/**
 * modules/retention-team.js
 */
(function () {
  'use strict';
  const { card, table, section, hero } = Components;
  const { money, num, pct, esc, hsLink, relativeDate } = Fmt;
  const { get } = AppState;
  const { setTitle, sectionUnavailable } = Utils;

  // ─── column definitions ──────────────────────────────────────────────────
  const smartCols = [
    { label: '#', key: 'sort_order' },
    { label: 'Action', key: 'title' },
    { label: 'Description', key: 'description' },
    { label: 'Accounts', key: 'accounts', render: r => num(r.accounts) },
    { label: 'Status', key: 'status' }
  ];

  const kpiCols = [
    { label: 'Period', key: 'period' },
    { label: 'Calls', key: 'calls_logged', render: r => num(r.calls_logged) },
    { label: 'Meetings', key: 'meetings_completed', render: r => num(r.meetings_completed) },
    { label: 'Booked', key: 'booked_count', render: r => num(r.booked_count) },
    { label: 'Cashed', key: 'cashed_count', render: r => num(r.cashed_count) },
    { label: 'Delayed', key: 'delayed_count', render: r => num(r.delayed_count) }
  ];

  const monthCols = [
    { label: 'Month', key: 'month' },
    { label: 'Due', key: 'due_accounts', render: r => num(r.due_accounts) },
    { label: 'Booked', key: 'booked_accounts', render: r => num(r.booked_accounts) },
    { label: 'Cashed', key: 'cashed_accounts', render: r => num(r.cashed_accounts) },
    { label: 'Delayed', key: 'delayed_accounts', render: r => num(r.delayed_accounts) },
    { label: 'Value', key: 'renewal_value', render: r => money(r.renewal_value) }
  ];

  const renewalCols = [
    { label: 'Account', key: 'company_name' },
    { label: 'Tier', key: 'tier_group' },
    { label: 'Renewal Value', key: 'renewal_value', render: r => money(r.renewal_value) },
    { label: 'Month', key: 'month' },
    { label: 'Renewal Date', key: 'renewal_date', render: r => r.renewal_date ? r.renewal_date.slice(0, 10) : '—' },
    { label: 'RM', key: 'rm_owner' },
    { label: 'CSM', key: 'csm_owner' },
    { label: 'Status', key: 'renewal_status', render: r => {
      const s = String(r.renewal_status || r.status || '').toLowerCase();
      const cls = r.is_delayed ? 'bad' : s.includes('lost') ? 'bad' : s.includes('booked') || s.includes('cashed') ? 'ok' : 'warn';
      return `<span class="status-pill ${cls}">${esc(r.renewal_status || r.status || '—')}</span>`;
    }},
    { label: 'HubSpot', key: 'hubspot_company_id', render: r => hsLink(r.hubspot_company_id || r.hs_object_id, 'company') }
  ];

  const covCols = [
    { label: 'Role', key: 'role' },
    { label: 'Owner', key: 'owner_name' },
    { label: 'Accounts', key: 'accounts', render: r => num(r.accounts) },
    { label: 'Delayed', key: 'delayed_accounts', render: r => num(r.delayed_accounts) },
    { label: 'Score', key: 'call_coverage_score', render: r => pct(r.call_coverage_score) }
  ];

  const churnCols = [
    { label: 'Reason', key: 'reason' },
    { label: 'Deals', key: 'deals', render: r => num(r.deals) },
    { label: 'Value', key: 'value', render: r => money(r.value) },
    { label: 'Top Account', key: 'top_account' }
  ];

  const followCols = [
    { label: 'Role', key: 'role' },
    { label: 'Owner', key: 'owner_name' },
    { label: 'Account', key: 'company_name' },
    { label: 'Tier', key: 'tier_group' },
    { label: 'Days', key: 'days_since_last_activity', render: r => num(r.days_since_last_activity) },
    { label: 'Alert', key: 'alert' },
    { label: 'HubSpot', key: 'hubspot_company_id', render: r => hsLink(r.hubspot_company_id || r.hs_object_id, 'company') }
  ];

  // ─── client-side derivations ─────────────────────────────────────────────
  function buildFocusFromLogic(renewals) {
    const delayed = renewals.filter(r => r.is_delayed);
    return {
      delayed_renewals: delayed.length,
      tier_a_overdue: delayed.filter(r => Number(r.renewal_value) > 5000).length,
      csm_follow_up_due: delayed.filter(r => r.csm_owner).length,
      rm_follow_up_due: delayed.filter(r => r.rm_owner).length
    };
  }

  function buildSmartActions(f) {
    return [
      { sort_order: 1, title: 'Work delayed renewals', description: 'Renewal date passed, no movement detected.', accounts: f.delayed_renewals, status: 'Delayed' },
      { sort_order: 2, title: 'Clear high-value overdue', description: 'High-value accounts need urgent action.', accounts: f.tier_a_overdue, status: 'Overdue' },
      { sort_order: 3, title: 'CSM follow-up due', description: 'Delayed accounts with assigned CSM.', accounts: f.csm_follow_up_due, status: 'CSM' },
      { sort_order: 4, title: 'RM follow-up due', description: 'Delayed accounts with assigned RM.', accounts: f.rm_follow_up_due, status: 'RM' }
    ];
  }

  function buildKpiFromLogic(renewals) {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toDateString();
    return [
      { period: 'Yesterday', calls_logged: 0, meetings_completed: 0, booked_count: renewals.filter(r => { const d = new Date(r.first_booked_date || r.renewal_date); return d.toDateString() === yStr && Number(r.booked_value) > 0; }).length, cashed_count: renewals.filter(r => { const d = new Date(r.first_collection_date || r.renewal_date); return d.toDateString() === yStr && Number(r.collected_value) > 0; }).length, delayed_count: renewals.filter(r => r.is_delayed && new Date(r.renewal_date).toDateString() === yStr).length },
      { period: 'MTD', calls_logged: 0, meetings_completed: 0, booked_count: renewals.filter(r => { const d = new Date(r.first_booked_date || r.renewal_date); return d.getFullYear() === y && d.getMonth() === m && Number(r.booked_value) > 0; }).length, cashed_count: renewals.filter(r => { const d = new Date(r.first_collection_date || r.renewal_date); return d.getFullYear() === y && d.getMonth() === m && Number(r.collected_value) > 0; }).length, delayed_count: renewals.filter(r => r.is_delayed && new Date(r.renewal_date).getFullYear() === y && new Date(r.renewal_date).getMonth() === m).length },
      { period: 'YTD', calls_logged: 0, meetings_completed: 0, booked_count: renewals.filter(r => { const d = new Date(r.first_booked_date || r.renewal_date); return d.getFullYear() === y && Number(r.booked_value) > 0; }).length, cashed_count: renewals.filter(r => { const d = new Date(r.first_collection_date || r.renewal_date); return d.getFullYear() === y && Number(r.collected_value) > 0; }).length, delayed_count: renewals.filter(r => r.is_delayed && new Date(r.renewal_date).getFullYear() === y).length }
    ];
  }

  function buildCovFromLogic(renewals) {
    const ownerMap = {};
    renewals.forEach(r => {
      [['RM', r.rm_owner], ['CSM', r.csm_owner]].forEach(([role, name]) => {
        if (!name) return;
        const k = role + '|' + name;
        ownerMap[k] = ownerMap[k] || { role, owner_name: name, accounts: 0, delayed_accounts: 0 };
        ownerMap[k].accounts++;
        if (r.is_delayed) ownerMap[k].delayed_accounts++;
      });
    });
    return Object.values(ownerMap).map(x => ({
      ...x,
      call_coverage_score: ((x.accounts - x.delayed_accounts) / Math.max(1, x.accounts)) * 100
    }));
  }

  // ─── render ──────────────────────────────────────────────────────────────
  async function render() {
    setTitle('Retention · Team Overview', 'Renewal movement and follow-up focus');

    const results = await Promise.allSettled([
      get('vw_dash_ret_focus_fast', 1),
      get('vw_dash_ret_smart_fast', 20),
      get('vw_retention_kpi_snapshot', 10),
      get('vw_retention_renewal_logic', 500),
      get('vw_retention_monthly_renewal_pipeline', 30),
      get('vw_retention_churn_reasons', 30),
      get('vw_retention_coverage_quality', 50),
      get('vw_retention_followup_due_details', 200)
    ]);

    const [focusR, smartR, kpiR, logicR, monthR, churnR, covR, followR] = results;

    const renewals = logicR.status === 'fulfilled' ? logicR.value : [];

    // Focus stats: prefer dedicated view, fall back to logic derivation
    const focusSnap = focusR.status === 'fulfilled' ? focusR.value[0] || buildFocusFromLogic(renewals) : buildFocusFromLogic(renewals);
    const f = {
      delayed_renewals: focusSnap.delayed_renewals || 0,
      tier_a_overdue: focusSnap.tier_a_overdue || 0,
      csm_follow_up_due: focusSnap.csm_follow_up_due || 0,
      rm_follow_up_due: focusSnap.rm_follow_up_due || 0
    };

    const smart = smartR.status === 'fulfilled' ? smartR.value : buildSmartActions(f);
    const kpi = kpiR.status === 'fulfilled' ? kpiR.value : buildKpiFromLogic(renewals);
    const monthly = monthR.status === 'fulfilled' ? monthR.value : [];
    const churn = churnR.status === 'fulfilled' ? churnR.value : [];
    const coverage = covR.status === 'fulfilled' ? covR.value : buildCovFromLogic(renewals);
    const followup = followR.status === 'fulfilled' ? followR.value
      : renewals.filter(r => r.is_delayed).slice(0, 150).map(r => ({
          role: 'RM/CSM', owner_name: r.rm_owner || r.csm_owner || 'Unassigned',
          company_name: r.company_name, tier_group: r.tier_group || '—',
          days_since_last_activity: 0, alert: 'Follow-up due',
          hubspot_company_id: r.hubspot_company_id
        }));

    const delayed = renewals.filter(r => r.is_delayed);
    const kpiCards = [
      card('Delayed Renewals', num(f.delayed_renewals), 'Need action', 'red',
        delayed.length ? { title: 'Delayed Renewals', columns: renewalCols, rows: delayed } : null),
      card('High Value Overdue', num(f.tier_a_overdue), 'Over $5K value', 'orange',
        { title: 'High Value Overdue', columns: renewalCols, rows: delayed.filter(r => Number(r.renewal_value) > 5000) }),
      card('CSM Follow-up Due', num(f.csm_follow_up_due), 'By owner', 'purple',
        { title: 'CSM Follow-up Due', columns: renewalCols, rows: delayed.filter(r => r.csm_owner) }),
      card('RM Follow-up Due', num(f.rm_follow_up_due), 'By owner', 'blue',
        { title: 'RM Follow-up Due', columns: renewalCols, rows: delayed.filter(r => r.rm_owner) })
    ];

    const app = document.getElementById('app');
    app.innerHTML = [
      hero("Today's Retention Focus", 'Delayed renewals and RM/CSM follow-up cadence.', 'Retention Snapshot'),
      `<div class="kpi-grid four">${kpiCards.join('')}</div>`,
      section('Smart Actions', 'Prioritised work list', table(smart, smartCols)),
      section('Retention KPI Snapshot', kpiR.status !== 'fulfilled' ? '⚠ Activity from Supabase logic (calls/meetings unavailable)' : 'Yesterday · MTD · YTD', table(kpi, kpiCols)),
      `<div class="two-col">
        ${section('Monthly Renewal Pipeline', 'Contract renewal dates', table(monthly, monthCols), monthly.length + ' months')}
        ${section('Coverage Quality', 'Owner-level renewal health', table(coverage, covCols), coverage.length + ' owners')}
      </div>`,
      renewals.length
        ? section('Unified Renewal Table', 'Full renewal logic view', table(renewals, renewalCols, 50), renewals.length + ' rows')
        : section('Unified Renewal Table', 'Unavailable', sectionUnavailable('vw_retention_renewal_logic', logicR.reason?.message)),
      `<div class="two-col">
        ${churn.length ? section('Churn Reasons', 'Lost/churn reasons', table(churn, churnCols)) : ''}
        ${section('RM / CSM Follow-up', 'Delayed accounts due for follow-up', table(followup, followCols, 30), followup.length + ' rows')}
      </div>`
    ].join('');
  }

  window.RetentionTeamModule = { render };
})();
