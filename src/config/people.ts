import type { PersonConfig } from '../types';

export const acquisitionPeople: PersonConfig[] = [
  { key: 'marita', displayName: 'Marita / Mariata', aliases: ['marita', 'mariata', 'merita'], role: 'Sales', section: 'acquisition', route: '/acquisition/marita', showActivities: true },
  { key: 'ursula', displayName: 'Ursula / Orsla / Orslo', aliases: ['ursula', 'orsla', 'orslo'], role: 'Sales', section: 'acquisition', route: '/acquisition/ursula', showActivities: true },
  { key: 'ahmed-khawajah', displayName: 'Ahmed Khawajah', aliases: ['ahmed khawajah', 'ahmed khawaja'], role: 'Sales', section: 'acquisition', route: '/acquisition/ahmed-khawajah', showActivities: true },
  { key: 'zein-fares', displayName: 'Zein Fares', aliases: ['zein fares', 'zain fares'], role: 'Sales', section: 'acquisition', route: '/acquisition/zein-fares', showActivities: true },
  { key: 'fares', displayName: 'Fares', aliases: ['fares'], role: 'Sales', section: 'acquisition', route: '/acquisition/fares', showActivities: true },
  { key: 'mohamed', displayName: 'Mohamed', aliases: ['mohamed', 'muhammad'], role: 'Sales', section: 'acquisition', route: '/acquisition/mohamed', showActivities: true },
  { key: 'jihad', displayName: 'Jihad', aliases: ['jihad', 'gihad'], role: 'Sales', section: 'acquisition', route: '/acquisition/jihad', showActivities: true },
  { key: 'fadi', displayName: 'Fadi', aliases: ['fadi'], role: 'VIEW', section: 'acquisition', route: '/acquisition/fadi', showActivities: false, dealsOnly: true },
  { key: 'faizan', displayName: 'Faizan', aliases: ['faizan'], role: 'VIEW', section: 'acquisition', route: '/acquisition/faizan', showActivities: false, dealsOnly: true }
];

export const retentionPeople: PersonConfig[] = [
  { key: 'fadi', displayName: 'Fadi', aliases: ['fadi'], role: 'RM', section: 'retention', route: '/retention/fadi', showActivities: true },
  { key: 'jihad', displayName: 'Jihad', aliases: ['jihad', 'gihad'], role: 'RM', section: 'retention', route: '/retention/jihad', showActivities: true },
  { key: 'faizan', displayName: 'Faizan', aliases: ['faizan'], role: 'RM', section: 'retention', route: '/retention/faizan', showActivities: true },
  { key: 'haia', displayName: 'Haia', aliases: ['haia', 'haya'], role: 'CSM', section: 'retention', route: '/retention/haia', showActivities: true },
  { key: 'mariam', displayName: 'Mariam', aliases: ['mariam'], role: 'CSM', section: 'retention', route: '/retention/mariam', showActivities: true },
  { key: 'sara', displayName: 'Sara', aliases: ['sara'], role: 'CSM', section: 'retention', route: '/retention/sara', showActivities: true },
  { key: 'darshna', displayName: 'Darshna', aliases: ['darshna'], role: 'CSM', section: 'retention', route: '/retention/darshna', showActivities: true },
  { key: 'hatem', displayName: 'Hatem', aliases: ['hatem'], role: 'CSM', section: 'retention', route: '/retention/hatem', showActivities: true }
];

export function findPersonByRoute(path: string) {
  return [...acquisitionPeople, ...retentionPeople].find((person) => person.route === path);
}

export function personNameMatches(rowValue: unknown, person: PersonConfig) {
  const value = String(rowValue || '').trim().toLowerCase();
  return person.aliases.some((alias) => value === alias || value.includes(alias));
}
