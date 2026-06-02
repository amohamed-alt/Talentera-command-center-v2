import { useEffect, useMemo, useState } from 'react';
import { Header } from '../components/layout/Header';
import { KpiCard } from '../components/ui/KpiCard';
import { LoadingState } from '../components/ui/LoadingState';
import { SectionPanel } from '../components/ui/SectionPanel';
import { ShowMoreTable } from '../components/ui/ShowMoreTable';
import { fetchView } from '../lib/fetchView';
import { formatMoney, formatNumber, formatPercent } from '../lib/formatters';
import type { AnyRow, DashboardFilters, PersonConfig, ViewResult } from '../types';

type PersonData = {
  periodKpis: ViewResult;
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

export function AcquisitionPersonPage({ filters, person }: { filters: DashboardFilters; person: PersonConfig }) {
  const [data, setData] = useState<PersonData | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetchView('v_acq_period_kpis'),
      fetchView('v_acq_rank_coverage'),
      fetchView('v_acq_country_rank_summary'),
      fetchView('v_acq_deals'),
      fetchView('v_acq_ai_coaching')
    ]).then(([periodKpis, rankCoverage, countrySummary, deals, aiCoaching]) => {
      if (alive) setData({ periodKpis, rankCoverage, countrySummary, deals, aiCoaching });
    });
    return () => { alive = false; };
  }, []);

  const prepared = useMemo(() => {
    if (!data) return null;
    const periods = data.periodKpis.rows.filter((row) => row.person_key === person.key);
    const byPeriod = (period: string) => periods.find((row) => row.period === period) || {};
    const yesterday = byPeriod('yesterday');
    const mtd = byPeriod('mtd');
    const ytd = byPeriod('ytd');
    const rankRows = filterRows(data.rankCoverage.rows.filter((row) => row.person_key === person.key), filters);
    const untouched = rankRows.filter((row) => row.touched === false);
    const countryRows = data.countrySummary.rows.filter((row) => row.person_key === person.key);
    const personDeals = data.deals.rows.filter((row) => row.person_key === person.key);
    const openDeals = personDeals.filter((row) => row.deal_status === 'open');
    const wonDeals = personDeals.filter((row) => row.deal_status === 'won');
    const lostDeals = personDeals.filter((row) => row.deal_status === 'lost');
    const stuckDeals = openDeals.filter((row) => row.is_stuck === true);
    const coldDeals = openDeals.filter((row) => row.is_cold === true);
    const coaching = data.aiCoaching.rows.filter((row) => row.person_key === person.key);
    return { yesterday, mtd, ytd, rankRows, untouched, countryRows, openDeals, wonDeals, lostDeals, stuckDeals, coldDeals, coaching };
  }, [data, filters, person.key]);

  if (!data || !prepared) return <LoadingState />;

  const periodRows: AnyRow[] = [
    { label: 'Yesterday', ...prepared.yesterday },
    { label: 'MTD', ...prepared.mtd },
    { label: 'YTD', ...prepared.ytd }
  ];

  if (person.dealsOnly) {
    return (
      <>
        <Header badge="Acquisition Deals View" title={`Acquisition · ${person.displayName}`} subtitle="Deals-only SQL view: Open, Won, Lost, Pipeline, Stuck and Cold deals." />
        <div className="kpiGrid">
          <KpiCard title="Open Deals" value={formatNumber(prepared.ytd.open_deals)} subtitle={formatMoney(prepared.ytd.open_pipeline)} tone="orange" />
          <KpiCard title="Won YTD" value={formatMoney(prepared.ytd.won_amount)} subtitle={`${formatNumber(prepared.ytd.won_deals)} deals`} tone="green" />
          <KpiCard title="Lost YTD" value={formatMoney(prepared.ytd.lost_amount)} subtitle={`${formatNumber(prepared.ytd.lost_deals)} deals`} tone="red" />
          <KpiCard title="Needs Attention" value={formatNumber(prepared.coaching.length)} tone="orange" />
        </div>
        <div className="panelGrid">
          <SectionPanel title="Open Deals"><ShowMoreTable rows={prepared.openDeals} columns={[{ key: 'dealname', label: 'Deal' },{ key: 'dealstage', label: 'Stage' },{ key: 'amount_home', label: 'Amount', render: (row) => formatMoney(row.amount_home) },{ key: 'next_activity_date', label: 'Next Activity' },{ key: 'is_stuck', label: 'Stuck' },{ key: 'is_cold', label: 'Cold' }]} /></SectionPanel>
          <SectionPanel title="AI Coaching"><ShowMoreTable rows={prepared.coaching} columns={[{ key: 'dealname', label: 'Deal' },{ key: 'amount_home', label: 'Amount', render: (row) => formatMoney(row.amount_home) },{ key: 'coaching_reason', label: 'Reason' },{ key: 'days_since_activity', label: 'Days Since Activity' }]} /></SectionPanel>
          <SectionPanel title="Stuck Deals"><ShowMoreTable rows={prepared.stuckDeals} columns={[{ key: 'dealname', label: 'Deal' },{ key: 'days_in_stage', label: 'Days Stuck', render: (row) => formatNumber(row.days_in_stage) },{ key: 'amount_home', label: 'Amount', render: (row) => formatMoney(row.amount_home) }]} /></SectionPanel>
          <SectionPanel title="Cold Deals"><ShowMoreTable rows={prepared.coldDeals} columns={[{ key: 'dealname', label: 'Deal' },{ key: 'days_since_activity', label: 'Days Cold', render: (row) => formatNumber(row.days_since_activity) },{ key: 'amount_home', label: 'Amount', render: (row) => formatMoney(row.amount_home) }]} /></SectionPanel>
        </div>
      </>
    );
  }

  return (
    <>
      <Header badge="Acquisition Rep" title={`Acquisition · ${person.displayName}`} subtitle="Live Supabase SQL views scoped to this representative." />
      <div className="kpiGrid">
        <KpiCard title="Calls Yesterday" value={formatNumber(prepared.yesterday.calls)} subtitle={`${formatNumber(prepared.yesterday.connected_calls)} connected · ${formatPercent(prepared.yesterday.connection_rate)}`} tone="blue" />
        <KpiCard title="Calls MTD" value={formatNumber(prepared.mtd.calls)} subtitle={`${formatNumber(prepared.mtd.connected_calls)} connected · ${formatPercent(prepared.mtd.connection_rate)}`} tone="blue" />
        <KpiCard title="Calls YTD" value={formatNumber(prepared.ytd.calls)} subtitle={`${formatNumber(prepared.ytd.connected_calls)} connected · ${formatPercent(prepared.ytd.connection_rate)}`} tone="green" />
        <KpiCard title="Meetings YTD" value={formatNumber(prepared.ytd.meetings)} tone="green" />
        <KpiCard title="Open Deals" value={formatNumber(prepared.ytd.open_deals)} subtitle={formatMoney(prepared.ytd.open_pipeline)} tone="orange" />
        <KpiCard title="Won YTD" value={formatMoney(prepared.ytd.won_amount)} subtitle={`${formatNumber(prepared.ytd.won_deals)} deals`} tone="green" />
        <KpiCard title="Lost YTD" value={formatMoney(prepared.ytd.lost_amount)} subtitle={`${formatNumber(prepared.ytd.lost_deals)} deals`} tone="red" />
        <KpiCard title="Needs Attention" value={formatNumber(prepared.coaching.length)} tone="orange" />
      </div>
      <div className="panelGrid two">
        <SectionPanel title="Yesterday / MTD / YTD"><ShowMoreTable rows={periodRows} columns={[{ key: 'label', label: 'Period' },{ key: 'calls', label: 'Calls', render: (row) => formatNumber(row.calls) },{ key: 'connected_calls', label: 'Connected', render: (row) => formatNumber(row.connected_calls) },{ key: 'connection_rate', label: 'Rate', render: (row) => formatPercent(row.connection_rate) },{ key: 'meetings', label: 'Meetings', render: (row) => formatNumber(row.meetings) },{ key: 'leads', label: 'Leads', render: (row) => formatNumber(row.leads) }]} /></SectionPanel>
        <SectionPanel title="Country Coverage"><ShowMoreTable rows={prepared.countryRows} columns={[{ key: 'country', label: 'Country' },{ key: 'rank_a', label: 'Rank A' },{ key: 'rank_b', label: 'Rank B' },{ key: 'touched', label: 'Touched' },{ key: 'untouched', label: 'Untouched' },{ key: 'total', label: 'Total' }]} /></SectionPanel>
      </div>
      <div className="panelGrid">
        <SectionPanel title="Needs to Contact / Rank A-B Coverage"><ShowMoreTable rows={prepared.untouched} columns={[{ key: 'company_name', label: 'Company' },{ key: 'country', label: 'Country' },{ key: 'rank', label: 'Rank' },{ key: 'connected_calls', label: 'Connected Calls' },{ key: 'completed_meetings', label: 'Meetings' },{ key: 'next_activity_date', label: 'Next Activity' }]} /></SectionPanel>
        <SectionPanel title="Open Deals"><ShowMoreTable rows={prepared.openDeals} columns={[{ key: 'dealname', label: 'Deal' },{ key: 'dealstage', label: 'Stage' },{ key: 'amount_home', label: 'Amount', render: (row) => formatMoney(row.amount_home) },{ key: 'next_activity_date', label: 'Next Activity' },{ key: 'days_since_activity', label: 'Days Since Activity' }]} /></SectionPanel>
        <SectionPanel title="AI Coaching"><ShowMoreTable rows={prepared.coaching} columns={[{ key: 'dealname', label: 'Deal' },{ key: 'amount_home', label: 'Amount', render: (row) => formatMoney(row.amount_home) },{ key: 'coaching_reason', label: 'Reason' },{ key: 'days_since_activity', label: 'Days Since Activity' }]} /></SectionPanel>
        <SectionPanel title="Stuck Deals"><ShowMoreTable rows={prepared.stuckDeals} columns={[{ key: 'dealname', label: 'Deal' },{ key: 'days_in_stage', label: 'Days Stuck', render: (row) => formatNumber(row.days_in_stage) },{ key: 'amount_home', label: 'Amount', render: (row) => formatMoney(row.amount_home) }]} /></SectionPanel>
        <SectionPanel title="Cold Deals"><ShowMoreTable rows={prepared.coldDeals} columns={[{ key: 'dealname', label: 'Deal' },{ key: 'days_since_activity', label: 'Days Cold', render: (row) => formatNumber(row.days_since_activity) },{ key: 'amount_home', label: 'Amount', render: (row) => formatMoney(row.amount_home) }]} /></SectionPanel>
      </div>
    </>
  );
}
