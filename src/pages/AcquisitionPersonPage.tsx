import { useEffect, useMemo, useState } from 'react';
import { Header } from '../components/layout/Header';
import { KpiCard } from '../components/ui/KpiCard';
import { LoadingState } from '../components/ui/LoadingState';
import { SectionPanel } from '../components/ui/SectionPanel';
import { ShowMoreTable } from '../components/ui/ShowMoreTable';
import { loadLegacyAcquisition } from '../data/legacyDashboard';
import { formatMoney, formatNumber, formatPercent } from '../lib/formatters';
import type { AnyRow, DashboardFilters, PersonConfig } from '../types';

function rows(value: unknown): AnyRow[] { return Array.isArray(value) ? value as AnyRow[] : []; }
function obj(value: unknown): AnyRow { return value && typeof value === 'object' ? value as AnyRow : {}; }
function repId(name: string) { return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function reasonText(row: AnyRow) { const reasonList = rows(row.reasons).map(String); return reasonList.length ? reasonList.join(' · ') : String(row.reason || row.status || row.nextStep || '—'); }
function filterByCountryAndRank(list: AnyRow[], filters: DashboardFilters) {
  return list.filter((row) => {
    const country = String(row.country || '').toLowerCase();
    const rank = String(row.rank || '').toUpperCase();
    const countryOk = filters.country === 'All' || country === filters.country.toLowerCase();
    const rankOk = filters.rank === 'All' || rank === filters.rank.toUpperCase();
    return countryOk && rankOk;
  });
}
function countryRows(value: unknown) { return Object.entries(obj(value)).map(([country, row]) => ({ country, ...obj(row) })); }

export function AcquisitionPersonPage({ filters, person }: { filters: DashboardFilters; person: PersonConfig }) {
  const [data, setData] = useState<AnyRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setError(null);
    loadLegacyAcquisition().then((next) => alive && setData(next)).catch((err: Error) => alive && setError(err.message));
    return () => { alive = false; };
  }, []);

  const rep = useMemo(() => {
    const list = rows(data?.repData);
    return list.find((item) => repId(String(item.name || '')) === person.key || person.aliases.some((alias) => String(item.name || '').toLowerCase() === alias.toLowerCase()));
  }, [data, person]);

  if (error) return <div className="loadingState">Acquisition data failed: {error}</div>;
  if (!data) return <LoadingState />;
  if (!rep) return <div className="loadingState">No acquisition data found for {person.displayName} in data.json</div>;

  const calls = obj(rep.calls);
  const meetings = obj(rep.meetings);
  const leadActivities = obj(rep.leadActivities);
  const leadQuality = obj(rep.leadQuality);
  const leadFunnel = obj(rep.leadFunnel);
  const rankA = rows(rep.rankAUntouched).map((item) => ({ ...item, rank: 'A', ownerName: rep.name }));
  const rankB = rows(rep.rankBUntouched).map((item) => ({ ...item, rank: 'B', ownerName: rep.name }));
  const untouched = filterByCountryAndRank([...rankA, ...rankB], filters);
  const topDeals = rows(rep.topDeals);
  const stuck = rows(rep.stuck);
  const cold = rows(rep.cold);
  const needsAttention = rows(rep.needsAttention);
  const countryBreakdown = countryRows(rep.countryBreakdown);

  if (person.dealsOnly) {
    return (
      <>
        <Header badge="Acquisition Deals View" title={`Acquisition · ${String(rep.name)}`} subtitle="Deals-only page: Open, Won, Lost, Pipeline, Stuck and Cold deals." />
        <div className="kpiGrid">
          <KpiCard title="Open Deals" value={formatNumber(rep.openDeals)} subtitle={formatMoney(rep.pipeAmt)} tone="orange" />
          <KpiCard title="Won YTD" value={formatMoney(rep.wonAmtYTD)} subtitle={`${formatNumber(rep.wonYTD)} deals`} tone="green" />
          <KpiCard title="Lost YTD" value={formatMoney(rep.lostAmtYTD)} subtitle={`${formatNumber(rep.lostYTD)} deals`} tone="red" />
          <KpiCard title="Needs Attention" value={formatNumber(needsAttention.length)} tone="orange" />
        </div>
        <div className="panelGrid">
          <SectionPanel title="Top Open Deals"><ShowMoreTable rows={topDeals} columns={[{ key: 'name', label: 'Deal' },{ key: 'stage', label: 'Stage' },{ key: 'amount', label: 'Amount', render: (row) => formatMoney(row.amount) },{ key: 'nextActivity', label: 'Next Activity' },{ key: 'isStuck', label: 'Stuck' },{ key: 'isCold', label: 'Cold' }]} /></SectionPanel>
          <SectionPanel title="AI Coaching / Needs Attention"><ShowMoreTable rows={needsAttention} columns={[{ key: 'name', label: 'Deal' },{ key: 'amount', label: 'Amount', render: (row) => formatMoney(row.amount) },{ key: 'reasons', label: 'Reason', render: reasonText }]} /></SectionPanel>
          <SectionPanel title="Stuck Deals"><ShowMoreTable rows={stuck} columns={[{ key: 'name', label: 'Deal' },{ key: 'days', label: 'Days', render: (row) => formatNumber(row.days) },{ key: 'amount', label: 'Amount', render: (row) => formatMoney(row.amount) }]} /></SectionPanel>
          <SectionPanel title="Cold Deals"><ShowMoreTable rows={cold} columns={[{ key: 'name', label: 'Deal' },{ key: 'days', label: 'Days', render: (row) => formatNumber(row.days) },{ key: 'amount', label: 'Amount', render: (row) => formatMoney(row.amount) }]} /></SectionPanel>
        </div>
      </>
    );
  }

  return (
    <>
      <Header badge="Acquisition Rep" title={`Acquisition · ${String(rep.name)}`} subtitle="Same old n8n JSON logic, scoped to this representative." />
      <div className="kpiGrid">
        <KpiCard title="Calls Yesterday" value={formatNumber(calls.yest)} subtitle={`${formatNumber(calls.yestConn)} connected · ${formatPercent(rep.connRateYest)}`} tone="blue" />
        <KpiCard title="Calls MTD" value={formatNumber(calls.mtd)} subtitle={`${formatNumber(calls.mtdConn)} connected · ${formatPercent(rep.connRateMTD)}`} tone="blue" />
        <KpiCard title="Calls YTD" value={formatNumber(calls.ytd)} subtitle={`${formatNumber(calls.ytdConn)} connected · ${formatPercent(rep.connRateYTD)}`} tone="green" />
        <KpiCard title="Meetings YTD" value={formatNumber(meetings.ytd)} tone="green" />
        <KpiCard title="Open Deals" value={formatNumber(rep.openDeals)} subtitle={formatMoney(rep.pipeAmt)} tone="orange" />
        <KpiCard title="Won YTD" value={formatMoney(rep.wonAmtYTD)} subtitle={`${formatNumber(rep.wonYTD)} deals`} tone="green" />
        <KpiCard title="Lost YTD" value={formatMoney(rep.lostAmtYTD)} subtitle={`${formatNumber(rep.lostYTD)} deals`} tone="red" />
        <KpiCard title="Needs Attention" value={formatNumber(needsAttention.length)} tone="orange" />
      </div>
      <div className="panelGrid two">
        <SectionPanel title="Yesterday / MTD / YTD"><ShowMoreTable rows={[{ period: 'Yesterday', calls: calls.yest, connected: calls.yestConn, connRate: rep.connRateYest, meetings: meetings.yest, leads: rep.leadsYest },{ period: 'MTD', calls: calls.mtd, connected: calls.mtdConn, connRate: rep.connRateMTD, meetings: meetings.mtd, leads: rep.leadsMTD },{ period: 'YTD', calls: calls.ytd, connected: calls.ytdConn, connRate: rep.connRateYTD, meetings: meetings.ytd, leads: rep.leadsYTD }]} columns={[{ key: 'period', label: 'Period' },{ key: 'calls', label: 'Calls', render: (row) => formatNumber(row.calls) },{ key: 'connected', label: 'Connected', render: (row) => formatNumber(row.connected) },{ key: 'connRate', label: 'Conn Rate', render: (row) => formatPercent(row.connRate) },{ key: 'meetings', label: 'Meetings', render: (row) => formatNumber(row.meetings) },{ key: 'leads', label: 'Leads', render: (row) => formatNumber(row.leads) }]} /></SectionPanel>
        <SectionPanel title="Lead Quality"><ShowMoreTable rows={[{ metric: 'Existing Client', value: leadQuality.statusExistingClient },{ metric: 'Other', value: leadQuality.statusOther },{ metric: 'Inbound', value: leadQuality.sourceInbound },{ metric: 'Outbound', value: leadQuality.sourceOutbound },{ metric: 'Created', value: leadFunnel.created },{ metric: 'Converted', value: leadFunnel.converted },{ metric: 'Conversion Rate', value: `${leadFunnel.conversionRate || 0}%` }]} columns={[{ key: 'metric', label: 'Metric' },{ key: 'value', label: 'Value' }]} /></SectionPanel>
      </div>
      <div className="panelGrid">
        <SectionPanel title="ANP / Rank A-B Coverage"><ShowMoreTable rows={untouched} columns={[{ key: 'name', label: 'Company' },{ key: 'country', label: 'Country' },{ key: 'rank', label: 'Rank' }]} /></SectionPanel>
        <SectionPanel title="Country Breakdown"><ShowMoreTable rows={countryBreakdown} columns={[{ key: 'country', label: 'Country' },{ key: 'rankA', label: 'Rank A', render: (row) => formatNumber(row.rankA) },{ key: 'rankB', label: 'Rank B', render: (row) => formatNumber(row.rankB) },{ key: 'total', label: 'Total', render: (row) => formatNumber(row.total) }]} /></SectionPanel>
        <SectionPanel title="Open Deals"><ShowMoreTable rows={topDeals} columns={[{ key: 'name', label: 'Deal' },{ key: 'stage', label: 'Stage' },{ key: 'amount', label: 'Amount', render: (row) => formatMoney(row.amount) },{ key: 'nextActivity', label: 'Next Activity' },{ key: 'isStuck', label: 'Stuck' },{ key: 'isCold', label: 'Cold' }]} /></SectionPanel>
        <SectionPanel title="AI Coaching / Needs Attention"><ShowMoreTable rows={needsAttention} columns={[{ key: 'name', label: 'Deal' },{ key: 'amount', label: 'Amount', render: (row) => formatMoney(row.amount) },{ key: 'reasons', label: 'Reason', render: reasonText }]} /></SectionPanel>
        <SectionPanel title="Stuck Deals"><ShowMoreTable rows={stuck} columns={[{ key: 'name', label: 'Deal' },{ key: 'days', label: 'Days', render: (row) => formatNumber(row.days) },{ key: 'amount', label: 'Amount', render: (row) => formatMoney(row.amount) }]} /></SectionPanel>
        <SectionPanel title="Cold Deals"><ShowMoreTable rows={cold} columns={[{ key: 'name', label: 'Deal' },{ key: 'days', label: 'Days', render: (row) => formatNumber(row.days) },{ key: 'amount', label: 'Amount', render: (row) => formatMoney(row.amount) }]} /></SectionPanel>
        <SectionPanel title="Lead Activities"><ShowMoreTable rows={[{ metric: 'Calls Yesterday', value: leadActivities.callsYest },{ metric: 'Calls MTD', value: leadActivities.callsMTD },{ metric: 'Calls YTD', value: leadActivities.callsYTD },{ metric: 'Meetings Yesterday', value: leadActivities.meetingsYest },{ metric: 'Meetings MTD', value: leadActivities.meetingsMTD },{ metric: 'Meetings YTD', value: leadActivities.meetingsYTD }]} columns={[{ key: 'metric', label: 'Metric' },{ key: 'value', label: 'Value', render: (row) => formatNumber(row.value) }]} /></SectionPanel>
      </div>
    </>
  );
}
