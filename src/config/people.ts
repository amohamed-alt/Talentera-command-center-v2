import type { PersonConfig } from '../types';

export const acquisitionPeople: PersonConfig[] = [
  { key: 'acq_marita', displayName: 'Marita Chedid', aliases: ['marita chedid'], role: 'Sales', section: 'acquisition', route: '/acquisition/marita', showActivities: true },
  { key: 'acq_zein_fares', displayName: 'Zein Fares', aliases: ['zein fares'], role: 'Sales', section: 'acquisition', route: '/acquisition/zein-fares', showActivities: true },
  { key: 'acq_ursula', displayName: 'Ursula Waked', aliases: ['ursula waked'], role: 'Sales', section: 'acquisition', route: '/acquisition/ursula', showActivities: true },
  { key: 'acq_ahmad_khawajah', displayName: 'Ahmad Khawajah', aliases: ['ahmad khawajah'], role: 'Sales', section: 'acquisition', route: '/acquisition/ahmad-khawajah', showActivities: true },
  { key: 'acq_jihad', displayName: 'Mohammad Jehad Al-Barqawi', aliases: ['mohammad jehad al-barqawi', 'jehad al-barqawi'], role: 'Sales', section: 'acquisition', route: '/acquisition/jehad', showActivities: true },
  { key: 'acq_fadi', displayName: 'Fadi Zanona', aliases: ['fadi zanona'], role: 'VIEW', section: 'acquisition', route: '/acquisition/fadi', showActivities: false, dealsOnly: true },
  { key: 'acq_faizan', displayName: 'Mohammed Faizan', aliases: ['mohammed faizan'], role: 'VIEW', section: 'acquisition', route: '/acquisition/faizan', showActivities: false, dealsOnly: true }
];

export const retentionPeople: PersonConfig[] = [
  { key: 'ret_fadi', displayName: 'Fadi Zanona', aliases: ['fadi zanona'], role: 'RM', section: 'retention', route: '/retention/fadi', showActivities: true },
  { key: 'ret_jihad', displayName: 'Mohammad Jehad Al-Barqawi', aliases: ['mohammad jehad al-barqawi', 'jehad al-barqawi'], role: 'RM', section: 'retention', route: '/retention/jihad', showActivities: true },
  { key: 'ret_faizan', displayName: 'Mohammed Faizan', aliases: ['mohammed faizan'], role: 'RM', section: 'retention', route: '/retention/faizan', showActivities: true },
  { key: 'ret_haya', displayName: 'Haia Al-Zoubi', aliases: ['haia al-zoubi', 'haia'], role: 'CSM', section: 'retention', route: '/retention/haia', showActivities: true },
  { key: 'ret_mariam', displayName: 'Maryam Alfarra', aliases: ['maryam alfarra'], role: 'CSM', section: 'retention', route: '/retention/maryam', showActivities: true },
  { key: 'ret_sara', displayName: 'Sarah Al-jarrah', aliases: ['sarah al-jarrah', 'sara hamouda'], role: 'CSM', section: 'retention', route: '/retention/sarah', showActivities: true },
  { key: 'ret_darshna', displayName: 'Darshna Suresh', aliases: ['darshna suresh'], role: 'CSM', section: 'retention', route: '/retention/darshna', showActivities: true },
  { key: 'ret_hatem', displayName: 'Hatem Alawneh', aliases: ['hatem alawneh'], role: 'CSM', section: 'retention', route: '/retention/hatem', showActivities: true }
];

export function findPersonByRoute(path: string) {
  return [...acquisitionPeople, ...retentionPeople].find((person) => person.route === path);
}

export function personNameMatches(rowValue: unknown, person: PersonConfig) {
  const value = String(rowValue || '').trim().toLowerCase();
  return person.aliases.some((alias) => value === alias || value.includes(alias));
}
