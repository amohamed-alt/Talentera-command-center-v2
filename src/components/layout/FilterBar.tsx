import { months } from '../../lib/dateUtils';
import type { DashboardFilters, Section } from '../../types';

type Props = { filters: DashboardFilters; setFilters: React.Dispatch<React.SetStateAction<DashboardFilters>>; section: Section };

export function FilterBar({ filters, setFilters, section }: Props) {
  const set = (key: keyof DashboardFilters, value: string) => setFilters((current) => ({ ...current, [key]: value }));
  return (
    <section className="filters">
      <label>Year<select value={filters.year} onChange={(e) => set('year', e.target.value)}><option>2026</option><option>2025</option></select></label>
      <label>Month<select value={filters.month} onChange={(e) => set('month', e.target.value)}>{months.map((month) => <option key={month}>{month}</option>)}</select></label>
      {section !== 'pnl' ? <label>Product<select value={filters.product} onChange={(e) => set('product', e.target.value)}><option>All</option><option>Talentera</option><option>Evalufy</option><option>After Hire</option></select></label> : null}
      {section === 'acquisition' ? <><label>Country<select value={filters.country} onChange={(e) => set('country', e.target.value)}><option>All</option><option>Saudi Arabia</option><option>UAE</option><option>Qatar</option><option>Egypt</option></select></label><label>Rank<select value={filters.rank} onChange={(e) => set('rank', e.target.value)}><option>All</option><option>A</option><option>B</option></select></label></> : null}
      {section === 'retention' ? <><label>Tier<select value={filters.tier} onChange={(e) => set('tier', e.target.value)}><option>All</option><option>A</option><option>B</option><option>C</option><option>Empty</option></select></label><label>Status<select value={filters.status} onChange={(e) => set('status', e.target.value)}><option>All</option><option>Active</option><option>Churned</option><option>Expected to be lost</option><option>Lost from 2025</option></select></label></> : null}
    </section>
  );
}
