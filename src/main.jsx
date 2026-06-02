import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import './styles.css';

const APP_CONFIG = {
  ...(window.TALENTERA_CONFIG || {}),
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || window.TALENTERA_CONFIG?.supabaseUrl || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || window.TALENTERA_CONFIG?.supabaseAnonKey || ''
};

const ACQUISITION_PEOPLE = [
  { name: 'Mariata', role: 'Acquisition', activities: true },
  { name: 'Orsla', role: 'Acquisition', activities: true },
  { name: 'Ahmed Khawaja', role: 'Acquisition', activities: true },
  { name: 'Zain', role: 'Acquisition', activities: true },
  { name: 'Fares', role: 'Acquisition', activities: true },
  { name: 'Mohamed', role: 'Acquisition', activities: true },
  { name: 'Jihad', role: 'Acquisition', activities: true },
  { name: 'Fadi', role: 'Deals only', activities: false },
  { name: 'Faizan', role: 'Deals only', activities: false }
];

const RETENTION_PEOPLE = [
  { name: 'Fadi', role: 'RM', activities: true },
  { name: 'Jihad', role: 'RM', activities: true },
  { name: 'Faizan', role: 'RM', activities: true },
  { name: 'Haya', role: 'CSM', activities: true },
  { name: 'Mariam', role: 'CSM', activities: true },
  { name: 'Sara', role: 'CSM', activities: true },
  { name: 'Darshna', role: 'CSM', activities: true },
  { name: 'Hatem', role: 'CSM', activities: true }
];

const DEFAULT_FILTERS = {
  period: 'MTD',
  year: '2026',
  month: 'All',
  country: 'All',
  product: 'All',
  rank: 'All',
  tier: 'All'
};

const money = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const compactMoney = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

function formatValue(value, type = 'number') {
  if (type === 'text') return value || '—';
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  if (type === 'money') return `$${compactMoney.format(Number(value))}`;
  if (type === 'percent') return `${Number(value).toFixed(1)}%`;
  return money.format(Number(value));
}

function initials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getSupabase() {
  if (APP_CONFIG.useDemoData || !APP_CONFIG.supabaseUrl || !APP_CONFIG.supabaseAnonKey) return null;
  return createClient(APP_CONFIG.supabaseUrl, APP_CONFIG.supabaseAnonKey, {
    db: { schema: APP_CONFIG.schema || 'public' },
    auth: { persistSession: false }
  });
}

async function selectView(client, viewName, filters = {}) {
  let query = client.from(viewName).select('*');

  Object.entries(filters).forEach(([key, value]) => {
    if (!value || value === 'All') return;
    if (['period', 'year', 'month', 'country', 'product', 'rank', 'tier', 'owner_name', 'section'].includes(key)) {
      query = query.eq(key, value);
    }
  });

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

const demo = {
  acquisitionSummary: [
    { label: 'Today Focus', value: 128, helper: 'Rank A/B companies needing contact', tone: 'green' },
    { label: 'Untouched Rank A/B', value: 46, helper: 'No connected activity yet', tone: 'red' },
    { label: 'Deals at Risk', value: 18, helper: 'Open deals cold for 21+ days', tone: 'orange' },
    { label: 'Open Pipeline', value: 740000, helper: 'Open deal value', tone: 'blue', type: 'money' }
  ],
  acquisitionPeople: ACQUISITION_PEOPLE.map((person, index) => ({
    owner_name: person.name,
    role: person.role,
    activities: person.activities,
    calls_logged: person.activities ? 22 + index * 3 : 0,
    connected_calls: person.activities ? 9 + index * 2 : 0,
    meetings_completed: person.activities ? 4 + (index % 4) : 0,
    deals_created: person.activities ? 3 + (index % 3) : 0,
    open_deals: 9 + index,
    won_deals: 2 + (index % 3),
    lost_deals: index % 4,
    rank_a_companies: 8 + index,
    rank_b_companies: 14 + index
  })),
  acquisitionPriority: [
    { company: 'Ajdan', owner_name: 'Mariata', country: 'Saudi Arabia', rank: 'A', status: 'Needs contact', next_step: 'Call decision maker' },
    { company: 'Al Fardan', owner_name: 'Ahmed Khawaja', country: 'Qatar', rank: 'A', status: 'Untouched', next_step: 'Schedule intro' },
    { company: 'ANB', owner_name: 'Zain', country: 'Saudi Arabia', rank: 'B', status: 'At risk', next_step: 'Renew outreach sequence' },
    { company: 'DBB', owner_name: 'Jihad', country: 'UAE', rank: 'A', status: 'Cold deal', next_step: 'Manager follow-up' },
    { company: 'Rotana Hotels', owner_name: 'Mohamed', country: 'UAE', rank: 'B', status: 'Needs contact', next_step: 'Confirm stakeholder' }
  ],
  retentionSummary: [
    { label: 'Renewal Value', value: 1240000, helper: 'Filtered renewal scope', tone: 'green', type: 'money' },
    { label: 'Cash Collected', value: 430000, helper: 'Collected this year', tone: 'blue', type: 'money' },
    { label: 'Remaining Collection', value: 810000, helper: 'Booked/cash gap', tone: 'orange', type: 'money' },
    { label: 'Churned / Lost', value: 9, helper: 'Lost or churned accounts', tone: 'red' }
  ],
  retentionPeople: RETENTION_PEOPLE.map((person, index) => ({
    owner_name: person.name,
    role: person.role,
    calls_logged: 18 + index * 2,
    connected_calls: 10 + index,
    meetings_completed: 5 + (index % 5),
    deals_created: 2 + (index % 4),
    open_deals: 7 + index,
    won_deals: 3 + (index % 4),
    lost_deals: index % 3,
    tier_a_accounts: 5 + index,
    tier_b_accounts: 8 + index,
    tier_c_accounts: 3 + (index % 4),
    empty_tier_accounts: 1 + (index % 2)
  })),
  retentionAccounts: [
    { company: 'Perfect Presentation', owner_name: 'Fadi', csm: 'Haya', product: 'Talentera', tier: 'A', status: 'Booked', renewal_value: 8115, cash_collected: 0 },
    { company: '365 Human Resources', owner_name: 'Faizan', csm: 'Mariam', product: 'Talentera', tier: 'B', status: 'Duplicate guard needed', renewal_value: 24000, cash_collected: 12000 },
    { company: 'Rotana Hotels', owner_name: 'Jihad', csm: 'Sara', product: 'Evalufy', tier: 'A', status: 'Delayed', renewal_value: 56000, cash_collected: 0 },
    { company: 'Ajor', owner_name: 'Fadi', csm: 'Darshna', product: 'After Hire', tier: 'C', status: 'Expected to be lost', renewal_value: 18000, cash_collected: 0 },
    { company: 'Sabbour', owner_name: 'Faizan', csm: 'Hatem', product: 'Talentera', tier: '', status: 'Cash collected', renewal_value: 32000, cash_collected: 32000 }
  ],
  pnlMonthly: [
    { month: 'Jan', year: '2026', revenue: 180000, cogs: 42000, overheads: 22000, super_allocate: 12000 },
    { month: 'Feb', year: '2026', revenue: 210000, cogs: 51000, overheads: 24000, super_allocate: 13000 },
    { month: 'Mar', year: '2026', revenue: 195000, cogs: 47000, overheads: 26000, super_allocate: 14000 },
    { month: 'Apr', year: '2026', revenue: 240000, cogs: 58000, overheads: 27000, super_allocate: 16000 },
    { month: 'May', year: '2026', revenue: 275000, cogs: 64000, overheads: 29000, super_allocate: 17000 },
    { month: 'Jun', year: '2026', revenue: 260000, cogs: 61000, overheads: 30000, super_allocate: 17000 }
  ]
};

async function loadDashboard(filters) {
  const client = getSupabase();
  if (!client) return demo;

  const views = APP_CONFIG.views || {};
  try {
    const [
      acquisitionSummary,
      acquisitionPeople,
      acquisitionPriority,
      retentionSummary,
      retentionPeople,
      retentionAccounts,
      pnlMonthly
    ] = await Promise.all([
      selectView(client, views.acquisitionSummary, filters),
      selectView(client, views.acquisitionPeople, filters),
      selectView(client, views.acquisitionPriority, filters),
      selectView(client, views.retentionSummary, filters),
      selectView(client, views.retentionPeople, filters),
      selectView(client, views.retentionAccounts, filters),
      selectView(client, views.pnlMonthly, filters)
    ]);

    return {
      acquisitionSummary: acquisitionSummary.length ? acquisitionSummary : demo.acquisitionSummary,
      acquisitionPeople: acquisitionPeople.length ? acquisitionPeople : demo.acquisitionPeople,
      acquisitionPriority: acquisitionPriority.length ? acquisitionPriority : demo.acquisitionPriority,
      retentionSummary: retentionSummary.length ? retentionSummary : demo.retentionSummary,
      retentionPeople: retentionPeople.length ? retentionPeople : demo.retentionPeople,
      retentionAccounts: retentionAccounts.length ? retentionAccounts : demo.retentionAccounts,
      pnlMonthly: pnlMonthly.length ? pnlMonthly : demo.pnlMonthly
    };
  } catch (error) {
    console.error('Supabase dashboard load failed. Falling back to demo data.', error);
    return demo;
  }
}

function Sidebar({ active, setActive }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brandMark">T</div>
        <div>
          <strong>Talentera</strong>
          <span>Command Center</span>
        </div>
      </div>

      <nav className="navBlock">
        <button className={active.type === 'acquisition' && !active.owner ? 'active' : ''} onClick={() => setActive({ type: 'acquisition' })}>
          Acquisition
        </button>
        <div className="peopleList">
          {ACQUISITION_PEOPLE.map((person) => (
            <button key={person.name} className={active.type === 'acquisition' && active.owner === person.name ? 'active person' : 'person'} onClick={() => setActive({ type: 'acquisition', owner: person.name })}>
              <i>{initials(person.name)}</i>
              <span>{person.name}</span>
              <em>{person.role}</em>
            </button>
          ))}
        </div>
      </nav>

      <nav className="navBlock">
        <button className={active.type === 'retention' && !active.owner ? 'active' : ''} onClick={() => setActive({ type: 'retention' })}>
          Retention
        </button>
        <div className="peopleList">
          {RETENTION_PEOPLE.map((person) => (
            <button key={person.name} className={active.type === 'retention' && active.owner === person.name ? 'active person' : 'person'} onClick={() => setActive({ type: 'retention', owner: person.name })}>
              <i>{initials(person.name)}</i>
              <span>{person.name}</span>
              <em>{person.role}</em>
            </button>
          ))}
        </div>
      </nav>

      <nav className="navBlock">
        <button className={active.type === 'pnl' ? 'active' : ''} onClick={() => setActive({ type: 'pnl' })}>
          P&amp;L
        </button>
      </nav>
    </aside>
  );
}

function FilterBar({ filters, setFilters, mode }) {
  const months = ['All', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  return (
    <section className="filters">
      <label>
        Period
        <select value={filters.period} onChange={(event) => update('period', event.target.value)}>
          <option>Yesterday</option>
          <option>MTD</option>
          <option>YTD</option>
        </select>
      </label>
      <label>
        Year
        <select value={filters.year} onChange={(event) => update('year', event.target.value)}>
          <option>2026</option>
          <option>2025</option>
        </select>
      </label>
      <label>
        Month
        <select value={filters.month} onChange={(event) => update('month', event.target.value)}>
          {months.map((month) => <option key={month}>{month}</option>)}
        </select>
      </label>
      {mode !== 'pnl' && (
        <>
          <label>
            Country
            <select value={filters.country} onChange={(event) => update('country', event.target.value)}>
              <option>All</option>
              <option>Saudi Arabia</option>
              <option>UAE</option>
              <option>Qatar</option>
              <option>Egypt</option>
            </select>
          </label>
          <label>
            Product
            <select value={filters.product} onChange={(event) => update('product', event.target.value)}>
              <option>All</option>
              <option>Talentera</option>
              <option>Evalufy</option>
              <option>After Hire</option>
            </select>
          </label>
        </>
      )}
      {mode === 'acquisition' && (
        <label>
          Rank
          <select value={filters.rank} onChange={(event) => update('rank', event.target.value)}>
            <option>All</option>
            <option>A</option>
            <option>B</option>
          </select>
        </label>
      )}
      {mode === 'retention' && (
        <label>
          Tier
          <select value={filters.tier} onChange={(event) => update('tier', event.target.value)}>
            <option>All</option>
            <option>A</option>
            <option>B</option>
            <option>C</option>
            <option>Empty</option>
          </select>
        </label>
      )}
    </section>
  );
}

function KpiGrid({ cards }) {
  return (
    <section className="kpiGrid">
      {cards.map((card) => (
        <article key={card.label} className={`kpi ${card.tone || ''}`}>
          <span>{card.label}</span>
          <strong>{formatValue(card.value, card.type)}</strong>
          <small>{card.helper}</small>
        </article>
      ))}
    </section>
  );
}

function DataTable({ columns, rows, empty = 'No matching records yet.' }) {
  if (!rows.length) return <div className="empty">{empty}</div>;

  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.company || row.owner_name || row.month}-${index}`}>
              {columns.map((column) => (
                <td key={column.key}>{column.render ? column.render(row) : row[column.key] || '—'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BarChart({ rows }) {
  const max = Math.max(...rows.map((row) => Number(row.revenue || 0)), 1);

  return (
    <div className="bars">
      {rows.map((row) => {
        const totalCost = Number(row.cogs || 0) + Number(row.overheads || 0) + Number(row.super_allocate || 0);
        const profit = Number(row.revenue || 0) - totalCost;
        return (
          <div className="barItem" key={`${row.year}-${row.month}`}>
            <div className="barTrack">
              <div className="barFill" style={{ height: `${Math.max(8, (Number(row.revenue) / max) * 100)}%` }} />
            </div>
            <b>{row.month}</b>
            <span>{formatValue(row.revenue, 'money')}</span>
            <small>Net {formatValue(profit, 'money')}</small>
          </div>
        );
      })}
    </div>
  );
}

function PageHeader({ title, subtitle, badge }) {
  return (
    <header className="hero">
      <div>
        <span className="eyebrow">{badge}</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="statusPill">Live-ready React build</div>
    </header>
  );
}

function AcquisitionPage({ data, activeOwner }) {
  const people = activeOwner ? data.acquisitionPeople.filter((row) => row.owner_name === activeOwner) : data.acquisitionPeople;
  const ownerMeta = ACQUISITION_PEOPLE.find((person) => person.name === activeOwner);
  const priority = activeOwner ? data.acquisitionPriority.filter((row) => row.owner_name === activeOwner) : data.acquisitionPriority;

  const ownerCards = activeOwner && people[0]
    ? [
        { label: 'Calls Logged', value: ownerMeta?.activities ? people[0].calls_logged : 0, helper: ownerMeta?.activities ? 'Owner activity scope' : 'Deals-only owner: activities hidden', tone: 'blue' },
        { label: 'Connected Calls', value: ownerMeta?.activities ? people[0].connected_calls : 0, helper: ownerMeta?.activities ? 'Connected only' : 'Not applicable', tone: 'green' },
        { label: 'Open Deals', value: people[0].open_deals, helper: 'Open deals for this person', tone: 'orange' },
        { label: 'Won / Lost', value: `${people[0].won_deals}/${people[0].lost_deals}`, helper: 'Won vs lost deals', tone: 'red', type: 'text' }
      ]
    : data.acquisitionSummary;

  return (
    <>
      <PageHeader
        badge="Acquisition"
        title={activeOwner ? `${activeOwner} Performance` : 'Acquisition Command Center'}
        subtitle="Rank A/B focus, outreach coverage, owner execution, open/won/lost pipeline, and priority accounts."
      />
      <KpiGrid cards={ownerCards} />
      <section className="panelGrid">
        <div className="panel">
          <h2>{activeOwner ? 'Owner KPI Breakdown' : 'People Overview'}</h2>
          <DataTable
            rows={people}
            columns={[
              { key: 'owner_name', label: 'Owner' },
              { key: 'role', label: 'Role' },
              { key: 'calls_logged', label: 'Calls' },
              { key: 'connected_calls', label: 'Connected' },
              { key: 'meetings_completed', label: 'Meetings' },
              { key: 'open_deals', label: 'Open Deals' },
              { key: 'won_deals', label: 'Won' },
              { key: 'lost_deals', label: 'Lost' }
            ]}
          />
        </div>
        <div className="panel">
          <h2>Priority Rank A/B Accounts</h2>
          <DataTable
            rows={priority}
            columns={[
              { key: 'company', label: 'Company' },
              { key: 'owner_name', label: 'Owner' },
              { key: 'country', label: 'Country' },
              { key: 'rank', label: 'Rank' },
              { key: 'status', label: 'Status' },
              { key: 'next_step', label: 'Next Step' }
            ]}
          />
        </div>
      </section>
    </>
  );
}

function RetentionPage({ data, activeOwner }) {
  const people = activeOwner ? data.retentionPeople.filter((row) => row.owner_name === activeOwner) : data.retentionPeople;
  const accounts = activeOwner ? data.retentionAccounts.filter((row) => row.owner_name === activeOwner || row.csm === activeOwner) : data.retentionAccounts;

  const ownerCards = activeOwner && people[0]
    ? [
        { label: 'Calls Logged', value: people[0].calls_logged, helper: 'Retention activity scope', tone: 'blue' },
        { label: 'Connected Calls', value: people[0].connected_calls, helper: 'Connected only', tone: 'green' },
        { label: 'Open Deals', value: people[0].open_deals, helper: 'Open retention deals', tone: 'orange' },
        { label: 'Tier A/B/C/Empty', value: `${people[0].tier_a_accounts}/${people[0].tier_b_accounts}/${people[0].tier_c_accounts}/${people[0].empty_tier_accounts}`, helper: 'Company tier split', tone: 'red', type: 'text' }
      ]
    : data.retentionSummary;

  return (
    <>
      <PageHeader
        badge="Retention"
        title={activeOwner ? `${activeOwner} Retention View` : 'Retention Command Center'}
        subtitle="RM/CSM ownership, company tiers A/B/C/Empty, activity KPIs, renewal value, cash, remaining collection, and account status."
      />
      <KpiGrid cards={ownerCards} />
      <section className="panelGrid">
        <div className="panel">
          <h2>{activeOwner ? 'Person KPI Breakdown' : 'RM / CSM Overview'}</h2>
          <DataTable
            rows={people}
            columns={[
              { key: 'owner_name', label: 'Person' },
              { key: 'role', label: 'Role' },
              { key: 'calls_logged', label: 'Calls' },
              { key: 'connected_calls', label: 'Connected' },
              { key: 'meetings_completed', label: 'Meetings' },
              { key: 'deals_created', label: 'Deals Created' },
              { key: 'open_deals', label: 'Open' },
              { key: 'won_deals', label: 'Won' },
              { key: 'lost_deals', label: 'Lost' }
            ]}
          />
        </div>
        <div className="panel">
          <h2>Renewal / Account Scope</h2>
          <DataTable
            rows={accounts}
            columns={[
              { key: 'company', label: 'Company' },
              { key: 'owner_name', label: 'RM' },
              { key: 'csm', label: 'CSM' },
              { key: 'product', label: 'Product' },
              { key: 'tier', label: 'Tier', render: (row) => row.tier || 'Empty' },
              { key: 'status', label: 'Status' },
              { key: 'renewal_value', label: 'Renewal', render: (row) => formatValue(row.renewal_value, 'money') },
              { key: 'cash_collected', label: 'Cash', render: (row) => formatValue(row.cash_collected, 'money') }
            ]}
          />
        </div>
      </section>
    </>
  );
}

function PnlPage({ data }) {
  const pnlRows = data.pnlMonthly.map((row) => ({
    ...row,
    total_cost: Number(row.cogs || 0) + Number(row.overheads || 0) + Number(row.super_allocate || 0),
    net_profit: Number(row.revenue || 0) - Number(row.cogs || 0) - Number(row.overheads || 0) - Number(row.super_allocate || 0)
  }));

  const totalRevenue = pnlRows.reduce((sum, row) => sum + Number(row.revenue || 0), 0);
  const totalCost = pnlRows.reduce((sum, row) => sum + Number(row.total_cost || 0), 0);
  const totalProfit = totalRevenue - totalCost;

  return (
    <>
      <PageHeader
        badge="P&L"
        title="Revenue Analysis"
        subtitle="Revenue, COGS, overheads, super allocate, total cost, and net profit by month for 2025/2026 comparison."
      />
      <KpiGrid
        cards={[
          { label: 'Revenue', value: totalRevenue, helper: 'Filtered revenue', tone: 'green', type: 'money' },
          { label: 'Total Cost', value: totalCost, helper: 'COGS + Overheads + Super Allocate', tone: 'orange', type: 'money' },
          { label: 'Net Profit', value: totalProfit, helper: 'Revenue minus cost', tone: totalProfit >= 0 ? 'blue' : 'red', type: 'money' },
          { label: 'Margin', value: totalRevenue ? (totalProfit / totalRevenue) * 100 : 0, helper: 'Net profit margin', tone: 'green', type: 'percent' }
        ]}
      />
      <section className="panelGrid">
        <div className="panel">
          <h2>Monthly Revenue / Net Profit</h2>
          <BarChart rows={pnlRows} />
        </div>
        <div className="panel">
          <h2>P&L Breakdown</h2>
          <DataTable
            rows={pnlRows}
            columns={[
              { key: 'month', label: 'Month' },
              { key: 'revenue', label: 'Revenue', render: (row) => formatValue(row.revenue, 'money') },
              { key: 'cogs', label: 'COGS', render: (row) => formatValue(row.cogs, 'money') },
              { key: 'overheads', label: 'Overheads', render: (row) => formatValue(row.overheads, 'money') },
              { key: 'super_allocate', label: 'Super Allocate', render: (row) => formatValue(row.super_allocate, 'money') },
              { key: 'total_cost', label: 'Total Cost', render: (row) => formatValue(row.total_cost, 'money') },
              { key: 'net_profit', label: 'Net Profit', render: (row) => formatValue(row.net_profit, 'money') }
            ]}
          />
        </div>
      </section>
    </>
  );
}

function App() {
  const [active, setActive] = useState({ type: 'acquisition' });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [data, setData] = useState(demo);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    loadDashboard(filters)
      .then((nextData) => {
        if (alive) setData(nextData);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [filters]);

  const page = useMemo(() => {
    if (active.type === 'retention') return <RetentionPage data={data} activeOwner={active.owner} />;
    if (active.type === 'pnl') return <PnlPage data={data} />;
    return <AcquisitionPage data={data} activeOwner={active.owner} />;
  }, [active, data]);

  return (
    <div className="appShell">
      <Sidebar active={active} setActive={setActive} />
      <main className="main">
        <FilterBar filters={filters} setFilters={setFilters} mode={active.type} />
        {loading && <div className="loading">Refreshing dashboard data…</div>}
        {page}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
