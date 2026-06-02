import { useEffect, useMemo, useState } from 'react';
import { Header } from '../components/layout/Header';
import { KpiCard } from '../components/ui/KpiCard';
import { LoadingState } from '../components/ui/LoadingState';
import { SectionPanel } from '../components/ui/SectionPanel';
import { ShowMoreTable } from '../components/ui/ShowMoreTable';
import { loadLegacyAcquisition } from '../data/legacyDashboard';
import { formatMoney, formatNumber, formatPercent } from '../lib/formatters';
import type { AnyRow, DashboardFilters } from '../types';

function rows(value: unknown): AnyRow[] { return Array.isArray(value) ? value as AnyRow[] : []; }
function obj(value: unknown): AnyRow { return value && typeof value === 'object' ? value as AnyRow : {}; }
function filterByCountryAndRank(list: AnyRow[], filters: DashboardFilters): AnyRow[] {
  return list.filter((row) => {
    const country = String(row.country || row.companyCountry || '').toLowerCase();
    const rank = String(row.rank || row.companyRank || '').replace(/^Rank\s+/i, '').toUpperCase();
    const countryOk = filters.country === 'All' || country === filters.country.toLowerCase();
    const rankOk = filters.rank === 'All' || rank === filters.rank.toUpperCase();
    return countryOk && rankOk;
  });
}
function countryRows(countryBreakdown: unknown): AnyRow[] {
  return Object.entries(obj(countryBreakdown)).map(([country, value]) => ({ country, ...obj(value) })) as AnyRow[];
}
function reasonText(row: AnyRow) {
  const reasonList = rows(row.reasons).map(String);
  return reasonList.length ? reasonList.join(' · ') : String(row.reason || row.status || row.nextStep || '—');
}

export function AcquisitionOverview({ filters }: { filters: DashboardFilters }) {
  const [data, setData] = useState<AnyRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setError(null);
    loadLegacyAcquisition().then((next) => alive && setData(next)).catch((err: Error) => alive && setError(err.message));
    return () => { alive = false; };
  }, []);

  const prepared = useMemo(() => {
    if (!data) return null;
    const kpi = obj(data.kpi);
    const y = obj(kpi.yesterday);
    const mtd = obj(kpi.mtd);
    const ytd = obj(kpi.ytd);
    const team = obj(data.team);
    const repData = rows(data.repData);
    const activeReps = repData.filter((rep) => rep.type !== 'view');
    const allUntouched = repData.flatMap((rep) => [
      ...rows(rep.rankAUntouched).map((item) => ({ ...item, rank: 'A', ownerName: rep.name })),
      ...rows(rep.rankBUntouched).map((item) => ({ ...item, rank: 'B', ownerName: rep.name }))
    ]) as AnyRow[];
    const filteredUntouched = filterByCountryAndRank(allUntouched, filters);
    const allNeedsAttention = repData.flatMap((rep) => rows(rep.needsAttention).map((item) => ({ ...item, ownerName: item.ownerName || rep.name }))) as AnyRow[];
    const allCold = repData.flatMap((rep) => rows(rep.cold).map((item) => ({ ...item, ownerName: item.ownerName || rep.name }))) as AnyRow[];
    const allStuck = repData.flatMap((rep) => rows(rep.stuck).map((item) => ({ ...item, ownerName: item.ownerName || rep.name }))) as AnyRow[];
    return { y, mtd, ytd, team, activeReps, filteredUntouched, allNeedsAttention, allCold, allStuck };
  }, [data, filters]);

  if (error) return <div className="loadingState">Acquisition data failed: {error}</div>;
  if (!data || !prepared) return <LoadingState />;

  const meta = obj(data.meta);
  const priorityLeads = rows(data.priorityLeads);
  const sourcePerformance = rows(data.sourcePerformance);
  const stageData = rows(data.stageData);
  const closedWon = rows(data.closedWon);
  const closedLost = rows(data.closedLost);
  const autoRecs = rows(data.autoRecs || data.aiRecommendations || data.managerActions);
  const countryBreakdown = countryRows(data.teamCountryBreakdown || data.countryBreakdown);
  const periodRows: AnyRow[] = [prepared.y, prepared.mtd, prepared.ytd].map((row, index) => ({ period: ['Yesterday', 'MTD', 'YTD'][index], ...row }));
  const aiRows: AnyRow[] = autoRecs.length ? autoRecs : prepared.allNeedsAttention;

  return (
    <>
      <Header badge="Acquisition" title="Acquisition · Team Overview" subtitle={`Updated ${String(meta.generatedAt || '')} · ${String(meta.yesterdayLabel || data.yesterdayLabel || '')}`} />

      <SectionPanel title="Today's Focus" subtitle="The immediate acquisition work from the legacy n8n JSON logic.">
        <div className="kpiGrid inlineGrid">
          <KpiCard title="Rank A/B Untouched" value={formatNumber(prepared.filteredUntouched.length)} subtitle="Filtered by Country / Rank" tone="red" />
          <KpiCard title="Needs Attention" value={formatNumber(prepared.allNeedsAttention.length)} subtitle="Cold or stuck deals" tone="orange" />
          <KpiCard title="Cold Deals" value={formatNumber(prepared.allCold.length)} tone="orange" />
          <KpiCard title="Stuck Deals" value={formatNumber(prepared.allStuck.length)} tone="red" />
        </div>
      </SectionPanel>

      <div className="kpiGrid">
        <KpiCard title="Calls Yesterday" value={formatNumber(prepared.y.calls)} subtitle={`${formatNumber(prepared.y.connected)} connected · ${formatPercent(prepared.y.connRate)}`} tone="blue" />
        <KpiCard title="Meetings Yesterday" value={formatNumber(prepared.y.meetings)} tone="green" />
        <KpiCard title="Leads Yesterday" value={formatNumber(prepared.y.leads)} subtitle={`${formatNumber(prepared.team.leadsYestInbound)} inbound · ${formatNumber(prepared.team.leadsYestOutbound)} outbound`} tone="orange" />
        <KpiCard title="Open Pipeline" value={formatMoney(prepared.team.pipeline)} subtitle={`${formatNumber(prepared.team.openDeals)} open deals`} tone="blue" />
        <KpiCard title="Calls MTD" value={formatNumber(prepared.mtd.calls)} subtitle={`${formatNumber(prepared.mtd.connected)} connected · ${formatPercent(prepared.mtd.connRate)}`} tone="blue" />
        <KpiCard title="Leads MTD" value={formatNumber(prepared.mtd.leads)} tone="orange" />
        <KpiCard title="Won YTD" value={formatMoney(prepared.ytd.wonAmt)} subtitle={`${formatNumber(prepared.ytd.wonDeals)} deals`} tone="green" />
        <KpiCard title="Lost YTD" value={formatMoney(prepared.ytd.lostAmt)} subtitle={`${formatNumber(prepared.ytd.lost)} deals`} tone="red" />
      </div>

      <div className="panelGrid two">
        <SectionPanel title="Yesterday / MTD / YTD Performance">
          <ShowMoreTable rows={periodRows} columns={[{ key: 'period', label: 'Period' },{ key: 'calls', label: 'Calls', render: (row) => formatNumber(row.calls) },{ key: 'connected', label: 'Connected', render: (row) => formatNumber(row.connected) },{ key: 'connRate', label: 'Conn Rate', render: (row) => formatPercent(row.connRate) },{ key: 'meetings', label: 'Meetings', render: (row) => formatNumber(row.meetings) },{ key: 'leads', label: 'Leads', render: (row) => formatNumber(row.leads) },{ key: 'pipeline', label: 'Pipeline', render: (row) => formatMoney(row.pipeline) },{ key: 'wonAmt', label: 'Won', render: (row) => formatMoney(row.wonAmt) },{ key: 'lostAmt', label: 'Lost', render: (row) => formatMoney(row.lostAmt) }]} />
        </SectionPanel>
        <SectionPanel title="Rep Execution">
          <ShowMoreTable rows={prepared.activeReps} columns={[{ key: 'name', label: 'Rep' },{ key: 'calls', label: 'Calls YTD', render: (row) => formatNumber(obj(row.calls).ytd) },{ key: 'connected', label: 'Connected YTD', render: (row) => formatNumber(obj(row.calls).ytdConn) },{ key: 'connRateYTD', label: 'Conn Rate', render: (row) => formatPercent(row.connRateYTD) },{ key: 'meetings', label: 'Meetings YTD', render: (row) => formatNumber(obj(row.meetings).ytd) },{ key: 'openDeals', label: 'Open Deals', render: (row) => formatNumber(row.openDeals) },{ key: 'pipeAmt', label: 'Pipeline', render: (row) => formatMoney(row.pipeAmt) }]} />
        </SectionPanel>
      </div>

      <div className="panelGrid">
        <SectionPanel title="Leads Priority"><ShowMoreTable rows={priorityLeads} columns={[{ key: 'name', label: 'Lead' },{ key: 'companyName', label: 'Company' },{ key: 'ownerName', label: 'Owner' },{ key: 'source', label: 'Source' },{ key: 'status', label: 'Status' },{ key: 'daysWithoutContact', label: 'Days No Contact', render: (row) => formatNumber(row.daysWithoutContact) }]} /></SectionPanel>
        <SectionPanel title="ANP / Rank A-B Coverage"><ShowMoreTable rows={prepared.filteredUntouched} columns={[{ key: 'name', label: 'Company' },{ key: 'ownerName', label: 'Owner' },{ key: 'country', label: 'Country' },{ key: 'rank', label: 'Rank' }]} /></SectionPanel>
        <SectionPanel title="Coverage by Country"><ShowMoreTable rows={countryBreakdown} columns={[{ key: 'country', label: 'Country' },{ key: 'rankA', label: 'Rank A', render: (row) => formatNumber(row.rankA) },{ key: 'rankB', label: 'Rank B', render: (row) => formatNumber(row.rankB) },{ key: 'total', label: 'Total', render: (row) => formatNumber(row.total) }]} /></SectionPanel>
        <SectionPanel title="Open Deals / Pipeline"><ShowMoreTable rows={stageData} columns={[{ key: 'name', label: 'Stage' },{ key: 'count', label: 'Deals', render: (row) => formatNumber(row.count) },{ key: 'amount', label: 'Amount', render: (row) => formatMoney(row.amount) }]} /></SectionPanel>
        <SectionPanel title="AI Coaching"><ShowMoreTable rows={aiRows} columns={[{ key: 'name', label: 'Item' },{ key: 'ownerName', label: 'Owner' },{ key: 'amount', label: 'Amount', render: (row) => formatMoney(row.amount) },{ key: 'reasons', label: 'Reason', render: reasonText }]} /></SectionPanel>
        <SectionPanel title="Lead Source Performance"><ShowMoreTable rows={sourcePerformance} columns={[{ key: 'source', label: 'Source' },{ key: 'created', label: 'Created', render: (row) => formatNumber(row.created) },{ key: 'contacted', label: 'Contacted', render: (row) => formatNumber(row.contacted) },{ key: 'converted', label: 'Converted', render: (row) => formatNumber(row.converted) },{ key: 'conversionRate', label: 'Conversion', render: (row) => formatPercent(row.conversionRate) }]} /></SectionPanel>
        <SectionPanel title="Closed Won"><ShowMoreTable rows={closedWon} columns={[{ key: 'name', label: 'Deal' },{ key: 'ownerName', label: 'Owner' },{ key: 'amount', label: 'Amount', render: (row) => formatMoney(row.amount) },{ key: 'closedate', label: 'Close Date' }]} /></SectionPanel>
        <SectionPanel title="Closed Lost"><ShowMoreTable rows={closedLost} columns={[{ key: 'name', label: 'Deal' },{ key: 'ownerName', label: 'Owner' },{ key: 'amount', label: 'Amount', render: (row) => formatMoney(row.amount) },{ key: 'closedate', label: 'Close Date' },{ key: 'lostReason', label: 'Reason' }]} /></SectionPanel>
      </div>
    </>
  );
}
