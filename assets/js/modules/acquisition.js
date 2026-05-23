/**
 * modules/acquisition.js
 */
(function () {
  'use strict';
  const { card, table, section, hero } = Components;
  const { money, num, pct, esc, hsLink, relativeDate } = Fmt;
  const { get } = AppState;
  const { setTitle, sectionUnavailable } = Utils;

  // ─── column definitions ──────────────────────────────────────────────────
  const kpiCols = [
    { label: 'Period', key: 'period' },
    { label: 'Calls Logged', key: 'calls_logged', render: r => num(r.calls_logged) },
    { label: 'Connected', key: 'connected_calls', render: r => num(r.connected_calls) },
    { label: 'Meetings Logged', key: 'meetings_logged', render: r => num(r.meetings_logged) },
    { label: 'Completed', key: 'meetings_completed', render: r => num(r.meetings_completed) },
    { label: 'Conn. Rate', key: 'connection_rate', render: r => r.connection_rate != null ? pct(r.connection_rate) : (r.calls_logged > 0 ? pct((r.connected_calls / r.calls_logged) * 100) : '—') }
  ];

  const repCols = [
    { label: 'Owner', key: 'owner_name' },
    { label: 'Calls', key: 'calls_logged', render: r => num(r.calls_logged) },
    { label: 'Connected', key: 'connected_calls', render: r => num(r.connected_calls) },
    { label: 'Meetings', key: 'meetings_logged', render: r => num(r.meetings_logged) },
    { label: 'Completed', key: 'meetings_completed', render: r => num(r.meetings_completed) },
    { label: 'Last Activity', key: 'last_activity_date', render: r => relativeDate(r.last_activity_date) }
  ];

  const rankCols = [
    { label: 'Rank', key: 'rank_group' },
    { label: 'Country', key: 'country' },
    { label: 'Owner', key: 'owner_name' },
    { label: 'Companies', key: 'companies', render: r => num(r.companies) },
    { label: 'Touched', key: 'touched_companies', render: r => num(r.touched_companies) },
    { label: 'No Touch', key: 'no_touch', render: r => num(r.no_touch != null ? r.no_touch : (r.companies - r.touched_companies)) },
    { label: 'Touch Rate', key: 'touch_rate', render: r => r.touch_rate != null ? pct(r.touch_rate) : (r.companies > 0 ? pct((r.touched_companies / r.companies) * 100) : '—') }
  ];

  const needsCols = [
    { label: 'Company', key: 'company_name' },
    { label: 'Owner', key: 'owner_name' },
    { label: 'Country', key: 'country' },
    { label: 'Rank', key: 'rank_group' },
    { label: 'Created', key: 'created_date', render: r => r.created_date ? r.created_date.slice(0, 10) : '—' },
    { label: 'Days', key: 'days_since_created', render: r => num(r.days_since_created) },
    { label: 'HubSpot', key: 'hubspot_company_id', render: r => hsLink(r.hubspot_company_id || r.hs_object_id, 'company') }
  ];

  const pipeCols = [
    { label: 'Deal', key: 'dealname' },
    { label: 'Owner', key: 'owner_name' },
    { label: 'Stage', key: 'dealstage' },
    { label: 'Product', key: 'product' },
    { label: 'Amount', key: 'amount', render: r => money(r.amount) },
    { label: 'Next Activity', key: 'next_activity_date', render: r => relativeDate(r.next_activity_date) },
    { label: 'HubSpot', key: 'hubspot_deal_id', render: r => hsLink(r.hubspot_deal_id || r.hs_object_id, 'deal') }
  ];

  const stuckCols = [
    { label: 'Deal', key: 'dealname' },
    { label: 'Owner', key: 'owner_name' },
    { label: 'Stage', key: 'dealstage' },
    { label: 'Days in Stage', key: 'days_in_stage', render: r => num(r.days_in_stage) },
    { label: 'Amount', key: 'amount', render: r => money(r.amount) },
    { label: 'HubSpot', key: 'hubspot_deal_id', render: r => hsLink(r.hubspot_deal_id || r.hs_object_id, 'deal') }
  ];

  // ─── render ──────────────────────────────────────────────────────────────
  async function render() {
    setTitle('Acquisition · Team Overview', 'Coverage, activity quality and pipeline health');

    const results = await Promise.allSettled([
      get('vw_dash_acq_team_fast', 1),
      get('vw_dash_acq_kpi_fast', 20),
      get('vw_dash_acq_sidebar_fast', 50),
      get('vw_dash_acq_rank_fast', 500),
      get('vw_dash_acq_needs_fast', 500),
      get('vw_acquisition_pipeline_details', 500),
      get('vw_acquisition_stuck_deals', 200)
    ]);

    const [snapR, kpiR, repsR, rankR, needsR, pipeR, stuckR] = results;

    const snap   = snapR.status   === 'fulfilled' ? snapR.value[0]   || {} : {};
    const kpi    = kpiR.status    === 'fulfilled' ? kpiR.value       : null;
    const reps   = repsR.status   === 'fulfilled' ? repsR.value      : null;
    const rank   = rankR.status   === 'fulfilled' ? rankR.value      : null;
    const needs  = needsR.status  === 'fulfilled' ? needsR.value     : null;
    const pipe   = pipeR.status   === 'fulfilled' ? pipeR.value      : null;
    const stuck  = stuckR.status  === 'fulfilled' ? stuckR.value     : null;

    // ── KPI card data ──
    const rankA    = rank ? rank.filter(r => String(r.rank_group).toUpperCase() === 'A') : [];
    const rankB    = rank ? rank.filter(r => String(r.rank_group).toUpperCase() === 'B') : [];
    const pipeVal  = pipe ? pipe.reduce((a, r) => a + Number(r.amount || 0), 0) : 0;
    const stuckCnt = stuck ? stuck.length : 0;

    const kpiCards = [
      card('Total Companies', num(snap.total_companies), 'HubSpot companies', 'blue'),
      card('Contacted', num(snap.contacted_companies), pct(snap.contacted_pct || 0) + ' coverage', 'green',
        rank ? { title: 'Contacted Companies', columns: rankCols, rows: rank.filter(r => r.touched_companies > 0) } : null),
      card('Needs Contact', num(snap.needs_contact_companies), 'No activity logged', 'orange',
        needs ? { title: 'Needs Contact — Company List', columns: needsCols, rows: needs } : null),
      card('Meetings Completed', num(snap.completed_meetings), 'Across all reps', 'purple',
        reps ? { title: 'Completed Meetings by Rep', columns: repCols, rows: reps } : null),
      card('Rank A Companies', num(rankA.reduce((a, r) => a + Number(r.companies || 0), 0)), 'High priority', 'blue',
        rankA.length ? { title: 'Rank A Coverage', columns: rankCols, rows: rankA } : null),
      card('Rank B Companies', num(rankB.reduce((a, r) => a + Number(r.companies || 0), 0)), 'Medium priority', 'purple',
        rankB.length ? { title: 'Rank B Coverage', columns: rankCols, rows: rankB } : null),
      card('Open Pipeline', money(pipeVal), 'Active deal value', 'green',
        pipe ? { title: 'Open Pipeline Details', columns: pipeCols, rows: pipe } : null),
      card('Stuck Deals', num(stuckCnt), 'Need attention', 'red',
        stuck ? { title: 'Stuck Deals', columns: stuckCols, rows: stuck } : null)
    ];

    const app = document.getElementById('app');
    app.innerHTML = [
      hero('Today\'s Acquisition Focus', 'Team coverage, rank A/B reach, lead contact quality and pipeline health.', new Date().toLocaleString()),
      `<div class="kpi-grid">${kpiCards.join('')}</div>`,

      // KPI snapshot
      kpi
        ? section('Yesterday · MTD · YTD', 'Calls, connected calls and completed meetings', table(kpi, kpiCols), kpi.length + ' periods')
        : section('Activity KPI', 'Summary unavailable', sectionUnavailable('vw_dash_acq_kpi_fast', kpiR.reason?.message)),

      // Rep performance
      reps
        ? section('Rep Performance', 'Owner-level activity snapshot', table(reps, repCols), reps.length + ' reps')
        : section('Rep Performance', 'Unavailable', sectionUnavailable('vw_dash_acq_sidebar_fast', repsR.reason?.message)),

      // Two-column row: rank + needs
      `<div class="two-col">
        ${rank
          ? section('Rank A/B Coverage', 'Country and owner-scoped coverage', table(rank, rankCols, 30), rank.length + ' rows')
          : section('Rank Coverage', 'Unavailable', sectionUnavailable('vw_dash_acq_rank_fast', rankR.reason?.message))
        }
        ${needs
          ? section('Needs Contact', 'Companies with no last contacted date', table(needs, needsCols, 30), needs.length + ' rows')
          : section('Needs Contact', 'Unavailable', sectionUnavailable('vw_dash_acq_needs_fast', needsR.reason?.message))
        }
      </div>`,

      // Two-column row: pipeline + stuck
      `<div class="two-col">
        ${pipe
          ? section('Open Pipeline', 'Active deal details', table(pipe, pipeCols, 30), pipe.length + ' deals')
          : section('Open Pipeline', 'Unavailable', sectionUnavailable('vw_acquisition_pipeline_details', pipeR.reason?.message))
        }
        ${stuck
          ? section('Stuck Deals', 'Deals requiring attention', table(stuck, stuckCols, 30), stuck.length + ' deals')
          : section('Stuck Deals', 'Unavailable', sectionUnavailable('vw_acquisition_stuck_deals', stuckR.reason?.message))
        }
      </div>`
    ].join('');
  }

  window.AcquisitionModule = { render };
})();
