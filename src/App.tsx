import { useEffect, useMemo, useState } from 'react';
import { acquisitionPeople, findPersonByRoute, retentionPeople } from './config/people';
import { currentYear } from './lib/dateUtils';
import { DashboardShell } from './components/layout/DashboardShell';
import { AcquisitionOverview } from './pages/AcquisitionOverview';
import { AcquisitionPersonPage } from './pages/AcquisitionPersonPage';
import { RetentionOverview } from './pages/RetentionOverview';
import { RetentionPersonPage } from './pages/RetentionPersonPage';
import { PnlOverview } from './pages/PnlOverview';
import type { DashboardFilters, RouteState } from './types';

const defaultFilters: DashboardFilters = { year: currentYear, month: 'All', country: 'All', product: 'All', rank: 'All', tier: 'All', status: 'All' };

function parseRoute(): RouteState {
  const path = window.location.hash.replace(/^#/, '') || '/acquisition';
  if (path === '/pnl') return { section: 'pnl' };
  const person = findPersonByRoute(path);
  if (person) return { section: person.section, personKey: person.key };
  if (path.startsWith('/retention')) return { section: 'retention' };
  return { section: 'acquisition' };
}

export default function App() {
  const [route, setRoute] = useState<RouteState>(() => parseRoute());
  const [filters, setFilters] = useState(defaultFilters);
  useEffect(() => { const onHash = () => setRoute(parseRoute()); window.addEventListener('hashchange', onHash); return () => window.removeEventListener('hashchange', onHash); }, []);
  const navigate = (path: string) => { window.location.hash = path; setRoute(parseRoute()); };
  const page = useMemo(() => {
    if (route.section === 'pnl') return <PnlOverview filters={filters} />;
    if (route.section === 'retention') {
      const person = retentionPeople.find((item) => item.key === route.personKey);
      return person ? <RetentionPersonPage filters={filters} person={person} /> : <RetentionOverview filters={filters} />;
    }
    const person = acquisitionPeople.find((item) => item.key === route.personKey);
    return person ? <AcquisitionPersonPage filters={filters} person={person} /> : <AcquisitionOverview filters={filters} />;
  }, [route, filters]);
  return <DashboardShell route={route} filters={filters} setFilters={setFilters} navigate={navigate}>{page}</DashboardShell>;
}
