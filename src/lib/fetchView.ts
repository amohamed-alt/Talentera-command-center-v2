import { getSupabaseClient } from './supabase';
import type { AnyRow, DashboardFilters, ViewResult } from '../types';

const filterColumnMap: Record<keyof DashboardFilters, string[]> = {
  year: ['year'],
  month: ['month'],
  country: ['country'],
  product: ['product'],
  rank: ['rank', 'acquisition_rank'],
  tier: ['tier'],
  status: ['status', 'account_status']
};

function sameValue(a: unknown, b: unknown) {
  return String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();
}

function rowMatches(row: AnyRow, columns: string[], value: string) {
  const existingColumns = columns.filter((column) => column in row);
  if (!existingColumns.length) return true;
  return existingColumns.some((column) => sameValue(row[column], value));
}

function applyClientFilters<T extends AnyRow>(rows: T[], filters?: Partial<DashboardFilters>, extraFilters?: Record<string, string | number | boolean | null>) {
  let nextRows = rows;
  Object.entries(filters || {}).forEach(([rawKey, value]) => {
    if (!value || value === 'All') return;
    const key = rawKey as keyof DashboardFilters;
    const columns = filterColumnMap[key] || [key];
    nextRows = nextRows.filter((row) => rowMatches(row, columns, String(value)));
  });
  Object.entries(extraFilters || {}).forEach(([column, value]) => {
    if (value === null || value === undefined || value === '') return;
    nextRows = nextRows.filter((row) => (column in row ? sameValue(row[column], value) : true));
  });
  return nextRows;
}

export async function fetchView<T extends AnyRow = AnyRow>(view: string, filters?: Partial<DashboardFilters>, extraFilters?: Record<string, string | number | boolean | null>): Promise<ViewResult<T>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { view, rows: [], status: 'not-configured', message: 'Data source not connected yet' };
  try {
    const { data, error } = await supabase.from(view).select('*').limit(5000);
    if (error) {
      const missing = error.message?.toLowerCase().includes('does not exist') || error.code === '42P01';
      return { view, rows: [], status: missing ? 'missing-view' : 'error', message: error.message };
    }
    return { view, rows: applyClientFilters((data || []) as T[], filters, extraFilters), status: 'ready' };
  } catch (error) {
    return { view, rows: [], status: 'error', message: error instanceof Error ? error.message : 'Unknown data error' };
  }
}

export async function fetchViews<T extends Record<string, string>>(viewMap: T, filters?: Partial<DashboardFilters>) {
  const entries = await Promise.all(Object.entries(viewMap).map(async ([key, view]) => [key, await fetchView(view, filters)]));
  return Object.fromEntries(entries) as Record<keyof T, ViewResult>;
}
