import type { ReactNode } from 'react';
import { FilterBar } from './FilterBar';
import { Sidebar } from './Sidebar';
import type { DashboardFilters, RouteState } from '../../types';

export function DashboardShell({ route, filters, setFilters, navigate, children }: { route: RouteState; filters: DashboardFilters; setFilters: React.Dispatch<React.SetStateAction<DashboardFilters>>; navigate: (path: string) => void; children: ReactNode }) {
  return <div className="appShell"><Sidebar route={route} navigate={navigate} /><main className="main"><FilterBar filters={filters} setFilters={setFilters} section={route.section} />{children}</main></div>;
}
