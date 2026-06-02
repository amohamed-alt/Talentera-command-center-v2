import { useEffect, useState } from 'react';
import { BarChartCard } from '../components/charts/BarChartCard';
import { Header } from '../components/layout/Header';
import { DataTable } from '../components/ui/DataTable';
import { KpiCard } from '../components/ui/KpiCard';
import { LoadingState } from '../components/ui/LoadingState';
import { SectionPanel } from '../components/ui/SectionPanel';
import { formatMoney, formatNumber, formatPercent } from '../lib/formatters';
import { countRows, numberFrom, ratio, sumRows } from '../lib/metrics';
import { loadAcquisitionOverview } from '../data/acquisition';
import type { AnyRow, DashboardFilters } from '../types';

export function AcquisitionOverview({ filters }: { filters: DashboardFilters }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof loadAcquisitionOverview>> | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { let alive = true; setLoading(true); loadAcquisitionOverview(filters).then((next) => alive && setData(next)).finally(() => alive && setLoading(false)); return () => { alive = false; }; }, [filters]);
  if (loading || !data) return <LoadingState />;

  const leadSummaryRow = data.leadSummary.rows[0];
  const touched = sumRows(data.rankCoverage.rows, ['touched_companies', 'touched']);
  const untouched = sumRows(data.rankCoverage.rows, ['untouched_companies', 'untouched']);
  const assigned = (touched ?? 0) + (untouched ?? 0) || null;

  return <>
    <Header badge="Acquisition" title="Acquisition Command Center" subtitle="Rank A/B coverage, same-owner touches, pipeline risk, next activity and rep execution." />
    <div className="kpiGrid">
      <KpiCard title="Leads Need Contact" value={formatNumber(numberFrom(leadSummaryRow, ['leads_need_contact_count', 'need_contact_count']))} subtitle="priority lead backlog" tone="orange" />
      <KpiCard title="Rank A/B Untouched" value={formatNumber(untouched)} subtitle="A/B only" tone="red" />
      <KpiCard title="Deals at Risk" value={formatNumber(countRows(data.dealsAtRisk.rows))} subtitle={formatMoney(sumRows(data.dealsAtRisk.rows, ['risk_deal_amount', 'amount']))} tone="red" />
      <KpiCard title="Lead Contact Rate" value={formatPercent(numberFrom(leadSummaryRow, ['lead_contact_rate_pct', 'contact_rate']))} subtitle="contacted / eligible" tone="green" />
      <KpiCard title="Booked This Year" value={formatMoney(sumRows(data.financialSummary.rows, ['booked_this_year', 'booking_amount']))} subtitle="from vw_acq_financial_summary_v1" tone="green" />
      <KpiCard title="Cashed This Year" value={formatMoney(sumRows(data.financialSummary.rows, ['cashed_this_year', 'cashing_amount']))} subtitle="from vw_acq_financial_summary_v1" tone="blue" />
      <KpiCard title="Open Pipeline" value={formatMoney(sumRows(data.personDeals.rows, ['open_pipeline_amount', 'open_amount', 'amount']))} subtitle="open deals amount" tone="orange" />
      <KpiCard title="Touch Rate" value={formatPercent(ratio(touched, assigned))} subtitle="same-owner connected/completed" tone="green" />
    </div>

    <div className="panelGrid two">
      <SectionPanel title="Revenue Health" subtitle="Open, won, lost and at-risk pipeline."><DataTable rows={data.personDeals.rows} columns={[{ key: 'rep_name', label: 'Rep' }, { key: 'deal_status', label: 'Status' }, { key: 'deal_count', label: 'Deals' }, { key: 'amount', label: 'Amount', render: (row: AnyRow) => formatMoney(row.amount) }]} /></SectionPanel>
      <SectionPanel title="Outreach Health" subtitle="Rank A/B same-owner coverage."><DataTable rows={data.rankBreakdown.rows} columns={[{ key: 'rank', label: 'Rank' }, { key: 'companies', label: 'Companies' }, { key: 'touched', label: 'Touched' }, { key: 'untouched', label: 'Untouched' }, { key: 'touch_rate', label: 'Touch Rate', render: (row: AnyRow) => formatPercent(row.touch_rate) }]} /></SectionPanel>
    </div>

    <div className="panelGrid">
      <SectionPanel title="Priority Actions"><DataTable rows={data.companyNextActivity.rows} columns={[{ key: 'company_name', label: 'Company' }, { key: 'owner_name', label: 'Owner' }, { key: 'country', label: 'Country' }, { key: 'rank', label: 'Rank' }, { key: 'last_activity_date', label: 'Last Activity' }, { key: 'next_activity_date', label: 'Next Activity' }]} /></SectionPanel>
      <SectionPanel title="Country Coverage"><DataTable rows={data.countryCoverage.rows} columns={[{ key: 'country', label: 'Country' }, { key: 'rank_a_companies', label: 'Rank A' }, { key: 'rank_b_companies', label: 'Rank B' }, { key: 'touched', label: 'Touched' }, { key: 'untouched', label: 'Untouched' }, { key: 'open_pipeline_amount', label: 'Open Pipeline', render: (row: AnyRow) => formatMoney(row.open_pipeline_amount) }]} /></SectionPanel>
      <SectionPanel title="Rep Leaderboard"><DataTable rows={data.repLeaderboard.rows} columns={[{ key: 'rep_name', label: 'Rep' }, { key: 'assigned_rank_ab', label: 'Assigned A/B' }, { key: 'touched', label: 'Touched' }, { key: 'untouched', label: 'Untouched' }, { key: 'connected_calls', label: 'Connected Calls' }, { key: 'completed_meetings', label: 'Completed Meetings' }, { key: 'open_deals', label: 'Open Deals' }]} /></SectionPanel>
      <BarChartCard title="Lead Source Performance" rows={data.leadSourcePerformance.rows} xKey="source" bars={['eligible_leads', 'need_contact', 'contacted']} />
      <SectionPanel title="Deals at Risk Details"><DataTable rows={data.dealsAtRisk.rows} columns={[{ key: 'deal_name', label: 'Deal' }, { key: 'company_name', label: 'Company' }, { key: 'owner_name', label: 'Owner' }, { key: 'stage', label: 'Stage' }, { key: 'amount', label: 'Amount', render: (row: AnyRow) => formatMoney(row.amount) }, { key: 'days_in_stage', label: 'Days in Stage' }, { key: 'risk_reason', label: 'Risk Reason' }]} /></SectionPanel>
    </div>
  </>;
}
