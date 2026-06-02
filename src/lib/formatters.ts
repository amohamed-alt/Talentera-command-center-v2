export function formatNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  const number = Number(value);
  if (Number.isNaN(number)) return String(value);
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(number);
}

export function formatMoney(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  const number = Number(value);
  if (Number.isNaN(number)) return String(value);
  return `$${new Intl.NumberFormat('en-US', { notation: Math.abs(number) >= 100000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(number)}`;
}

export function formatPercent(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  const number = Number(value);
  if (Number.isNaN(number)) return String(value);
  return `${number.toFixed(1)}%`;
}

export function displayCell(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}
