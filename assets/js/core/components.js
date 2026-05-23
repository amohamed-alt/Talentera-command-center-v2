/**
 * core/components.js
 * Reusable HTML-building helpers.
 */
(function () {
  'use strict';

  /**
   * KPI card — clickable if rows/columns provided.
   * @param {string} label
   * @param {string} value
   * @param {string} sub
   * @param {string} color  blue|green|red|orange|purple
   * @param {object} [detail]  { title, rows, columns }
   */
  function card(label, value, sub = '', color = 'blue', detail = null) {
    const dataAttr = detail
      ? `data-modal='${Fmt.esc(JSON.stringify(detail))}'`
      : '';
    const clickable = detail ? 'clickable' : '';
    return `<div class="kpi-card ${color} ${clickable}" ${dataAttr}>
      <span class="kpi-label">${Fmt.esc(label)}</span>
      <strong class="kpi-value">${value}</strong>
      <small class="kpi-sub">${Fmt.esc(sub)}</small>
      ${detail ? '<span class="kpi-hint">Click to explore ↗</span>' : ''}
    </div>`;
  }

  /**
   * Full-width data table.
   * @param {Array}  rows
   * @param {Array}  cols  [{label, key, render}]
   * @param {number} [preview]  rows to show before "Show more"
   */
  function table(rows, cols, preview = 40) {
    if (!rows || !rows.length) {
      return `<div class="table-empty">No rows returned</div>`;
    }
    const visible = rows.slice(0, preview);
    const hidden = rows.slice(preview);
    const thead = `<thead><tr>${cols.map(c => `<th>${Fmt.esc(c.label)}</th>`).join('')}</tr></thead>`;
    const makeRows = arr => arr.map(r =>
      `<tr>${cols.map(c => `<td>${c.render ? c.render(r) : Fmt.esc(r[c.key])}</td>`).join('')}</tr>`
    ).join('');
    let html = `<div class="table-wrap">
      <table>
        ${thead}
        <tbody>${makeRows(visible)}</tbody>
      </table>`;
    if (hidden.length) {
      html += `<div class="show-more-wrap">
        <button class="show-more-btn" data-hidden='${Fmt.esc(JSON.stringify({ rows: hidden, cols }))}'
          >Show ${hidden.length} more rows ↓</button>
      </div>`;
    }
    html += `</div>`;
    return html;
  }

  /**
   * Section container.
   */
  function section(title, sub, body, badge = '', extra = '') {
    return `<section class="dash-section">
      <div class="section-head">
        <div class="section-title-group">
          <h3>${Fmt.esc(title)}</h3>
          ${sub ? `<p>${Fmt.esc(sub)}</p>` : ''}
        </div>
        <div class="section-actions">
          ${badge ? `<span class="badge">${Fmt.esc(badge)}</span>` : ''}
          ${extra}
        </div>
      </div>
      <div class="section-body">${body}</div>
    </section>`;
  }

  /**
   * Hero banner at top of each page.
   */
  function hero(title, sub, badgeText = '') {
    return `<div class="page-hero">
      <div>
        <h3>${Fmt.esc(title)}</h3>
        <p>${Fmt.esc(sub)}</p>
      </div>
      ${badgeText ? `<span class="hero-badge">${Fmt.esc(badgeText)}</span>` : ''}
    </div>`;
  }

  /**
   * Status pill.
   */
  function statusPill(text, type = 'info') {
    return `<span class="status-pill ${type}">${Fmt.esc(text)}</span>`;
  }

  window.Components = { card, table, section, hero, statusPill };
})();
