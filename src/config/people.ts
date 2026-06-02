import type { PersonConfig } from '../types';

export const acquisitionPeople: PersonConfig[] = [
  { key: 'acq_marita', displayName: 'Marita Chedid', aliases: ['marita chedid', 'marita', 'mariata'], role: 'Sales', section: 'acquisition', route: '/acquisition/marita', showActivities: true },
  { key: 'acq_ursula', displayName: 'Ursula Waked', aliases: ['ursula waked', 'ursula', 'orsla', 'orslo'], role: 'Sales', section: 'acquisition', route: '/acquisition/ursula', showActivities: true },
  { key: 'acq_ahmad_khawajah', displayName: 'Ahmad Khawajah', aliases: ['ahmad khawajah', 'ahmed khawaja', 'ahmed khawajah'], role: 'Sales', section: 'acquisition', route: '/acquisition/ahmad-khawajah', showActivities: true },
  { key: 'acq_zein_fares', displayName: 'Zein Fares', aliases: ['zein fares', 'zain fares'], role: 'Sales', section: 'acquisition', route: '/acquisition/zein-fares', showActivities: true },
  { key: 'acq_mohamed_ashraf', displayName: 'Mohamed Ashraf', aliases: ['mohamed ashraf'], role: 'Sales', section: 'acquisition', route: '/acquisition/mohamed-ashraf', showActivities: true },
  { key: 'acq_jihad', displayName: 'Mohammad Jehad Al-Barqawi', aliases: ['mohammad jehad al-barqawi', 'mohammad jehad', 'jihad', 'jehad'], role: 'Sales', section: 'acquisition', route: '/acquisition/jihad', showActivities: true },
  { key: 'acq_fadi', displayName: 'Fadi Zanona', aliases: ['fadi zanona', 'fadi'], role: 'VIEW', section: 'acquisition', route: '/acquisition/fadi', showActivities: false, dealsOnly: true },
  { key: 'acq_faizan', displayName: 'Mohammed Faizan', aliases: ['mohammed faizan', 'faizan'], role: 'VIEW', section: 'acquisition', route: '/acquisition/faizan', showActivities: false, dealsOnly: true }
];

export const retentionPeople: PersonConfig[] = [
  { key: 'ret_fadi', displayName: 'Fadi Zanona', aliases: ['fadi zanona', 'fadi'], role: 'RM', section: 'retention', route: '/retention/fadi', showActivities: true },
  { key: 'ret_jihad', displayName: 'Mohammad Jehad Al-Barqawi', aliases: ['mohammad jehad al-barqawi', 'mohammad jehad', 'jihad', 'jehad'], role: 'RM', section: 'retention', route: '/retention/jihad', showActivities: true },
  { key: 'ret_faizan', displayName: 'Mohammed Faizan', aliases: ['mohammed faizan', 'faizan'], role: 'RM', section: 'retention', route: '/retention/faizan', showActivities: true },
  { key: 'ret_haya', displayName: 'Haia Al-Zo’ubi', aliases: ['haia al-zo’ubi', 'haia', 'haya'], role: 'CSM', section: 'retention', route: '/retention/haia', showActivities: true },
  { key: 'ret_mariam', displayName: 'Maryam Alfarra', aliases: ['maryam alfarra', 'mariam', 'maryam'], role: 'CSM', section: 'retention', route: '/retention/mariam', showActivities: true },
  { key: 'ret_sara', displayName: 'Sara Hamouda', aliases: ['sara hamouda', 'sara'], role: 'CSM', section: 'retention', route: '/retention/sara', showActivities: true },
  { key: 'ret_darshna', displayName: 'Darshna Suresh', aliases: ['darshna suresh', 'darshna'], role: 'CSM', section: 'retention', route: '/retention/darshna', showActivities: true },
  { key: 'ret_hatem', displayName: 'Hatem Alawneh', aliases: ['hatem alawneh', 'hatem'], role: 'CSM', section: 'retention', route: '/retention/hatem', showActivities: true }
];

export function findPersonByRoute(path: string) {
  return [...acquisitionPeople, ...retentionPeople].find((person) => person.route === path);
}

export function personNameMatches(rowValue: unknown, person: PersonConfig) {
  const value = String(rowValue || '').trim().toLowerCase();
  return person.aliases.some((alias) => value === alias || value.includes(alias));
}
