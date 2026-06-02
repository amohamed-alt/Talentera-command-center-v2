import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from './ChartCard';
import type { AnyRow } from '../../types';

export function LineTrendChart({ title, rows, xKey, lines }: { title: string; rows: AnyRow[]; xKey: string; lines: string[] }) {
  return (
    <ChartCard title={title} rows={rows}>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          {lines.map((line) => <Line key={line} type="monotone" dataKey={line} stroke="#129B78" strokeWidth={3} dot={false} />)}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
