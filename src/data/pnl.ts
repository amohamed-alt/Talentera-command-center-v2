import { views } from '../config/dashboardViews';
import { fetchView } from '../lib/fetchView';
import type { DashboardFilters } from '../types';

export async function loadPnlOverview(filters: DashboardFilters) {
  const v = views.pnl;
  const [monthlySummary, costBreakdown, productProfitability] = await Promise.all([
    fetchView(v.monthlySummary, filters),
    fetchView(v.costBreakdown, filters),
    fetchView(v.productProfitability, filters)
  ]);
  return { monthlySummary, costBreakdown, productProfitability };
}
