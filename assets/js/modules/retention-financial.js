/**
 * modules/retention-financial.js
 */
(function () {
  'use strict';
  const { card, table, section, hero } = Components;
  const { money, num, pct, esc, hsLink } = Fmt;
  const { get } = AppState;
  const { setTitle, sectionUnavailable } = Utils;

  const ownerCols = [
    { label: 'Role', key: 'role' },
    { label: 'Owner', key: 'owner_name' },
    { label: 'Accounts', key: 'accounts', render: r => num(r.accounts) },
    { label: 'Renewal', key: 'renewal_value', render: r => money(r.renewal_value) },
    { label: 'Booked', key: 'booked_value', render: r => money(r.booked_value) },
    { label: 'Cash', key: 'cash_collected', render: r => money(r.cash_collected) },
    { label: 'Remaining', key: 'remaining_collection', render: r => money(r.remaining_collection) },
    { label: 'Delayed', key: 'delayed_accounts', render: r => num(r.delayed_accounts) }
  ];

  const productCols = [
    { label: 'Product', key: 'product' },
    { label: 'Accounts', key: 'accounts', render: r => num(r.accounts) },
    { label: 'Renewal', key: 'renewal_value', render: r => money(r.renewal_value) },
    { label: 'Booked', key: 'booked_value', render: r => money(r.booked_value) },
    { label: 'Cash', key: 'cash_collected', render: r => money(r.cash_collected) }
  ];

  const monthCols = [
    { label: 'Month', key: 'month' },
    { label: 'Due', key: 'due_accounts', render: r => num(r.due_accounts) },
    { label: 'Value', key: 'renewal_value', render: r => money(r.renewal_value) },
    { label: 'Booked', key: 'booked_value', render: r => money(r.booked_value) },
    { label: 'Cash', key: 'cash_collected', render: r => money(r.cash_collected) }
  ];

  const statusCols = [
    { label: 'Account', key: 'company_name' },
    { label: 'RM', key: 'rm_owner' },
    { label: 'CSM', key: 'csm_owner' },
    { label: 'Month', key: 'month' },
    { label: 'Renewal', key: 'renewal_value', render: r => money(r.renewal_value) },
    { label: 'Booked', key: 'booked_value', render: r => money(r.booked_value) },
    { label: 'Cash', key: 'collected_value', render: r => money(r.collected_value) },
    { label: 'Status', key: 'renewal_status', render: r => {
      const s = String(r.renewal_status || r.status || '').toLowerCase();
      const cls = r.is_delayed ? 'bad' : s.includes('lost') ? 'bad' : s.includes('booked') || s.includes('cashed') ? 'ok' : 'warn';
      return `<span class="status-pill ${cls}">${esc(r.renewal_status || r.status || '—')}</span>`;
    }},
    { label: 'HubSpot', key: 'hubspot_company_id', render: r => hsLink(r.hubspot_company_id || r.hs_object_id, 'company') }
  ];

  const notBudgetCols = [
    { label: 'Source', key: 'source' },
    { label: 'Company', key: 'company_name' },
    { label: 'Product', key: 'product' },
    { label: 'Owner', key: 'owner_name' },
    { label: 'Value', key: 'value', render: r => money(r.value) },
    { label: 'HubSpot', key: 'hubspot_company_id', render: r => hsLink(r.hubspot_company_id || r.hs_object_id, 'company') }
  ];

  function statusFilter(logic, predicate) {
    return logic.filter(predicate);
  }

  async function render() {
    setTitle('Retention · Financial Details', 'Booked, cash collected, delayed and renewal exposure');

    const results = await Promise.allSettled([
      get('vw_retention_team_summary', 1),
      get('vw_retention_owner_financial_summary', 100),
      get('vw_retention_product_financial_summary', 50),
      get('vw_retention_renewal_logic', 500),
      get('vw_retention_monthly_renewal_pipeline', 30),
      get('vw_retention_not_in_budget', 200)
    ]);

    const [sumR, ownersR, productsR, logicR, monthR, notBudgetR] = results;

    const s = sumR.status === 'fulfilled' ? sumR.value[0] || {} : {};
    const owners = ownersR.status === 'fulfilled' ? ownersR.value : null;
    const products = productsR.status === 'fulfilled' ? productsR.value : null;
    const logic = logicR.status === 'fulfilled' ? logicR.value : [];
    const monthly = monthR.status === 'fulfilled' ? monthR.value : [];
    const notBudget = notBudgetR.status === 'fulfilled' ? notBudgetR.value : null;

    // Status split groups
    const booked = statusFilter(logic, r => Number(r.booked_value) > 0);
    const cashed = statusFilter(logic, r => Number(r.collected_value) > 0);
    const delayed = statusFilter(logic, r => r.is_delayed);
    const lostRows = statusFilter(logic, r => /lost|churn/i.test(r.renewal_status || r.status || ''));
    const expected = statusFilter(logic, r => /expected/i.test(r.renewal_status || r.status || ''));
    const onTime = statusFilter(logic, r => r.renewed_on_time === true || /on.?time/i.test(r.renewal_status || ''));
    const late = statusFilter(logic, r => r.renewed_late === true || /late/i.test(r.renewal_status || ''));

    const kpiCards = [
      card('Renewal Value', money(s.renewal_value), 'All renewals', 'blue',
        logic.length ? { title: 'All Renewals', columns: statusCols, rows: logic } : null),
      card('Booked Value', money(s.booked_value), 'Booked total', 'purple',
        booked.length ? { title: 'Booked Renewals', columns: statusCols, rows: booked } : null),
      card('Cash Collected', money(s.cash_collected), 'Collected total', 'green',
        cashed.length ? { title: 'Cash Collected', columns: statusCols, rows: cashed } : null),
      card('Remaining', money(s.remaining_collection), 'Collection exposure', 'orange'),
      card('Delayed', num(s.delayed_accounts), 'Accounts', 'red',
        delayed.length ? { title: 'Delayed Accounts', columns: statusCols, rows: delayed } : null),
      card('Renewed Late', num(late.length), 'Accounts', 'orange',
        late.length ? { title: 'Renewed Late', columns: statusCols, rows: late } : null),
      card('Expected Lost', num(expected.length), 'At risk', 'red',
        expected.length ? { title: 'Expected to be Lost', columns: statusCols, rows: expected } : null),
      card('Lost', num(s.lost_accounts || lostRows.length), 'Accounts', 'red',
        lostRows.length ? { title: 'Lost Accounts', columns: statusCols, rows: lostRows } : null)
    ];

    const app = document.getElementById('app');
    app.innerHTML = [
      hero('Retention Financial Details', 'Sheet-driven financial summary from Supabase views.', 'No fallback'),
      `<div class="kpi-grid">${kpiCards.join('')}</div>`,

      owners
        ? section('Owner Financial Summary', 'RM and CSM rollup', table(owners, ownerCols), owners.length + ' owners')
        : section('Owner Financial Summary', 'Unavailable', sectionUnavailable('vw_retention_owner_financial_summary', ownersR.reason?.message)),

      `<div class="two-col">
        ${products
          ? section('Product Summary', 'Product-level financials', table(products, productCols))
          : section('Product Summary', 'Unavailable', sectionUnavailable('vw_retention_product_financial_summary', productsR.reason?.message))
        }
        ${monthly.length
          ? section('Monthly Pipeline', 'Monthly renewal movement', table(monthly, monthCols))
          : ''
        }
      </div>`,

      section('Renewal Status Split', 'Full status breakdown', `
        <div class="status-tabs">
          ${booked.length ? `<div class="status-group"><h4 class="status-group-title ok-title">✓ Booked (${booked.length})</h4>${table(booked, statusCols, 20)}</div>` : ''}
          ${cashed.length ? `<div class="status-group"><h4 class="status-group-title ok-title">💰 Cashed (${cashed.length})</h4>${table(cashed, statusCols, 20)}</div>` : ''}
          ${onTime.length ? `<div class="status-group"><h4 class="status-group-title ok-title">⏰ On Time (${onTime.length})</h4>${table(onTime, statusCols, 20)}</div>` : ''}
          ${late.length ? `<div class="status-group"><h4 class="status-group-title warn-title">⚠ Late (${late.length})</h4>${table(late, statusCols, 20)}</div>` : ''}
          ${delayed.length ? `<div class="status-group"><h4 class="status-group-title bad-title">🔴 Delayed (${delayed.length})</h4>${table(delayed, statusCols, 20)}</div>` : ''}
          ${expected.length ? `<div class="status-group"><h4 class="status-group-title bad-title">⚡ Expected Lost (${expected.length})</h4>${table(expected, statusCols, 20)}</div>` : ''}
          ${lostRows.length ? `<div class="status-group"><h4 class="status-group-title bad-title">✗ Lost (${lostRows.length})</h4>${table(lostRows, statusCols, 20)}</div>` : ''}
        </div>
      `, logic.length + ' total rows'),

      notBudget
        ? section('Not in Budget', 'Movements not matched to budget', table(notBudget, notBudgetCols))
        : section('Not in Budget', 'Unavailable', sectionUnavailable('vw_retention_not_in_budget', notBudgetR.reason?.message))
    ].join('');
  }

  window.RetentionFinancialModule = { render };
})();
