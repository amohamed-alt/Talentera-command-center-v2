export type Tone = 'green' | 'red' | 'orange' | 'blue' | 'neutral';
export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'rank' | 'tier' | 'stage';
export type Section = 'acquisition' | 'retention' | 'pnl';
export type DataStatus = 'ready' | 'not-configured' | 'missing-view' | 'error';

export type DashboardFilters = {
  year: string;
  month: string;
  country: string;
  product: string;
  rank: string;
  tier: string;
  status: string;
};

export type RouteState = {
  section: Section;
  personKey?: string;
};

export type PersonConfig = {
  key: string;
  displayName: string;
  aliases: string[];
  role: string;
  section: 'acquisition' | 'retention';
  route: string;
  showActivities: boolean;
  dealsOnly?: boolean;
};

export type ViewResult<T = Record<string, unknown>> = {
  view: string;
  rows: T[];
  status: DataStatus;
  message?: string;
};

export type Kpi = {
  title: string;
  value: string | number | null;
  subtitle?: string;
  tone?: Tone;
};

export type TableColumn<T> = {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
};

export type AnyRow = Record<string, unknown>;
