import { useEffect, useState } from 'react';
import { Header } from '../components/layout/Header';
import { DataTable } from '../components/ui/DataTable';
import { KpiCard } from '../components/ui/KpiCard';
import { LoadingState } from '../components/ui/LoadingState';
import { SectionPanel } from '../components/ui/SectionPanel';
import { loadLegacyAcquisition } from '../data/legacyDashboard';
import { formatMoney, formatNumber, formatPercent } from '../lib/formatters';
import type { AnyRow, DashboardFilters } from '../types';

function n(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function rows(value: unknown): AnyRow[] {
  return Array.isArray(value) ? (value as AnyRow[]) : [];
}

export function AcquisitionOverview({ filters }: { filters: DashboardFilters }) {
  const [data, setData] = useState<AnyRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setError(null);
    loadLegacyAcquisition()
      .then((next) => alive && setData(next))
      .catch((err: Error) => alive && setError(err.message));
    return () => { alive = false; };
  }, [filters]);

  if (error) throw new Error(error);
  if (!data) return <LoadingState />;

  const meta = (data.meta || {}) as AnyRow;
  const kpi = (data.kpi || {}) as AnyRow;
  const y = (kpi.yesterday || {}) as AnyRow;
  const mtd = (kpi.mtd || {}) as AnyRow;
  const ytd = (kpi.ytd || {}) as AnyRow;
  const team = (data.team || {}) as AnyRow;
  const repData = rows(data.repData);
  const activeReps = repData.filter((rep) => rep.type !== 'view');
  const stageData = rows(data.stageData);
  const priorityLeads = rows(data.priorityLeads).slice(0, 12);
  const sourcePerformance = rows(data.sourcePerformance).slice(0, 12);
  const managerActions = (data.managerActions || {}) as AnyRow;
  const firstLook = (data.firstLookSummary || {}) as AnyRow;

  return (
    <>
      <Header badge="Acquisition" title="Acquisition Command Center" subtitle={`Updated ${String(meta.generatedAt || '')} · ${String(meta.yesterdayLabel || data.yesterdayLabel || '')}`} />

      <div className="kpiGrid">
        <KpiCard title="Calls Yesterday" value={formatNumber(y.calls)} subtitle={`${formatNumber(y.connected)} connected · ${formatPercent(y.connRate)}`} tone="blue" />
        <KpiCard title="Meetings Yesterday" value={formatNumber(y.meetings)} tone="green" />
        <KpiCard title="New Leads Yesterday" value={formatNumber(y.leads)} tone="orange" />
        <KpiCard title="Open Pipeline" value={formatMoney(team.pipeline)} subtitle={`${formatNumber(team.openDeals)} open deals`} tone="blue" />
        <KpiCard title="Calls MTD" value={formatNumber(mtd.calls)} subtitle={`${formatNumber(mtd.connected)} connected · ${formatPercent(mtd.connRate)}`} tone="blue" />
        <KpiCard title="Calls YTD" value={formatNumber(ytd.calls)} subtitle={`${formatNumber(ytd.connected)} connected · ${formatPercent(ytd.connRate)}`} tone="green" />
        <KpiCard title="Won YTD" value={formatMoney(ytd.wonAmt)} subtitle={`${formatNumber(ytd.wonDeals)} deals`} tone="green" />
        <KpiCard title="Lost YTD" value={formatMoney(ytd.lostAmt)} subtitle={`${formatNumber(ytd.lost)} deals`} tone="red" />
      </div>

      <div className="panelGrid two">
        <SectionPanel title="Yesterday Performance" subtitle="Exact values from the legacy n8n JSON output.">
          <DataTable rows={[y, mtd, ytd].map((row, index) => ({ period: ['Yesterday', 'MTD', 'YTD'][index], ...row }))} columns={[
            { key: 'period', label: 'Period' },
            { key: 'calls', label: 'Calls', render: (row) => formatNumber(row.calls) },
            { key: 'connected', label: 'Connected', render: (row) => formatNumber(row.connected) },
            { key: 'connRate', label: 'Conn Rate', render: (row) => formatPercent(row.connRate) },
            { key: 'meetings', label: 'Meetings', render: (row) => formatNumber(row.meetings) },
            { key: 'leads', label: 'Leads', render: (row) => formatNumber(row.leads) },
            { key: 'wonAmt', label: 'Won', render: (row) => formatMoney(row.wonAmt) },
            { key: 'lostAmt', label: 'Lost', render: (row) => formatMoney(row.lostAmt) }
          ]} />
        </SectionPanel>

        <SectionPanel title="Rep Execution" subtitle="Same repData object used by the old HTML dashboard.">
          <DataTable rows={activeReps} columns={[
            { key: 'name', label: 'Rep' },
            { key: 'calls', label: 'Calls YTD', render: (row) => formatNumber((row.calls as AnyRow)?.ytd) },
            { key: 'connected', label: 'Connected YTD', render: (row) => formatNumber((row.calls as AnyRow)?.ytdConn) },
            { key: 'connRateYTD', label: 'Conn Rate', render: (row) => formatPercent(row.connRateYTD) },
            { key: 'meetings', label: 'Meetings YTD', render: (row) => formatNumber((row.meetings as AnyRow)?.ytd) },
            { key: 'openDeals', label: 'Open Deals', render: (row) => formatNumber(row.openDeals) },
            { key: 'pipeAmt', label: 'Pipeline', render: (row) => formatMoney(row.pipeAmt) }
          ]} />
        </SectionPanel>
      </div>

      <div className="panelGrid">
        <SectionPanel title="Pipeline Stages">
          <DataTable rows={stageData} columns={[
            { key: 'name', label: 'Stage' },
            { key: 'count', label: 'Deals', render: (row) => formatNumber(row.count) },
            { key: 'amount', label: 'Amount', render: (row) => formatMoney(row.amount) }
          ]} />
        </SectionPanel>

        <SectionPanel title="Priority Leads">
          <DataTable rows={priorityLeads} columns={[
            { key: 'name', label: 'Lead' },
            { key: 'companyName', label: 'Company' },
            { key: 'ownerName', label: 'Owner' },
            { key: 'source', label: 'Source' },
            { key: 'status', label: 'Status' },
            { key: 'daysWithoutContact', label: 'Days No Contact', render: (row) => formatNumber(row.daysWithoutContact) }
          ]} />
        </SectionPanel>

        <SectionPanel title="Lead Source Performance">
          <DataTable rows={sourcePerformance} columns={[
            { key: 'source', label: 'Source' },
            { key: 'created', label: 'Created', render: (row) => formatNumber(row.created) },
            { key: 'contacted', label: 'Contacted', render: (row) => formatNumber(row.contacted) },
            { key: 'converted', label: 'Converted', render: (row) => formatNumber(row.converted) },
            { key: 'conversionRate', label: 'Conversion', render: (row) => formatPercent(row.conversionRate) }
          ]} />
        </SectionPanel>

        <SectionPanel title="Manager Actions">
          <DataTable rows={rows(managerActions.actions || managerActions.items || firstLook.priorityActions)} columns={[
            { key: 'title', label: 'Action' },
            { key: 'description', label: 'Description' },
            { key: 'impact', label: 'Impact' },
            { key: 'owner', label: 'Owner' }
          ]} />
        </SectionPanel>
      </div>
    </>
  );
}
