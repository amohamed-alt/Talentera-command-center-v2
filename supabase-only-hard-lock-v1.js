/* ═══════════════════════════════════════════
   RETENTION ADDON — Features Plan for Upselling
   Source expected from n8n Google Sheets node in Supabase retention model:
   R.featuresPlanForUpselling OR R.upsellingFeaturesPlan OR R.sheetData.featuresPlanForUpselling
   This addon is read-only and does not touch Acquisition.
   ═══════════════════════════════════════════ */
(function(){
  if(window.__RETENTION_UPSELLING_FEATURES_PLAN__) return;
  window.__RETENTION_UPSELLING_FEATURES_PLAN__ = true;

  var STYLE_ID = 'retUpsellingFeaturesPlanStyle';
  if(!document.getElementById(STYLE_ID)){
    var st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = `
      .ret-upsell-hero{display:flex;align-items:center;gap:18px;padding:20px 24px;margin-bottom:14px;background:linear-gradient(135deg,#ffffff 0%,#f7fbfa 100%);border:1px solid var(--border);border-left:4px solid var(--purple);border-radius:var(--r-lg);box-shadow:var(--sh);position:relative;overflow:hidden}
      .ret-upsell-hero::after{content:"";position:absolute;right:-70px;top:-70px;width:190px;height:190px;border-radius:50%;background:var(--purple);opacity:.055}
      .ret-upsell-icon{width:58px;height:58px;border-radius:18px;background:var(--purple-bg);border:1px solid var(--purple-bd);display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0}
      .ret-upsell-title{font-size:20px;font-weight:900;color:var(--text);letter-spacing:-.03em}
      .ret-upsell-sub{font-size:12px;color:var(--muted);line-height:1.6;margin-top:5px;max-width:850px;font-weight:600}
      .ret-upsell-kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:14px}
      .ret-upsell-kpi{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);box-shadow:var(--sh-xs);padding:14px 12px;border-top:3px solid var(--kc,var(--purple));position:relative;overflow:hidden}
      .ret-upsell-kpi-v{font-family:var(--mono);font-size:25px;font-weight:900;color:var(--kc,var(--purple));line-height:1}
      .ret-upsell-kpi-l{font-size:8px;font-weight:900;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;margin-top:8px}
      .ret-upsell-kpi-s{font-size:10px;color:var(--text2);font-weight:700;margin-top:4px;line-height:1.45}
      .ret-upsell-board{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);box-shadow:var(--sh);overflow:hidden;border-top:3px solid var(--purple)}
      .ret-upsell-tools{padding:12px 14px;background:var(--surface2);border-bottom:1px solid var(--border);display:flex;gap:9px;align-items:center;flex-wrap:wrap}
      .ret-upsell-select{padding:8px 10px;border-radius:8px;border:1px solid var(--border);background:#fff;font-size:11px;font-weight:800;color:var(--text2);font-family:var(--font);min-width:145px}
      .ret-upsell-search{padding:8px 10px;border-radius:8px;border:1px solid var(--border);background:#fff;font-size:11px;font-weight:800;color:var(--text2);font-family:var(--font);min-width:220px;flex:1}
      .ret-upsell-status{font-size:8px;font-weight:900;border-radius:999px;padding:4px 8px;border:1px solid var(--border);display:inline-flex;align-items:center;justify-content:center;white-space:nowrap}
      .ret-upsell-interested{background:var(--green-bg);color:var(--green);border-color:var(--green-bd)}
      .ret-upsell-proposal{background:var(--blue-bg);color:var(--blue);border-color:var(--blue-bd)}
      .ret-upsell-not{background:var(--red-bg);color:var(--red);border-color:var(--red-bd)}
      .ret-upsell-empty{padding:24px;text-align:center;color:var(--muted);font-size:13px;font-style:italic}
      .ret-upsell-note{font-size:10px;color:var(--muted);font-weight:700;line-height:1.45;background:linear-gradient(135deg,#fff 0%,#f7faf8 100%);border-bottom:1px solid var(--border);padding:10px 14px}
      .ret-upsell-client-cell{background:linear-gradient(135deg,#fff 0%,#f7faf8 100%);border-right:1px solid var(--border);vertical-align:top}
      .ret-upsell-client-name{font-size:12px;font-weight:900;color:var(--text);line-height:1.25}
      .ret-upsell-client-product{font-size:9px;color:var(--muted);font-weight:800;margin-top:4px}
      .ret-upsell-client-count{display:inline-flex;margin-top:8px;font-size:8px;font-weight:900;border-radius:999px;padding:3px 7px;background:var(--purple-bg);color:var(--purple);border:1px solid var(--purple-bd)}
      .ret-upsell-group-start td{border-top:2px solid color-mix(in srgb,var(--purple) 18%,var(--border))}
      .ret-upsell-subtle{font-size:9px;color:var(--muted);font-weight:700;margin-top:4px}
      @media(max-width:1200px){.ret-upsell-kpis{grid-template-columns:repeat(3,1fr)}}
      @media(max-width:700px){.ret-upsell-kpis{grid-template-columns:1fr}.ret-upsell-hero{align-items:flex-start;flex-direction:column}.ret-upsell-tools{align-items:stretch}.ret-upsell-select,.ret-upsell-search{width:100%;min-width:0}}
    `;
    document.head.appendChild(st);
  }

  function byId(id){ return document.getElementById(id); }
  function escLocal(v){ return (typeof window.esc === 'function' ? window.esc(v) : String(v ?? '').replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m];})); }
  function money(n){ return typeof window.fmt === 'function' ? window.fmt(n) : ('$' + Math.round(Number(n||0)).toLocaleString()); }
  function num(v){ var n = Number(String(v ?? '').replace(/[^0-9.-]/g,'')); return Number.isFinite(n) ? n : 0; }
  function normKey(v){ return String(v || '').trim().toLowerCase().replace(/[^a-z0-9]+/g,''); }
  function first(obj, names){
    if(!obj) return '';
    for(var i=0;i<names.length;i++){
      var n = names[i];
      if(obj[n] !== undefined && obj[n] !== null && String(obj[n]).trim() !== '') return obj[n];
    }
    var map = {}; Object.keys(obj).forEach(function(k){ map[normKey(k)] = k; });
    for(var j=0;j<names.length;j++){
      var key = map[normKey(names[j])];
      if(key && obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== '') return obj[key];
    }
    return '';
  }
  function rawRows(){
    var r = window.R || {};
    var candidates = [
      r.featuresPlanForUpselling,
      r.upsellingFeaturesPlan,
      r.featuresPlan,
      r.featuresPlanRows,
      r.sheetData && r.sheetData.featuresPlanForUpselling,
      r.sheetData && r.sheetData.upsellingFeaturesPlan,
      r.googleSheets && r.googleSheets.featuresPlanForUpselling
    ];
    for(var i=0;i<candidates.length;i++) if(Array.isArray(candidates[i])) return candidates[i];
    return [];
  }
  function getRows(){
    var carry = { product:'', clientName:'', csm:'', rm:'', renewalMonth:'', renewalValue:0 };
    return rawRows().map(function(x, idx){
      var row = Array.isArray(x) ? {
        product:x[0], clientName:x[1], csm:x[2], rm:x[3], renewalMonth:x[4], renewalValue:x[5], feature:x[6], ownership:x[7], status:x[8], timeline:x[9], upsellValue:x[10], notes:x[11]
      } : x;
      var obj = {
        product: first(row, ['Product','product']) || carry.product,
        clientName: first(row, ['Client name','Client Name','clientName','client','company','Account','Account Name']) || carry.clientName,
        csm: first(row, ['CSM','csm','CSM Owner']) || carry.csm,
        rm: first(row, ['RM','rm','RM Owner']) || carry.rm,
        renewalMonth: first(row, ['Renewal Month','renewalMonth','Month']) || carry.renewalMonth,
        renewalValue: num(first(row, ['Renewal Value','renewalValue','Renewal Amount','amount'])) || carry.renewalValue,
        feature: first(row, ['Feature','feature','Feature Name']),
        ownership: first(row, ['Ownership','ownership','Owner Type']),
        status: first(row, ['Status','status']),
        timeline: first(row, ['Timeline','timeline']),
        upsellValue: num(first(row, ['Upsell Value','upsellValue','Upsell Amount'])),
        notes: first(row, ['Notes','notes','Note']),
        _row: idx + 2
      };
      if(obj.product) carry.product = obj.product;
      if(obj.clientName) carry.clientName = obj.clientName;
      if(obj.csm) carry.csm = obj.csm;
      if(obj.rm) carry.rm = obj.rm;
      if(obj.renewalMonth) carry.renewalMonth = obj.renewalMonth;
      if(obj.renewalValue) carry.renewalValue = obj.renewalValue;
      return obj;
    }).filter(function(r){ return r.clientName || r.feature || r.status; });
  }
  function statusClass(status){
    var s = String(status||'').toLowerCase();
    if(s.indexOf('proposal') >= 0) return 'ret-upsell-proposal';
    if(s.indexOf('not') >= 0) return 'ret-upsell-not';
    if(s.indexOf('interest') >= 0) return 'ret-upsell-interested';
    return '';
  }
  function ensurePanel(){
    var existing = byId('panel-retention-upselling');
    if(existing) return existing;
    var dash = byId('dashMain') || document.querySelector('.content');
    if(!dash) return null;
    var panel = document.createElement('div');
    panel.className = 'panel';
    panel.id = 'panel-retention-upselling';
    panel.innerHTML = `
      <div class="ret-upsell-hero">
        <div class="ret-upsell-icon">🚀</div>
        <div>
          <div class="ret-upsell-title">Features Plan for Upselling</div>
          <div class="ret-upsell-sub">Read-only view from Google Sheet. n8n reads the sheet and updates this section inside the Supabase Retention only.</div>
        </div>
      </div>
      <div class="ret-upsell-kpis" id="retUpsellKpis"></div>
      <div class="ret-upsell-board">
        <div class="card-hd">
          <div class="card-title"><div class="card-title-icon" style="background:var(--purple-bg)">📋</div>Features Plan for Upselling</div>
          <span class="badge bp" id="retUpsellRowsBadge">Google Sheet</span>
        </div>
        <div class="ret-upsell-tools">
          <input class="ret-upsell-search" id="retUpsellSearch" placeholder="Search client, feature, RM, CSM..." oninput="renderRetentionUpsellingFeaturesPlan()">
          <select class="ret-upsell-select" id="retUpsellStatus" onchange="renderRetentionUpsellingFeaturesPlan()"></select>
          <select class="ret-upsell-select" id="retUpsellMonth" onchange="renderRetentionUpsellingFeaturesPlan()"></select>
          <select class="ret-upsell-select" id="retUpsellProduct" onchange="renderRetentionUpsellingFeaturesPlan()"></select>
          <select class="ret-upsell-select" id="retUpsellRM" onchange="renderRetentionUpsellingFeaturesPlan()"></select>
          <select class="ret-upsell-select" id="retUpsellCSM" onchange="renderRetentionUpsellingFeaturesPlan()"></select>
        </div>
        <div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Client / Product</th><th>CSM</th><th>RM</th><th class="c">Renewal Month</th><th class="c">Renewal Value</th><th>Feature</th><th class="c">Ownership</th><th class="c">Status</th><th class="c">Timeline</th><th class="c">Upsell Value</th><th>Notes</th></tr></thead><tbody id="retUpsellBody"></tbody></table></div>
      </div>`;
    var retFinancial = byId('panel-retention-financial');
    if(retFinancial && retFinancial.parentNode) retFinancial.parentNode.insertBefore(panel, retFinancial.nextSibling);
    else dash.appendChild(panel);
    return panel;
  }
  function unique(arr){ return Array.from(new Set(arr.filter(function(v){ return String(v||'').trim(); }))).sort(); }
  function clientKey(v){ return String(v || '').trim().toLowerCase().replace(/\s+/g,' '); }
  function sheetBlockKey(r){
    /*
      Mirror the Google Sheet, not only the client name.
      A company can appear more than once when it has multiple products
      such as Talentera / Evalufy / AfterHire. Each client + product + renewal
      block is counted once, while the feature rows under that block stay visible.
    */
    return [
      r.clientName || 'Unknown Client',
      r.product || '',
      r.csm || '',
      r.rm || '',
      r.renewalMonth || '',
      num(r.renewalValue) || num(r.upsellValue) || 0
    ].map(clientKey).join('|');
  }
  function uniqueClientsFromRows(rows){
    return Array.from(new Set(rows.map(function(r){ return clientKey(r.clientName); }).filter(Boolean)));
  }
  function groupRowsByClient(rows){
    var map = {};
    var order = [];
    rows.forEach(function(r){
      var key = sheetBlockKey(r);
      if(!map[key]){
        map[key] = {
          key:key,
          clientName:r.clientName || 'Unknown Client',
          product:r.product || '',
          csm:r.csm || '',
          rm:r.rm || '',
          renewalMonth:r.renewalMonth || '',
          renewalValue:0,
          upsellValue:0,
          rows:[],
          firstRow:r._row || 0
        };
        order.push(key);
      }
      var g = map[key];
      if(!g.product && r.product) g.product = r.product;
      if(!g.csm && r.csm) g.csm = r.csm;
      if(!g.rm && r.rm) g.rm = r.rm;
      if(!g.renewalMonth && r.renewalMonth) g.renewalMonth = r.renewalMonth;
      if(num(r.renewalValue) > 0) g.renewalValue = num(r.renewalValue);
      if(num(r.upsellValue) > 0) g.upsellValue += num(r.upsellValue);
      g.rows.push(r);
    });
    return order.map(function(k){
      var g = map[k];
      g.clientValue = num(g.renewalValue);
      return g;
    });
  }
  function fillSelect(id, allLabel, values, current){
    var el = byId(id); if(!el) return;
    var old = current !== undefined ? current : el.value;
    el.innerHTML = '<option value="">' + allLabel + '</option>' + values.map(function(v){ return '<option value="' + escLocal(v) + '">' + escLocal(v) + '</option>'; }).join('');
    if(values.indexOf(old) >= 0) el.value = old;
  }
  window.renderRetentionUpsellingFeaturesPlan = function(){
    ensurePanel();
    var rows = getRows();
    var groupedAll = groupRowsByClient(rows);
    var clients = uniqueClientsFromRows(rows);
    var proposalSent = rows.filter(function(r){ return /proposal\s*sent|proposal/i.test(r.status || ''); }).length;
    var interested = rows.filter(function(r){ return /interested|interest/i.test(r.status || '') && !/not\s*interested/i.test(r.status || ''); }).length;
    var notInterested = rows.filter(function(r){ return /not\s*interested|not interested/i.test(r.status || ''); }).length;
    var renewalTotal = groupedAll.reduce(function(s,g){ return s + num(g.renewalValue); },0);
    var upsellTotal = groupedAll.reduce(function(s,g){ return s + num(g.upsellValue); },0);
    var kpis = byId('retUpsellKpis');
    if(kpis) kpis.innerHTML = [
      {v: clients.length, l:'Clients', c:'var(--cyan)'},
      {v: proposalSent, l:'Proposal Sent', c:'var(--blue)'},
      {v: interested, l:'Interested', c:'var(--green)'},
      {v: notInterested, l:'Not Interested', c:'var(--red)'},
      {v: money(upsellTotal), l:'Upsell Value', c:'var(--green)'}
    ].map(function(x){ return '<div class="ret-upsell-kpi" style="--kc:' + x.c + '"><div class="ret-upsell-kpi-v">' + escLocal(x.v) + '</div><div class="ret-upsell-kpi-l">' + escLocal(x.l) + '</div></div>'; }).join('');

    fillSelect('retUpsellStatus','All statuses', unique(rows.map(function(r){return r.status;})));
    fillSelect('retUpsellMonth','All months', unique(rows.map(function(r){return r.renewalMonth;})));
    fillSelect('retUpsellProduct','All products', unique(rows.map(function(r){return r.product;})));
    fillSelect('retUpsellRM','All RMs', unique(rows.map(function(r){return r.rm;})));
    fillSelect('retUpsellCSM','All CSMs', unique(rows.map(function(r){return r.csm;})));

    var q = String((byId('retUpsellSearch')||{}).value || '').toLowerCase().trim();
    var fs = String((byId('retUpsellStatus')||{}).value || '');
    var fm = String((byId('retUpsellMonth')||{}).value || '');
    var fp = String((byId('retUpsellProduct')||{}).value || '');
    var frm = String((byId('retUpsellRM')||{}).value || '');
    var fcsm = String((byId('retUpsellCSM')||{}).value || '');
    var filtered = rows.filter(function(r){
      var text = [r.clientName,r.product,r.csm,r.rm,r.renewalMonth,r.feature,r.ownership,r.status,r.timeline,r.notes].join(' ').toLowerCase();
      return (!q || text.indexOf(q) >= 0) && (!fs || r.status === fs) && (!fm || r.renewalMonth === fm) && (!fp || r.product === fp) && (!frm || r.rm === frm) && (!fcsm || r.csm === fcsm);
    });
    var groupedFiltered = groupRowsByClient(filtered);
    var badge = byId('retUpsellRowsBadge');
    if(badge) badge.textContent = groupedFiltered.length + ' / ' + groupedAll.length + ' sheet blocks · ' + uniqueClientsFromRows(filtered).length + ' clients';
    var body = byId('retUpsellBody');
    if(!body) return;
    if(!rows.length){
      body.innerHTML = '<tr><td colspan="11"><div class="ret-upsell-empty">No Google Sheet rows found yet. Add featuresPlanForUpselling to the Supabase Retention from n8n.</div></td></tr>';
      return;
    }
    if(!filtered.length){
      body.innerHTML = '<tr><td colspan="11"><div class="ret-upsell-empty">No clients match the selected filters.</div></td></tr>';
      return;
    }
    body.innerHTML = groupedFiltered.map(function(g){
      var span = Math.max(1, g.rows.length);
      return g.rows.map(function(r, idx){
        var status = r.status || '—';
        var clientCells = idx === 0 ?
          '<td class="ret-upsell-client-cell" rowspan="' + span + '"><div class="ret-upsell-client-name">' + escLocal(g.clientName || '—') + '</div><div class="ret-upsell-client-product">' + escLocal(g.product || '—') + '</div><span class="ret-upsell-client-count">' + span + ' features</span></td>' +
          '<td rowspan="' + span + '">' + escLocal(g.csm || '—') + '</td>' +
          '<td rowspan="' + span + '">' + escLocal(g.rm || '—') + '</td>' +
          '<td class="c" rowspan="' + span + '">' + escLocal(g.renewalMonth || '—') + '</td>' +
          '<td class="c" rowspan="' + span + '" style="font-family:var(--mono);font-weight:900;color:var(--amber)">' + (num(g.renewalValue) ? money(g.renewalValue) : '—') + '</td>' : '';
        var upsellCell = idx === 0 ? '<td class="c" rowspan="' + span + '" style="font-family:var(--mono);font-weight:900;color:var(--green)">' + (num(g.upsellValue) ? money(g.upsellValue) : '—') + '</td>' : '';
        return '<tr class="' + (idx === 0 ? 'ret-upsell-group-start' : '') + '">' +
          clientCells +
          '<td style="font-weight:800">' + escLocal(r.feature || '—') + '</td>' +
          '<td class="c"><span class="badge bp">' + escLocal(r.ownership || '—') + '</span></td>' +
          '<td class="c"><span class="ret-upsell-status ' + statusClass(status) + '">' + escLocal(status) + '</span></td>' +
          '<td class="c">' + escLocal(r.timeline || '—') + '</td>' +
          upsellCell +
          '<td style="max-width:260px;white-space:normal;line-height:1.45">' + escLocal(r.notes || '—') + '</td>' +
        '</tr>';
      }).join('');
    }).join('');
  };

  window.switchRetentionUpsellingFeaturesPlan = function(){
    APP_MAIN_PANEL = 'retention';
    APP_RETENTION_VIEW = 'upselling';
    APP_RETENTION_OWNER_ID = null;
    RET_SELECTED_OWNER_ID = null;
    RETENTION_SUBVIEW = 'upselling';
    document.querySelectorAll('.tab-btn').forEach(function(t){ t.classList.remove('active'); });
    document.querySelectorAll('.panel').forEach(function(p){ p.classList.remove('active'); });
    document.querySelectorAll('.nav-item').forEach(function(n){ n.classList.remove('active'); });
    if(byId('tabsBar')) byId('tabsBar').style.display = 'none';
    if(typeof setRetentionOwnerMode === 'function') setRetentionOwnerMode(false);
    byId('side-retention') && byId('side-retention').classList.add('active');
    ensurePanel();
    byId('panel-retention-upselling') && byId('panel-retention-upselling').classList.add('active');
    if(typeof renderRetentionSidebar === 'function') renderRetentionSidebar('upselling');
    if(byId('topbarTitle')) byId('topbarTitle').textContent = 'Retention · Features Plan for Upselling';
    if(byId('topbarSub')) byId('topbarSub').textContent = 'Read-only Google Sheet tab · updated by n8n into Supabase Retention';
    window.renderRetentionUpsellingFeaturesPlan();
    window.scrollTo({top:0, behavior:'smooth'});
  };

  var oldSidebar = window.renderRetentionSidebar;
  if(typeof oldSidebar === 'function' && !oldSidebar.__upsellingWrapped){
    window.renderRetentionSidebar = function(activeMode){
      if(window.APP_RETENTION_VIEW === 'upselling') activeMode = 'upselling';
      var result = oldSidebar.apply(this, arguments.length ? [activeMode] : arguments);
      var holder = byId('sideRepLinks');
      if(holder && !byId('side-ret-upselling')){
        var rows = getRows();
        var grouped = groupRowsByClient(rows);
        var active = activeMode === 'upselling' ? ' active' : '';
        var html = '<button class="nav-item' + active + '" id="side-ret-upselling" onclick="switchRetentionUpsellingFeaturesPlan()"><span class="nav-icon" style="color:var(--purple)">🚀</span>Features Plan<span class="view-tag">SHEET</span><span class="nav-badge">' + uniqueClientsFromRows(rows).length + '</span></button>';
        var financial = byId('side-ret-financial');
        if(financial) financial.insertAdjacentHTML('afterend', html);
        else holder.insertAdjacentHTML('afterbegin', html);
      }
      return result;
    };
    window.renderRetentionSidebar.__upsellingWrapped = true;
  }

  var oldRestore = window.restoreCurrentView;
  if(typeof oldRestore === 'function' && !oldRestore.__upsellingWrapped){
    window.restoreCurrentView = function(options){
      if(window.APP_MAIN_PANEL === 'retention' && window.APP_RETENTION_VIEW === 'upselling'){
        var y = window.scrollY;
        window.switchRetentionUpsellingFeaturesPlan();
        if(!options || options.keepScroll !== false) requestAnimationFrame(function(){ window.scrollTo(0, y); });
        return;
      }
      return oldRestore.apply(this, arguments);
    };
    window.restoreCurrentView.__upsellingWrapped = true;
  }

  var oldLoad = window.loadData;
  if(typeof oldLoad === 'function' && !oldLoad.__upsellingWrapped){
    window.loadData = async function(options = {}){
      var result = oldLoad.apply(this, arguments);
      if(result && typeof result.then === 'function') await result;
      try{
        ensurePanel();
        if(window.APP_MAIN_PANEL === 'retention' && window.APP_RETENTION_VIEW === 'upselling') window.renderRetentionUpsellingFeaturesPlan();
      }catch(e){ console.error('Features Plan render failed', e); }
      return result;
    };
    window.loadData.__upsellingWrapped = true;
  }

  ensurePanel();
})();
