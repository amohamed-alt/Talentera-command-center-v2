import type { AnyRow } from '../types';

export function numberFrom(row: AnyRow | undefined, keys: string[]): number | null {
  if (!row) return null;
  for (const key of keys) {
    const value = row[key];
    if (value !== null && value !== undefined && value !== '') {
      const number = Number(value);
      if (!Number.isNaN(number)) return number;
    }
  }
  return null;
}

export function sumRows(rows: AnyRow[], keys: string[]) {
  if (!rows.length) return null;
  let total = 0;
  let found = false;
  rows.forEach((row) => {
    keys.forEach((key) => {
      const value = row[key];
      const number = Number(value);
      if (value !== null && value !== undefined && value !== '' && !Number.isNaN(number)) {
        total += number;
        found = true;
      }
    });
  });
  return found ? total : null;
}

export function countRows(rows: AnyRow[]) {
  return rows.length ? rows.length : null;
}

export function ratio(numerator: number | null, denominator: number | null) {
  if (numerator === null || denominator === null || denominator === 0) return null;
  return (numerator / denominator) * 100;
}
