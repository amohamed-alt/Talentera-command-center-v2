import type { ReactNode } from 'react';
import { EmptyState } from '../ui/EmptyState';

export function ChartCard({ title, rows, children }: { title: string; rows: unknown[]; children: ReactNode }) {
  return (
    <div className="chartCard">
      <h3>{title}</h3>
      {rows.length ? children : <EmptyState message="Data source not connected yet" />}
    </div>
  );
}
