/**
 * modules/pnl.js
 */
(function () {
  'use strict';
  const { card, table, section, hero } = Components;
  const { money, num, pct, esc } = Fmt;
  const { get } = AppState;
  const { setTitle, sectionUnavailable } = Utils;

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const monthCols = [
    { label: 'Year', key: 'year' },
    { label: 'Month', key: 'month' },
    { label: 'Product', key: 'product' },
    { label: 'Booking', key: 'booking', render: r => money(r.booking) },
    { label: 'Cashing', key: 'cashing', render: r => money(r.cashing) },
    { label: 'COGS', key: 'cogs', render: r => money(r.cogs) },
    { label: 'Overheads', key: 'overheads', render: r => money(r.overheads) },
    { label: 'Support', key: 'support_allocation', render: r => money(r.support_allocation) },
    { label: 'Total Cost', key: 'total_cost', render: r => money(r.total_cost) },
    { label: 'Net Cash', key: 'net_cash_position', render: r => {
      const v = Number(r.net_cash_position || 0);
      const clr = v < 0 ? 'var(--red)' : 'var(--green)';
      return `<span style="color:${clr};font-weight:700">${money(v)}</span>`;
    }}
  ];

  const costCols = [
    { label: 'Year', key: 'year' },
    { label: 'Product', key: 'product' },
    { label: 'COGS', key: 'cogs', render: r => money(r.cogs) },
    { label: 'Overheads', key: 'overheads', render: r => money(r.overheads) },
    { label: 'Support', key: 'support_allocation', render: r => money(r.support_allocation) },
    { label: 'Total Cost', key: 'total_cost', render: r => money(r.total_cost) }
  ];

  function sumBy(rows, year, key) {
    return MONTHS.map((_, i) =>
      rows.filter(r =>
        String(r.year) === String(year) &&
        (Number(r.month) === i + 1 || String(r.month).slice(0, 3).toLowerCase() === MONTHS[i].toLowerCase())
      ).reduce((a, b) => a + Number(b[key] || 0), 0)
    );
  }

  function drawCharts(rows) {
    if (!window.Chart) return;

    const y2026booking = sumBy(rows, 2026, 'booking').reduce((a, b) => a + b, 0);
    const y2026cashing = sumBy(rows, 2026, 'cashing').reduce((a, b) => a + b, 0);
    const y2026cost    = sumBy(rows, 2026, 'total_cost').reduce((a, b) => a + b, 0);
    const y2025booking = sumBy(rows, 2025, 'booking').reduce((a, b) => a + b, 0);
    const y2025cashing = sumBy(rows, 2025, 'cashing').reduce((a, b) => a + b, 0);
    const y2025cost    = sumBy(rows, 2025, 'total_cost').reduce((a, b) => a + b, 0);

    const barCtx = document.getElementById('pnlBar');
    if (barCtx) new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: ['Booking', 'Cashing', 'Total Cost'],
        datasets: [
          { label: '2025', data: [y2025booking, y2025cashing, y2025cost], backgroundColor: ['#93c5fd','#6ee7b7','#fca5a5'] },
          { label: '2026', data: [y2026booking, y2026cashing, y2026cost], backgroundColor: ['#2563eb','#16a34a','#ef4444'] }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }
    });

    const lineCtx = document.getElementById('pnlLine');
    if (lineCtx) new Chart(lineCtx, {
      type: 'line',
      data: {
        labels: MONTHS,
        datasets: [
          { label: 'Booking 2026', data: sumBy(rows, 2026, 'booking'), borderColor: '#2563eb', tension: 0.3, fill: false },
          { label: 'Cashing 2026', data: sumBy(rows, 2026, 'cashing'), borderColor: '#16a34a', tension: 0.3, fill: false },
          { label: 'Total Cost 2026', data: sumBy(rows, 2026, 'total_cost'), borderColor: '#ef4444', tension: 0.3, fill: false }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  async function render() {
    setTitle('P&L · Revenue Analysis', 'ForReporting 2025 full year · 2026 actuals to date');

    const results = await Promise.allSettled([
      get('vw_pnl_monthly_summary_v2', 500),
      get('vw_pnl_exec_summary_v2', 20),
      get('vw_pnl_cost_breakdown_v2', 100)
    ]);

    const [monthR, execR, costR] = results;
    const rows = monthR.status === 'fulfilled' ? monthR.value : [];
    const exec = execR.status === 'fulfilled' ? execR.value : [];
    const cost = costR.status === 'fulfilled' ? costR.value : null;

    const y2026 = exec.find(r => String(r.year) === '2026') || exec[0] || {};

    const kpiCards = [
      card('Booking 2026', money(y2026.booking), 'Bookings', 'purple',
        { title: 'Monthly Booking 2026', columns: monthCols, rows: rows.filter(r => String(r.year) === '2026') }),
      card('Cashing 2026', money(y2026.cashing), 'Cash collected', 'green',
        { title: 'Monthly Cashing 2026', columns: monthCols, rows: rows.filter(r => String(r.year) === '2026') }),
      card('Total Cost 2026', money(y2026.total_cost), 'COGS + Overheads + Support', 'orange'),
      card('Net Cash', money(y2026.net_cash_position), 'Cash minus cost', Number(y2026.net_cash_position) < 0 ? 'red' : 'green'),
      card('Cash Coverage', pct(y2026.cash_coverage_pct), 'Cash / cost', 'red'),
      card('Booking → Cash', pct(y2026.booking_cash_pct), 'Cash / booking', 'orange')
    ];

    const app = document.getElementById('app');
    app.innerHTML = [
      hero('Executive P&L Dashboard', 'Booking, Cashing, Total Cost, COGS, Overheads and Support Allocation.', 'Dynamic · Supabase'),
      `<div class="kpi-grid six">${kpiCards.join('')}</div>`,
      `<div class="two-col">
        <section class="dash-section">
          <div class="section-head"><div class="section-title-group"><h3>YTD / Period Comparison</h3><p>Booking, Cashing and Total Cost</p></div></div>
          <div class="chart-wrap"><canvas id="pnlBar"></canvas></div>
        </section>
        <section class="dash-section">
          <div class="section-head"><div class="section-title-group"><h3>Monthly Trend 2026</h3><p>Booking vs Cashing vs Cost</p></div></div>
          <div class="chart-wrap"><canvas id="pnlLine"></canvas></div>
        </section>
      </div>`,
      rows.length
        ? section('Monthly P&L Table', 'All rows from Supabase', table(rows, monthCols, 50), rows.length + ' rows')
        : section('Monthly P&L', 'Unavailable', sectionUnavailable('vw_pnl_monthly_summary_v2', monthR.reason?.message)),
      cost
        ? section('Cost Breakdown', 'Product-level cost mix', table(cost, costCols))
        : section('Cost Breakdown', 'Unavailable', sectionUnavailable('vw_pnl_cost_breakdown_v2', costR.reason?.message))
    ].join('');

    setTimeout(() => drawCharts(rows), 100);
  }

  window.PnlModule = { render };
})();
