/**
 * core/utils.js
 */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  function setTitle(title, sub) {
    const t = $('#pageTitle');
    const s = $('#pageSub');
    if (t) t.textContent = title;
    if (s) s.textContent = sub || '';
  }

  function showLoading(msg = 'Loading…') {
    const app = $('#app');
    if (app) app.innerHTML = `<div class="loading-state"><div class="spinner"></div><span>${Fmt.esc(msg)}</span></div>`;
  }

  function showError(msg) {
    const app = $('#app');
    if (app) app.innerHTML = `<div class="error-state"><span class="err-icon">⚠</span><div><b>Dashboard Error</b><p>${Fmt.esc(msg)}</p></div></div>`;
  }

  function sectionUnavailable(viewName, errorMsg) {
    return `<div class="section-unavailable">
      <span class="unavail-icon">⚠</span>
      <div>
        <b>Section unavailable</b>
        <p>View <code>${Fmt.esc(viewName)}</code> could not be loaded.</p>
        <p class="unavail-detail">${Fmt.esc(errorMsg || '')}</p>
      </div>
    </div>`;
  }

  window.Utils = { $, $$, setTitle, showLoading, showError, sectionUnavailable };
})();
