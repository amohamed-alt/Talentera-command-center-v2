(function(){
  if(window.__RETENTION_FINANCIAL_CLEAN_V57__) return;
  window.__RETENTION_FINANCIAL_CLEAN_V57__ = true;
  window.DASHBOARD_CLEAN_VERSION = 'retention-financial-clean-v59';

  var MONTHS = [
    {key:'All',label:'All Months',i:0},
    {key:'Jan',label:'January',i:1},{key:'Feb',label:'February',i:2},{key:'Mar',label:'March',i:3},{key:'Apr',label:'April',i:4},
    {key:'May',label:'May',i:5},{key:'Jun',label:'June',i:6},{key:'Jul',label:'July',i:7},{key:'Aug',label:'August',i:8},
    {key:'Sep',label:'September',i:9},{key:'Oct',label:'October',i:10},{key:'Nov',label:'November',i:11},{key:'Dec',label:'December',i:12}
  ];

  window.RET_FIN_SHEET_FILTERS = Object.assign(
    {month:'All',rm:'All',csm:'All',product:'All',accountStatus:'All',status:'All'},
    window.RET_FIN_SHEET_FILTERS || {}
  );

  function byId(id){ return document.getElementById(id); }
  function arr(v){ return Array.isArray(v) ? v : []; }
  function txt(v){ return String(v == null ? '' : v).trim(); }
  function norm(v){ return txt(v).toLowerCase().replace(/\s+/g,' '); }
  function esc(v){ return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
  function num(v){
    if(v == null || v === '') return 0;
    if(typeof v === 'number') return Number.isFinite(v) ? v : 0;
    var n = Number(String(v).replace(/[^0-9.-]/g,''));
    return Number.isFinite(n) ? n : 0;
  }
  function money(v){ return '$' + Math.round(num(v)).toLocaleString('en-US'); }
  function monthLabel(key){ var m = MONTHS.find(function(x){ return x.key === key; }); return m ? m.label : (key || 'All Months'); }
  function monthKey(raw){
    var v = norm(raw);
    if(!v) return '';
    var found = MONTHS.find(function(m){ return norm(m.key) === v || norm(m.label) === v; });
    return found ? found.key : txt(raw);
  }
  function monthIndexFromValue(raw){
    var k = monthKey(raw);
    var found = MONTHS.find(function(m){ return m.key === k; });
    return found ? found.i : 0;
  }
  function currentRiyadhMonthIndex(){
    var d = new Date(Date.now() + 3 * 60 * 60 * 1000);
    return d.getUTCMonth() + 1;
  }
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
  function filters(){
    window.RET_FIN_SHEET_FILTERS = Object.assign(
      {month:'All',rm:'All',csm:'All',product:'All',accountStatus:'All',status:'All'},
      window.RET_FIN_SHEET_FILTERS || {}
    );
    return window.RET_FIN_SHEET_FILTERS;
  }
  function productOf(row){ return txt(first(row,['product','Product','productName','sheetProduct','solution'])) || 'Unknown'; }
  function rmOf(row){ return txt(first(row,['rm','rm2026','RM 2026','RM','rmOwnerName','ownerName','retentionOwner','owner'])); }
  function csmOf(row){ return txt(first(row,['csm','csmName','CSM Name','CSM','csmOwnerName','customerSuccessManager'])); }
  function clientOf(row){ return txt(first(row,['clientName','client','Client','companyName','company','name','dealName','accountName'])) || 'Unknown Client'; }
  function gidOf(row){ return txt(first(row,['cleanGid','gid','GID','companyId','company_id','hs_object_id','id'])); }
  function urlOf(row){ return txt(first(row,['companyUrl','hubspotUrl','url','recordUrl'])); }
  function accountStatusLabel(row){
    var s = norm(first(row,['accountStatusForFilter','accountStatusLabel','budgetStatusLabel','budgetStatusRaw','renewalStatusFromSheet','statusAbdullah','abdullahStatus','Status Abdullah','status Abdullah','Account Status','accountStatus','account_status','budgetStatus','status']));
    if(!s) return 'Active';
    if(s === 'lost') return 'Lost';
    if(s === 'lost from 2025' || s === 'lost from 25' || s === 'lost 2025') return 'Lost From 2025';
    if(s === 'expected to be lost' || s === 'expected be lost' || s === 'expected lost') return 'Expected To Be Lost';
    if(s === 'active') return 'Active';
    return txt(first(row,['accountStatusForFilter','accountStatusLabel','budgetStatusLabel','budgetStatusRaw','renewalStatusFromSheet','statusAbdullah','abdullahStatus','Status Abdullah','Account Status','accountStatus','status'])) || 'Active';
  }
  function nestedMonthProduct(map, month, product){
    if(!map) return 0;
    if(month && month !== 'All'){
      var bucket = map[month] || map[monthLabel(month)] || map[month.toLowerCase && month.toLowerCase()] || {};
      if(typeof bucket === 'number' || typeof bucket === 'string') return num(bucket);
      if(product && product !== 'All') return num(bucket[product]);
      return Object.keys(bucket || {}).reduce(function(sum,key){ return sum + num(bucket[key]); },0);
    }
    return Object.keys(map || {}).reduce(function(total,mkey){
      var bucket = map[mkey];
      if(typeof bucket === 'number' || typeof bucket === 'string') return total + num(bucket);
      if(product && product !== 'All') return total + num(bucket && bucket[product]);
      return total + Object.keys(bucket || {}).reduce(function(sum,key){ return sum + num(bucket[key]); },0);
    },0);
  }
  function bookingValue(row, month, product){
    var v = nestedMonthProduct(first(row,['bookingByMonth']) || row.bookingByMonth, month, product);
    if(v !== 0) return v;
    if((!month || month === 'All') && (!product || product === 'All')){
      return num(first(row,['bookingSheetValue','bookedValue','totalBookedValue','bookingValue','bookedAmount','booked','Booked']));
    }
    if(month && month !== 'All'){
      var bm = monthKey(first(row,['bookingMonth','Booking Month']));
      if(bm === month && (!product || product === 'All' || productOf(row) === product)){
        return num(first(row,['bookingSheetValue','bookedValue','bookingValue','bookedAmount','booked','Booked']));
      }
    }
    return 0;
  }
  function collectionValue(row, month, product){
    var v = nestedMonthProduct(first(row,['collectionByMonth']) || row.collectionByMonth, month, product);
    if(v !== 0) return v;
    if((!month || month === 'All') && (!product || product === 'All')){
      return num(first(row,['collectedValue','totalCollectedValue','collectionValue','cashedValue','cashCollected','Collected']));
    }
    if(month && month !== 'All'){
      var cm = monthKey(first(row,['collectionMonth','Collection Month','cashMonth']));
      if(cm === month && (!product || product === 'All' || productOf(row) === product)){
        return num(first(row,['collectedValue','collectionValue','cashedValue','cashCollected','Collected']));
      }
    }
    return 0;
  }
  function renewalValue(row, month, product){
    if(product && product !== 'All' && productOf(row) !== product) return 0;
    var rm = monthKey(first(row,['renewalMonth','Renewal Month','contractRenewalMonth','month']));
    if(month && month !== 'All' && rm && rm !== month) return 0;
    return num(first(row,['renewalValue2026','renewalValue','Renewal Value','renewal_value','amount']));
  }
  function bookedNotCash(row, month, product){ return bookingValue(row,month,product) - collectionValue(row,month,product); }
  function renewalMonth(row){ return monthKey(first(row,['renewalMonth','Renewal Month','contractRenewalMonth','month'])) || '—'; }
  function bookingMonth(row){ return monthKey(first(row,['bookingMonth','Booking Month'])) || '—'; }
  function collectionMonth(row){ return monthKey(first(row,['collectionMonth','Collection Month','cashMonth'])) || '—'; }
  function monthIndex(row, indexField, monthField){
    var n = num(first(row,[indexField]));
    if(n > 0) return n;
    return monthIndexFromValue(first(row,[monthField]));
  }
  function renewalStatus(row){
    var existing = norm(first(row,['calculatedRenewalStatus','renewalStatus','renewal_status','calculated_status','Calculated Renewal Status']));
    if(existing){
      if(existing.indexOf('renewed on time') >= 0) return 'Renewed On Time';
      if(existing.indexOf('renewed late') >= 0 || existing === 'late') return 'Renewed Late';
      if(existing.indexOf('delayed') >= 0) return 'Delayed';
      if(existing.indexOf('upcoming') >= 0) return 'Upcoming';
      if(existing.indexOf('no renewal month') >= 0) return 'No Renewal Month';
      if(existing.indexOf('booked') >= 0 && existing.indexOf('pending') >= 0) return 'Booked Pending Collection';
      if(existing.indexOf('cash') >= 0 || existing.indexOf('cashed') >= 0) return 'Cashed';
      if(existing.indexOf('renewed') >= 0) return 'Renewed';
    }

    var acc = accountStatusLabel(row);
    if(acc === 'Lost' || acc === 'Lost From 2025') return acc;

    var b = monthIndex(row,'bookingMonthIndex','bookingMonth');
    var c = monthIndex(row,'collectionMonthIndex','collectionMonth');
    var r = monthIndex(row,'renewalMonthIndex','renewalMonth');
    var hasBooked = bookingValue(row,'All','All') !== 0;
    var hasCollected = collectionValue(row,'All','All') !== 0;
    var proof = 0;

    if(hasBooked && b) proof = b;
    if(hasCollected && c) proof = proof ? Math.min(proof,c) : c;

    if(proof && r) return proof > r ? 'Renewed Late' : 'Renewed On Time';
    if(hasBooked && !hasCollected) return 'Booked Pending Collection';
    if(hasCollected) return 'Cashed';
    if(proof) return 'Renewed';
    if(r) return currentRiyadhMonthIndex() > r ? 'Delayed' : 'Upcoming';
    return 'No Renewal Month';
  }
  function fullStatus(row){
    var acc = accountStatusLabel(row);
    var st = renewalStatus(row);
    return acc === 'Expected To Be Lost' ? acc + ' · ' + st : st;
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
  function clientCell(row){
    var bits = [];
    var gid = gidOf(row);
    if(gid) bits.push('GID ' + gid);
    if(first(row,['notInBudget2026']) || first(row,['budgetNote'])) bits.push(txt(first(row,['budgetNote'])) || 'Not in Budget 2026');
    var name = clientOf(row);
    var link = urlOf(row) ? '<a class="record-link" href="'+esc(urlOf(row))+'" target="_blank" rel="noopener">'+esc(name)+'</a>' : esc(name);
    return '<div style="font-weight:900">'+link+'</div>' + (bits.length ? '<div style="font-size:10px;color:var(--muted);margin-top:2px">'+esc(bits.join(' · '))+'</div>' : '');
  }
  function allAccounts(){
    var s = sheets();
    var rows = arr(s.accounts).concat(arr(s.sheetOnlyNotInBudgetAccounts));
    var seen = {};
    return rows.filter(function(row){
      var key = [gidOf(row),clientOf(row),productOf(row),renewalMonth(row),bookingMonth(row),collectionMonth(row),num(first(row,['renewalValue2026','renewalValue','amount'])),num(first(row,['bookedValue','bookingSheetValue'])),num(first(row,['collectedValue']))].join('|');
      if(seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }
  function unique(rows, fn){
    var seen = {};
    return rows.map(fn).filter(function(v){
      v = txt(v);
      if(!v || seen[v]) return false;
      seen[v] = true;
      return true;
    }).sort(function(a,b){ return String(a).localeCompare(String(b)); });
  }
  function productMatches(row, product){
    if(!product || product === 'All') return true;
    if(productOf(row) === product) return true;
    if(renewalValue(row,'All',product) !== 0) return true;
    if(financialEntries([row],'booked','All',product).length) return true;
    if(financialEntries([row],'cash','All',product).length) return true;
    return false;
  }
  function passMonth(row, month, product){
    if(!month || month === 'All') return true;
    if(renewalValue(row,month,product) !== 0) return true;
    if(financialEntries([row],'booked',month,product).length) return true;
    if(financialEntries([row],'cash',month,product).length) return true;
    if(renewalMonth(row) === month && productMatches(row,product)) return true;
    if(bookingMonth(row) === month && productMatches(row,product)) return true;
    if(collectionMonth(row) === month && productMatches(row,product)) return true;
    return false;
  }
  function filteredAccounts(){
    var f = filters();
    var product = f.product || 'All';
    var month = f.month || 'All';
    return allAccounts().filter(function(row){
      if(f.rm && f.rm !== 'All' && rmOf(row) !== f.rm) return false;
      if(f.csm && f.csm !== 'All' && csmOf(row) !== f.csm) return false;
      if(f.accountStatus && f.accountStatus !== 'All' && accountStatusLabel(row) !== f.accountStatus) return false;
      if(!productMatches(row, product)) return false;
      if(!passMonth(row, month, product)) return false;
      return true;
    });
  }
  function financialKindValue(row, kind, month, product){
    return kind === 'cash' ? collectionValue(row, month, product) : bookingValue(row, month, product);
  }
  function financialKindMonth(row, kind, month){
    if(month && month !== 'All') return month;
    return kind === 'cash' ? collectionMonth(row) : bookingMonth(row);
  }
  function asObject(value){
    if(!value) return null;
    if(typeof value === 'object') return value;
    if(typeof value === 'string'){
      try{
        var parsed = JSON.parse(value);
        return parsed && typeof parsed === 'object' ? parsed : null;
      }catch(e){
        return null;
      }
    }
    return null;
  }
  function financialMap(row, kind){
    var raw = kind === 'cash'
      ? (first(row,['collectionByMonth','cashByMonth','collectedByMonth']) || row.collectionByMonth || row.cashByMonth || row.collectedByMonth)
      : (first(row,['bookingByMonth','bookedByMonth']) || row.bookingByMonth || row.bookedByMonth);
    return asObject(raw);
  }
  function financialSourceId(row, kind){
    return txt(first(row, kind === 'cash'
      ? ['collectionSourceId','collectionRowId','collectionSheetRowId','collectionKey','cashSourceId','cashRowId','sourceCollectionRowId','sourceRowId']
      : ['bookingSourceId','bookingRowId','bookingSheetRowId','bookingKey','bookedSourceId','bookedRowId','sourceBookingRowId','sourceRowId']
    ));
  }
  function financialEntryKey(entry){
    var row = entry.row || {};
    var source = financialSourceId(row, entry.kind);
    var accountKey = source || norm(gidOf(row) || clientOf(row));
    var valueKey = String(Math.round(num(entry.value) * 100) / 100);
    return [entry.kind, accountKey, norm(entry.product || productOf(row)), norm(entry.month || ''), valueKey].join('|');
  }
  function financialEntries(rows, kind, month, product){
    var selectedMonth = month || 'All';
    var selectedProduct = product || 'All';
    var entries = [];
    arr(rows).forEach(function(row){
      var map = financialMap(row, kind);
      if(map){
        Object.keys(map).forEach(function(rawMonth){
          var m = monthKey(rawMonth) || rawMonth;
          if(selectedMonth !== 'All' && m !== selectedMonth) return;
          var bucket = map[rawMonth];
          if(typeof bucket === 'number' || typeof bucket === 'string'){
            var derivedProduct = productOf(row);
            if(selectedProduct !== 'All' && derivedProduct !== selectedProduct) return;
            var directValue = num(bucket);
            if(directValue !== 0) entries.push({kind:kind,row:row,month:m,product:derivedProduct,value:directValue});
            return;
          }
          bucket = asObject(bucket) || {};
          Object.keys(bucket).forEach(function(rawProduct){
            var p = txt(rawProduct) || productOf(row);
            if(selectedProduct !== 'All' && p !== selectedProduct) return;
            var value = num(bucket[rawProduct]);
            if(value !== 0) entries.push({kind:kind,row:row,month:m,product:p,value:value});
          });
        });
      }else{
        var derivedMonth = financialKindMonth(row, kind, selectedMonth);
        var derivedProduct = productOf(row);
        if(selectedMonth !== 'All' && derivedMonth !== selectedMonth) return;
        if(selectedProduct !== 'All' && derivedProduct !== selectedProduct) return;
        var derivedValue = financialKindValue(row, kind, selectedMonth, selectedProduct);
        if(derivedValue !== 0) entries.push({kind:kind,row:row,month:derivedMonth,product:derivedProduct,value:derivedValue});
      }
    });

    var seen = {};
    return entries.filter(function(entry){
      var key = financialEntryKey(entry);
      if(seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }
  function financialDedupKey(row, kind, month, product){
    return financialEntryKey({kind:kind,row:row,month:financialKindMonth(row,kind,month),product:(product && product !== 'All') ? product : productOf(row),value:financialKindValue(row,kind,month,product)});
  }
  function uniqueFinancialRows(rows, kind, month, product){
    var seen = {};
    return rows.filter(function(row){
      var entries = financialEntries([row], kind, month, product);
      if(!entries.length) return false;
      var keep = false;
      entries.forEach(function(entry){
        var key = financialEntryKey(entry);
        if(!seen[key]){
          seen[key] = true;
          keep = true;
        }
      });
      return keep;
    });
  }
  function rowClass(index){ return index >= 10 ? 'ret-hidden' : ''; }
  function empty(cols,msg){ return '<tr><td colspan="'+cols+'" class="ret-fin-empty">'+esc(msg)+'</td></tr>'; }
  function cellMoney(value,color){ return '<span style="font-family:var(--mono);font-weight:900;color:'+color+'">'+money(value)+'</span>'; }
  function tableHead(headers){
    return '<thead><tr>' + headers.map(function(h){
      var c = h.charAt(0) === ':';
      return '<th'+(c?' class="c"':'')+'>'+esc(c?h.slice(1):h)+'</th>';
    }).join('') + '</tr></thead>';
  }
  function setHtml(id, html){ var el = byId(id); if(el) el.innerHTML = html; }
  function setText(id, value){ var el = byId(id); if(el) el.textContent = value; }

  function ensureStyle(){
    if(byId('retFinCleanV57Style')) return;
    var style = document.createElement('style');
    style.id = 'retFinCleanV57Style';
    style.textContent = [
      '#panel-retention-financial{max-width:none!important;width:100%!important;margin:0!important}',
      '#panel-retention-financial #retFinCleanLayout{display:block;width:100%}',
      '#panel-retention-financial .ret-fin-top-grid{grid-template-columns:repeat(6,minmax(0,1fr))!important}',
      '#panel-retention-financial .ret-fin-status-grid-clean{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;padding:14px}',
      '#panel-retention-financial .ret-fin-main-split{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;padding:14px;border-bottom:1px solid rgba(22,64,42,.08);margin:0!important}',
      '#panel-retention-financial .ret-fin-main-split .ret-fin-subcard{margin-bottom:0!important}',
      '#panel-retention-financial .ret-fin-subcard[data-ret-status-card]{margin-bottom:0!important}',
      '#panel-retention-financial .ret-hidden{display:none}',
      '#panel-retention-financial .ret-sheet-filter{margin-bottom:16px}',
      '#panel-retention-financial .ret-sheet-filter-left{gap:8px 10px}',
      '@media(max-width:1400px){#panel-retention-financial .ret-fin-top-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}}',
      '@media(max-width:900px){#panel-retention-financial .ret-fin-top-grid,#panel-retention-financial .ret-fin-status-grid-clean,#panel-retention-financial .ret-fin-main-split{grid-template-columns:1fr!important}}'
    ].join('');
    document.head.appendChild(style);
  }
  function ensureLayout(){
    var panel = byId('panel-retention-financial');
    if(!panel) return;
    ensureStyle();

    var hero = panel.querySelector('.ret-fin-hero');
    if(!hero){
      hero = document.createElement('div');
      hero.className = 'ret-fin-hero';
      panel.insertBefore(hero,panel.firstChild);
    }
    hero.innerHTML = '<div class="ret-fin-hero-icon">💰</div><div><div class="ret-fin-hero-title">Retention Financial Details</div><div class="ret-fin-hero-sub">A clean money view for Customer Success: Renewal value, booked value, cash collected, booked not cash, delayed accounts, and renewed late accounts for this year.</div></div>';

    if(byId('retFinCleanLayout')) return;

    while(hero.nextSibling) hero.nextSibling.remove();

    hero.insertAdjacentHTML('afterend',
      '<div id="retFinCleanLayout">'+
        '<div id="retFinSheetFilter" class="ret-sheet-filter"></div>'+
        '<div class="ret-fin-top-grid" id="retFinTopGrid"></div>'+
        '<div class="ret-fin-board" id="retFinOwnerBoard">'+
          '<div class="ret-fin-board-hd"><div><div class="ret-fin-board-title">📊 Owner Financial Summary</div><div class="ret-fin-mini-note" style="border:0;background:transparent;padding:4px 0 0">Renewal, booked, cash collected, and booked not cash by RM / CSM after the current filters.</div></div><span class="badge bb" id="retFinOwnerBadge">0 owners</span></div>'+
          '<div class="ret-fin-owner-grid" id="retFinOwnerGrid"></div>'+
        '</div>'+
        '<div class="ret-fin-board" id="retFinStatusBoard">'+
          '<div class="ret-fin-board-hd"><div><div class="ret-fin-board-title">📌 Renewal Status Split</div><div class="ret-fin-mini-note" style="border:0;background:transparent;padding:4px 0 0">Booked, cash collected, and renewal status movement for this year after the current filters.</div></div><span class="badge bb" id="retFinStatusBadge">0 accounts</span></div>'+
          '<div class="ret-fin-main-split">'+
            '<div class="ret-fin-subcard" style="--sc:var(--purple)">'+
              '<div class="ret-fin-subhd"><div class="ret-fin-subtitle" style="color:var(--purple)">📝 Booked This Year</div><span class="badge bp" id="retFinBookedBadge"></span></div>'+
              '<div class="ret-fin-mini-note">Booked value for this year after the current filters.</div>'+
              '<div style="overflow-x:auto"><table class="tbl" id="retFinBookedTable">'+tableHead(['Client','RM 2026','CSM',':Product',':Booking Month',':Booked',':Booked Not Cash',':Renewal Status'])+'<tbody id="retFinBookedBody"></tbody></table></div>'+
              '<button class="ret-show-btn" id="retFinBookedToggle" onclick="retFinToggleRows(\'retFinBookedBody\',this)">▼ Show more</button>'+
            '</div>'+
            '<div class="ret-fin-subcard" style="--sc:var(--green)">'+
              '<div class="ret-fin-subhd"><div class="ret-fin-subtitle" style="color:var(--green)">💵 Cash Collected This Year</div><span class="badge bg" id="retFinCashedBadge"></span></div>'+
              '<div class="ret-fin-mini-note">Cash collected for this year after the current filters.</div>'+
              '<div style="overflow-x:auto"><table class="tbl" id="retFinCashedTable">'+tableHead(['Client','RM 2026','CSM',':Product',':Collection Month',':Cash Collected',':Booked Not Cash',':Renewal Status'])+'<tbody id="retFinCashedBody"></tbody></table></div>'+
              '<button class="ret-show-btn" id="retFinCashedToggle" onclick="retFinToggleRows(\'retFinCashedBody\',this)">▼ Show more</button>'+
            '</div>'+
          '</div>'+
          '<div class="ret-fin-status-grid-clean" id="retFinStatusGrid"></div>'+
        '</div>'+
      '</div>'
    );
  }
  function optionHtml(value,label,selected){
    return '<option value="'+esc(value)+'"'+(value===selected?' selected':'')+'>'+esc(label || value)+'</option>';
  }
  function selectHtml(id,key,label,value,options){
    return '<span class="ret-sheet-label">'+esc(label)+'</span><select class="ret-sheet-select" id="'+esc(id)+'" data-ret-fin-filter-key="'+esc(key)+'">'+optionHtml('All','All',value)+options.map(function(o){ return optionHtml(o,o,value); }).join('')+'</select>';
  }
  function productOptions(rows){
    var values = {};
    rows.forEach(function(row){
      var p = productOf(row);
      if(p) values[p] = true;
      ['booked','cash'].forEach(function(kind){
        var map = financialMap(row,kind);
        Object.keys(map || {}).forEach(function(rawMonth){
          var bucket = map[rawMonth];
          if(bucket && typeof bucket === 'object'){
            Object.keys(bucket).forEach(function(rawProduct){
              var fp = txt(rawProduct);
              if(fp) values[fp] = true;
            });
          }
        });
      });
    });
    return Object.keys(values).sort(function(a,b){ return String(a).localeCompare(String(b)); });
  }
  function renderFilters(allRows){
    var f = filters();
    var monthOptions = MONTHS.filter(function(m){ return m.key !== 'All'; }).map(function(m){ return m.key; });
    var accountOptions = unique(allRows, accountStatusLabel);
    ['Active','Expected To Be Lost','Lost','Lost From 2025'].forEach(function(x){ if(accountOptions.indexOf(x) < 0) accountOptions.unshift(x); });
    accountOptions = unique(accountOptions,function(x){ return x; });
    var src = (sheets().sourceSheets || {});
    setHtml('retFinSheetFilter',
      '<div class="ret-sheet-filter-inner"><div class="ret-sheet-filter-left">'+
        selectHtml('retFinFilterMonth','month','Month',f.month || 'All',monthOptions)+
        selectHtml('retFinFilterRm','rm','RM 2026',f.rm || 'All',unique(allRows,rmOf))+
        selectHtml('retFinFilterCsm','csm','CSM',f.csm || 'All',unique(allRows,csmOf))+
        selectHtml('retFinFilterProduct','product','Product',f.product || 'All',productOptions(allRows))+
        selectHtml('retFinFilterAccountStatus','accountStatus','Account Status',f.accountStatus || 'All',accountOptions)+
        '<button class="ret-sheet-select" style="cursor:pointer;color:var(--red);min-width:auto" onclick="window.retFinResetFilters()">Reset</button>'+
        '<span class="ret-sheet-note">Filters apply to cards, owner summary, booked, cash collected, and all status sections.</span>'+
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
    if(btn){
      btn.dataset.open = open ? '0' : '1';
      btn.textContent = open ? '▼ Show more' : '▲ Show less';
    }
  };
  function exportRows(fileName, headers, rows){
    var lines = [headers].concat(rows).map(function(row){
      return row.map(function(cell){
        return '"' + String(cell == null ? '' : cell).replace(/"/g,'""') + '"';
      }).join(',');
    }).join('\n');
    var blob = new Blob(['\ufeff'+lines],{type:'text/csv;charset=utf-8;'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = fileName + '.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function(){ URL.revokeObjectURL(url); },500);
  }
  function rawExportRow(row, month, product){
    return [
      clientOf(row),
      gidOf(row),
      rmOf(row),
      csmOf(row),
      productOf(row),
      renewalMonth(row),
      bookingMonth(row),
      collectionMonth(row),
      Math.round(renewalValue(row,month,product)),
      Math.round(bookingValue(row,month,product)),
      Math.round(collectionValue(row,month,product)),
      Math.round(bookedNotCash(row,month,product)),
      accountStatusLabel(row),
      renewalStatus(row)
    ];
  }
  window.retFinExport = function(kind, status){
    var f = filters();
    var month = f.month || 'All';
    var product = f.product || 'All';
    var rows = filteredAccounts();

    if(kind === 'booked'){
      var bookedEntries = financialEntries(rows,'booked',month,product);
      exportRows('retention-booked-this-year', ['Client','GID','RM 2026','CSM','Product','Booking Month','Booked','Booked Not Cash','Account Status','Renewal Status'], bookedEntries.map(function(entry){
        var row = entry.row || {};
        return [clientOf(row),gidOf(row),rmOf(row),csmOf(row),entry.product,entry.month,Math.round(num(entry.value)),Math.round(entryBookedNotCash(entry,month,product)),accountStatusLabel(row),renewalStatus(row)];
      }));
      return;
    }
    if(kind === 'cash'){
      var cashEntries = financialEntries(rows,'cash',month,product);
      exportRows('retention-cash-collected-this-year', ['Client','GID','RM 2026','CSM','Product','Collection Month','Cash Collected','Booked Not Cash','Account Status','Renewal Status'], cashEntries.map(function(entry){
        var row = entry.row || {};
        return [clientOf(row),gidOf(row),rmOf(row),csmOf(row),entry.product,entry.month,Math.round(num(entry.value)),Math.round(entryBookedNotCash(entry,month,product)),accountStatusLabel(row),renewalStatus(row)];
      }));
      return;
    }
    if(kind === 'owners'){
      var owners = ownerSummary(rows,month,product);
      exportRows('retention-owner-financial-summary', ['Owner','Role','Accounts','Renewal','Booked','Cash Collected','Booked Not Cash'], owners.map(function(o){ return [o.name,o.role,o.accountCount,Math.round(o.renewal),Math.round(o.booked),Math.round(o.collected),Math.round(o.remaining)]; }));
      return;
    }
    if(kind === 'status' && status) rows = rows.filter(function(row){ return renewalStatus(row) === status; });

    exportRows('retention-'+kind+(status?'-'+status.toLowerCase().replace(/[^a-z0-9]+/g,'-'):''), ['Client','GID','RM 2026','CSM','Product','Renewal Month','Booking Month','Collection Month','Renewal Value','Booked','Cash Collected','Booked Not Cash','Account Status','Renewal Status'], rows.map(function(row){ return rawExportRow(row,month,product); }));
  };
  function renderTopCards(rows){
    var f = filters();
    var month = f.month || 'All';
    var product = f.product || 'All';
    var renewalTotal = rows.reduce(function(s,row){ return s + renewalValue(row,month,product); },0);
    var bookedEntries = financialEntries(rows,'booked',month,product);
    var cashEntries = financialEntries(rows,'cash',month,product);
    var bookedTotal = bookedEntries.reduce(function(s,entry){ return s + num(entry.value); },0);
    var cashTotal = cashEntries.reduce(function(s,entry){ return s + num(entry.value); },0);
    var remainingTotal = bookedTotal - cashTotal;
    var delayedRows = rows.filter(function(row){ return renewalStatus(row) === 'Delayed' && accountStatusLabel(row) !== 'Lost' && accountStatusLabel(row) !== 'Lost From 2025'; });
    var lateRows = rows.filter(function(row){ return renewalStatus(row) === 'Renewed Late'; });

    var cards = [
      {k:'renewal',v:money(renewalTotal),l:'Renewal Value',s:rows.length.toLocaleString()+' accounts · '+monthLabel(month),c:'var(--cyan)',i:'💎'},
      {k:'booked',v:money(bookedTotal),l:'Booked Value',s:bookedEntries.length.toLocaleString()+' rows · This Year',c:'var(--purple)',i:'📝'},
      {k:'cash',v:money(cashTotal),l:'Cash Collected',s:cashEntries.length.toLocaleString()+' rows · This Year',c:'var(--green)',i:'💵'},
      {k:'remaining',v:money(remainingTotal),l:'Booked Not Cash',s:monthLabel(month),c:'var(--blue)',i:'⏳'},
      {k:'delayed',v:delayedRows.length.toLocaleString(),l:'Delayed Accounts',s:'Excludes Lost / Lost From 2025',c:'var(--red)',i:'🚨'},
      {k:'late',v:lateRows.length.toLocaleString(),l:'Renewed Late',s:'Booking after renewal month',c:'var(--amber)',i:'⚠️'}
    ];

    setHtml('retFinTopGrid', cards.map(function(card){
      return '<div class="ret-fin-card ret-click-card" style="--fc:'+card.c+'" onclick="openRetFinSheetDetails(\''+card.k+'\')" title="Click to open account list"><div class="ret-fin-card-icon">'+card.i+'</div><div class="ret-fin-card-v">'+card.v+'</div><div class="ret-fin-card-l">'+card.l+'</div><div class="ret-fin-card-s">'+card.s+'</div></div>';
    }).join(''));
  }
  function ownerSummary(rows, month, product){
    var map = {};
    rows.forEach(function(row){
      [['RM',rmOf(row)],['CSM',csmOf(row)]].forEach(function(pair){
        var role = pair[0], name = pair[1];
        if(!name) return;
        var key = role + '|' + name;
        if(!map[key]) map[key] = {role:role,name:name,accounts:{},renewal:0,booked:0,collected:0,remaining:0,bookedKeys:{},cashKeys:{}};
        map[key].accounts[clientOf(row)+'|'+gidOf(row)] = true;
        map[key].renewal += renewalValue(row,month,product);

        financialEntries([row],'booked',month,product).forEach(function(entry){
          var bk = financialEntryKey(entry);
          if(!map[key].bookedKeys[bk]){
            map[key].bookedKeys[bk] = true;
            map[key].booked += num(entry.value);
          }
        });

        financialEntries([row],'cash',month,product).forEach(function(entry){
          var ck = financialEntryKey(entry);
          if(!map[key].cashKeys[ck]){
            map[key].cashKeys[ck] = true;
            map[key].collected += num(entry.value);
          }
        });
      });
    });
    return Object.keys(map).map(function(k){
      var o = map[k];
      o.accountCount = Object.keys(o.accounts).length;
      o.remaining = o.booked - o.collected;
      delete o.bookedKeys;
      delete o.cashKeys;
      return o;
    }).sort(function(a,b){ return b.renewal - a.renewal; });
  }
  function renderOwnerSummary(rows){
    var f = filters();
    var owners = ownerSummary(rows, f.month || 'All', f.product || 'All');
    var head = ['Owner','Role','Accounts','Renewal','Booked','Cash Collected','Booked Not Cash'];
    setText('retFinOwnerBadge', owners.length.toLocaleString() + ' owners · ' + monthLabel(f.month || 'All'));
    var badge = byId('retFinOwnerBadge');
    if(badge && !byId('export-owner-clean')){
      var btn = document.createElement('button');
      btn.id = 'export-owner-clean';
      btn.className = 'ret-export-btn';
      btn.type = 'button';
      btn.textContent = 'Export Excel';
      btn.onclick = function(e){ e.stopPropagation(); retFinExport('owners'); };
      badge.parentNode.appendChild(btn);
    }
    setHtml('retFinOwnerGrid',
      head.map(function(h){ return '<div class="ret-fin-owner-cell ret-fin-owner-head">'+esc(h)+'</div>'; }).join('') +
      (owners.length ? owners.map(function(o){
        return '<div class="ret-fin-owner-cell"><div class="ret-fin-owner-name"><span class="ret-fin-dot" style="--oc:'+(o.role==='RM'?'var(--blue)':'var(--cyan)')+'"></span>'+esc(o.name)+'</div></div>'+
          '<div class="ret-fin-owner-cell"><span class="ret">'+esc(o.role)+'</span></div>'+
          '<div class="ret-fin-owner-cell" style="font-family:var(--mono);font-weight:900">'+o.accountCount.toLocaleString()+'</div>'+
          '<div class="ret-fin-owner-cell" style="font-family:var(--mono);font-weight:900;color:var(--cyan)">'+money(o.renewal)+'</div>'+
          '<div class="ret-fin-owner-cell" style="font-family:var(--mono);font-weight:900;color:var(--purple)">'+money(o.booked)+'</div>'+
          '<div class="ret-fin-owner-cell" style="font-family:var(--mono);font-weight:900;color:var(--green)">'+money(o.collected)+'</div>'+
          '<div class="ret-fin-owner-cell" style="font-family:var(--mono);font-weight:900;color:var(--blue)">'+money(o.remaining)+'</div>';
      }).join('') : '<div class="ret-fin-empty" style="grid-column:1/-1">No RM/CSM values found after filters.</div>')
    );
  }
  function entryBookedNotCash(entry, month, product){
    if(!entry) return 0;
    var row = entry.row || {};
    if(entry.kind === 'booked') return num(entry.value) - collectionValue(row, entry.month || month, entry.product || product);
    return bookingValue(row, entry.month || month, entry.product || product) - num(entry.value);
  }
  function bookedEntryRow(entry,index,month,product){
    var row = entry.row || {};
    return '<tr class="'+rowClass(index)+'"><td>'+clientCell(row)+'</td><td>'+esc(rmOf(row)||'—')+'</td><td>'+esc(csmOf(row)||'—')+'</td><td class="c">'+esc(entry.product || productOf(row))+'</td><td class="c">'+esc(entry.month || (month==='All'?bookingMonth(row):month))+'</td><td class="c">'+cellMoney(entry.value,'var(--purple)')+'</td><td class="c">'+cellMoney(entryBookedNotCash(entry,month,product),'var(--blue)')+'</td><td class="c">'+badge(fullStatus(row))+'</td></tr>';
  }
  function cashEntryRow(entry,index,month,product){
    var row = entry.row || {};
    return '<tr class="'+rowClass(index)+'"><td>'+clientCell(row)+'</td><td>'+esc(rmOf(row)||'—')+'</td><td>'+esc(csmOf(row)||'—')+'</td><td class="c">'+esc(entry.product || productOf(row))+'</td><td class="c">'+esc(entry.month || (month==='All'?collectionMonth(row):month))+'</td><td class="c">'+cellMoney(entry.value,'var(--green)')+'</td><td class="c">'+cellMoney(entryBookedNotCash(entry,month,product),'var(--blue)')+'</td><td class="c">'+badge(fullStatus(row))+'</td></tr>';
  }
  function renderBookedCash(rows){
    var f = filters();
    var month = f.month || 'All';
    var product = f.product || 'All';
    var booked = financialEntries(rows,'booked',month,product);
    var cash = financialEntries(rows,'cash',month,product);
    var bookedTotal = booked.reduce(function(s,entry){ return s + num(entry.value); },0);
    var cashTotal = cash.reduce(function(s,entry){ return s + num(entry.value); },0);

    setText('retFinBookedBadge', booked.length.toLocaleString() + ' · ' + money(bookedTotal));
    setText('retFinCashedBadge', cash.length.toLocaleString() + ' · ' + money(cashTotal));

    ensureExportButton('retFinBookedBadge','booked');
    ensureExportButton('retFinCashedBadge','cash');

    setHtml('retFinBookedBody', booked.length ? booked.map(function(entry,i){ return bookedEntryRow(entry,i,month,product); }).join('') : empty(8,'No booked rows found for the selected filters.'));
    setHtml('retFinCashedBody', cash.length ? cash.map(function(entry,i){ return cashEntryRow(entry,i,month,product); }).join('') : empty(8,'No cash collected rows found for the selected filters.'));

    var bt = byId('retFinBookedToggle');
    if(bt){ bt.style.display = booked.length > 10 ? 'block' : 'none'; bt.dataset.open = '0'; bt.textContent = '▼ Show more'; }
    var ct = byId('retFinCashedToggle');
    if(ct){ ct.style.display = cash.length > 10 ? 'block' : 'none'; ct.dataset.open = '0'; ct.textContent = '▼ Show more'; }
  }
  function ensureExportButton(anchorId,kind,status){
    var anchor = byId(anchorId);
    if(!anchor || !anchor.parentNode) return;
    var id = 'export-'+kind+(status?'-'+status.replace(/[^a-z0-9]+/gi,'-'):'');
    if(byId(id)) return;
    var btn = document.createElement('button');
    btn.id = id;
    btn.className = 'ret-export-btn';
    btn.type = 'button';
    btn.textContent = 'Export Excel';
    btn.onclick = function(e){ e.stopPropagation(); retFinExport(kind,status); };
    anchor.parentNode.appendChild(btn);
  }
  function statusRow(row,index,month,product){
    return '<tr class="'+rowClass(index)+'"><td>'+clientCell(row)+'</td><td>'+esc(rmOf(row)||'—')+'</td><td>'+esc(csmOf(row)||'—')+'</td><td class="c">'+esc(productOf(row))+'</td><td class="c">'+esc(renewalMonth(row))+'</td><td class="c">'+cellMoney(renewalValue(row,month,product),'var(--cyan)')+'</td><td class="c">'+cellMoney(bookingValue(row,month,product),'var(--purple)')+'</td><td class="c">'+cellMoney(collectionValue(row,month,product),'var(--green)')+'</td><td class="c">'+cellMoney(bookedNotCash(row,month,product),'var(--blue)')+'</td><td class="c">'+badge(accountStatusLabel(row))+'</td><td class="c">'+badge(renewalStatus(row))+'</td></tr>';
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
    var f = filters();
    var month = f.month || 'All';
    var product = f.product || 'All';
    var grouped = {};
    rows.forEach(function(row){
      var st = renewalStatus(row);
      if(!grouped[st]) grouped[st] = [];
      grouped[st].push(row);
    });

    var order = ['Renewed On Time','Renewed Late','Delayed','Upcoming','Booked Pending Collection','Cashed','Renewed','No Renewal Month','Lost From 2025','Lost'];
    Object.keys(grouped).forEach(function(st){ if(order.indexOf(st) < 0) order.push(st); });

    setText('retFinStatusBadge', rows.length.toLocaleString() + ' filtered accounts');

    var html = order.filter(function(st){ return grouped[st] && grouped[st].length; }).map(function(st,index){
      var list = grouped[st];
      var total = list.reduce(function(s,row){ return s + renewalValue(row,month,product); },0);
      var bodyId = 'retFinStatusBody'+index;
      var badgeId = 'retFinStatusBadge'+index;
      var color = statusColor(st);
      var extra = list.length > 10 ? '<button class="ret-show-btn" onclick="retFinToggleRows(\''+bodyId+'\',this)">▼ Show more</button>' : '';
      return '<div class="ret-fin-subcard" data-ret-status-card="1" style="--sc:'+color+'">'+
        '<div class="ret-fin-subhd"><div class="ret-fin-subtitle" style="color:'+color+'">📌 '+esc(st)+'</div><span class="badge '+statusClass(st)+'" id="'+badgeId+'">'+list.length.toLocaleString()+' · '+money(total)+'</span></div>'+
        '<div class="ret-fin-mini-note">Filtered renewal status rows for this year.</div>'+
        '<div style="overflow-x:auto"><table class="tbl">'+tableHead(['Client','RM 2026','CSM',':Product',':Renewal Month',':Renewal Value',':Booked',':Cash Collected',':Booked Not Cash',':Account Status',':Renewal Status'])+'<tbody id="'+bodyId+'">'+list.map(function(row,i){ return statusRow(row,i,month,product); }).join('')+'</tbody></table></div>'+
        '<div style="display:flex;justify-content:flex-end;padding:8px 12px;border-top:1px solid var(--border)"><button class="ret-export-btn" onclick="retFinExport(\'status\','+JSON.stringify(st).replace(/"/g,'&quot;')+')">Export Excel</button></div>'+
        extra+
      '</div>';
    }).join('');

    setHtml('retFinStatusGrid', html || '<div class="ret-fin-empty" style="grid-column:1/-1">No renewal status rows found after filters.</div>');
  }
  window.openRetFinSheetDetails = function(kind){
    var f = filters();
    var month = f.month || 'All';
    var product = f.product || 'All';
    var rows = filteredAccounts();
    var isBookedDetail = kind === 'booked';
    var isCashDetail = kind === 'cash' || kind === 'collected';
    var entries = [];

    if(isBookedDetail) entries = financialEntries(rows,'booked',month,product);
    else if(isCashDetail) entries = financialEntries(rows,'cash',month,product);
    else {
      if(kind === 'remaining') rows = rows.filter(function(row){ return bookedNotCash(row,month,product) !== 0; });
      if(kind === 'delayed') rows = rows.filter(function(row){ return renewalStatus(row) === 'Delayed' && accountStatusLabel(row) !== 'Lost' && accountStatusLabel(row) !== 'Lost From 2025'; });
      if(kind === 'late') rows = rows.filter(function(row){ return renewalStatus(row) === 'Renewed Late'; });
      if(kind === 'renewal') rows = rows.filter(function(row){ return renewalValue(row,month,product) !== 0; });
    }

    var old = byId('retFinSheetDetailsBackdrop');
    if(old) old.remove();

    var titleMap = {
      renewal:'Renewal Value Accounts',
      booked:'Booked Value Accounts',
      cash:'Cash Collected Accounts',
      collected:'Cash Collected Accounts',
      remaining:'Booked Not Cash Accounts',
      delayed:'Delayed Accounts',
      late:'Renewed Late Accounts'
    };

    var count = (isBookedDetail || isCashDetail) ? entries.length : rows.length;
    var body;
    if(isBookedDetail){
      body = entries.length ?
        '<div style="overflow-x:auto"><table class="tbl">'+tableHead(['Client','RM 2026','CSM',':Product',':Booking Month',':Booked',':Booked Not Cash',':Account Status',':Renewal Status'])+'<tbody>'+
          entries.slice(0,150).map(function(entry,i){ return bookedEntryRow(entry,i,month,product).replace('class="ret-hidden"',''); }).join('')+
        '</tbody></table></div>'+(entries.length > 150 ? '<div class="ret-drill-empty" style="padding:12px">Showing first 150 of '+entries.length.toLocaleString()+' rows.</div>' : '')
        : '<div class="ret-drill-empty">No booked rows found for this card with the current filters.</div>';
    }else if(isCashDetail){
      body = entries.length ?
        '<div style="overflow-x:auto"><table class="tbl">'+tableHead(['Client','RM 2026','CSM',':Product',':Collection Month',':Cash Collected',':Booked Not Cash',':Account Status',':Renewal Status'])+'<tbody>'+
          entries.slice(0,150).map(function(entry,i){ return cashEntryRow(entry,i,month,product).replace('class="ret-hidden"',''); }).join('')+
        '</tbody></table></div>'+(entries.length > 150 ? '<div class="ret-drill-empty" style="padding:12px">Showing first 150 of '+entries.length.toLocaleString()+' rows.</div>' : '')
        : '<div class="ret-drill-empty">No cash collected rows found for this card with the current filters.</div>';
    }else{
      body = rows.length ?
        '<div style="overflow-x:auto"><table class="tbl">'+tableHead(['Client','RM 2026','CSM',':Product',':Renewal Month',':Renewal Value',':Booked',':Cash Collected',':Booked Not Cash',':Account Status',':Renewal Status'])+'<tbody>'+
          rows.slice(0,150).map(function(row,i){ return statusRow(row,i,month,product).replace('class="ret-hidden"',''); }).join('')+
        '</tbody></table></div>'+(rows.length > 150 ? '<div class="ret-drill-empty" style="padding:12px">Showing first 150 of '+rows.length.toLocaleString()+' rows.</div>' : '')
        : '<div class="ret-drill-empty">No accounts found for this card with the current filters.</div>';
    }

    var node = document.createElement('div');
    node.id = 'retFinSheetDetailsBackdrop';
    node.className = 'acq-detail-backdrop';
    node.onclick = function(e){ if(e.target === node) node.remove(); };
    node.innerHTML = '<div class="acq-detail-card" style="border-top:4px solid var(--cyan)">'+
      '<div class="acq-detail-hd"><div><div class="acq-detail-title">'+esc(titleMap[kind] || 'Retention Financial Details')+' <span class="badge bb" style="margin-left:8px">'+count.toLocaleString()+' rows</span></div>'+
      '<div class="acq-detail-sub">Month: '+esc(monthLabel(month))+' · Product: '+esc(product)+' · RM: '+esc(f.rm||'All')+' · CSM: '+esc(f.csm||'All')+' · Account Status: '+esc(f.accountStatus||'All')+'</div></div>'+
      '<button class="acq-detail-close" onclick="document.getElementById(\'retFinSheetDetailsBackdrop\')?.remove()">×</button></div>'+
      '<div class="acq-detail-body">'+body+'</div></div>';
    document.body.appendChild(node);
  };
  function updateSidebarBadge(allRows){
    var badge = document.querySelector('#side-ret-financial .nav-badge');
    if(!badge) return;
    var booked = financialEntries(allRows,'booked','All','All').length;
    var cash = financialEntries(allRows,'cash','All','All').length;
    badge.textContent = booked + '/' + cash;
    badge.title = 'Booked rows / Cash collected rows';
  }
  function updateSidebarBadge(allRows){
    var badge = document.querySelector('#side-ret-financial .nav-badge');
    if(!badge) return;
    var booked = uniqueFinancialRows(allRows,'booked','All','All').length;
    var cash = uniqueFinancialRows(allRows,'cash','All','All').length;
    badge.textContent = booked + '/' + cash;
    badge.title = 'Booked rows / Cash collected rows';
  }
  window.renderRetentionFinancialDetails = function(){
    keepRetentionFinancialView();
    var auditBoard = byId('retFinAuditBoard');
    if(auditBoard) auditBoard.remove();
    if(document.body) document.body.classList.add('retention-financial-wide');
    ensureLayout();

    var all = allAccounts();
    renderFilters(all);
    updateSidebarBadge(all);

    var rows = filteredAccounts();
    var f = filters();
    var month = f.month || 'All';
    var product = f.product || 'All';

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
      topbarSub.textContent = 'Budget + Booking + Collection · Month / RM / CSM / Product / Account Status filters';
    }
  };

  var previousSwitchRetentionFinancial = window.switchRetentionFinancial;
  window.switchRetentionFinancial = function(){
    if(typeof previousSwitchRetentionFinancial === 'function'){
      previousSwitchRetentionFinancial.apply(this,arguments);
    }
    window.APP_MAIN_PANEL = 'retention';
    window.APP_RETENTION_VIEW = 'financial';
    setTimeout(window.renderRetentionFinancialDetails,0);
  };

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded',function(){
      if(window.APP_MAIN_PANEL === 'retention' && window.APP_RETENTION_VIEW === 'financial') window.renderRetentionFinancialDetails();
    });
  }else{
    setTimeout(function(){
      if(window.APP_MAIN_PANEL === 'retention' && window.APP_RETENTION_VIEW === 'financial') window.renderRetentionFinancialDetails();
    },0);
  }
})();
