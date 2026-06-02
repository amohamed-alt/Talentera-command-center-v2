import { useEffect, useState } from 'react';
import { Header } from '../components/layout/Header';
import { DataTable } from '../components/ui/DataTable';
import { KpiCard } from '../components/ui/KpiCard';
import { LoadingState } from '../components/ui/LoadingState';
import { SectionPanel } from '../components/ui/SectionPanel';
import { loadLegacyRetention } from '../data/legacyDashboard';
import { formatMoney, formatNumber } from '../lib/formatters';
import type { AnyRow, DashboardFilters } from '../types';

function asRows(value: unknown): AnyRow[] { return Array.isArray(value) ? value as AnyRow[] : []; }
function amountTotal(list: AnyRow[]) { return list.reduce((sum, row) => sum + Number(row.amount || 0), 0); }

export function RetentionOverview({ filters }: { filters: DashboardFilters }) {
  const [data, setData] = useState<AnyRow | null>(null);
  useEffect(() => { let ok = true; loadLegacyRetention().then((next) => { if (ok) setData(next); }); return () => { ok = false; }; }, [filters]);
  if (!data) return <LoadingState />;

  const summary = (data.summary || {}) as AnyRow;
  const kpis = (data.kpis || data.kpi || {}) as AnyRow;
  const ytd = (kpis.ytd || {}) as AnyRow;
  const yest = (kpis.yesterday || kpis.yest || {}) as AnyRow;
  const mtd = (kpis.mtd || {}) as AnyRow;
  const owners = asRows(data.ownerMatrix || data.repData);
  const rms = asRows(data.rmMatrix);
  const csms = asRows(data.csmMatrix);
  const split = (data.dealsSplit || {}) as AnyRow;
  const tierFollowup = (data.tierFollowup || {}) as AnyRow;

  return <>
    <Header badge="Retention" title="Retention Command Center" subtitle={`${String(data.yesterdayLabel || '')} · exact n8n JSON output`} />
    <div className="kpiGrid">
      <KpiCard title="Active Accounts" value={formatNumber(summary.activeAccounts)} tone="blue" />
      <KpiCard title="Churned Accounts" value={formatNumber(summary.churnedAccounts)} tone="red" />
      <KpiCard title="Delayed Renewals" value={formatNumber(summary.delayedRenewals)} subtitle={formatMoney(ytd.delayedAmt)} tone="orange" />
      <KpiCard title="Renewed Deals" value={formatNumber(summary.renewedDeals)} subtitle={formatMoney(ytd.renewedAmt)} tone="green" />
      <KpiCard title="Booked YTD" value={formatMoney(ytd.bookedAmt)} subtitle={`${formatNumber(ytd.booked)} deals`} tone="green" />
      <KpiCard title="Cashed YTD" value={formatMoney(ytd.cashedAmt)} subtitle={`${formatNumber(ytd.cashed)} deals`} tone="blue" />
      <KpiCard title="Calls YTD" value={formatNumber(ytd.calls)} tone="blue" />
      <KpiCard title="Meetings YTD" value={formatNumber(ytd.meetings)} tone="green" />
    </div>
    <div className="panelGrid two">
      <SectionPanel title="Retention Period KPIs"><DataTable rows={[yest, mtd, ytd].map((row, i) => ({ period: ['Yesterday','MTD','YTD'][i], ...row }))} columns={[{ key:'period', label:'Period' },{ key:'calls', label:'Calls', render: row => formatNumber(row.calls) },{ key:'meetings', label:'Meetings', render: row => formatNumber(row.meetings) },{ key:'renewedAmt', label:'Renewed', render: row => formatMoney(row.renewedAmt) },{ key:'bookedAmt', label:'Booked', render: row => formatMoney(row.bookedAmt) },{ key:'cashedAmt', label:'Cashed', render: row => formatMoney(row.cashedAmt) },{ key:'delayedAmt', label:'Delayed', render: row => formatMoney(row.delayedAmt) }]} /></SectionPanel>
      <SectionPanel title="Owner Matrix"><DataTable rows={owners} columns={[{ key:'name', label:'Owner' },{ key:'role', label:'Role' },{ key:'accounts', label:'Accounts', render: row => formatNumber(row.accounts) },{ key:'activeAccounts', label:'Active', render: row => formatNumber(row.activeAccounts) },{ key:'renewedAmt', label:'Renewed', render: row => formatMoney(row.renewedAmt) },{ key:'bookedAmt', label:'Booked', render: row => formatMoney(row.bookedAmt) },{ key:'cashedAmt', label:'Cashed', render: row => formatMoney(row.cashedAmt) },{ key:'delayedAmt', label:'Delayed', render: row => formatMoney(row.delayedAmt) }]} /></SectionPanel>
    </div>
    <div className="panelGrid">
      <SectionPanel title="RM Matrix"><DataTable rows={rms} columns={[{ key:'name', label:'RM' },{ key:'accounts', label:'Accounts', render: row => formatNumber(row.accounts) },{ key:'noContact', label:'No Contact', render: row => formatNumber(row.noContact) },{ key:'noMeeting', label:'No Meeting', render: row => formatNumber(row.noMeeting) },{ key:'tierFollowupDue', label:'Tier Followup', render: row => formatNumber(row.tierFollowupDue) }]} /></SectionPanel>
      <SectionPanel title="CSM Matrix"><DataTable rows={csms} columns={[{ key:'name', label:'CSM' },{ key:'accounts', label:'Accounts', render: row => formatNumber(row.accounts) },{ key:'noContact', label:'No Contact', render: row => formatNumber(row.noContact) },{ key:'noMeeting', label:'No Meeting', render: row => formatNumber(row.noMeeting) },{ key:'tierFollowupDue', label:'Tier Followup', render: row => formatNumber(row.tierFollowupDue) }]} /></SectionPanel>
      <SectionPanel title="Deal Splits"><DataTable rows={[{ type:'Renewed', count:asRows(split.renewed).length, amount:amountTotal(asRows(split.renewed)) },{ type:'Booked', count:asRows(split.booked).length, amount:amountTotal(asRows(split.booked)) },{ type:'Cashed', count:asRows(split.cashed).length, amount:amountTotal(asRows(split.cashed)) },{ type:'Churn', count:asRows(split.churn).length, amount:amountTotal(asRows(split.churn)) },{ type:'Delayed', count:asRows(data.delayedRenewals).length, amount:amountTotal(asRows(data.delayedRenewals)) }]} columns={[{ key:'type', label:'Type' },{ key:'count', label:'Count', render: row => formatNumber(row.count) },{ key:'amount', label:'Amount', render: row => formatMoney(row.amount) }]} /></SectionPanel>
      <SectionPanel title="Tier Follow-Up Summary"><DataTable rows={asRows(tierFollowup.summary)} columns={[{ key:'tier', label:'Tier' },{ key:'accounts', label:'Accounts', render: row => formatNumber(row.accounts) },{ key:'rmDue', label:'RM Due', render: row => formatNumber(row.rmDue) },{ key:'csmDue', label:'CSM Due', render: row => formatNumber(row.csmDue) },{ key:'totalDue', label:'Total Due', render: row => formatNumber(row.totalDue) },{ key:'rmCadence', label:'RM Cadence' },{ key:'csmCadence', label:'CSM Cadence' }]} /></SectionPanel>
    </div>
  </>;
}
