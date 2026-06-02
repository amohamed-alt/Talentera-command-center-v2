import type { Tone } from '../../types';

type Props = {
  title: string;
  value: string | number | null;
  subtitle?: string;
  tone?: Tone;
};

export function KpiCard({ title, value, subtitle, tone = 'neutral' }: Props) {
  return (
    <article className={`kpi ${tone}`}>
      <span>{title}</span>
      <strong>{value === null || value === undefined || value === '' ? '—' : value}</strong>
      {subtitle ? <small>{subtitle}</small> : null}
    </article>
  );
}
