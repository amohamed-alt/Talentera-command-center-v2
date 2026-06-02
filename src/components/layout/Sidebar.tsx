import { acquisitionPeople, retentionPeople } from '../../config/people';
import type { RouteState } from '../../types';

function initials(name: string) {
  return name.split(/[\s/]+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

type Props = { route: RouteState; navigate: (path: string) => void };

export function Sidebar({ route, navigate }: Props) {
  return (
    <aside className="sidebar">
      <div className="brand"><div className="brandMark">T</div><div><strong>Talentera</strong><span>Sales Command Center</span></div></div>
      <nav className="navBlock">
        <button className={route.section === 'acquisition' && !route.personKey ? 'active' : ''} onClick={() => navigate('/acquisition')}>Acquisition Overview</button>
        <div className="peopleList">
          {acquisitionPeople.map((person) => <button key={person.route} className={route.section === 'acquisition' && route.personKey === person.key ? 'active person' : 'person'} onClick={() => navigate(person.route)}><i>{initials(person.displayName)}</i><span>{person.displayName}</span><em>{person.role}</em></button>)}
        </div>
      </nav>
      <nav className="navBlock">
        <button className={route.section === 'retention' && !route.personKey ? 'active' : ''} onClick={() => navigate('/retention')}>Retention Overview</button>
        <div className="peopleList">
          {retentionPeople.map((person) => <button key={person.route} className={route.section === 'retention' && route.personKey === person.key ? 'active person' : 'person'} onClick={() => navigate(person.route)}><i>{initials(person.displayName)}</i><span>{person.displayName}</span><em>{person.role}</em></button>)}
        </div>
      </nav>
      <nav className="navBlock"><button className={route.section === 'pnl' ? 'active' : ''} onClick={() => navigate('/pnl')}>P&L</button></nav>
    </aside>
  );
}
