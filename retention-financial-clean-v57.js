/* ═══════════════════════════════════════════
   ACQUISITION REP TABS — NEEDS TO CONTACT SPLIT
   Shows contacts that need contact per rep tab, split Online / Offline.
   Does not touch Retention or existing KPI/table logic.
   ═══════════════════════════════════════════ */
(function(){
  if(window.__acqRepNeedsContactSplitPatch) return;
  window.__acqRepNeedsContactSplitPatch = true;

  function byId(id){ return document.getElementById(id); }
  function safe(v){
    return String(v ?? '')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }
  function slug(v){ return String(v || '').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }

  function firstValue(obj, keys){
    for(const k of keys){
      const val = obj?.[k] ?? obj?.properties?.[k];
      if(val !== undefined && val !== null && String(val).trim() !== '') return val;
    }
    return null;
  }

  function sourceBucket(row){
    const explicit = String(firstValue(row, ['sourceBucket','_sourceBucket']) || '').toLowerCase();
    if(explicit === 'online' || explicit === 'inbound') return 'online';
    if(explicit === 'offline' || explicit === 'outbound') return 'offline';
    const src = String(firstValue(row, ['source','hs_analytics_source']) || '').trim().toUpperCase();
    if(src && src !== 'OFFLINE' && src !== 'IMPORT') return 'online';
    return 'offline';
  }

  function createdDate(row){
    const v = firstValue(row, ['createdAt','createdate','hs_createdate','date']);
    if(!v) return null;
    return String(v).includes('T') ? String(v).split('T')[0] : String(v).slice(0,10);
  }

  function daysValue(row){
    const explicit = firstValue(row, ['daysWithoutConnectedCall','daysWithoutContact','ageDays','days']);
    const n = Number(explicit);
    if(Number.isFinite(n) && n >= 0 && n < 9999) return Math.floor(n);
    const d = createdDate(row);
    if(!d) return null;
    const ms = new Date(d).getTime();
    if(!Number.isFinite(ms)) return null;
    return Math.max(0, Math.floor((Date.now() - ms) / 86400000));
  }

  function contactName(row){
    if(typeof window.acqContactName === 'function') return window.acqContactName(row);
    const first = firstValue(row, ['firstname','firstName']);
    const last = firstValue(row, ['lastname','lastName']);
    const full = `${first || ''} ${last || ''}`.trim();
    return full || firstValue(row, ['name','fullName','email','phone','mobilephone','id','hs_object_id']) || 'Unknown contact';
  }

  function contactEmail(row){
    if(typeof window.acqContactEmail === 'function') return window.acqContactEmail(row);
    return firstValue(row, ['email']);
  }

  function contactPhone(row){
    if(typeof window.acqContactPhone === 'function') return window.acqContactPhone(row);
    return firstValue(row, ['phone','mobilephone']);
  }

  function contactUrl(row){
    if(row?.hubspotUrl || row?.url) return row.hubspotUrl || row.url;
    const id = firstValue(row, ['id','hs_object_id','contactId','recordId']);
    if(id && typeof window.hubspotRecordUrl === 'function') return window.hubspotRecordUrl('contact', id);
    return null;
  }

  function ownerMatch(row, rep){
    const ownerId = String(firstValue(row, ['ownerId','hubspot_owner_id']) || '');
    const ownerName = String(firstValue(row, ['ownerName','rep','owner']) || '');
    return ownerId === String(rep.id) || ownerName === String(rep.name);
  }

  function baseNeedsRows(rep){
    const contacts = window.D?.outreachCoverage?.contacts || {};

    // Preferred strict list from n8n: only contacts with 0 connected calls.
    let rows = [];
    const byRep = Array.isArray(contacts.noConnectedCallsByRep) ? contacts.noConnectedCallsByRep : [];
    const repBlock = byRep.find(x => String(x.id) === String(rep.id) || String(x.name) === String(rep.name));
    if(repBlock && Array.isArray(repBlock.list)) rows = repBlock.list;

    if(!rows.length && Array.isArray(contacts.noConnectedCallsList)) rows = contacts.noConnectedCallsList.filter(row => ownerMatch(row, rep));

    // Compatibility for older Supabase mapping: current dashboard "needs contact" list.
    if(!rows.length && Array.isArray(contacts.notContactedList)) rows = contacts.notContactedList.filter(row => ownerMatch(row, rep));

    return rows
      .filter(row => Number(firstValue(row, ['connectedCallsCount']) || 0) === 0)
      .sort((a,b) => Number(daysValue(b) || 0) - Number(daysValue(a) || 0));
  }

  function rowHtml(row, index, bucket, rowLimit){
    const isHidden = index >= rowLimit;
    const name = contactName(row);
    const url = contactUrl(row);
    const label = url && typeof window.recordLink === 'function'
      ? window.recordLink(name, url)
      : safe(name);
    const emailOrPhone = contactEmail(row) || contactPhone(row) || 'No email in exported data';
    const source = firstValue(row, ['source','hs_analytics_source','sourceBucket']) || (bucket === 'online' ? 'ONLINE' : 'OFFLINE');
    const d = daysValue(row);
    return `<div class="mini-row acq-need-row ${isHidden ? 'acq-hidden-row' : ''}" data-acq-need-extra="${bucket}" style="${isHidden ? 'display:none' : ''}">
      <div class="mini-main">
        <div class="mini-name">${label}</div>
        <div class="mini-meta">${safe(emailOrPhone)} · ${safe(source)}${createdDate(row) ? ' · Created ' + safe(createdDate(row)) : ''}</div>
      </div>
      <div class="mini-score" style="color:var(--red)">${d !== null ? safe(d + 'd') : '—'}</div>
    </div>`;
  }

  function listCard(rep, bucket, rows){
    const color = bucket === 'online' ? 'var(--blue)' : 'var(--amber)';
    const icon = bucket === 'online' ? '🌐' : '📞';
    const title = bucket === 'online' ? 'Online / Inbound needs contact' : 'Offline / Outbound needs contact';
    const id = `acq-need-${slug(rep.id)}-${bucket}`;
    const maxDays = rows.length ? Math.max(...rows.map(x => Number(daysValue(x) || 0))) : 0;
    const rowLimit = 5;
    const body = rows.length
      ? rows.map((row, i) => rowHtml(row, i, id, rowLimit)).join('')
      : `<div class="acq-empty">No ${bucket} contacts need contact for ${safe(rep.name)}.</div>`;
    const moreBtn = rows.length > rowLimit
      ? `<button class="acq-show-btn" onclick="toggleAcqNeedContactRows('${id}', this)">▼ Show ${rows.length - rowLimit} more</button>`
      : '';

    return `<div class="acq-mini-table" style="border-top:3px solid ${color}">
      <div class="acq-mini-hd">
        <div class="acq-mini-title" style="color:${color}">${icon} ${title}</div>
        <span class="badge ${bucket === 'online' ? 'bb' : 'ba'}">${rows.length.toLocaleString()} contacts${rows.length ? ' · max ' + maxDays + 'd' : ''}</span>
      </div>
      <div id="${id}">${body}</div>
      ${moreBtn}
    </div>`;
  }

  window.toggleAcqNeedContactRows = function(containerId, btn){
    const box = byId(containerId);
    if(!box || !btn) return;
    const hiddenRows = box.querySelectorAll('.acq-hidden-row');
    const opening = Array.from(hiddenRows).some(row => row.style.display === '' || row.style.display === 'none');
    hiddenRows.forEach(row => { row.style.display = opening ? 'flex' : 'none'; });
    btn.textContent = opening ? '▲ Show less' : `▼ Show ${hiddenRows.length} more`;
  };

  function sectionHtml(rep){
    const all = baseNeedsRows(rep);
    const online = all.filter(row => sourceBucket(row) === 'online');
    const offline = all.filter(row => sourceBucket(row) === 'offline');
    return `<div class="acq-needs-contact-by-rep" data-acq-needs-contact-by-rep style="margin:14px 0">
      <div class="acq-follow-card" style="--fc:var(--red)">
        <div class="acq-follow-hd">
          <div class="acq-follow-title">☎ Needs to Contact · ${safe(rep.name)}</div>
          <span class="badge br">${all.length.toLocaleString()} contacts</span>
        </div>
        <div class="acq-follow-sub">Contacts assigned to ${safe(rep.name)} with 0 connected calls in the current data. Split by HubSpot source: Online vs Offline.</div>
        <div class="acq-lead-split">
          ${listCard(rep, 'online', online)}
          ${listCard(rep, 'offline', offline)}
        </div>
      </div>
    </div>`;
  }

  function injectForRep(rep){
    const panel = byId('panel-' + String(rep.name || '').toLowerCase().replace(/\s/g,'-'));
    if(!panel) return;
    panel.querySelectorAll('[data-acq-needs-contact-by-rep]').forEach(node => node.remove());
    const html = sectionHtml(rep);
    const afterSummary = panel.querySelector('[data-acq-period-summary]');
    const hero = panel.querySelector('.rep-hero');
    const statChips = panel.querySelector('.stat-chips');
    if(afterSummary) afterSummary.insertAdjacentHTML('afterend', html);
    else if(statChips) statChips.insertAdjacentHTML('afterend', html);
    else if(hero) hero.insertAdjacentHTML('afterend', html);
    else panel.insertAdjacentHTML('afterbegin', html);
  }

  function renderAllRepNeedsContact(){
    if(!window.D || !Array.isArray(D.repData)) return;
    D.repData
      .filter(rep => rep && rep.type !== 'view')
      .forEach(injectForRep);
  }

  window.renderAllRepNeedsContact = renderAllRepNeedsContact;

  const oldEnhance = window.enhanceAcquisitionInteractiveViews;
  window.enhanceAcquisitionInteractiveViews = function(){
    let result;
    if(typeof oldEnhance === 'function') result = oldEnhance.apply(this, arguments);
    setTimeout(renderAllRepNeedsContact, 0);
    setTimeout(renderAllRepNeedsContact, 250);
    return result;
  };
  try { enhanceAcquisitionInteractiveViews = window.enhanceAcquisitionInteractiveViews; } catch(e) {}

  if(typeof window.render === 'function' && !window.render.__acqNeedsContactWrapped){
    const oldRender = window.render;
    window.render = function(){
      const result = oldRender.apply(this, arguments);
      setTimeout(renderAllRepNeedsContact, 0);
      setTimeout(renderAllRepNeedsContact, 300);
      return result;
    };
    window.render.__acqNeedsContactWrapped = true;
    try { render = window.render; } catch(e) {}
  }

  if(typeof window.switchTab === 'function' && !window.switchTab.__acqNeedsContactWrapped){
    const oldSwitchTab = window.switchTab;
    window.switchTab = function(){
      const result = oldSwitchTab.apply(this, arguments);
      setTimeout(renderAllRepNeedsContact, 0);
      setTimeout(renderAllRepNeedsContact, 250);
      return result;
    };
    window.switchTab.__acqNeedsContactWrapped = true;
    try { switchTab = window.switchTab; } catch(e) {}
  }

  if(typeof window.loadData === 'function' && !window.loadData.__acqNeedsContactWrapped){
    const oldLoadData = window.loadData;
    window.loadData = function(){
      const result = oldLoadData.apply(this, arguments);
      try{
        if(result && typeof result.then === 'function') result.then(function(){ setTimeout(renderAllRepNeedsContact, 0); setTimeout(renderAllRepNeedsContact, 300); });
        else { setTimeout(renderAllRepNeedsContact, 0); setTimeout(renderAllRepNeedsContact, 300); }
      }catch(e){}
      return result;
    };
    window.loadData.__acqNeedsContactWrapped = true;
    try { loadData = window.loadData; } catch(e) {}
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(renderAllRepNeedsContact, 300); });
  else setTimeout(renderAllRepNeedsContact, 300);
})();
