import type { StatusTone } from '../../types';

export function StatusPill({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: StatusTone }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}
