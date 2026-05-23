(function(){
  if(window.__RETENTION_FINANCIAL_SOURCE_OF_TRUTH_V62__) return;
  window.__RETENTION_FINANCIAL_SOURCE_OF_TRUTH_V62__ = true;
  window.DASHBOARD_CLEAN_VERSION = 'retention-financial-source-of-truth-v62';

  var MONTHS = [
    {key:'All', label:'All Months', i:0},
    {key:'Jan', label:'January', i:1}, {key:'Feb', label:'February', i:2}, {key:'Mar', label:'March', i:3},
    {key:'Apr', label:'April', i:4}, {key:'May', label:'May', i:5}, {key:'Jun', label:'June', i:6},
    {key:'Jul', label:'July', i:7}, {key:'Aug', label:'August', i:8}, {key:'Sep', label:'September', i:9},
    {key:'Oct', label:'October', i:10}, {key:'Nov', label:'November', i:11}, {key:'Dec', label:'December', i:12}
  ];

  window.RET_FIN_SHEET_FILTERS = Object.assign(
    {month:'All', rm:'All', csm:'All', product:'All', accountStatus:'All', status:'All'},
    window.RET_FIN_SHEET_FILTERS || {}
  );

  function byId(id){ return document.getElementById(id); }
  function arr(v){ return Array.isArray(v) ? v : []; }
  function txt(v){ return String(v == null ? '' : v).trim(); }
  function norm(v){ return txt(v).toLowerCase().replace(/[’']/g,'').replace(/[_\-\/\\|]+/g,' ').replace(/[.,:;()[\]{}]/g,' ').replace(/\s+/g,' ').trim(); }
  function esc(v){ return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
  function num(v){
    if(v == null || v === '') return 0;
    if(typeof v === 'number') return Number.isFinite(v) ? v : 0;
    var s = String(v).replace(/,/g,'').replace(/\$/g,'').trim();
    var negative = /^-/.test(s) || /-$/.test(s) || (s.indexOf('(') >= 0 && s.indexOf(')') >= 0);
    s = s.replace(/[()\s-]/g,'').replace(/[^0-9.]/g,'');
    var n = Number(s);
    return Number.isFinite(n) ? (negative ? -n : n) : 0;
  }
  function money(v){ return '$' + Math.round(num(v)).toLocaleString('en-US'); }
  function first(row, keys){
    var sources = [row, row && row.properties, row && row.raw, row && row.fields].filter(Boolean);
    for(var i=0;i<keys.length;i++){
      for(var j=0;j<sources.length;j++){
        var src = sources[j], key = keys[i];
        if(Object.prototype.hasOwnProperty.call(src,key)){
          var val = src[key];
          if(val !== undefined && val !== null && String(val).trim() !== '') return val;
        }
      }
    }
    return '';
  }
  function sheets(){
    var r = window.R || {};
    return r.retentionSheets2026 || r.sheets2026 || (r.sheetData && r.sheetData.retentionSheets2026) || {};
  }
  function summary(){ return sheets().summary || {}; }
  function filters(){
    window.RET_FIN_SHEET_FILTERS = Object.assign(
      {month:'All', rm:'All', csm:'All', product:'All', accountStatus:'All', status:'All'},
      window.RET_FIN_SHEET_FILTERS || {}
    );
    return window.RET_FIN_SHEET_FILTERS;
  }
  function filtersAreDefault(){
    var f = filters();
    return ['month','rm','csm','product','accountStatus','status'].every(function(k){ return !f[k] || f[k] === 'All'; });
  }
  function monthLabel(key){ var m = MONTHS.find(function(x){ return x.key === key; }); return m ? m.label : (key || 'All Months'); }
  function monthKey(raw){
    var v = norm(raw);
    if(!v) return '';
    var aliases = {january:'jan',february:'feb',march:'mar',april:'apr',june:'jun',july:'jul',august:'aug',september:'sep',sept:'sep',october:'oct',november:'nov',december:'dec'};
    if(aliases[v]) v = aliases[v];
    var found = MONTHS.find(function(m){ return norm(m.key) === v || norm(m.label) === v || String(m.i) === v || ('0'+m.i) === v; });
    return found ? found.key : txt(raw);
  }
  function monthIndex(raw){ var k = monthKey(raw); var m = MONTHS.find(function(x){ return x.key === k; }); return m ? m.i : 0; }
  function productOf(row){
    var p = txt(first(row,['product','Product','productName','sheetProduct','solution']));
    var n = norm(p);
    if(n.indexOf('talentera') >= 0 || n === 'ats') return 'Talentera';
    if(n.indexOf('afterhire') >= 0 || n.indexOf('after hire') >= 0 || n === 'after') return 'AfterHire';
    if(n.indexOf('evalufy') >= 0 || n.indexOf('evaluate') >= 0) return 'Evalufy';
    return p || 'Unknown';
  }
  function rmOf(row){ return txt(first(row,['rm','rm2026','RM 2026','RM','rmOwnerName','ownerName','retentionOwner','owner'])) || ''; }
  function csmOf(row){ return txt(first(row,['csm','csmName','CSM Name','CSM','csmOwnerName','customerSuccessManager'])) || ''; }
  function clientOf(row){ return txt(first(row,['clientName','client','Client','companyName','company','name','dealName','accountName'])) || 'Unknown Client'; }
  function gidOf(row){ return txt(first(row,['cleanGid','gid','GID','companyId','company_id','hs_object_id','id'])); }
  function urlOf(row){ return txt(first(row,['companyUrl','hubspotUrl','url','recordUrl'])); }
  function renewalMonth(row){ return monthKey(first(row,['renewalMonth','Renewal Month','contractRenewalMonth','month'])) || '—'; }
  function bookingMonth(row){ return monthKey(first(row,['bookingMonth','Booking Month'])) || '—'; }
  function collectionMonth(row){ return monthKey(first(row,['collectionMonth','Collection Month','cashMonth'])) || '—'; }
  function accountStatusLabel(row){
    var raw = first(row,['accountStatusForFilter','accountStatusLabel','budgetStatusLabel','budgetStatusRaw','abdullahStatus','statusAbdullah','Status Abdullah','Account Status','accountStatus','account_status','budgetStatus']);
    var s = norm(raw);
    if(!s || s === 'active') return 'Active';
    if(s === 'lost' || s === 'churned') return 'Lost';
    if(s === 'lost from 2025' || s === 'lost from 25' || s === 'lost 2025' || s === 'lost 25') return 'Lost From 2025';
    if(s === 'expected to be lost' || s === 'expected be lost' || s === 'expected lost' || s === 'expected to lost') return 'Expected To Be Lost';
    return txt(raw) || 'Active';
  }
  function renewalStatus(row){
    var raw = first(row,['status','calculatedRenewalStatus','renewalStatus','renewal_status','calculated_status','Calculated Renewal Status','financialStatus']);
    var s = norm(raw);
    if(s){
      if(s === 'lost' || s === 'churned') return 'Lost';
      if(s.indexOf('lost from 2025') >= 0 || s.indexOf('lost from 25') >= 0) return 'Lost From 2025';
      if(s.indexOf('renewed on time') >= 0) return 'Renewed On Time';
      if(s.indexOf('renewed late') >= 0 || s === 'late') return 'Renewed Late';
      if(s.indexOf('delayed') >= 0) return 'Delayed';
      if(s.indexOf('upcoming') >= 0) return 'Upcoming';
      if(s.indexOf('booked') >= 0 && s.indexOf('pending') >= 0) return 'Booked Pending Collection';
      if(s.indexOf('partially cashed') >= 0) return 'Partially Cashed';
      if(s.indexOf('cash') >= 0 || s.indexOf('cashed') >= 0) return 'Cashed';
      if(s.indexOf('renewed') >= 0) return 'Renewed';
      if(s.indexOf('no renewal month') >= 0) return 'No Renewal Month';
    }
    var acc = accountStatusLabel(row);
    if(acc === 'Lost' || acc === 'Lost From 2025') return acc;
    var r = num(first(row,['renewalMonthIndex'])) || monthIndex(renewalMonth(row));
    var b = num(first(row,['bookingMonthIndex'])) || monthIndex(bookingMonth(row));
    var c = num(first(row,['collectionMonthIndex'])) || monthIndex(collectionMonth(row));
    var hasBooked = valueFor(row,'booked','All','All') !== 0;
    var hasCash = valueFor(row,'cash','All','All') !== 0;
    var proof = 0;
    if(hasBooked && b) proof = b;
    if(hasCash && c) proof = proof ? Math.min(proof,c) : c;
    if(proof && r) return proof > r ? 'Renewed Late' : 'Renewed On Time';
    if(hasBooked && !hasCash) return 'Booked Pending Collection';
    if(hasCash) return 'Cashed';
    if(r){
      var now = new Date(Date.now() + 3 * 60 * 60 * 1000).getUTCMonth() + 1;
      return now > r ? 'Delayed' : 'Upcoming';
    }
    return 'No Renewal Month';
  }
  function fullStatus(row){
    var acc = accountStatusLabel(row);
    var st = renewalStatus(row);
    return acc === 'Expected To Be Lost' ? acc + ' · ' + st : st;
  }
  function finalLost(row){ var a = accountStatusLabel(row); return a === 'Lost' || a === 'Lost From 2025'; }
  function asObject(value){
    if(!value) return null;
    if(typeof value === 'object') return value;
    if(typeof value === 'string'){
      try{ var parsed = JSON.parse(value); return parsed && typeof parsed === 'object' ? parsed : null; }catch(e){ return null; }
    }
    return null;
  }
  function financialMap(row, kind){
    var raw = kind === 'cash'
      ? (first(row,['collectionByMonth','cashByMonth','collectedByMonth']) || row.collectionByMonth || row.cashByMonth || row.collectedByMonth)
      : (first(row,['bookingByMonth','bookedByMonth']) || row.bookingByMonth || row.bookedByMonth);
    return asObject(raw);
  }
  function rawValue(row, kind){
    return kind === 'cash'
      ? num(first(row,['collectedValue','totalCollectedValue','collectionValue','cashedValue','cashCollected','Collected']))
      : num(first(row,['bookingSheetValue','bookedValue','totalBookedValue','bookingValue','bookedAmount','booked','Booked']));
  }
  function productMatches(row, product){ return !product || product === 'All' || productOf(row) === product; }
  function mapValue(row, kind, month, product){
    var map = financialMap(row, kind);
    if(!map) return 0;
    var p = product && product !== 'All' ? product : productOf(row);
    if(month && month !== 'All'){
      var bucket = map[month] || map[monthLabel(month)] || map[norm(month)] || null;
      if(bucket == null) return 0;
      if(typeof bucket === 'number' || typeof bucket === 'string') return num(bucket);
      if(p && p !== 'Unknown') return num(bucket[p]);
      return Object.keys(bucket || {}).reduce(function(s,k){ return s + num(bucket[k]); },0);
    }
    return Object.keys(map).reduce(function(total,m){
      var bucket = map[m];
      if(typeof bucket === 'number' || typeof bucket === 'string') return total + num(bucket);
      if(p && p !== 'Unknown') return total + num(bucket && bucket[p]);
      return total + Object.keys(bucket || {}).reduce(function(s,k){ return s + num(bucket[k]); },0);
    },0);
  }
  function valueFor(row, kind, month, product){
    if(!row) return 0;
    if(product && product !== 'All' && productOf(row) !== product) return 0;
    var raw = rawValue(row, kind);
    var rowMonth = kind === 'cash' ? collectionMonth(row) : bookingMonth(row);
    if(!month || month === 'All'){
      if(raw !== 0) return raw;
      return mapValue(row, kind, 'All', product);
    }
    var mv = mapValue(row, kind, month, product);
    if(mv !== 0) return mv;
    return rowMonth === month ? raw : 0;
  }
  function renewalValue(row, month, product){
    if(product && product !== 'All' && productOf(row) !== product) return 0;
    var val = num(first(row,['renewalValue2026','renewalValue','Renewal Value','renewal_value','amount']));
    if(!month || month === 'All') return val;
    return renewalMonth(row) === month ? val : 0;
  }
  function bookedNotCash(row, month, product){ return Math.max(valueFor(row,'booked',month,product) - valueFor(row,'cash',month,product), 0); }
  function allAccounts(){
    var s = sheets();
    var base = arr(s.accounts);
    var extra = arr(s.sheetOnlyNotInBudgetAccounts);
    var rows = base.concat(extra);
    var seen = {};
    return rows.filter(function(row){
      var key = [gidOf(row), norm(clientOf(row)), productOf(row), renewalMonth(row), bookingMonth(row), collectionMonth(row), rawValue(row,'booked'), rawValue(row,'cash'), renewalValue(row,'All','All'), first(row,['notInBudget2026']) ? 'nb' : 'b'].join('|');
      if(seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }
  function unique(rows, fn){
    var seen = {};
    return arr(rows).map(fn).filter(function(v){ v = txt(v); if(!v || seen[v]) return false; seen[v] = true; return true; }).sort(function(a,b){ return String(a).localeCompare(String(b)); });
  }
  function passMonth(row, month, product){
    if(!month || month === 'All') return true;
    if(renewalValue(row, month, product) !== 0) return true;
    if(valueFor(row,'booked',month,product) !== 0) return true;
    if(valueFor(row,'cash',month,product) !== 0) return true;
    return false;
  }
  function filteredAccounts(){
    var f = filters();
    return allAccounts().filter(function(row){
      if(f.rm && f.rm !== 'All' && rmOf(row) !== f.rm) return false;
      if(f.csm && f.csm !== 'All' && csmOf(row) !== f.csm) return false;
      if(f.accountStatus && f.accountStatus !== 'All' && accountStatusLabel(row) !== f.accountStatus) return false;
      if(f.status && f.status !== 'All' && renewalStatus(row) !== f.status) return false;
      if(!productMatches(row, f.product || 'All')) return false;
      if(!passMonth(row, f.month || 'All', f.product || 'All')) return false;
      return true;
    });
  }
  function financialEntries(rows, kind, month, product){
    var seen = {};
    return arr(rows).map(function(row){
      var value = valueFor(row, kind, month || 'All', product || 'All');
      if(value === 0) return null;
      var entryMonth = (month && month !== 'All') ? month : (kind === 'cash' ? collectionMonth(row) : bookingMonth(row));
      var entryProduct = (product && product !== 'All') ? product : productOf(row);
      return {kind:kind, row:row, month:entryMonth || '—', product:entryProduct, value:value};
    }).filter(Boolean).filter(function(entry){
      var key = [entry.kind, norm(gidOf(entry.row) || clientOf(entry.row)), norm(clientOf(entry.row)), entry.product, entry.month, Math.round(num(entry.value) * 100) / 100].join('|');
      if(seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }
  function statusClass(status){
    var s = norm(status);
    if(s.indexOf('expected to be lost') >= 0) return 'ba';
    if(s === 'lost' || s.indexOf('lost from 2025') >= 0 || s.indexOf('delayed') >= 0) return 'br';
    if(s.indexOf('late') >= 0 || s.indexOf('pending') >= 0) return 'ba';
    if(s.indexOf('renewed') >= 0 || s.indexOf('cash') >= 0) return 'bg';
    if(s.indexOf('upcoming') >= 0 || s.indexOf('no renewal') >= 0) return 'bb';
    return 'bp';
  }
  function badge(status){ return '<span class="badge '+statusClass(status)+'">'+esc(status || '—')+'</span>'; }
  function rowClass(index){ return index >= 10 ? 'ret-hidden' : ''; }
  function empty(cols,msg){ return '<tr><td colspan="'+cols+'" class="ret-fin-empty">'+esc(msg)+'</td></tr>'; }
  function cellMoney(value,color){ return '<span style="font-family:var(--mono);font-weight:900;color:'+color+'">'+money(value)+'</span>'; }
  function tableHead(headers){ return '<thead><tr>' + headers.map(function(h){ var c = h.charAt(0) === ':'; return '<th'+(c?' class="c"':'')+'>'+esc(c?h.slice(1):h)+'</th>'; }).join('') + '</tr></thead>'; }
  function setHtml(id, html){ var el = byId(id); if(el) el.innerHTML = html; }
  function setText(id, value){ var el = byId(id); if(el) el.textContent = value; }
  function clientCell(row){
    var bits = [];
    var gid = gidOf(row);
    if(gid) bits.push('GID ' + gid);
    if(first(row,['notInBudget2026']) || first(row,['budgetNote'])) bits.push(txt(first(row,['budgetNote'])) || 'Not in Budget 2026');
    var name = clientOf(row);
    var link = urlOf(row) ? '<a class="record-link" href="'+esc(urlOf(row))+'" target="_blank" rel="noopener">'+esc(name)+'</a>' : esc(name);
    return '<div style="font-weight:900">'+link+'</div>' + (bits.length ? '<div style="font-size:10px;color:var(--muted);margin-top:2px">'+esc(bits.join(' · '))+'</div>' : '');
  }

  function ensureLayout(){
    var panel = byId('panel-retention-financial');
    if(!panel) return;
    if(!byId('retFinSourceOfTruthStyle')){
      var style = document.createElement('style');
      style.id = 'retFinSourceOfTruthStyle';
      style.textContent = [
        '#panel-retention-financial{max-width:none!important;width:100%!important;margin:0!important}',
        '#panel-retention-financial #retFinSourceLayout{display:block;width:100%}',
        '#panel-retention-financial .ret-fin-top-grid{grid-template-columns:repeat(6,minmax(0,1fr))!important}',
        '#panel-retention-financial .ret-fin-main-split{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;padding:14px;border-bottom:1px solid rgba(22,64,42,.08);margin:0!important}',
        '#panel-retention-financial .ret-fin-status-grid-clean{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;padding:14px}',
        '#panel-retention-financial .ret-fin-main-split .ret-fin-subcard{margin-bottom:0!important}',
        '#panel-retention-financial .ret-hidden{display:none}',
        '@media(max-width:1400px){#panel-retention-financial .ret-fin-top-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}}',
        '@media(max-width:900px){#panel-retention-financial .ret-fin-top-grid,#panel-retention-financial .ret-fin-main-split,#panel-retention-financial .ret-fin-status-grid-clean{grid-template-columns:1fr!important}}'
      ].join('');
      document.head.appendChild(style);
    }
    var hero = panel.querySelector('.ret-fin-hero');
    if(!hero){ hero = document.createElement('div'); hero.className = 'ret-fin-hero'; panel.insertBefore(hero, panel.firstChild); }
    hero.innerHTML = '<div class="ret-fin-hero-icon">💰</div><div><div class="ret-fin-hero-title">Retention Financial Details</div><div class="ret-fin-hero-sub">A clean money view for Customer Success: Renewal value, booked value, cash collected, booked not cash, delayed accounts, and renewed late accounts from Budget + Booking + Collection sheets.</div></div>';
    if(byId('retFinSourceLayout')) return;
    while(hero.nextSibling) hero.nextSibling.remove();
    hero.insertAdjacentHTML('afterend',
      '<div id="retFinSourceLayout">'+
        '<div id="retFinSheetFilter" class="ret-sheet-filter"></div>'+
        '<div class="ret-fin-top-grid" id="retFinTopGrid"></div>'+
        '<div class="ret-fin-board" id="retFinOwnerBoard">'+
          '<div class="ret-fin-board-hd"><div><div class="ret-fin-board-title">📊 Owner Financial Summary</div><div class="ret-fin-mini-note" style="border:0;background:transparent;padding:4px 0 0">Renewal, booked, cash collected, and booked not cash by RM / CSM after the current filters.</div></div><span class="badge bb" id="retFinOwnerBadge">0 owners</span></div>'+
          '<div class="ret-fin-owner-grid" id="retFinOwnerGrid"></div>'+
        '</div>'+
        '<div class="ret-fin-board" id="retFinStatusBoard">'+
          '<div class="ret-fin-board-hd"><div><div class="ret-fin-board-title">📌 Renewal Status Split</div><div class="ret-fin-mini-note" style="border:0;background:transparent;padding:4px 0 0">Booked, cash collected, and renewal status movement for this year after the current filters.</div></div><span class="badge bb" id="retFinStatusBadge">0 accounts</span></div>'+
          '<div class="ret-fin-main-split">'+
            '<div class="ret-fin-subcard" style="--sc:var(--purple)"><div class="ret-fin-subhd"><div class="ret-fin-subtitle" style="color:var(--purple)">📝 Booked This Year</div><span class="badge bp" id="retFinBookedBadge"></span></div><div class="ret-fin-mini-note">Booked value from Retention Accounts Booking sheet.</div><div style="overflow-x:auto"><table class="tbl" id="retFinBookedTable">'+tableHead(['Client','RM 2026','CSM',':Product',':Booking Month',':Booked',':Booked Not Cash',':Renewal Status'])+'<tbody id="retFinBookedBody"></tbody></table></div><button class="ret-show-btn" id="retFinBookedToggle" onclick="retFinToggleRows(\'retFinBookedBody\',this)">▼ Show more</button></div>'+
            '<div class="ret-fin-subcard" style="--sc:var(--green)"><div class="ret-fin-subhd"><div class="ret-fin-subtitle" style="color:var(--green)">💵 Cash Collected This Year</div><span class="badge bg" id="retFinCashedBadge"></span></div><div class="ret-fin-mini-note">Cash collected from Retention Accounts Collection sheet.</div><div style="overflow-x:auto"><table class="tbl" id="retFinCashedTable">'+tableHead(['Client','RM 2026','CSM',':Product',':Collection Month',':Cash Collected',':Booked Not Cash',':Renewal Status'])+'<tbody id="retFinCashedBody"></tbody></table></div><button class="ret-show-btn" id="retFinCashedToggle" onclick="retFinToggleRows(\'retFinCashedBody\',this)">▼ Show more</button></div>'+
          '</div>'+
          '<div class="ret-fin-status-grid-clean" id="retFinStatusGrid"></div>'+
        '</div>'+
      '</div>'
    );
  }
  function optionHtml(value,label,selected){ return '<option value="'+esc(value)+'"'+(value===selected?' selected':'')+'>'+esc(label || value)+'</option>'; }
  function selectHtml(id,key,label,value,options){ return '<span class="ret-sheet-label">'+esc(label)+'</span><select class="ret-sheet-select" id="'+esc(id)+'" data-ret-fin-filter-key="'+esc(key)+'">'+optionHtml('All','All',value)+options.map(function(o){ return optionHtml(o,o,value); }).join('')+'</select>'; }
  function productOptions(rows){ var values = {}; rows.forEach(function(row){ var p = productOf(row); if(p) values[p] = true; }); return Object.keys(values).sort(); }
  function renderFilters(allRows){
    var f = filters();
    var monthOptions = MONTHS.filter(function(m){ return m.key !== 'All'; }).map(function(m){ return m.key; });
    var accountOptions = unique(allRows, accountStatusLabel);
    ['Active','Expected To Be Lost','Lost','Lost From 2025'].forEach(function(x){ if(accountOptions.indexOf(x) < 0) accountOptions.unshift(x); });
    var statusOptions = unique(allRows, renewalStatus);
    var src = sheets().sourceSheets || {};
    setHtml('retFinSheetFilter',
      '<div class="ret-sheet-filter-inner"><div class="ret-sheet-filter-left">'+
        selectHtml('retFinFilterMonth','month','Month',f.month || 'All',monthOptions)+
        selectHtml('retFinFilterRm','rm','RM 2026',f.rm || 'All',unique(allRows,rmOf))+
        selectHtml('retFinFilterCsm','csm','CSM',f.csm || 'All',unique(allRows,csmOf))+
        selectHtml('retFinFilterProduct','product','Product',f.product || 'All',productOptions(allRows))+
        selectHtml('retFinFilterAccountStatus','accountStatus','Account Status',f.accountStatus || 'All',accountOptions)+
        '<button class="ret-sheet-select" style="cursor:pointer;color:var(--red);min-width:auto" onclick="window.retFinResetFilters()">Reset</button>'+
        '<span class="ret-sheet-note">Filters apply to cards, owner summary, booked, cash collected, and status sections.</span>'+
      '</div><span class="badge bb">Financial view</span></div>'+
      '<div class="ret-sheet-source"><span class="ret-sheet-pill">Budget: '+esc(src.budget || '1- 2026 Budget / 2026 Budget')+'</span><span class="ret-sheet-pill">Booking: '+esc(src.booking || 'Retention Accounts Booking')+'</span><span class="ret-sheet-pill">Collection: '+esc(src.collection || 'Retention Accounts Collection')+'</span><span class="ret-sheet-pill">Last updated: '+esc(sheets().lastUpdated || (window.R && window.R.generatedAt) || '—')+'</span></div>'
    );
  }
  window.retFinSetFilter = function(key,value){
    window.RET_FIN_SHEET_FILTERS = Object.assign({month:'All',rm:'All',csm:'All',product:'All',accountStatus:'All',status:'All'}, window.RET_FIN_SHEET_FILTERS || {});
    window.RET_FIN_SHEET_FILTERS[key] = value || 'All';
    window.renderRetentionFinancialDetails();
  };
  window.retFinResetFilters = function(){
    window.RET_FIN_SHEET_FILTERS = {month:'All',rm:'All',csm:'All',product:'All',accountStatus:'All',status:'All'};
    window.renderRetentionFinancialDetails();
  };
  window.retFinToggleRows = function(bodyId,btn){
    var body = byId(bodyId);
    if(!body) return;
    var rows = Array.from(body.querySelectorAll('.ret-hidden'));
    var open = btn && btn.dataset.open === '1';
    rows.forEach(function(row){ row.style.display = open ? 'none' : 'table-row'; });
    if(btn){ btn.dataset.open = open ? '0' : '1'; btn.textContent = open ? '▼ Show more' : '▲ Show less'; }
  };
  function setToggle(id,count){ var btn = byId(id); if(btn){ btn.style.display = count > 10 ? 'block' : 'none'; btn.dataset.open = '0'; btn.textContent = '▼ Show more'; } }
  function exportRows(fileName, headers, rows){
    var lines = [headers].concat(rows).map(function(row){ return row.map(function(cell){ return '"' + String(cell == null ? '' : cell).replace(/"/g,'""') + '"'; }).join(','); }).join('\n');
    var blob = new Blob(['\ufeff'+lines],{type:'text/csv;charset=utf-8;'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a'); a.href = url; a.download = fileName + '.csv'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(url); },500);
  }
  function rawExportRow(row, month, product){ return [clientOf(row), gidOf(row), rmOf(row), csmOf(row), productOf(row), renewalMonth(row), bookingMonth(row), collectionMonth(row), Math.round(renewalValue(row,month,product)), Math.round(valueFor(row,'booked',month,product)), Math.round(valueFor(row,'cash',month,product)), Math.round(bookedNotCash(row,month,product)), accountStatusLabel(row), renewalStatus(row)]; }
  window.retFinExport = function(kind, status){
    var f = filters(), month = f.month || 'All', product = f.product || 'All', rows = filteredAccounts();
    if(kind === 'booked'){
      var booked = financialEntries(rows,'booked',month,product);
      exportRows('retention-booked-this-year',['Client','GID','RM 2026','CSM','Product','Booking Month','Booked','Booked Not Cash','Account Status','Renewal Status'], booked.map(function(e){ var r = e.row || {}; return [clientOf(r),gidOf(r),rmOf(r),csmOf(r),e.product,e.month,Math.round(e.value),Math.round(bookedNotCash(r,month,product)),accountStatusLabel(r),renewalStatus(r)]; })); return;
    }
    if(kind === 'cash'){
      var cash = financialEntries(rows,'cash',month,product);
      exportRows('retention-cash-collected-this-year',['Client','GID','RM 2026','CSM','Product','Collection Month','Cash Collected','Booked Not Cash','Account Status','Renewal Status'], cash.map(function(e){ var r = e.row || {}; return [clientOf(r),gidOf(r),rmOf(r),csmOf(r),e.product,e.month,Math.round(e.value),Math.round(bookedNotCash(r,month,product)),accountStatusLabel(r),renewalStatus(r)]; })); return;
    }
    if(kind === 'owners'){
      var owners = ownerSummary(rows, month, product);
      exportRows('retention-owner-financial-summary',['Owner','Role','Accounts','Renewal','Booked','Cash Collected','Booked Not Cash'], owners.map(function(o){ return [o.name,o.role,o.accountCount,Math.round(o.renewal),Math.round(o.booked),Math.round(o.collected),Math.round(o.remaining)]; })); return;
    }
    if(kind === 'status' && status) rows = rows.filter(function(row){ return renewalStatus(row) === status; });
    exportRows('retention-'+kind+(status?'-'+status.toLowerCase().replace(/[^a-z0-9]+/g,'-'):''), ['Client','GID','RM 2026','CSM','Product','Renewal Month','Booking Month','Collection Month','Renewal Value','Booked','Cash Collected','Booked Not Cash','Account Status','Renewal Status'], rows.map(function(row){ return rawExportRow(row,month,product); }));
  };
  function topTotals(rows, month, product){
    var s = summary();
    if(filtersAreDefault()){
      return {
        renewal:num(s.totalRenewalValue || sheets().renewalValue),
        booked:num(s.totalBookedValue || s.totalBookingSheetValue || sheets().bookedValue || sheets().bookingSheetValue),
        cash:num(s.totalCollectedValue || sheets().collectedValue),
        remaining:num(s.remainingCollection || s.totalBookedNotCashValue || sheets().remainingCollection || sheets().bookedNotCashValue),
        delayed:num(s.delayedAccounts),
        late:num(s.renewedLateAccounts),
        accounts:num(s.totalAccounts) || rows.length,
        bookedRows:num(s.bookedAccounts || s.bookingSheetAccounts) || financialEntries(rows,'booked',month,product).length,
        cashRows:num(s.collectedAccounts) || financialEntries(rows,'cash',month,product).length
      };
    }
    var bookedEntries = financialEntries(rows,'booked',month,product);
    var cashEntries = financialEntries(rows,'cash',month,product);
    var booked = bookedEntries.reduce(function(sum,e){ return sum + num(e.value); },0);
    var cash = cashEntries.reduce(function(sum,e){ return sum + num(e.value); },0);
    return {
      renewal:rows.reduce(function(sum,row){ return sum + renewalValue(row,month,product); },0),
      booked:booked,
      cash:cash,
      remaining:Math.max(booked - cash, 0),
      delayed:rows.filter(function(row){ return renewalStatus(row) === 'Delayed' && !finalLost(row); }).length,
      late:rows.filter(function(row){ return renewalStatus(row) === 'Renewed Late'; }).length,
      accounts:rows.length,
      bookedRows:bookedEntries.length,
      cashRows:cashEntries.length
    };
  }
  function renderTopCards(rows){
    var f = filters(), month = f.month || 'All', product = f.product || 'All';
    var t = topTotals(rows, month, product);
    var cards = [
      {k:'renewal',v:money(t.renewal),l:'Renewal Value',s:t.accounts.toLocaleString()+' accounts · '+monthLabel(month),c:'var(--cyan)',i:'💎'},
      {k:'booked',v:money(t.booked),l:'Booked Value',s:t.bookedRows.toLocaleString()+' rows · This Year',c:'var(--purple)',i:'📝'},
      {k:'cash',v:money(t.cash),l:'Cash Collected',s:t.cashRows.toLocaleString()+' rows · This Year',c:'var(--green)',i:'💵'},
      {k:'remaining',v:money(t.remaining),l:'Booked Not Cash',s:monthLabel(month),c:'var(--blue)',i:'⏳'},
      {k:'delayed',v:t.delayed.toLocaleString(),l:'Delayed Accounts',s:'Excludes Lost / Lost From 2025',c:'var(--red)',i:'🚨'},
      {k:'late',v:t.late.toLocaleString(),l:'Renewed Late',s:'Booking after renewal month',c:'var(--amber)',i:'⚠️'}
    ];
    setHtml('retFinTopGrid', cards.map(function(card){ return '<div class="ret-fin-card ret-click-card" style="--fc:'+card.c+'" onclick="openRetFinSheetDetails(\''+card.k+'\')" title="Click to open account list"><div class="ret-fin-card-icon">'+card.i+'</div><div class="ret-fin-card-v">'+card.v+'</div><div class="ret-fin-card-l">'+card.l+'</div><div class="ret-fin-card-s">'+card.s+'</div></div>'; }).join(''));
  }
  function ownerSummary(rows, month, product){
    var map = {};
    rows.forEach(function(row){
      [['RM',rmOf(row)],['CSM',csmOf(row)]].forEach(function(pair){
        var role = pair[0], name = pair[1];
        if(!name) return;
        var key = role + '|' + name;
        if(!map[key]) map[key] = {role:role,name:name,accounts:{},renewal:0,booked:0,collected:0,remaining:0};
        map[key].accounts[norm(clientOf(row))+'|'+gidOf(row)] = true;
        map[key].renewal += renewalValue(row, month, product);
        map[key].booked += valueFor(row,'booked',month,product);
        map[key].collected += valueFor(row,'cash',month,product);
      });
    });
    return Object.keys(map).map(function(k){
      var o = map[k];
      o.accountCount = Object.keys(o.accounts).length;
      o.remaining = Math.max(o.booked - o.collected, 0);
      return o;
    }).sort(function(a,b){ return (a.role === b.role ? 0 : a.role === 'RM' ? -1 : 1) || b.renewal - a.renewal; });
  }
  function ensureOwnerExportButton(){
    var badge = byId('retFinOwnerBadge');
    if(badge && badge.parentNode && !byId('export-owner-v62')){
      var btn = document.createElement('button');
      btn.id = 'export-owner-v62'; btn.className = 'ret-export-btn'; btn.type = 'button'; btn.textContent = 'Export Excel';
      btn.onclick = function(e){ e.stopPropagation(); retFinExport('owners'); };
      badge.parentNode.appendChild(btn);
    }
  }
  function renderOwnerSummary(rows){
    var f = filters(), month = f.month || 'All', product = f.product || 'All';
    var owners = ownerSummary(rows, month, product);
    var head = ['Owner','Role','Accounts','Renewal','Booked','Cash Collected','Booked Not Cash'];
    setText('retFinOwnerBadge', owners.length.toLocaleString() + ' owners · ' + monthLabel(month));
    ensureOwnerExportButton();
    setHtml('retFinOwnerGrid', head.map(function(h){ return '<div class="ret-fin-owner-cell ret-fin-owner-head">'+esc(h)+'</div>'; }).join('') + (owners.length ? owners.map(function(o){
      return '<div class="ret-fin-owner-cell"><div class="ret-fin-owner-name"><span class="ret-fin-dot" style="--oc:'+(o.role==='RM'?'var(--blue)':'var(--cyan)')+'"></span>'+esc(o.name)+'</div></div>'+
        '<div class="ret-fin-owner-cell"><span class="ret">'+esc(o.role)+'</span></div>'+
        '<div class="ret-fin-owner-cell" style="font-family:var(--mono);font-weight:900">'+o.accountCount.toLocaleString()+'</div>'+
        '<div class="ret-fin-owner-cell" style="font-family:var(--mono);font-weight:900;color:var(--cyan)">'+money(o.renewal)+'</div>'+
        '<div class="ret-fin-owner-cell" style="font-family:var(--mono);font-weight:900;color:var(--purple)">'+money(o.booked)+'</div>'+
        '<div class="ret-fin-owner-cell" style="font-family:var(--mono);font-weight:900;color:var(--green)">'+money(o.collected)+'</div>'+
        '<div class="ret-fin-owner-cell" style="font-family:var(--mono);font-weight:900;color:var(--blue)">'+money(o.remaining)+'</div>';
    }).join('') : '<div class="ret-fin-empty" style="grid-column:1/-1">No RM/CSM values found after filters.</div>'));
  }
  function bookedEntryRow(entry,index,month,product){
    var row = entry.row || {};
    return '<tr class="'+rowClass(index)+'"><td>'+clientCell(row)+'</td><td>'+esc(rmOf(row)||'—')+'</td><td>'+esc(csmOf(row)||'—')+'</td><td class="c">'+esc(entry.product || productOf(row))+'</td><td class="c">'+esc(entry.month || (month==='All'?bookingMonth(row):month))+'</td><td class="c">'+cellMoney(entry.value,'var(--purple)')+'</td><td class="c">'+cellMoney(bookedNotCash(row,month,product),'var(--blue)')+'</td><td class="c">'+badge(fullStatus(row))+'</td></tr>';
  }
  function cashEntryRow(entry,index,month,product){
    var row = entry.row || {};
    return '<tr class="'+rowClass(index)+'"><td>'+clientCell(row)+'</td><td>'+esc(rmOf(row)||'—')+'</td><td>'+esc(csmOf(row)||'—')+'</td><td class="c">'+esc(entry.product || productOf(row))+'</td><td class="c">'+esc(entry.month || (month==='All'?collectionMonth(row):month))+'</td><td class="c">'+cellMoney(entry.value,'var(--green)')+'</td><td class="c">'+cellMoney(bookedNotCash(row,month,product),'var(--blue)')+'</td><td class="c">'+badge(fullStatus(row))+'</td></tr>';
  }
  function ensureExportButton(anchorId,kind,status){
    var anchor = byId(anchorId);
    if(!anchor || !anchor.parentNode) return;
    var id = 'export-v62-'+kind+(status?'-'+String(status).replace(/[^a-z0-9]+/gi,'-'):'');
    if(byId(id)) return;
    var btn = document.createElement('button'); btn.id = id; btn.className = 'ret-export-btn'; btn.type = 'button'; btn.textContent = 'Export Excel';
    btn.onclick = function(e){ e.stopPropagation(); retFinExport(kind,status); };
    anchor.parentNode.appendChild(btn);
  }
  function renderBookedCash(rows){
    var f = filters(), month = f.month || 'All', product = f.product || 'All';
    var booked = financialEntries(rows,'booked',month,product);
    var cash = financialEntries(rows,'cash',month,product);
    var bookedTotal = booked.reduce(function(s,e){ return s + num(e.value); },0);
    var cashTotal = cash.reduce(function(s,e){ return s + num(e.value); },0);
    if(filtersAreDefault()){
      var s = summary();
      bookedTotal = num(s.totalBookedValue || s.totalBookingSheetValue || bookedTotal);
      cashTotal = num(s.totalCollectedValue || cashTotal);
    }
    setText('retFinBookedBadge', booked.length.toLocaleString() + ' · ' + money(bookedTotal));
    setText('retFinCashedBadge', cash.length.toLocaleString() + ' · ' + money(cashTotal));
    ensureExportButton('retFinBookedBadge','booked');
    ensureExportButton('retFinCashedBadge','cash');
    setHtml('retFinBookedBody', booked.length ? booked.map(function(entry,i){ return bookedEntryRow(entry,i,month,product); }).join('') : empty(8,'No booked rows found for the selected filters.'));
    setHtml('retFinCashedBody', cash.length ? cash.map(function(entry,i){ return cashEntryRow(entry,i,month,product); }).join('') : empty(8,'No cash collected rows found for the selected filters.'));
    setToggle('retFinBookedToggle', booked.length);
    setToggle('retFinCashedToggle', cash.length);
  }
  function statusRow(row,index,month,product){
    return '<tr class="'+rowClass(index)+'"><td>'+clientCell(row)+'</td><td>'+esc(rmOf(row)||'—')+'</td><td>'+esc(csmOf(row)||'—')+'</td><td class="c">'+esc(productOf(row))+'</td><td class="c">'+esc(renewalMonth(row))+'</td><td class="c">'+cellMoney(renewalValue(row,month,product),'var(--cyan)')+'</td><td class="c">'+cellMoney(valueFor(row,'booked',month,product),'var(--purple)')+'</td><td class="c">'+cellMoney(valueFor(row,'cash',month,product),'var(--green)')+'</td><td class="c">'+cellMoney(bookedNotCash(row,month,product),'var(--blue)')+'</td><td class="c">'+badge(accountStatusLabel(row))+'</td><td class="c">'+badge(renewalStatus(row))+'</td></tr>';
  }
  function statusColor(status){
    var s = norm(status);
    if(s === 'delayed' || s === 'lost' || s === 'lost from 2025') return 'var(--red)';
    if(s.indexOf('late') >= 0 || s.indexOf('pending') >= 0) return 'var(--amber)';
    if(s.indexOf('renewed') >= 0 || s.indexOf('cash') >= 0) return 'var(--green)';
    if(s.indexOf('upcoming') >= 0 || s.indexOf('no renewal') >= 0) return 'var(--blue)';
    return 'var(--purple)';
  }
  function renderStatusSplit(rows){
    var f = filters(), month = f.month || 'All', product = f.product || 'All';
    var grouped = {};
    rows.forEach(function(row){ var st = renewalStatus(row); if(!grouped[st]) grouped[st] = []; grouped[st].push(row); });
    var order = ['Renewed On Time','Renewed Late','Delayed','Upcoming','Booked Pending Collection','Partially Cashed','Cashed','Renewed','No Renewal Month','Lost From 2025','Lost'];
    Object.keys(grouped).forEach(function(st){ if(order.indexOf(st) < 0) order.push(st); });
    setText('retFinStatusBadge', rows.length.toLocaleString() + ' filtered accounts');
    var html = order.filter(function(st){ return grouped[st] && grouped[st].length; }).map(function(st,index){
      var list = grouped[st];
      var total = list.reduce(function(sum,row){ return sum + renewalValue(row,month,product); },0);
      var bodyId = 'retFinStatusBody'+index;
      var color = statusColor(st);
      var extra = list.length > 10 ? '<button class="ret-show-btn" onclick="retFinToggleRows(\''+bodyId+'\',this)">▼ Show more</button>' : '';
      return '<div class="ret-fin-subcard" data-ret-status-card="1" style="--sc:'+color+'"><div class="ret-fin-subhd"><div class="ret-fin-subtitle" style="color:'+color+'">📌 '+esc(st)+'</div><span class="badge '+statusClass(st)+'">'+list.length.toLocaleString()+' · '+money(total)+'</span></div><div class="ret-fin-mini-note">Filtered renewal status rows for this year.</div><div style="overflow-x:auto"><table class="tbl">'+tableHead(['Client','RM 2026','CSM',':Product',':Renewal Month',':Renewal Value',':Booked',':Cash Collected',':Booked Not Cash',':Account Status',':Renewal Status'])+'<tbody id="'+bodyId+'">'+list.map(function(row,i){ return statusRow(row,i,month,product); }).join('')+'</tbody></table></div><div style="display:flex;justify-content:flex-end;padding:8px 12px;border-top:1px solid var(--border)"><button class="ret-export-btn" onclick="retFinExport(\'status\','+JSON.stringify(st).replace(/"/g,'&quot;')+')">Export Excel</button></div>'+extra+'</div>';
    }).join('');
    setHtml('retFinStatusGrid', html || '<div class="ret-fin-empty" style="grid-column:1/-1">No renewal status rows found after filters.</div>');
  }
  window.openRetFinSheetDetails = function(kind){
    var f = filters(), month = f.month || 'All', product = f.product || 'All';
    var rows = filteredAccounts();
    var isBooked = kind === 'booked';
    var isCash = kind === 'cash' || kind === 'collected';
    var entries = [];
    if(isBooked) entries = financialEntries(rows,'booked',month,product);
    else if(isCash) entries = financialEntries(rows,'cash',month,product);
    else {
      if(kind === 'remaining') rows = rows.filter(function(row){ return bookedNotCash(row,month,product) > 0; });
      if(kind === 'delayed') rows = rows.filter(function(row){ return renewalStatus(row) === 'Delayed' && !finalLost(row); });
      if(kind === 'late') rows = rows.filter(function(row){ return renewalStatus(row) === 'Renewed Late'; });
      if(kind === 'renewal') rows = rows.filter(function(row){ return renewalValue(row,month,product) !== 0; });
    }
    var old = byId('retFinSheetDetailsBackdrop'); if(old) old.remove();
    var titleMap = {renewal:'Renewal Value Accounts',booked:'Booked Value Accounts',cash:'Cash Collected Accounts',collected:'Cash Collected Accounts',remaining:'Booked Not Cash Accounts',delayed:'Delayed Accounts',late:'Renewed Late Accounts'};
    var count = (isBooked || isCash) ? entries.length : rows.length;
    var body = '';
    if(isBooked){
      body = entries.length ? '<div style="overflow-x:auto"><table class="tbl">'+tableHead(['Client','RM 2026','CSM',':Product',':Booking Month',':Booked',':Booked Not Cash',':Account Status',':Renewal Status'])+'<tbody>'+entries.slice(0,150).map(function(e,i){ return bookedEntryRow(e,i,month,product).replace('class="ret-hidden"',''); }).join('')+'</tbody></table></div>'+(entries.length > 150 ? '<div class="ret-drill-empty" style="padding:12px">Showing first 150 of '+entries.length.toLocaleString()+' rows.</div>' : '') : '<div class="ret-drill-empty">No booked rows found for this card with the current filters.</div>';
    }else if(isCash){
      body = entries.length ? '<div style="overflow-x:auto"><table class="tbl">'+tableHead(['Client','RM 2026','CSM',':Product',':Collection Month',':Cash Collected',':Booked Not Cash',':Account Status',':Renewal Status'])+'<tbody>'+entries.slice(0,150).map(function(e,i){ return cashEntryRow(e,i,month,product).replace('class="ret-hidden"',''); }).join('')+'</tbody></table></div>'+(entries.length > 150 ? '<div class="ret-drill-empty" style="padding:12px">Showing first 150 of '+entries.length.toLocaleString()+' rows.</div>' : '') : '<div class="ret-drill-empty">No cash collected rows found for this card with the current filters.</div>';
    }else{
      body = rows.length ? '<div style="overflow-x:auto"><table class="tbl">'+tableHead(['Client','RM 2026','CSM',':Product',':Renewal Month',':Renewal Value',':Booked',':Cash Collected',':Booked Not Cash',':Account Status',':Renewal Status'])+'<tbody>'+rows.slice(0,150).map(function(row,i){ return statusRow(row,i,month,product).replace('class="ret-hidden"',''); }).join('')+'</tbody></table></div>'+(rows.length > 150 ? '<div class="ret-drill-empty" style="padding:12px">Showing first 150 of '+rows.length.toLocaleString()+' rows.</div>' : '') : '<div class="ret-drill-empty">No accounts found for this card with the current filters.</div>';
    }
    var node = document.createElement('div');
    node.id = 'retFinSheetDetailsBackdrop'; node.className = 'acq-detail-backdrop';
    node.onclick = function(e){ if(e.target === node) node.remove(); };
    node.innerHTML = '<div class="acq-detail-card" style="border-top:4px solid var(--cyan)"><div class="acq-detail-hd"><div><div class="acq-detail-title">'+esc(titleMap[kind] || 'Retention Financial Details')+' <span class="badge bb" style="margin-left:8px">'+count.toLocaleString()+' rows</span></div><div class="acq-detail-sub">Month: '+esc(monthLabel(month))+' · Product: '+esc(product)+' · RM: '+esc(f.rm||'All')+' · CSM: '+esc(f.csm||'All')+' · Account Status: '+esc(f.accountStatus||'All')+'</div></div><button class="acq-detail-close" onclick="document.getElementById(\'retFinSheetDetailsBackdrop\')?.remove()">×</button></div><div class="acq-detail-body">'+body+'</div></div>';
    document.body.appendChild(node);
  };
  function updateSidebarBadge(allRows){
    var badge = document.querySelector('#side-ret-financial .nav-badge');
    if(!badge) return;
    var s = summary();
    var booked = num(s.bookedAccounts || s.bookingSheetAccounts) || financialEntries(allRows,'booked','All','All').length;
    var cash = num(s.collectedAccounts) || financialEntries(allRows,'cash','All','All').length;
    badge.textContent = booked + '/' + cash;
    badge.title = 'Booked rows / Cash collected rows';
  }
  window.renderRetentionFinancialDetails = function(){
    if(document.body) document.body.classList.add('retention-financial-wide');
    ensureLayout();
    var auditBoardAfterLayout = byId('retFinAuditBoard');
    if(auditBoardAfterLayout) auditBoardAfterLayout.remove();
    var all = allAccounts();
    renderFilters(all);
    updateSidebarBadge(all);
    var rows = filteredAccounts();
    if(!all.length){
      setHtml('retFinTopGrid','<div class="ret-fin-card" style="--fc:var(--red);grid-column:1/-1"><div class="ret-fin-card-v">No Data</div><div class="ret-fin-card-l">Retention financial source is empty</div><div class="ret-fin-card-s">Run the retention n8n workflow and make sure Supabase retention views contains retentionSheets2026.accounts.</div></div>');
      setHtml('retFinOwnerGrid','<div class="ret-fin-empty" style="grid-column:1/-1">No owner summary because retention financial data is empty.</div>');
      setHtml('retFinBookedBody',empty(8,'No booked rows found.'));
      setHtml('retFinCashedBody',empty(8,'No cash collected rows found.'));
      setHtml('retFinStatusGrid','<div class="ret-fin-empty" style="grid-column:1/-1">No status rows found.</div>');
      return;
    }
    renderTopCards(rows);
    renderOwnerSummary(rows);
    renderBookedCash(rows);
    renderStatusSplit(rows);
    var topbarSub = byId('topbarSub');
    if(topbarSub && window.APP_MAIN_PANEL === 'retention' && window.APP_RETENTION_VIEW === 'financial'){
      topbarSub.textContent = 'Budget + Booking + Collection · source totals from retentionSheets2026.summary · no cached HubSpot financial rows';
    }
    if(window.console && console.info){
      var f = filters(), t = topTotals(rows, f.month || 'All', f.product || 'All');
      console.info('[Retention Financial v62]', {source:'retentionSheets2026.summary + accounts only', filters:f, topCards:t, rows:rows.length});
    }
  };
  var previousSwitchRetentionFinancial = window.switchRetentionFinancial;
  window.switchRetentionFinancial = function(){
    if(typeof previousSwitchRetentionFinancial === 'function') previousSwitchRetentionFinancial.apply(this, arguments);
    window.APP_MAIN_PANEL = 'retention';
    window.APP_RETENTION_VIEW = 'financial';
    setTimeout(window.renderRetentionFinancialDetails, 0);
  };
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ if(window.APP_MAIN_PANEL === 'retention' && window.APP_RETENTION_VIEW === 'financial') window.renderRetentionFinancialDetails(); });
  }else{
    setTimeout(function(){ if(window.APP_MAIN_PANEL === 'retention' && window.APP_RETENTION_VIEW === 'financial') window.renderRetentionFinancialDetails(); },0);
  }
})();
