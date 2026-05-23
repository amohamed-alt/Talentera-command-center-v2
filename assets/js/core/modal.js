/**
 * core/modal.js
 * Reusable full-screen detail modal with CSV export.
 */
(function () {
  'use strict';

  let _overlay, _inner;

  function _build() {
    if (document.getElementById('tcc-modal')) return;
    const el = document.createElement('div');
    el.id = 'tcc-modal';
    el.className = 'modal-overlay hidden';
    el.innerHTML = `
      <div class="modal-box" role="dialog" aria-modal="true">
        <div class="modal-header">
          <div>
            <h2 class="modal-title" id="modal-title"></h2>
            <p class="modal-subtitle" id="modal-subtitle"></p>
          </div>
          <div class="modal-actions">
            <button id="modal-export" class="modal-btn export-btn">⬇ Export CSV</button>
            <button id="modal-close" class="modal-btn close-btn">✕ Close</button>
          </div>
        </div>
        <div class="modal-body" id="modal-body"></div>
      </div>`;
    document.body.appendChild(el);
    _overlay = el;
    _inner = el.querySelector('.modal-box');
    document.getElementById('modal-close').addEventListener('click', close);
    _overlay.addEventListener('click', e => { if (e.target === _overlay) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  let _currentRows = [], _currentCols = [];

  function open({ title, subtitle = '', rows = [], columns = [] }) {
    _build();
    _currentRows = rows;
    _currentCols = columns;

    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-subtitle').textContent =
      subtitle || `${rows.length.toLocaleString()} rows`;

    const body = document.getElementById('modal-body');
    if (!rows.length) {
      body.innerHTML = `<div class="modal-empty">No rows to display.</div>`;
    } else {
      const thead = `<thead><tr>${columns.map(c => `<th>${Fmt.esc(c.label)}</th>`).join('')}</tr></thead>`;
      const tbody = rows.map(r =>
        `<tr>${columns.map(c => `<td>${c.render ? c.render(r) : Fmt.esc(r[c.key])}</td>`).join('')}</tr>`
      ).join('');
      body.innerHTML = `<div class="table-wrap"><table>${thead}<tbody>${tbody}</tbody></table></div>`;
    }

    document.getElementById('modal-export').onclick = () => exportCsv(title);
    _overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    if (_overlay) _overlay.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function exportCsv(title) {
    if (!_currentRows.length) return;
    const headers = _currentCols.map(c => c.label);
    const csvRows = [headers, ..._currentRows.map(r =>
      _currentCols.map(c => {
        const val = c.csvValue ? c.csvValue(r) : (r[c.key] ?? '');
        const s = String(val).replace(/"/g, '""');
        return s.includes(',') || s.includes('\n') ? `"${s}"` : s;
      })
    )];
    const blob = new Blob([csvRows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${title.replace(/\s+/g, '_')}.csv`;
    a.click();
  }

  window.Modal = { open, close };
})();
