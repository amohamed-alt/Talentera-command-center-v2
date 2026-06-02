import { useEffect, useMemo, useState } from 'react';
import { Header } from '../components/layout/Header';
import { KpiCard } from '../components/ui/KpiCard';
import { LoadingState } from '../components/ui/LoadingState';
import { SectionPanel } from '../components/ui/SectionPanel';
import { ShowMoreTable } from '../components/ui/ShowMoreTable';
import { fetchView } from '../lib/fetchView';
import { formatMoney, formatNumber, formatPercent } from '../lib/formatters';
import type { AnyRow, DashboardFilters, ViewResult } from '../types';

type AcquisitionData = {
  focus: ViewResult;
  periodKpis: ViewResult;
  repExecution: ViewResult;
  priorityActions: ViewResult;
  rankCoverage: ViewResult;
  countrySummary: ViewResult;
  deals: ViewResult;
  aiCoaching: ViewResult;
};

function filterRows(rows: AnyRow[], filters: DashboardFilters) {
  return rows.filter((row) => {
    const country = String(row.country || '').toLowerCase();
    const rank = String(row.rank || '').toUpperCase();
    const countryOk = filters.country === 'All' || country === filters.country.toLowerCase();
    const rankOk = filters.rank === 'All' || rank === filters.rank.toUpperCase();
    return countryOk && rankOk;
  });
}

function asTone(value: unknown) {
  const tone = String(value || 'neutral');
  return ['green', 'red', 'orange', 'blue', 'neutral'].includes(tone) ? tone as 'green' | 'red' | 'orange' | 'blue' | 'neutral' : 'neutral';
}

export function AcquisitionOverview({ filters }: { filters: DashboardFilters }) {
  const [data, setData] = useState<AcquisitionData | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetchView('acq_team_cards_cache'),
      fetchView('acq_period_kpis_cache'),
      fetchView('acq_rep_execution_cache'),
      fetchView('acq_priority_actions_cache'),
      fetchView('acq_rank_coverage_cache'),
      fetchView('acq_country_rank_summary_cache'),
      fetchView('acq_deals_cache'),
      fetchView('acq_ai_coaching_cache')
    ]).then(([focus, periodKpis, repExecution, priorityActions, rankCoverage, countrySummary, deals, aiCoaching]) => {
      if (alive) setData({ focus, periodKpis, repExecution, priorityActions, rankCoverage, countrySummary, deals, aiCoaching });
    });
    return () => { alive = false; };
  }, []);

  const prepared = useMemo(() => {
    if (!data) return null;
    const teamPeriods = data.periodKpis.rows.filter((row) => row.person_key === 'team');
    const byPeriod = (period: string) => teamPeriods.find((row) => row.period === period) || {};
    const yesterday = byPeriod('yesterday');
    const mtd = byPeriod('mtd');
    const ytd = byPeriod('ytd');
    const rankRows = filterRows(data.rankCoverage.rows, filters);
    const untouched = rankRows.filter((row) => row.touched === false);
    const openDeals = data.deals.rows.filter((row) => row.deal_status === 'open');
    const wonDeals = data.deals.rows.filter((row) => row.deal_status === 'won');
    const lostDeals = data.deals.rows.filter((row) => row.deal_status === 'lost');
    const countryRows = data.countrySummary.rows.filter((row) => row.person_key === 'team');
    return { yesterday, mtd, ytd, rankRows, untouched, openDeals, wonDeals, lostDeals, countryRows };
  }, [data, filters]);

  if (!data || !prepared) return <LoadingState />;

  const periodRows: AnyRow[] = [
    { label: 'Yesterday', ...prepared.yesterday },
    { label: 'MTD', ...prepared.mtd },
    { label: 'YTD', ...prepared.ytd }
  ];

  return (
    <>
      <Header badge="Acquisition" title="Acquisition · Team Overview" subtitle="Ready cache tables · refreshed every 6 hours · no live calculation" />

      <SectionPanel title="Today's Focus" subtitle="Precomputed cards from Supabase cache tables.">
        <div className="kpiGrid inlineGrid">
          {data.focus.rows.map((card) => (
            <KpiCard key={String(card.card_key)} title={String(card.title)} value={card.card_key === 'lead_contact_rate' ? formatPercent(card.value) : formatNumber(card.value)} subtitle={String(card.subtitle || '')} tone={asTone(card.tone)} />
          ))}
        </div>
      </SectionPanel>

      <div className="kpiGrid">
        <KpiCard title="Calls Yesterday" value={formatNumber(prepared.yesterday.calls_logged)} subtitle={`${formatNumber(prepared.yesterday.connected_calls)} connected · ${formatPercent(prepared.yesterday.connection_rate)}`} tone="blue" />
        <KpiCard title="Meetings Yesterday" value={formatNumber(prepared.yesterday.meetings_completed)} tone="green" />
        <KpiCard title="Leads Yesterday" value={formatNumber(prepared.yesterday.leads_created)} tone="orange" />
        <KpiCard title="Open Pipeline" value={formatMoney(prepared.ytd.open_pipeline)} subtitle={`${formatNumber(prepared.ytd.open_deals)} open deals`} tone="blue" />
        <KpiCard title="Calls MTD" value={formatNumber(prepared.mtd.calls_logged)} subtitle={`${formatNumber(prepared.mtd.connected_calls)} connected · ${formatPercent(prepared.mtd.connection_rate)}`} tone="blue" />
        <KpiCard title="Leads MTD" value={formatNumber(prepared.mtd.leads_created)} tone="orange" />
        <KpiCard title="Won YTD" value={formatMoney(prepared.ytd.won_amount)} subtitle={`${formatNumber(prepared.ytd.won_deals)} deals`} tone="green" />
        <KpiCard title="Lost YTD" value={formatMoney(prepared.ytd.lost_amount)} subtitle={`${formatNumber(prepared.ytd.lost_deals)} deals`} tone="red" />
      </div>

      <div className="panelGrid two">
        <SectionPanel title="Priority Actions">
          <ShowMoreTable rows={data.priorityActions.rows} columns={[{ key: 'title', label: 'Action' }, { key: 'description', label: 'Description' }, { key: 'value', label: 'Count', render: (row) => formatNumber(row.value) }, { key: 'tone', label: 'Tone' }]} />
        </SectionPanel>
        <SectionPanel title="Yesterday / MTD / YTD Performance">
          <ShowMoreTable rows={periodRows} columns={[{ key: 'label', label: 'Period' }, { key: 'calls_logged', label: 'Calls', render: (row) => formatNumber(row.calls_logged) }, { key: 'connected_calls', label: 'Connected', render: (row) => formatNumber(row.connected_calls) }, { key: 'connection_rate', label: 'Rate', render: (row) => formatPercent(row.connection_rate) }, { key: 'meetings_completed', label: 'Meetings', render: (row) => formatNumber(row.meetings_completed) }, { key: 'leads_created', label: 'Leads', render: (row) => formatNumber(row.leads_created) }, { key: 'open_pipeline', label: 'Pipeline', render: (row) => formatMoney(row.open_pipeline) }]} />
        </SectionPanel>
      </div>

      <div className="panelGrid">
        <SectionPanel title="Rep Execution">
          <ShowMoreTable rows={data.repExecution.rows} columns={[{ key: 'display_name', label: 'Rep' }, { key: 'calls_logged', label: 'Calls' }, { key: 'connected_calls', label: 'Connected' }, { key: 'connection_rate', label: 'Rate', render: (row) => formatPercent(row.connection_rate) }, { key: 'meetings_completed', label: 'Meetings' }, { key: 'open_deals', label: 'Open Deals' }, { key: 'open_pipeline', label: 'Pipeline', render: (row) => formatMoney(row.open_pipeline) }, { key: 'status', label: 'Status' }]} />
        </SectionPanel>
        <SectionPanel title="ANP / Rank A-B Coverage">
          <ShowMoreTable rows={prepared.untouched} columns={[{ key: 'company_name', label: 'Company' }, { key: 'display_name', label: 'Owner' }, { key: 'country', label: 'Country' }, { key: 'rank', label: 'Rank' }, { key: 'connected_calls', label: 'Connected Calls' }, { key: 'completed_meetings', label: 'Meetings' }]} />
        </SectionPanel>
        <SectionPanel title="Coverage by Country">
          <ShowMoreTable rows={prepared.countryRows} columns={[{ key: 'country', label: 'Country' }, { key: 'rank_a', label: 'Rank A' }, { key: 'rank_b', label: 'Rank B' }, { key: 'touched', label: 'Touched' }, { key: 'untouched', label: 'Untouched' }, { key: 'total', label: 'Total' }]} />
        </SectionPanel>
        <SectionPanel title="Open Deals / Pipeline">
          <ShowMoreTable rows={prepared.openDeals} columns={[{ key: 'dealname', label: 'Deal' }, { key: 'display_name', label: 'Owner' }, { key: 'dealstage', label: 'Stage' }, { key: 'amount_home', label: 'Amount', render: (row) => formatMoney(row.amount_home) }, { key: 'next_activity_date', label: 'Next Activity' }, { key: 'days_since_activity', label: 'Days Since Activity' }]} />
        </SectionPanel>
        <SectionPanel title="AI Coaching">
          <ShowMoreTable rows={data.aiCoaching.rows} columns={[{ key: 'dealname', label: 'Deal' }, { key: 'display_name', label: 'Owner' }, { key: 'amount_home', label: 'Amount', render: (row) => formatMoney(row.amount_home) }, { key: 'coaching_reason', label: 'Reason' }, { key: 'days_since_activity', label: 'Days Since Activity' }]} />
        </SectionPanel>
        <SectionPanel title="Closed Won">
          <ShowMoreTable rows={prepared.wonDeals} columns={[{ key: 'dealname', label: 'Deal' }, { key: 'display_name', label: 'Owner' }, { key: 'amount_home', label: 'Amount', render: (row) => formatMoney(row.amount_home) }, { key: 'closedate', label: 'Close Date' }]} />
        </SectionPanel>
        <SectionPanel title="Closed Lost">
          <ShowMoreTable rows={prepared.lostDeals} columns={[{ key: 'dealname', label: 'Deal' }, { key: 'display_name', label: 'Owner' }, { key: 'amount_home', label: 'Amount', render: (row) => formatMoney(row.amount_home) }, { key: 'closedate', label: 'Close Date' }, { key: 'lost_reason', label: 'Reason' }]} />
        </SectionPanel>
      </div>
    </>
  );
}
