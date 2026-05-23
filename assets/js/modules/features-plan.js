/**
 * modules/features-plan.js
 */
(function () {
  'use strict';
  const { card, table, section, hero } = Components;
  const { money, num, esc, hsLink } = Fmt;
  const { get } = AppState;
  const { setTitle, sectionUnavailable } = Utils;

  const companyCols = [
    { label: 'Company', key: 'company_name' },
    { label: 'Product', key: 'product_line' },
    { label: 'Owner', key: 'owner_name' },
    { label: 'CSM', key: 'csm_owner' },
    { label: 'Features', key: 'features', render: r => num(r.features) },
    { label: 'Proposal', key: 'proposal', render: r => num(r.proposal) },
    { label: 'Interested', key: 'interested', render: r => num(r.interested) },
    { label: 'Not Interested', key: 'not_interested', render: r => num(r.not_interested) },
    { label: 'Upsell Value', key: 'upsell', render: r => money(r.upsell) },
    { label: 'Renewal Value', key: 'renewal', render: r => money(r.renewal) }
  ];

  function groupByCompany(rows) {
    const map = {};
    rows.forEach(r => {
      const k = String(r.company_name || 'Unknown').toLowerCase();
      if (!map[k]) {
        map[k] = {
          company_name: r.company_name,
          product_line: r.product_line,
          owner_name: r.owner_name,
          csm_owner: r.csm_owner,
          features: 0,
          proposal: 0,
          interested: 0,
          not_interested: 0,
          upsell: 0,
          renewal: 0
        };
      }
      const c = map[k];
      c.features++;
      const st = String(r.feature_status || '').toLowerCase();
      if (st.includes('proposal')) c.proposal++;
      if (st.includes('interested') && !st.includes('not interested')) c.interested++;
      if (st.includes('not interested')) c.not_interested++;
      // Company-unique max values (not sum per feature row)
      c.upsell = Math.max(c.upsell, Number(r.upsell_value || 0));
      c.renewal = Math.max(c.renewal, Number(r.renewal_value || 0));
    });
    return Object.values(map);
  }

  async function render() {
    setTitle('Features Plan · Upselling', 'Upsell features grouped by company');

    const results = await Promise.allSettled([
      get('features_plan_rows', 2000),
      get('vw_upsell_company_summary', 500),
      get('vw_upsell_dashboard_summary', 10),
      get('vw_upsell_feature_status_summary', 50)
    ]);

    const [rawR, companySumR, dashR, statusSumR] = results;

    const raw = rawR.status === 'fulfilled' ? rawR.value : [];
    const companies = companySumR.status === 'fulfilled' ? companySumR.value : groupByCompany(raw);
    const dashSum = dashR.status === 'fulfilled' ? dashR.value[0] || {} : {};
    const statusSum = statusSumR.status === 'fulfilled' ? statusSumR.value : [];

    if (!raw.length && companySumR.status !== 'fulfilled') {
      document.getElementById('app').innerHTML =
        sectionUnavailable('features_plan_rows', rawR.reason?.message);
      return;
    }

    const totalUpsell = companies.reduce((a, c) => a + c.upsell, 0);
    const totalRenewal = companies.reduce((a, c) => a + c.renewal, 0);
    const totalProposal = companies.reduce((a, c) => a + c.proposal, 0);
    const totalInterested = companies.reduce((a, c) => a + c.interested, 0);
    const totalNot = companies.reduce((a, c) => a + c.not_interested, 0);

    const statusSumCols = [
      { label: 'Status', key: 'feature_status' },
      { label: 'Feature Rows', key: 'feature_rows', render: r => num(r.feature_rows) },
      { label: 'Companies', key: 'companies', render: r => num(r.companies) }
    ];

    const kpiCards = [
      card('Companies', num(companies.length), 'Unique company cards', 'blue',
        { title: 'All Companies', columns: companyCols, rows: companies }),
      card('Proposal Sent', num(totalProposal), 'Feature rows', 'purple',
        { title: 'Proposal Sent', columns: companyCols, rows: companies.filter(c => c.proposal > 0) }),
      card('Interested', num(totalInterested), 'Feature rows', 'green',
        { title: 'Interested Companies', columns: companyCols, rows: companies.filter(c => c.interested > 0) }),
      card('Not Interested', num(totalNot), 'Feature rows', 'red',
        { title: 'Not Interested Companies', columns: companyCols, rows: companies.filter(c => c.not_interested > 0) }),
      card('Total Upsell Value', money(totalUpsell), 'Company-unique max', 'orange',
        { title: 'Upsell Value by Company', columns: companyCols, rows: [...companies].sort((a, b) => b.upsell - a.upsell) }),
      card('Total Renewal Value', money(totalRenewal), 'Company-unique max', 'green',
        { title: 'Renewal Value by Company', columns: companyCols, rows: [...companies].sort((a, b) => b.renewal - a.renewal) })
    ];

    const app = document.getElementById('app');
    app.innerHTML = [
      hero('Features Plan for Upselling', 'Company-level grouping avoids double-counting values.', raw.length + ' feature rows'),
      `<div class="kpi-grid six">${kpiCards.join('')}</div>`,
      section('Company Features Plan', 'Grouped rows — one row per company', table(companies, companyCols, 50), companies.length + ' companies'),
      statusSum.length
        ? section('Feature Status Summary', 'Row counts by status', table(statusSum, statusSumCols))
        : ''
    ].join('');
  }

  window.FeaturesPlanModule = { render };
})();
