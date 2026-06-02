import { getSupabaseClient } from './supabase';
import type { AnyRow, DashboardFilters, ViewResult } from '../types';

const filterColumnMap: Record<keyof DashboardFilters, string[]> = {
  year: ['year'],
  month: ['month'],
  country: ['country'],
  product: ['product'],
  rank: ['rank'],
  tier: ['tier'],
  status: ['status', 'account_status']
};

export async function fetchView<T extends AnyRow = AnyRow>(view: string, filters?: Partial<DashboardFilters>, extraFilters?: Record<string, string | number | boolean | null>): Promise<ViewResult<T>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { view, rows: [], status: 'not-configured', message: 'Data source not connected yet' };

  try {
    let query = supabase.from(view).select('*');

    Object.entries(filters || {}).forEach(([rawKey, value]) => {
      if (!value || value === 'All') return;
      const key = rawKey as keyof DashboardFilters;
      const columns = filterColumnMap[key] || [key];
      if (columns.length === 1) query = query.eq(columns[0], value);
    });

    Object.entries(extraFilters || {}).forEach(([column, value]) => {
      if (value === null || value === undefined || value === '') return;
      query = query.eq(column, value);
    });

    const { data, error } = await query.limit(5000);
    if (error) {
      const missing = error.message?.toLowerCase().includes('does not exist') || error.code === '42P01';
      return { view, rows: [], status: missing ? 'missing-view' : 'error', message: error.message };
    }

    return { view, rows: (data || []) as T[], status: 'ready' };
  } catch (error) {
    return { view, rows: [], status: 'error', message: error instanceof Error ? error.message : 'Unknown data error' };
  }
}

export async function fetchViews<T extends Record<string, string>>(viewMap: T, filters?: Partial<DashboardFilters>) {
  const entries = await Promise.all(Object.entries(viewMap).map(async ([key, view]) => [key, await fetchView(view, filters)]));
  return Object.fromEntries(entries) as Record<keyof T, ViewResult>;
}
