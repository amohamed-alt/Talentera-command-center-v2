import { useEffect, useState } from 'react';
import { LineTrendChart } from '../components/charts/LineTrendChart';
import { Header } from '../components/layout/Header';
import { DataTable } from '../components/ui/DataTable';
import { KpiCard } from '../components/ui/KpiCard';
import { LoadingState } from '../components/ui/LoadingState';
import { SectionPanel } from '../components/ui/SectionPanel';
import { loadPnlOverview } from '../data/pnl';
import { formatMoney, formatPercent } from '../lib/formatters';
import { ratio, sumRows } from '../lib/metrics';
import type { AnyRow, DashboardFilters } from '../types';

export function PnlOverview({ filters }: { filters: DashboardFilters }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof loadPnlOverview>> | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { let alive = true; setLoading(true); loadPnlOverview(filters).then((next) => alive && setData(next)).finally(() => alive && setLoading(false)); return () => { alive = false; }; }, [filters]);
  if (loading || !data) return <LoadingState />;
  const booking = sumRows(data.monthlySummary.rows, ['booking', 'booking_amount']);
  const cashing = sumRows(data.monthlySummary.rows, ['cashing', 'cashing_amount']);
  const totalCost = sumRows(data.monthlySummary.rows, ['total_cost']);
  const netCash = sumRows(data.monthlySummary.rows, ['net_cash', 'net']);
  return <><Header badge="P&L" title="P&L Command Center" subtitle="Booking, cashing, cost, net cash position, margin and product profitability." /><div className="kpiGrid"><KpiCard title="Booking" value={formatMoney(booking)} tone="green" /><KpiCard title="Cashing" value={formatMoney(cashing)} tone="blue" /><KpiCard title="Total Cost" value={formatMoney(totalCost)} tone="orange" /><KpiCard title="Net Cash" value={formatMoney(netCash)} tone="green" /><KpiCard title="COGS" value={formatMoney(sumRows(data.costBreakdown.rows, ['cogs']))} tone="orange" /><KpiCard title="Overheads" value={formatMoney(sumRows(data.costBreakdown.rows, ['overheads']))} tone="orange" /><KpiCard title="Support Allocation" value={formatMoney(sumRows(data.costBreakdown.rows, ['support_allocation', 'super_allocate']))} tone="orange" /><KpiCard title="Net Margin" value={formatPercent(ratio(netCash, booking))} tone="green" /></div><div className="panelGrid"><LineTrendChart title="Monthly P&L" rows={data.monthlySummary.rows} xKey="month" lines={['booking', 'cashing', 'total_cost', 'net_cash']} /><SectionPanel title="Monthly P&L Details"><DataTable rows={data.monthlySummary.rows} columns={[{ key: 'year', label: 'Year' }, { key: 'month', label: 'Month' }, { key: 'product', label: 'Product' }, { key: 'booking', label: 'Booking', render: (row: AnyRow) => formatMoney(row.booking) }, { key: 'cashing', label: 'Cashing', render: (row: AnyRow) => formatMoney(row.cashing) }, { key: 'total_cost', label: 'Total Cost', render: (row: AnyRow) => formatMoney(row.total_cost) }, { key: 'net_cash', label: 'Net Cash', render: (row: AnyRow) => formatMoney(row.net_cash) }]} /></SectionPanel><SectionPanel title="Product Profitability"><DataTable rows={data.productProfitability.rows} columns={[{ key: 'product', label: 'Product' }, { key: 'booking', label: 'Booking', render: (row: AnyRow) => formatMoney(row.booking) }, { key: 'cashing', label: 'Cashing', render: (row: AnyRow) => formatMoney(row.cashing) }, { key: 'cost', label: 'Cost', render: (row: AnyRow) => formatMoney(row.cost) }, { key: 'net', label: 'Net', render: (row: AnyRow) => formatMoney(row.net) }, { key: 'margin', label: 'Margin', render: (row: AnyRow) => formatPercent(row.margin) }]} /></SectionPanel></div></>;
}
