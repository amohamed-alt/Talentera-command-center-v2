import { useMemo, useState } from 'react';
import type { TableColumn } from '../../types';
import { DataTable } from './DataTable';

type Props<T extends Record<string, unknown>> = {
  columns: TableColumn<T>[];
  rows: T[];
  initialRows?: number;
  emptyMessage?: string;
};

export function ShowMoreTable<T extends Record<string, unknown>>({ columns, rows, initialRows = 5, emptyMessage }: Props<T>) {
  const [expanded, setExpanded] = useState(false);
  const visibleRows = useMemo(() => (expanded ? rows : rows.slice(0, initialRows)), [expanded, rows, initialRows]);
  const hiddenCount = Math.max(0, rows.length - visibleRows.length);

  return (
    <div>
      <DataTable columns={columns} rows={visibleRows} emptyMessage={emptyMessage} />
      {rows.length > initialRows ? (
        <button className="showMoreBtn" type="button" onClick={() => setExpanded((value) => !value)}>
          {expanded ? 'Show less' : `Show more (${hiddenCount})`}
        </button>
      ) : null}
    </div>
  );
}
