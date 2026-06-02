import type { AnyRow } from '../types';

const ACQ_URL = 'https://amohamed-alt.github.io/talentera-huddle/data.json';
const RET_URL = 'https://amohamed-alt.github.io/talentera-huddle/data-retention.json';

let acqCache: Promise<AnyRow> | null = null;
let retCache: Promise<AnyRow> | null = null;

async function loadJson(url: string) {
  const response = await fetch(`${url}?t=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load ${url}: HTTP ${response.status}`);
  return response.json() as Promise<AnyRow>;
}

export function loadLegacyAcquisition() {
  if (!acqCache) acqCache = loadJson(ACQ_URL);
  return acqCache;
}

export function loadLegacyRetention() {
  if (!retCache) retCache = loadJson(RET_URL);
  return retCache;
}

export async function loadLegacyAll() {
  const [acquisition, retention] = await Promise.all([loadLegacyAcquisition(), loadLegacyRetention()]);
  return { acquisition, retention };
}

export function clearLegacyCache() {
  acqCache = null;
  retCache = null;
}

export function byName(rows: AnyRow[] | undefined, name: string) {
  const target = name.trim().toLowerCase();
  return (rows || []).find((row) => String(row.name || '').trim().toLowerCase() === target);
}

export function firstName(name: string) {
  return String(name || '').split(' ')[0] || name;
}
