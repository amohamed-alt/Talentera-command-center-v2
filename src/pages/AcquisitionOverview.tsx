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
function n(value: unknown) { const number = Number(value || 0); return Number.isFinite(number) ? number : 0; }
function rate(value: unknown) { return formatPercent(n(value)); }
function filterRankCountry(list: AnyRow[], filters: DashboardFilters) {
  return list.filter((row) => {
    const rank = String(row.rank || row.companyRank || '').replace(/^Rank\s+/i, '').toUpperCase();
    const country = String(row.country || row.companyCountry || '').toLowerCase();
    const rankOk = filters.rank === 'All' || rank === filters.rank.toUpperCase();
    const countryOk = filters.country === 'All' || country === filters.country.toLowerCase();
    return rankOk && countryOk;
  });
}
function compactReason(row: AnyRow) {
  const reasonList = rows(row.reasons).map(String);
  return reasonList.length ? reasonList.join(' · ') : String(row.reason || row.nextStep || row.status || '—');
}
function countryRows(data: AnyRow) {
  const breakdown = obj(data.teamCountryBreakdown || data.countryBreakdown);
  return Object.entries(breakdown).map(([country, value]) => ({ country, ...obj(value) }));
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
    const yesterday = obj(kpi.yesterday);
    const mtd = obj(kpi.mtd);
    const ytd = obj(kpi.ytd);
    const team = obj(data.team);
    const repData = rows(data.repData);
    const activeReps = repData.filter((rep) => rep.type !== 'view');
    const rankA = repData.flatMap((rep) => rows(rep.rankAUntouched).map((item) => ({ ...item, rank: 'A', ownerName: rep.name })));
    const rankB = repData.flatMap((rep) => rows(rep.rankBUntouched).map((item) => ({ ...item, rank: 'B', ownerName: rep.name })));
    const untouched = filterRankCountry([...rankA, ...rankB], filters);
    const needsAttention = repData.flatMap((rep) => rows(rep.needsAttention).map((item) => ({ ...item, ownerName: item.ownerName || rep.name })));
    const cold = repData.flatMap((rep) => rows(rep.cold).map((item) => ({ ...item, ownerName: item.ownerName || rep.name })));
    const stuck = repData.flatMap((rep) => rows(rep.stuck).map((item) => ({ ...item, ownerName: item.ownerName || rep.name })));
    const rankTotals = obj(data.rankTotals);
    return { yesterday, mtd, ytd, team, activeReps, untouched, needsAttention, cold, stuck, rankTotals };
  }, [data, filters]);

  if (error) return <div className="loadingState">Acquisition data failed: {error}</div>;
  if (!data || !prepared) return <LoadingState />;

  const meta = obj(data.meta);
  const priorityLeads = rows(data.priorityLeads);
  const sourcePerformance = rows(data.sourcePerformance);
  const stageData = rows(data.stageData);
  const closedWon = rows(data.closedWon);
  const closedLost = rows(data.closedLost);
  const autoRecs = rows(data.autoRecs || data.aiRecommendations || data.managerActions).length ? rows(data.autoRecs || data.aiRecommendations || data.managerActions) : prepared.needsAttention;
  const periodRows: AnyRow[] = [
    { period: 'Yesterday', ...prepared.yesterday },
    { period: 'MTD', ...prepared.mtd },
    { period: 'YTD', ...prepared.ytd }
  ];
  const countrySummary = countryRows(data);

  return (
    <>
      <Header badge="Acquisition" title="Acquisition · Team Overview" subtitle={`n8n legacy output · ${String(meta.generatedAt || '')} · ${String(meta.yesterdayLabel || data.yesterdayLabel || '')}`} />

      <SectionPanel title="Today's Focus" subtitle="Same source as the working n8n + HTML dashboard.">
        <div className="kpiGrid inlineGrid">
          <KpiCard title="Leads Need Contact" value={formatNumber(obj(data.firstLookSummary).leadsNeedContact || prepared.yesterday.leads || obj(data.teamLeadQuality).notContacted || priorityLeads.length)} subtitle="priority lead backlog" tone="red" />
          <KpiCard title="Rank A/B Untouched" value={formatNumber(n(prepared.rankTotals.ANotContacted) + n(prepared.rankTotals.BNotContacted) || prepared.untouched.length)} subtitle={`A: ${formatNumber(prepared.rankTotals.ANotContacted)} · B: ${formatNumber(prepared.rankTotals.BNotContacted)}`} tone="orange" />
          <KpiCard title="Deals At Risk" value={formatNumber(prepared.needsAttention.length)} subtitle={`${formatNumber(prepared.cold.length)} cold · ${formatNumber(prepared.stuck.length)} stuck`} tone="red" />
          <KpiCard title="Lead Contact Rate" value={rate(obj(data.teamLeadQuality).contactRate || prepared.yesterday.connRate)} subtitle="contacted / eligible leads" tone="green" />
        </div>
      </SectionPanel>

      <div className="kpiGrid">
        <KpiCard title="Calls Yesterday" value={formatNumber(prepared.yesterday.calls)} subtitle={`${formatNumber(prepared.yesterday.connected)} connected · ${rate(prepared.yesterday.connRate)}`} tone="blue" />
        <KpiCard title="Meetings Yesterday" value={formatNumber(prepared.yesterday.meetings)} tone="green" />
        <KpiCard title="Leads Yesterday" value={formatNumber(prepared.yesterday.leads)} tone="orange" />
        <KpiCard title="Open Pipeline" value={formatMoney(prepared.team.pipeline || prepared.ytd.pipeline)} subtitle={`${formatNumber(prepared.team.openDeals || prepared.ytd.openDealsSnap)} open deals`} tone="blue" />
        <KpiCard title="Calls MTD" value={formatNumber(prepared.mtd.calls)} subtitle={`${formatNumber(prepared.mtd.connected)} connected · ${rate(prepared.mtd.connRate)}`} tone="blue" />
        <KpiCard title="Leads MTD" value={formatNumber(prepared.mtd.leads)} tone="orange" />
        <KpiCard title="Won YTD" value={formatMoney(prepared.ytd.wonAmt)} subtitle={`${formatNumber(prepared.ytd.wonDeals)} deals`} tone="green" />
        <KpiCard title="Lost YTD" value={formatMoney(prepared.ytd.lostAmt)} subtitle={`${formatNumber(prepared.ytd.lost)} deals`} tone="red" />
      </div>

      <div className="panelGrid two">
        <SectionPanel title="Priority Actions">
          <ShowMoreTable rows={rows(obj(data.managerActions).actions || data.managerActions || data.firstLookSummary?.priorityActions)} columns={[{ key: 'title', label: 'Action' }, { key: 'description', label: 'Description' }, { key: 'impact', label: 'Impact' }, { key: 'owner', label: 'Owner' }]} />
        </SectionPanel>
        <SectionPanel title="Yesterday / MTD / YTD Performance">
          <ShowMoreTable rows={periodRows} columns={[{ key: 'period', label: 'Period' }, { key: 'calls', label: 'Calls', render: (row) => formatNumber(row.calls) }, { key: 'connected', label: 'Connected', render: (row) => formatNumber(row.connected) }, { key: 'connRate', label: 'Rate', render: (row) => rate(row.connRate) }, { key: 'meetings', label: 'Meetings', render: (row) => formatNumber(row.meetings) }, { key: 'leads', label: 'Leads', render: (row) => formatNumber(row.leads) }, { key: 'pipeline', label: 'Pipeline', render: (row) => formatMoney(row.pipeline) }]} />
        </SectionPanel>
      </div>

      <div className="panelGrid">
        <SectionPanel title="Rep Execution">
          <ShowMoreTable rows={prepared.activeReps} columns={[{ key: 'name', label: 'Rep' }, { key: 'calls', label: 'Calls YTD', render: (row) => formatNumber(obj(row.calls).ytd) }, { key: 'connected', label: 'Connected YTD', render: (row) => formatNumber(obj(row.calls).ytdConn) }, { key: 'connRateYTD', label: 'Rate', render: (row) => rate(row.connRateYTD) }, { key: 'meetings', label: 'Meetings YTD', render: (row) => formatNumber(obj(row.meetings).ytd) }, { key: 'openDeals', label: 'Open Deals', render: (row) => formatNumber(row.openDeals) }, { key: 'pipeAmt', label: 'Pipeline', render: (row) => formatMoney(row.pipeAmt) }]} />
        </SectionPanel>
        <SectionPanel title="Leads Priority"><ShowMoreTable rows={priorityLeads} columns={[{ key: 'name', label: 'Lead' }, { key: 'companyName', label: 'Company' }, { key: 'ownerName', label: 'Owner' }, { key: 'source', label: 'Source' }, { key: 'status', label: 'Status' }, { key: 'daysWithoutContact', label: 'Days No Contact', render: (row) => formatNumber(row.daysWithoutContact) }]} /></SectionPanel>
        <SectionPanel title="ANP / Rank A-B Coverage"><ShowMoreTable rows={prepared.untouched} columns={[{ key: 'name', label: 'Company' }, { key: 'ownerName', label: 'Owner' }, { key: 'country', label: 'Country' }, { key: 'rank', label: 'Rank' }]} /></SectionPanel>
        <SectionPanel title="Coverage by Country"><ShowMoreTable rows={countrySummary} columns={[{ key: 'country', label: 'Country' }, { key: 'rankA', label: 'Rank A', render: (row) => formatNumber(row.rankA || row.A || row.rank_a) }, { key: 'rankB', label: 'Rank B', render: (row) => formatNumber(row.rankB || row.B || row.rank_b) }, { key: 'total', label: 'Total', render: (row) => formatNumber(row.total) }]} /></SectionPanel>
        <SectionPanel title="Open Deals / Pipeline"><ShowMoreTable rows={stageData} columns={[{ key: 'name', label: 'Stage' }, { key: 'count', label: 'Deals', render: (row) => formatNumber(row.count) }, { key: 'amount', label: 'Amount', render: (row) => formatMoney(row.amount) }]} /></SectionPanel>
        <SectionPanel title="AI Coaching"><ShowMoreTable rows={autoRecs} columns={[{ key: 'name', label: 'Item' }, { key: 'ownerName', label: 'Owner' }, { key: 'amount', label: 'Amount', render: (row) => formatMoney(row.amount) }, { key: 'reasons', label: 'Reason', render: compactReason }]} /></SectionPanel>
        <SectionPanel title="Lead Source Performance"><ShowMoreTable rows={sourcePerformance} columns={[{ key: 'source', label: 'Source' }, { key: 'created', label: 'Created', render: (row) => formatNumber(row.created) }, { key: 'contacted', label: 'Contacted', render: (row) => formatNumber(row.contacted) }, { key: 'converted', label: 'Converted', render: (row) => formatNumber(row.converted) }, { key: 'conversionRate', label: 'Conversion', render: (row) => rate(row.conversionRate) }]} /></SectionPanel>
        <SectionPanel title="Closed Won"><ShowMoreTable rows={closedWon} columns={[{ key: 'name', label: 'Deal' }, { key: 'ownerName', label: 'Owner' }, { key: 'amount', label: 'Amount', render: (row) => formatMoney(row.amount) }, { key: 'closedate', label: 'Close Date' }]} /></SectionPanel>
        <SectionPanel title="Closed Lost"><ShowMoreTable rows={closedLost} columns={[{ key: 'name', label: 'Deal' }, { key: 'ownerName', label: 'Owner' }, { key: 'amount', label: 'Amount', render: (row) => formatMoney(row.amount) }, { key: 'closedate', label: 'Close Date' }, { key: 'lostReason', label: 'Reason' }]} /></SectionPanel>
      </div>
    </>
  );
}
