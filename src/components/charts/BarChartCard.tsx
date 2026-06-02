import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from './ChartCard';
import type { AnyRow } from '../../types';

export function BarChartCard({ title, rows, xKey, bars }: { title: string; rows: AnyRow[]; xKey: string; bars: string[] }) {
  return (
    <ChartCard title={title} rows={rows}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          {bars.map((bar) => <Bar key={bar} dataKey={bar} fill="#129B78" radius={[8, 8, 0, 0]} />)}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
