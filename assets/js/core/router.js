/**
 * core/router.js
 * Hash-based client router. Loads modules lazily.
 */
(function () {
  'use strict';

  const ROUTES = {
    acquisition: () => window.AcquisitionModule.render(),
    'retention-team': () => window.RetentionTeamModule.render(),
    'retention-financial': () => window.RetentionFinancialModule.render(),
    'features-plan': () => window.FeaturesPlanModule.render(),
    pnl: () => window.PnlModule.render()
  };

  function navigate(route) {
    if (!ROUTES[route]) route = 'acquisition';
    AppState.setRoute(route);

    // Update active states
    document.querySelectorAll('[data-route]').forEach(el => {
      el.classList.toggle('active', el.dataset.route === route);
    });

    const app = document.getElementById('app');
    app.classList.add('page-transitioning');
    Utils.showLoading(`Loading ${route}…`);

    // Scroll to top of content
    app.scrollTop = 0;

    setTimeout(() => {
      app.classList.remove('page-transitioning');
      ROUTES[route]().catch(err => {
        Utils.showError(err.message || String(err));
      });
    }, 60);
  }

  function init() {
    // Wire all nav/tab buttons
    document.querySelectorAll('[data-route]').forEach(btn => {
      btn.addEventListener('click', () => navigate(btn.dataset.route));
    });

    // Restore previous route
    navigate(AppState.route);

    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        AppState.invalidate();
        navigate(AppState.route);
      });
    }
  }

  // Global delegated click for modal cards and show-more
  document.addEventListener('click', function (e) {
    // KPI card click → modal
    const kpiCard = e.target.closest('.kpi-card.clickable');
    if (kpiCard) {
      try {
        const detail = JSON.parse(kpiCard.dataset.modal || '{}');
        if (detail.title && detail.columns) {
          Modal.open(detail);
        }
      } catch (_) { /* ignore */ }
      return;
    }

    // Show-more row injection
    const showMore = e.target.closest('.show-more-btn');
    if (showMore) {
      try {
        const { rows, cols } = JSON.parse(showMore.dataset.hidden || '{}');
        if (!rows || !cols) return;
        const wrap = showMore.closest('.table-wrap');
        const tbody = wrap && wrap.querySelector('tbody');
        if (!tbody) return;
        const fragment = rows.map(r =>
          `<tr>${cols.map(c => `<td>${c.render ? '' : Fmt.esc(r[c.key])}</td>`).join('')}</tr>`
        ).join('');
        tbody.insertAdjacentHTML('beforeend', fragment);
        showMore.closest('.show-more-wrap').remove();
      } catch (_) { /* ignore */ }
    }
  });

  window.Router = { navigate, init };
})();
