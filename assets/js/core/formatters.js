/**
 * core/formatters.js
 */
(function () {
  'use strict';

  const C = window.TALENTERA_CONFIG;

  function money(v) {
    v = Number(v || 0);
    const a = Math.abs(v);
    let f;
    if (a >= 1e6) f = (v / 1e6).toFixed(1) + 'M';
    else if (a >= 1e3) f = (v / 1e3).toFixed(0) + 'K';
    else f = v.toFixed(0);
    return '$' + f.replace('$-', '-$');
  }

  function num(v) {
    return Number(v || 0).toLocaleString();
  }

  function pct(v) {
    return Number(v || 0).toFixed(1) + '%';
  }

  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[m]));
  }

  function hsCompanyUrl(id) {
    return id ? `${C.hubspotBase}/company/${id}` : null;
  }
  function hsDealUrl(id) {
    return id ? `${C.hubspotBase}/deal/${id}` : null;
  }
  function hsContactUrl(id) {
    return id ? `${C.hubspotBase}/contact/${id}` : null;
  }

  function hsLink(id, type = 'company', label = 'Open') {
    let url;
    if (type === 'deal') url = hsDealUrl(id);
    else if (type === 'contact') url = hsContactUrl(id);
    else url = hsCompanyUrl(id);
    if (!url) return '—';
    return `<a href="${url}" target="_blank" rel="noopener" class="hs-link">↗ ${esc(label)}</a>`;
  }

  function relativeDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d)) return esc(dateStr);
    const diff = Math.round((Date.now() - d) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 0) return `In ${Math.abs(diff)}d`;
    return `${diff}d ago`;
  }

  window.Fmt = { money, num, pct, esc, hsLink, hsCompanyUrl, hsDealUrl, hsContactUrl, relativeDate };
})();
