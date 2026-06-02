import { displayCell } from '../../lib/formatters';
import type { TableColumn } from '../../types';
import { EmptyState } from './EmptyState';

type Props<T extends Record<string, unknown>> = { columns: TableColumn<T>[]; rows: T[]; emptyMessage?: string };

export function DataTable<T extends Record<string, unknown>>({ columns, rows, emptyMessage }: Props<T>) {
  if (!rows.length) return <EmptyState message={emptyMessage} />;
  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : displayCell(row[column.key])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
