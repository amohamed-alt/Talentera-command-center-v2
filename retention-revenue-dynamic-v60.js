(function(){
  if(window.__RETENTION_FINANCIAL_DYNAMIC_FILTERS_V65__) return;
  window.__RETENTION_FINANCIAL_DYNAMIC_FILTERS_V65__ = true;
  window.DASHBOARD_CLEAN_VERSION = 'retention-financial-dynamic-filters-v65-negative-dedupe-filters';

  var MONTHS = [
    {key:'All',label:'All Months',i:0},
    {key:'Jan',label:'January',i:1},{key:'Feb',label:'February',i:2},{key:'Mar',label:'March',i:3},{key:'Apr',label:'April',i:4},
    {key:'May',label:'May',i:5},{key:'Jun',label:'June',i:6},{key:'Jul',label:'July',i:7},{key:'Aug',label:'August',i:8},
    {key:'Sep',label:'September',i:9},{key:'Oct',label:'October',i:10},{key:'Nov',label:'November',i:11},{key:'Dec',label:'December',i:12}
  ];

  window.RET_FIN_SHEET_FILTERS = Object.assign({month:'All',rm:'All',csm:'All',product:'All',accountStatus:'All'}, window.RET_FIN_SHEET_FILTERS || {});

  function byId(id){ return document.getElementById(id); }
  function arr(v){ return Array.isArray(v) ? v : []; }
  function txt(v){ return String(v == null ? '' : v).trim(); }
  function norm(v){ return txt(v).toLowerCase().replace(/[’']/g,'').replace(/&/g,' and ').replace(/[_\-\/\\|]+/g,' ').replace(/[.,:;()[\]{}]/g,' ').replace(/\s+/g,' ').trim(); }
  function esc(v){ return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
  function num(v){
    if(v == null || v === '') return 0;
    if(typeof v === 'number') return Number.isFinite(v) ? v : 0;
    var s = String(v).replace(/,/g,'').replace(/\$/g,'').replace(/[−–—]/g,'-').trim();
    var negative = /^-/.test(s) || /-$/.test(s) || /\([^)]*\)/.test(s) || /(^|[^0-9])-\s*\d/.test(s);
    s = s.replace(/[()\s-]/g,'').replace(/[^0-9.]/g,'');
    var n = Number(s);
    return Number.isFinite(n) ? (negative ? -n : n) : 0;
  }
  function money(v){
    var n = num(v);
    var abs = Math.round(Math.abs(n)).toLocaleString('en-US');
    return (n < 0 ? '-$' : '$') + abs;
  }
  function currentR(){ try{ if(typeof R !== 'undefined' && R) return R; }catch(e){} return window.R || {}; }
  function sheets(){ var r = currentR(); return r.retentionSheets2026 || r.sheets2026 || (r.sheetData && r.sheetData.retentionSheets2026) || {}; }
  function summary(){ return sheets().summary || {}; }
  function filters(){ window.RET_FIN_SHEET_FILTERS = Object.assign({month:'All',rm:'All',csm:'All',product:'All',accountStatus:'All'}, window.RET_FIN_SHEET_FILTERS || {}); return window.RET_FIN_SHEET_FILTERS; }
  function filtersAreDefault(){ var f = filters(); return ['month','rm','csm','product','accountStatus'].every(function(k){ return !f[k] || f[k] === 'All'; }); }
  function first(row, keys){
    var sources = [row, row && row.properties, row && row.raw, row && row.fields].filter(Boolean);
    for(var i=0;i<keys.length;i++){
      for(var j=0;j<sources.length;j++){
        var src = sources[j], key = keys[i];
        if(Object.prototype.hasOwnProperty.call(src,key)){
          var val = src[key];
          if(val !== undefined && val !== null && (typeof val === 'object' || String(val).trim() !== '')) return val;
        }
      }
    }
    return '';
  }
  function asObject(value){
    if(!value) return null;
    if(typeof value === 'object') return value;
    if(typeof value === 'string'){
      try{ var parsed = JSON.parse(value); return parsed && typeof parsed === 'object' ? parsed : null; }catch(e){ return null; }
    }
    return null;
  }
  function monthLabel(key){ var m = MONTHS.find(function(x){ return x.key === key; }); return m ? m.label : (key || 'All Months'); }
  function monthKey(raw){
    var v = norm(raw);
    if(!v) return '';
    for(var i=0;i<MONTHS.length;i++){
      var m = MONTHS[i];
      if(norm(m.key) === v || norm(m.label) === v) return m.key;
    }
    return txt(raw);
  }
  function monthIndex(raw){ var k = monthKey(raw); var m = MONTHS.find(function(x){ return x.key === k; }); return m ? m.i : 0; }
  function productKey(raw){
    var p = txt(raw);
    var n = norm(p);
    if(n.indexOf('talentera') >= 0 || n === 'ats') return 'Talentera';
    if(n.indexOf('afterhire') >= 0 || n.indexOf('after hire') >= 0 || n === 'after') return 'AfterHire';
    if(n.indexOf('evalufy') >= 0 || n.indexOf('evaluate') >= 0) return 'Evalufy';
    return p || 'Unknown';
  }
  function productOf(row){ return productKey(first(row,['product','Product','productName','sheetProduct','solution'])); }
  function rmOf(row){ return txt(first(row,['rm','rm2026','RM 2026','RM','rmOwnerName','ownerName','retentionOwner','owner'])) || ''; }
  function csmOf(row){ return txt(first(row,['csm','csmName','CSM Name','CSM','csmOwnerName','customerSuccessManager'])) || ''; }
  function clientOf(row){ return txt(first(row,['clientName','client','Client','companyName','company','name','dealName','accountName'])) || 'Unknown Client'; }
  function gidOf(row){ return txt(first(row,['cleanGid','gid','GID','companyId','company_id','hs_object_id','id'])); }
  function urlOf(row){ return txt(first(row,['companyUrl','hubspotUrl','url','recordUrl'])); }
  function renewalMonth(row){ return monthKey(first(row,['renewalMonth','Renewal Month','contractRenewalMonth','month'])) || '—'; }
  function bookingMonth(row){ return monthKey(first(row,['bookingMonth','Booking Month'])) || '—'; }
  function collectionMonth(row){ return monthKey(first(row,['collectionMonth','Collection Month','cashMonth'])) || '—'; }
  function accountKey(row){ return norm(gidOf(row) || clientOf(row)); }
  function accountStatusLabel(row){
    var raw = first(row,['accountStatusForFilter','accountStatusLabel','budgetStatusLabel','budgetStatusRaw','renewalStatusFromSheet','abdullahStatus','statusAbdullah','Status Abdullah','Account Status','accountStatus','account_status','budgetStatus']);
    var s = norm(raw);
    if(!s || s === 'active') return 'Active';
    if(s === 'lost' || s === 'churned') return 'Lost';
    if(s === 'lost from 2025' || s === 'lost from 25' || s === 'lost 2025' || s === 'lost 25') return 'Lost From 2025';
    if(s === 'expected to be lost' || s === 'expected be lost' || s === 'expected lost' || s === 'expected to lost') return 'Expected To Be Lost';
    return txt(raw) || 'Active';
  }
  function finalLost(row){ var a = accountStatusLabel(row); return a === 'Lost' || a === 'Lost From 2025'; }
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
  function allProductsFromRow(row){
    var found = {};
    var base = productOf(row);
    if(base && base !== 'Unknown') found[base] = true;
    ['booked','cash'].forEach(function(kind){
      var map = financialMap(row,kind);
      Object.keys(map || {}).forEach(function(m){
        var bucket = map[m];
        if(bucket && typeof bucket === 'object') Object.keys(bucket).forEach(function(p){ var pk = productKey(p); if(pk && pk !== 'Unknown') found[pk] = true; });
      });
    });
    return Object.keys(found);
  }
  function productMatches(row, product){ return !product || product === 'All' || allProductsFromRow(row).indexOf(product) >= 0; }
  function mapEntriesForRow(row, kind, month, product){
    var map = financialMap(row,kind);
    var out = [];
    if(map){
      Object.keys(map).forEach(function(rawMonth){
        var m = monthKey(rawMonth) || rawMonth;
        if(month && month !== 'All' && m !== month) return;
        var bucket = map[rawMonth];
        if(bucket == null) return;
        if(typeof bucket === 'number' || typeof bucket === 'string'){
          var p = productOf(row);
          if(product && product !== 'All' && p !== product) return;
          var v = num(bucket);
          if(v !== 0) out.push({kind:kind,row:row,month:m,product:p,value:v});
          return;
        }
        bucket = asObject(bucket) || {};
        Object.keys(bucket).forEach(function(rawProduct){
          var p = productKey(rawProduct);
          if(product && product !== 'All' && p !== product) return;
          var v = num(bucket[rawProduct]);
          if(v !== 0) out.push({kind:kind,row:row,month:m,product:p,value:v});
        });
      });
      return out;
    }
    var rowMonth = kind === 'cash' ? collectionMonth(row) : bookingMonth(row);
    var p = productOf(row);
    if(month && month !== 'All' && rowMonth !== month) return out;
    if(product && product !== 'All' && p !== product) return out;
    var v = rawValue(row,kind);
    if(v !== 0) out.push({kind:kind,row:row,month:rowMonth,product:p,value:v});
    return out;
  }
  function entryKey(entry){
    var row = entry.row || {};
    var clientKey = norm(clientOf(row));
    var safeAccountKey = clientKey && clientKey !== 'unknown client' ? clientKey : accountKey(row);
    return [entry.kind, safeAccountKey, norm(entry.product), norm(entry.month), Math.round(num(entry.value) * 100) / 100].join('|');
  }
  function financialEntries(rows, kind, month, product){
    var seen = {};
    var out = [];
    arr(rows).forEach(function(row){
      mapEntriesForRow(row, kind, month || 'All', product || 'All').forEach(function(entry){
        var key = entryKey(entry);
        if(seen[key]) return;
        seen[key] = true;
        out.push(entry);
      });
    });
    return out;
  }
  function valueFor(row, kind, month, product){ return financialEntries([row],kind,month || 'All',product || 'All').reduce(function(s,e){ return s + num(e.value); },0); }
  function renewalValue(row, month, product){
    if(product && product !== 'All' && productOf(row) !== product) return 0;
    var val = num(first(row,['renewalValue2026','renewalValue','Renewal Value','renewal_value','amount']));
    if(!month || month === 'All') return val;
    return renewalMonth(row) === month ? val : 0;
  }
  function renewalStatus(row){
    var raw = first(row,['status','calculatedRenewalStatus','renewalStatus','renewal_status','calculated_status','Calculated Renewal Status','financialStatus']);
    var s = norm(raw);
    if(s){
      if(s === 'lost' || s === 'churned') return 'Lost';
      if(s.indexOf('lost from 2025') >= 0 || s.indexOf('lost from 25') >= 0) return 'Lost From 2025';
      if(s.indexOf('renewed on time') >= 0) return 'Renewed On Time';
      if(s.indexOf('renewed late') >= 0 || s === 'late') return 'Renewed Late';
      if(s.indexOf('expected to be lost') >= 0 && s.indexOf('delayed') >= 0) return 'Delayed';
      if(s.indexOf('delayed') >= 0) return 'Delayed';
      if(s.indexOf('upcoming') >= 0) return 'Upcoming';
      if(s.indexOf('partially cashed') >= 0) return 'Partially Cashed';
      if(s.indexOf('booked') >= 0 && s.indexOf('pending') >= 0) return 'Booked Pending Collection';
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
    if(r){ var now = new Date(Date.now() + 3 * 60 * 60 * 1000).getUTCMonth() + 1; return now > r ? 'Delayed' : 'Upcoming'; }
    return 'No Renewal Month';
  }
  function fullStatus(row){ var a = accountStatusLabel(row), s = renewalStatus(row); return a === 'Expected To Be Lost' ? a + ' · ' + s : s; }
  function statusClass(status){
    var s = norm(status);
    if(s.indexOf('expected to be lost') >= 0) return 'ba';
    if(s === 'lost' || s.indexOf('lost from 2025') >= 0 || s.indexOf('delayed') >= 0) return 'br';
    if(s.indexOf('late') >= 0 || s.indexOf('pending') >= 0) return 'ba';
    if(s.indexOf('renewed') >= 0 || s.indexOf('cash') >= 0) return 'bg';
    if(s.indexOf('upcoming') >= 0 || s.indexOf('no renewal') >= 0) return 'bb';
    return 'bp';
  }
  function statusColor(status){
    var s = norm(status);
    if(s === 'delayed' || s === 'lost' || s === 'lost from 2025') return 'var(--red)';
    if(s.indexOf('late') >= 0 || s.indexOf('pending') >= 0 || s.indexOf('expected') >= 0) return 'var(--amber)';
    if(s.indexOf('renewed') >= 0 || s.indexOf('cash') >= 0) return 'var(--green)';
    if(s.indexOf('upcoming') >= 0 || s.indexOf('no renewal') >= 0) return 'var(--blue)';
    return 'var(--purple)';
  }
  function badge(status){ return '<span class="badge '+statusClass(status)+'">'+esc(status || '—')+'</span>'; }
  function cellMoney(value,color){ return '<span style="font-family:var(--mono);font-weight:900;color:'+color+'">'+money(value)+'</span>'; }
  function rowClass(index){ return index >= 10 ? 'ret-hidden' : ''; }
  function empty(cols,msg){ return '<tr><td colspan="'+cols+'" class="ret-fin-empty">'+esc(msg)+'</td></tr>'; }
  function tableHead(headers){ return '<thead><tr>' + headers.map(function(h){ var c = h.charAt(0) === ':'; return '<th'+(c?' class="c"':'')+'>'+esc(c?h.slice(1):h)+'</th>'; }).join('') + '</tr></thead>'; }
  function setHtml(id, html){ var el = byId(id); if(el) el.innerHTML = html; }
  function setText(id, value){ var el = byId(id); if(el) el.textContent = value; }
  function clientCell(row){
    var bits = [];
    var gid = gidOf(row);
    if(gid) bits.push('GID ' + gid);
    if(first(row,['notInBudget2026']) || first(row,['budgetNote'])) bits.push(txt(first(row,['budgetNote'])) || 'Not in Budget 2026');
    var name = clientOf(row);
    var url = urlOf(row);
    var link = url ? '<a class="record-link" href="'+esc(url)+'" target="_blank" rel="noopener">'+esc(name)+'</a>' : esc(name);
    return '<div style="font-weight:900">'+link+'</div>' + (bits.length ? '<div style="font-size:10px;color:var(--muted);margin-top:2px">'+esc(bits.join(' · '))+'</div>' : '');
  }
  function rawAccounts(){
    var s = sheets();
    return arr(s.accounts).concat(arr(s.sheetOnlyNotInBudgetAccounts));
  }
  function allAccounts(){
    var seen = {};
    return rawAccounts().filter(function(row){
      var clientKey = norm(clientOf(row));
      var safeAccountKey = clientKey && clientKey !== 'unknown client' ? clientKey : gidOf(row);
      var key = [safeAccountKey,productOf(row),renewalMonth(row),bookingMonth(row),collectionMonth(row),rawValue(row,'booked'),rawValue(row,'cash'),renewalValue(row,'All','All'),first(row,['notInBudget2026']) || first(row,['budgetNote']) ? 'nb' : 'b'].join('|');
      if(seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }
  function rowPassBase(row){
    var f = filters();
    if(f.rm && f.rm !== 'All' && norm(rmOf(row)) !== norm(f.rm)) return false;
    if(f.csm && f.csm !== 'All' && norm(csmOf(row)) !== norm(f.csm)) return false;
    if(f.accountStatus && f.accountStatus !== 'All' && norm(accountStatusLabel(row)) !== norm(f.accountStatus)) return false;
    if(f.product && f.product !== 'All' && !productMatches(row,f.product)) return false;
    return true;
  }
  function passMonth(row, month, product){
    if(!month || month === 'All') return true;
    if(renewalValue(row,month,product) !== 0) return true;
    if(valueFor(row,'booked',month,product) !== 0) return true;
    if(valueFor(row,'cash',month,product) !== 0) return true;
    return false;
  }
  function filteredAccounts(){ var f = filters(); return allAccounts().filter(function(row){ return rowPassBase(row) && passMonth(row,f.month || 'All',f.product || 'All'); }); }
  function rawFilteredAccounts(){ var f = filters(); return rawAccounts().filter(function(row){ return rowPassBase(row) && passMonth(row,f.month || 'All',f.product || 'All'); }); }
  function dueAccounts(rows, month, product){ return rows.filter(function(row){ return renewalValue(row,month || 'All',product || 'All') !== 0; }); }
  function duplicateFinancialGroups(rows, month, product){
    var groups = {};
    function add(entry){
      var row = entry.row || {};
      var clientKey = norm(clientOf(row));
      if(!clientKey || clientKey === 'unknown client') return;
      var key = [entry.kind, clientKey, norm(entry.product), norm(entry.month), Math.round(num(entry.value) * 100) / 100].join('|');
      if(!groups[key]) groups[key] = {kind:entry.kind, client:clientOf(row), product:entry.product, month:entry.month, value:num(entry.value), rows:[], gids:{}, owners:{}};
      groups[key].rows.push(row);
      var gid = gidOf(row); if(gid) groups[key].gids[gid] = true;
      var owner = rmOf(row) || csmOf(row); if(owner) groups[key].owners[owner] = true;
    }
    arr(rows).forEach(function(row){
      mapEntriesForRow(row,'booked',month || 'All',product || 'All').forEach(add);
      mapEntriesForRow(row,'cash',month || 'All',product || 'All').forEach(add);
    });
    return Object.keys(groups).map(function(k){ return groups[k]; }).filter(function(g){ return g.rows.length > 1; }).sort(function(a,b){ return b.rows.length - a.rows.length || Math.abs(b.value) - Math.abs(a.value); });
  }
  function renderDuplicateAudit(rawRows, month, product){
    var board = byId('retFinAuditBoard');
    var body = byId('retFinAuditBody');
    var badgeEl = byId('retFinAuditBadge');
    if(!board || !body) return;
    var groups = duplicateFinancialGroups(rawRows, month || 'All', product || 'All');
    if(!groups.length){
      board.style.display = 'none';
      body.innerHTML = '';
      if(badgeEl) badgeEl.textContent = '0 duplicates';
      return;
    }
    board.style.display = 'block';
    if(badgeEl) badgeEl.textContent = groups.length.toLocaleString() + ' duplicate groups excluded from totals';
    body.innerHTML = '<div class="ret-fin-mini-note">These rows have the same client + product + month + value, so the dashboard counts them once even if the GID is different. This catches cases like duplicate Human Resources / 365 entries.</div>'+
      '<div style="overflow-x:auto"><table class="tbl">'+tableHead(['Type','Client',':Product',':Month',':Value',':Repeated',':GIDs / Owners'])+'<tbody>'+groups.slice(0,20).map(function(g){
        var gids = Object.keys(g.gids).join(', ') || '—';
        var owners = Object.keys(g.owners).join(', ') || '—';
        return '<tr><td><span class="badge '+(g.kind === 'cash' ? 'bg' : 'bp')+'">'+esc(g.kind === 'cash' ? 'Cash' : 'Booked')+'</span></td><td><div style="font-weight:900">'+esc(g.client)+'</div></td><td class="c">'+esc(g.product || '—')+'</td><td class="c">'+esc(g.month || '—')+'</td><td class="c">'+cellMoney(g.value, g.value < 0 ? 'var(--red)' : (g.kind === 'cash' ? 'var(--green)' : 'var(--purple)'))+'</td><td class="c"><span class="badge ba">'+g.rows.length+'x</span></td><td class="c"><div style="font-size:10px;color:var(--muted)">'+esc(gids)+'<br>'+esc(owners)+'</div></td></tr>';
      }).join('')+'</tbody></table></div>'+(groups.length > 20 ? '<div class="ret-drill-empty" style="padding:12px">Showing first 20 of '+groups.length.toLocaleString()+' duplicate groups.</div>' : '');
  }
  function unique(rows, fn){ var seen = {}; return arr(rows).map(fn).filter(function(v){ v = txt(v); if(!v || seen[v]) return false; seen[v] = true; return true; }).sort(function(a,b){ return String(a).localeCompare(String(b)); }); }
  function productOptions(rows){ var values = {}; rows.forEach(function(row){ allProductsFromRow(row).forEach(function(p){ if(p && p !== 'Unknown') values[p] = true; }); }); return Object.keys(values).sort(); }
  function remainingGroups(rows, month, product){
    var groups = {};
    function keyFor(e){ return [accountKey(e.row), norm(clientOf(e.row)), norm(e.product), (month && month !== 'All') ? norm(e.month) : 'all'].join('|'); }
    financialEntries(rows,'booked',month,product).forEach(function(e){ var k = keyFor(e); if(!groups[k]) groups[k] = {row:e.row, product:e.product, month:e.month, booked:0, cash:0}; groups[k].booked += num(e.value); });
    financialEntries(rows,'cash',month,product).forEach(function(e){ var k = keyFor(e); if(!groups[k]) groups[k] = {row:e.row, product:e.product, month:e.month, booked:0, cash:0}; groups[k].cash += num(e.value); });
    return Object.keys(groups).map(function(k){ var g = groups[k]; g.remaining = Math.max(g.booked - g.cash,0); return g; }).filter(function(g){ return g.remaining > 0; });
  }
  function topTotals(rows, month, product){
    var booked = financialEntries(rows,'booked',month,product);
    var cash = financialEntries(rows,'cash',month,product);
    var due = dueAccounts(rows,month,product);
    var rem = remainingGroups(rows,month,product);
    return {
      renewal:due.reduce(function(sum,row){ return sum + renewalValue(row,month,product); },0),
      booked:booked.reduce(function(sum,e){ return sum + num(e.value); },0),
      cash:cash.reduce(function(sum,e){ return sum + num(e.value); },0),
      remaining:rem.reduce(function(sum,g){ return sum + num(g.remaining); },0),
      delayed:due.filter(function(row){ return renewalStatus(row) === 'Delayed' && !finalLost(row); }).length,
      late:due.filter(function(row){ return renewalStatus(row) === 'Renewed Late'; }).length,
      accounts:due.length || rows.length,
      bookedRows:booked.length,
      cashRows:cash.length
    };
  }
  function ownerSummary(rows, month, product){
    var map = {};
    function add(row,role,name){
      if(!name) return;
      var key = role + '|' + name;
      if(!map[key]) map[key] = {role:role,name:name,accounts:{},renewal:0,booked:0,cash:0,remaining:0};
      map[key].accounts[norm(clientOf(row))+'|'+gidOf(row)] = true;
      map[key].renewal += renewalValue(row,month,product);
    }
    rows.forEach(function(row){ add(row,'RM',rmOf(row)); add(row,'CSM',csmOf(row)); });
    var booked = financialEntries(rows,'booked',month,product);
    var cash = financialEntries(rows,'cash',month,product);
    booked.forEach(function(e){ [['RM',rmOf(e.row)],['CSM',csmOf(e.row)]].forEach(function(pair){ var k = pair[0] + '|' + pair[1]; if(map[k]) map[k].booked += num(e.value); }); });
    cash.forEach(function(e){ [['RM',rmOf(e.row)],['CSM',csmOf(e.row)]].forEach(function(pair){ var k = pair[0] + '|' + pair[1]; if(map[k]) map[k].cash += num(e.value); }); });
    remainingGroups(rows,month,product).forEach(function(g){ [['RM',rmOf(g.row)],['CSM',csmOf(g.row)]].forEach(function(pair){ var k = pair[0] + '|' + pair[1]; if(map[k]) map[k].remaining += num(g.remaining); }); });
    return Object.keys(map).map(function(k){ var o = map[k]; o.accountCount = Object.keys(o.accounts).length; return o; }).sort(function(a,b){ return (a.role === b.role ? 0 : a.role === 'RM' ? -1 : 1) || b.renewal - a.renewal; });
  }
  function ensureLayout(){
    var panel = byId('panel-retention-financial');
    if(!panel) return;
    var hero = panel.querySelector('.ret-fin-hero');
    if(!hero){
      hero = document.createElement('div');
      hero.className = 'ret-fin-hero';
      hero.innerHTML = '<div class="ret-fin-hero-icon">💰</div><div><div class="ret-fin-hero-title">Retention Financial Details</div><div class="ret-fin-hero-sub">Budget + Booking + Collection sheets with dynamic filters.</div></div>';
      panel.insertBefore(hero,panel.firstChild);
    }
    var title = hero.querySelector('.ret-fin-hero-title');
    var sub = hero.querySelector('.ret-fin-hero-sub');
    if(title) title.textContent = 'Retention Financial Details';
    if(sub) sub.textContent = 'Budget + Booking + Collection sheets. Month, RM 2026, CSM, Product, and Account Status filters recalculate all cards, owner summary, booked rows, cash rows, and renewal status split.';
    var layout = byId('retFinDynamicLayoutV64');
    if(layout) return;
    Array.from(panel.children).forEach(function(child){ if(child !== hero) child.remove(); });
    hero.insertAdjacentHTML('afterend',
      '<div id="retFinDynamicLayoutV64">'+
        '<div id="retFinSheetFilter" class="ret-sheet-filter"></div>'+
        '<div class="ret-fin-top-grid" id="retFinTopGrid"></div>'+
        '<div class="ret-fin-board" id="retFinOwnerBoard"><div class="ret-fin-board-hd"><div><div class="ret-fin-board-title">📊 Owner Financial Summary</div><div class="ret-fin-mini-note" style="border:0;background:transparent;padding:4px 0 0">Renewal, booked total, cash collected, and booked-not-cash by RM / CSM after the current filters.</div></div><span class="badge bb" id="retFinOwnerBadge">0 owners</span></div><div class="ret-fin-owner-grid" id="retFinOwnerGrid"></div></div>'+
        '<div class="ret-fin-board" id="retFinStatusBoard"><div class="ret-fin-board-hd"><div><div class="ret-fin-board-title">📌 Renewal Status Split</div><div class="ret-fin-mini-note" style="border:0;background:transparent;padding:4px 0 0">Renewal statuses by renewal month after the current filters. Booked total and cash tables below use their own booking / collection month.</div></div><span class="badge bb" id="retFinStatusBadge">0 accounts</span></div>'+
          '<div class="ret-fin-main-split"><div class="ret-fin-subcard" style="--sc:var(--purple)"><div class="ret-fin-subhd"><div class="ret-fin-subtitle" style="color:var(--purple)">📝 Booked Value Total</div><span class="badge bp" id="retFinBookedBadge"></span></div><div class="ret-fin-mini-note">Filtered by booking month and product from Retention Accounts Booking.</div><div style="overflow-x:auto"><table class="tbl" id="retFinBookedTable">'+tableHead(['Client','RM 2026','CSM',':Product',':Booking Month',':Booked',':Booked Not Cash',':Renewal Status'])+'<tbody id="retFinBookedBody"></tbody></table></div><button class="ret-show-btn" id="retFinBookedToggle" onclick="retFinToggleRows(\'retFinBookedBody\',this)">▼ Show more</button></div>'+
          '<div class="ret-fin-subcard" style="--sc:var(--green)"><div class="ret-fin-subhd"><div class="ret-fin-subtitle" style="color:var(--green)">💵 Cash Collected</div><span class="badge bg" id="retFinCashedBadge"></span></div><div class="ret-fin-mini-note">Filtered by collection month and product from Retention Accounts Collection.</div><div style="overflow-x:auto"><table class="tbl" id="retFinCashedTable">'+tableHead(['Client','RM 2026','CSM',':Product',':Collection Month',':Cash Collected',':Booked Not Cash',':Renewal Status'])+'<tbody id="retFinCashedBody"></tbody></table></div><button class="ret-show-btn" id="retFinCashedToggle" onclick="retFinToggleRows(\'retFinCashedBody\',this)">▼ Show more</button></div></div>'+
          '<div class="ret-fin-status-grid-clean" id="retFinStatusGrid"></div></div>'+ 
      '</div>'
    );
  }
  function optionHtml(value,label,selected){ return '<option value="'+esc(value)+'"'+(value===selected?' selected':'')+'>'+esc(label || value)+'</option>'; }
  function selectHtml(id,key,label,value,options){ return '<span class="ret-sheet-label">'+esc(label)+'</span><select class="ret-sheet-select" id="'+esc(id)+'" data-ret-fin-filter-key="'+esc(key)+'">'+optionHtml('All','All',value)+options.map(function(o){ return optionHtml(o,o,value); }).join('')+'</select>'; }
  function renderFilters(allRows){
    var f = filters();
    var monthOptions = MONTHS.filter(function(m){ return m.key !== 'All'; }).map(function(m){ return m.key; });
    var accountOptions = unique(allRows,accountStatusLabel);
    ['Active','Expected To Be Lost','Lost','Lost From 2025'].reverse().forEach(function(x){ if(accountOptions.indexOf(x) < 0) accountOptions.unshift(x); });
    var src = sheets().sourceSheets || {};
    setHtml('retFinSheetFilter',
      '<div class="ret-sheet-filter-inner"><div class="ret-sheet-filter-left">'+
        selectHtml('retFinFilterMonth','month','Month',f.month || 'All',monthOptions)+
        selectHtml('retFinFilterRm','rm','RM 2026',f.rm || 'All',unique(allRows,rmOf))+
        selectHtml('retFinFilterCsm','csm','CSM',f.csm || 'All',unique(allRows,csmOf))+
        selectHtml('retFinFilterProduct','product','Product',f.product || 'All',productOptions(allRows))+
        selectHtml('retFinFilterAccountStatus','accountStatus','Account Status',f.accountStatus || 'All',accountOptions)+
        '<button class="ret-sheet-select" style="cursor:pointer;color:var(--red);min-width:auto" onclick="window.retFinResetFilters()">Reset</button>'+ 
        '<span class="ret-sheet-note">Filters recalculate every number below without moving the page.</span>'+ 
      '</div><span class="badge bb">Financial view</span></div>'+ 
      '<div class="ret-sheet-source"><span class="ret-sheet-pill">Budget: '+esc(src.budget || '1- 2026 Budget / 2026 Budget')+'</span><span class="ret-sheet-pill">Booking: '+esc(src.booking || 'Retention Accounts Booking')+'</span><span class="ret-sheet-pill">Collection: '+esc(src.collection || 'Retention Accounts Collection')+'</span><span class="ret-sheet-pill">Last updated: '+esc(sheets().lastUpdated || currentR().generatedAt || '—')+'</span></div>'
    );
  }
  function renderTopCards(rows){
    var f = filters(), month = f.month || 'All', product = f.product || 'All';
    var t = topTotals(rows,month,product);
    var cards = [
      {k:'renewal',v:money(t.renewal),l:'Renewal Value',s:t.accounts.toLocaleString()+' accounts · '+monthLabel(month),c:'var(--cyan)',i:'💎'},
      {k:'booked',v:money(t.booked),l:'Booked Value Total',s:t.bookedRows.toLocaleString()+' booking rows · '+monthLabel(month),c:'var(--purple)',i:'📝'},
      {k:'cash',v:money(t.cash),l:'Cash Collected',s:t.cashRows.toLocaleString()+' collection rows · '+monthLabel(month),c:'var(--green)',i:'💵'},
      {k:'remaining',v:money(t.remaining),l:'Booked Not Cash',s:'Per account/product: booked - cash, never below zero',c:'var(--blue)',i:'⏳'},
      {k:'delayed',v:t.delayed.toLocaleString(),l:'Delayed Accounts',s:'Due in '+monthLabel(month)+' · excludes lost',c:'var(--red)',i:'🚨'},
      {k:'late',v:t.late.toLocaleString(),l:'Renewed Late',s:'Due in '+monthLabel(month),c:'var(--amber)',i:'⚠️'}
    ];
    setHtml('retFinTopGrid', cards.map(function(card){ return '<div class="ret-fin-card ret-click-card" style="--fc:'+card.c+'" onclick="openRetFinSheetDetails(\''+card.k+'\')" title="Click to open account list"><div class="ret-fin-card-icon">'+card.i+'</div><div class="ret-fin-card-v">'+card.v+'</div><div class="ret-fin-card-l">'+card.l+'</div><div class="ret-fin-card-s">'+card.s+'</div></div>'; }).join(''));
  }
  function ensureExportButton(anchorId,kind,status){
    var anchor = byId(anchorId);
    if(!anchor || !anchor.parentNode) return;
    var id = 'export-v63-'+kind+(status?'-'+String(status).replace(/[^a-z0-9]+/gi,'-'):'');
    if(byId(id)) return;
    var btn = document.createElement('button');
    btn.id = id; btn.className = 'ret-export-btn'; btn.type = 'button'; btn.textContent = 'Export Excel';
    btn.onclick = function(e){ e.stopPropagation(); retFinExport(kind,status); };
    anchor.parentNode.appendChild(btn);
  }
  function renderOwnerSummary(rows){
    var f = filters(), month = f.month || 'All', product = f.product || 'All';
    var owners = ownerSummary(rows,month,product);
    var head = ['Owner','Role','Accounts','Renewal','Booked Total','Cash Collected','Booked Not Cash'];
    setText('retFinOwnerBadge', owners.length.toLocaleString() + ' owners · ' + monthLabel(month));
    ensureExportButton('retFinOwnerBadge','owners');
    setHtml('retFinOwnerGrid', head.map(function(h){ return '<div class="ret-fin-owner-cell ret-fin-owner-head">'+esc(h)+'</div>'; }).join('') + (owners.length ? owners.map(function(o){
      return '<div class="ret-fin-owner-cell"><div class="ret-fin-owner-name"><span class="ret-fin-dot" style="--oc:'+(o.role==='RM'?'var(--blue)':'var(--cyan)')+'"></span>'+esc(o.name)+'</div></div>'+ 
        '<div class="ret-fin-owner-cell"><span class="ret">'+esc(o.role)+'</span></div>'+ 
        '<div class="ret-fin-owner-cell" style="font-family:var(--mono);font-weight:900">'+o.accountCount.toLocaleString()+'</div>'+ 
        '<div class="ret-fin-owner-cell" style="font-family:var(--mono);font-weight:900;color:var(--cyan)">'+money(o.renewal)+'</div>'+ 
        '<div class="ret-fin-owner-cell" style="font-family:var(--mono);font-weight:900;color:var(--purple)">'+money(o.booked)+'</div>'+ 
        '<div class="ret-fin-owner-cell" style="font-family:var(--mono);font-weight:900;color:var(--green)">'+money(o.cash)+'</div>'+ 
        '<div class="ret-fin-owner-cell" style="font-family:var(--mono);font-weight:900;color:var(--blue)">'+money(o.remaining)+'</div>';
    }).join('') : '<div class="ret-fin-empty" style="grid-column:1/-1">No RM/CSM values found after filters.</div>'));
  }
  function bookedNotCashForEntry(entry, month, product){
    var g = remainingGroups([entry.row], (month && month !== 'All') ? entry.month : month, entry.product || product).filter(function(x){ return accountKey(x.row) === accountKey(entry.row) && x.product === (entry.product || product); })[0];
    return g ? g.remaining : 0;
  }
  function bookedEntryRow(entry,index,month,product){ var row = entry.row || {}; return '<tr class="'+rowClass(index)+'"><td>'+clientCell(row)+'</td><td>'+esc(rmOf(row)||'—')+'</td><td>'+esc(csmOf(row)||'—')+'</td><td class="c">'+esc(entry.product || productOf(row))+'</td><td class="c">'+esc(entry.month || bookingMonth(row))+'</td><td class="c">'+cellMoney(entry.value,'var(--purple)')+'</td><td class="c">'+cellMoney(bookedNotCashForEntry(entry,month,product),'var(--blue)')+'</td><td class="c">'+badge(fullStatus(row))+'</td></tr>'; }
  function cashEntryRow(entry,index,month,product){ var row = entry.row || {}; return '<tr class="'+rowClass(index)+'"><td>'+clientCell(row)+'</td><td>'+esc(rmOf(row)||'—')+'</td><td>'+esc(csmOf(row)||'—')+'</td><td class="c">'+esc(entry.product || productOf(row))+'</td><td class="c">'+esc(entry.month || collectionMonth(row))+'</td><td class="c">'+cellMoney(entry.value,'var(--green)')+'</td><td class="c">'+cellMoney(bookedNotCashForEntry(entry,month,product),'var(--blue)')+'</td><td class="c">'+badge(fullStatus(row))+'</td></tr>'; }
  function setToggle(id,count){ var btn = byId(id); if(btn){ btn.style.display = count > 10 ? 'block' : 'none'; btn.dataset.open = '0'; btn.textContent = '▼ Show more'; } }
  function renderBookedCash(rows){
    var f = filters(), month = f.month || 'All', product = f.product || 'All';
    var booked = financialEntries(rows,'booked',month,product);
    var cash = financialEntries(rows,'cash',month,product);
    var bookedTotal = booked.reduce(function(s,e){ return s + num(e.value); },0);
    var cashTotal = cash.reduce(function(s,e){ return s + num(e.value); },0);
    setText('retFinBookedBadge', booked.length.toLocaleString() + ' · ' + money(bookedTotal));
    setText('retFinCashedBadge', cash.length.toLocaleString() + ' · ' + money(cashTotal));
    ensureExportButton('retFinBookedBadge','booked');
    ensureExportButton('retFinCashedBadge','cash');
    setHtml('retFinBookedBody', booked.length ? booked.map(function(e,i){ return bookedEntryRow(e,i,month,product); }).join('') : empty(8,'No booked rows found for the selected filters.'));
    setHtml('retFinCashedBody', cash.length ? cash.map(function(e,i){ return cashEntryRow(e,i,month,product); }).join('') : empty(8,'No cash collected rows found for the selected filters.'));
    setToggle('retFinBookedToggle', booked.length);
    setToggle('retFinCashedToggle', cash.length);
  }
  function statusRow(row,index,month,product){ return '<tr class="'+rowClass(index)+'"><td>'+clientCell(row)+'</td><td>'+esc(rmOf(row)||'—')+'</td><td>'+esc(csmOf(row)||'—')+'</td><td class="c">'+esc(productOf(row))+'</td><td class="c">'+esc(renewalMonth(row))+'</td><td class="c">'+cellMoney(renewalValue(row,month,product),'var(--cyan)')+'</td><td class="c">'+cellMoney(valueFor(row,'booked',month,product),'var(--purple)')+'</td><td class="c">'+cellMoney(valueFor(row,'cash',month,product),'var(--green)')+'</td><td class="c">'+cellMoney(remainingGroups([row],month,product).reduce(function(s,g){ return s + g.remaining; },0),'var(--blue)')+'</td><td class="c">'+badge(accountStatusLabel(row))+'</td><td class="c">'+badge(fullStatus(row))+'</td></tr>'; }
  function renderStatusSplit(rows){
    var f = filters(), month = f.month || 'All', product = f.product || 'All';
    var statusRows = dueAccounts(rows,month,product);
    var grouped = {};
    statusRows.forEach(function(row){ var st = renewalStatus(row); if(!grouped[st]) grouped[st] = []; grouped[st].push(row); });
    var order = ['Renewed On Time','Renewed Late','Delayed','Upcoming','Booked Pending Collection','Partially Cashed','Cashed','Renewed','No Renewal Month','Lost From 2025','Lost'];
    Object.keys(grouped).forEach(function(st){ if(order.indexOf(st) < 0) order.push(st); });
    setText('retFinStatusBadge', statusRows.length.toLocaleString() + ' renewal rows');
    setHtml('retFinStatusGrid', order.filter(function(st){ return grouped[st] && grouped[st].length; }).map(function(st,index){
      var list = grouped[st], color = statusColor(st), bodyId = 'retFinStatusBodyV64'+index;
      var total = list.reduce(function(sum,row){ return sum + renewalValue(row,month,product); },0);
      var more = list.length > 10 ? '<button class="ret-show-btn" onclick="retFinToggleRows(\''+bodyId+'\',this)">▼ Show more</button>' : '';
      return '<div class="ret-fin-subcard" data-ret-status-card="1" style="--sc:'+color+'"><div class="ret-fin-subhd"><div class="ret-fin-subtitle" style="color:'+color+'">📌 '+esc(st)+'</div><span class="badge '+statusClass(st)+'">'+list.length.toLocaleString()+' · '+money(total)+'</span></div><div class="ret-fin-mini-note">Renewal month: '+esc(monthLabel(month))+'</div><div style="overflow-x:auto"><table class="tbl">'+tableHead(['Client','RM 2026','CSM',':Product',':Renewal Month',':Renewal Value',':Booked',':Cash Collected',':Booked Not Cash',':Account Status',':Renewal Status'])+'<tbody id="'+bodyId+'">'+list.map(function(row,i){ return statusRow(row,i,month,product); }).join('')+'</tbody></table></div><div style="display:flex;justify-content:flex-end;padding:8px 12px;border-top:1px solid var(--border)"><button class="ret-export-btn" onclick="retFinExport(\'status\','+JSON.stringify(st).replace(/"/g,'&quot;')+')">Export Excel</button></div>'+more+'</div>';
    }).join('') || '<div class="ret-fin-empty" style="grid-column:1/-1">No renewal status rows found after filters.</div>');
  }
  function exportRows(fileName, headers, rows){
    var lines = [headers].concat(rows).map(function(row){ return row.map(function(cell){ return '"' + String(cell == null ? '' : cell).replace(/"/g,'""') + '"'; }).join(','); }).join('\n');
    var blob = new Blob(['\ufeff'+lines],{type:'text/csv;charset=utf-8;'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a'); a.href = url; a.download = fileName + '.csv'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(url); },500);
  }
  function rawExportRow(row, month, product){ return [clientOf(row),gidOf(row),rmOf(row),csmOf(row),productOf(row),renewalMonth(row),bookingMonth(row),collectionMonth(row),Math.round(renewalValue(row,month,product)),Math.round(valueFor(row,'booked',month,product)),Math.round(valueFor(row,'cash',month,product)),Math.round(remainingGroups([row],month,product).reduce(function(s,g){ return s + g.remaining; },0)),accountStatusLabel(row),renewalStatus(row)]; }
  window.retFinExport = function(kind,status){
    var f = filters(), month = f.month || 'All', product = f.product || 'All', rows = filteredAccounts();
    if(kind === 'booked'){
      var booked = financialEntries(rows,'booked',month,product);
      exportRows('retention-booked-value',['Client','GID','RM 2026','CSM','Product','Booking Month','Booked Total','Booked Not Cash','Account Status','Renewal Status'],booked.map(function(e){ return [clientOf(e.row),gidOf(e.row),rmOf(e.row),csmOf(e.row),e.product,e.month,Math.round(e.value),Math.round(bookedNotCashForEntry(e,month,product)),accountStatusLabel(e.row),renewalStatus(e.row)]; })); return;
    }
    if(kind === 'cash'){
      var cash = financialEntries(rows,'cash',month,product);
      exportRows('retention-cash-collected',['Client','GID','RM 2026','CSM','Product','Collection Month','Cash Collected','Booked Not Cash','Account Status','Renewal Status'],cash.map(function(e){ return [clientOf(e.row),gidOf(e.row),rmOf(e.row),csmOf(e.row),e.product,e.month,Math.round(e.value),Math.round(bookedNotCashForEntry(e,month,product)),accountStatusLabel(e.row),renewalStatus(e.row)]; })); return;
    }
    if(kind === 'owners'){
      var owners = ownerSummary(rows,month,product);
      exportRows('retention-owner-financial-summary',['Owner','Role','Accounts','Renewal','Booked Total','Cash Collected','Booked Not Cash'],owners.map(function(o){ return [o.name,o.role,o.accountCount,Math.round(o.renewal),Math.round(o.booked),Math.round(o.cash),Math.round(o.remaining)]; })); return;
    }
    if(kind === 'status' && status) rows = dueAccounts(rows,month,product).filter(function(row){ return renewalStatus(row) === status; });
    exportRows('retention-'+kind+(status?'-'+String(status).toLowerCase().replace(/[^a-z0-9]+/g,'-'):''),['Client','GID','RM 2026','CSM','Product','Renewal Month','Booking Month','Collection Month','Renewal Value','Booked Total','Cash Collected','Booked Not Cash','Account Status','Renewal Status'],rows.map(function(row){ return rawExportRow(row,month,product); }));
  };
  window.retFinToggleRows = function(bodyId,btn){
    var body = byId(bodyId); if(!body) return;
    var rows = Array.from(body.querySelectorAll('.ret-hidden'));
    var open = btn && btn.dataset.open === '1';
    rows.forEach(function(row){ row.style.display = open ? 'none' : 'table-row'; });
    if(btn){ btn.dataset.open = open ? '0' : '1'; btn.textContent = open ? '▼ Show more' : '▲ Show less'; }
  };
  function keepRetentionFinancialView(){
    window.APP_MAIN_PANEL = 'retention';
    window.APP_RETENTION_VIEW = 'financial';
    window.APP_RETENTION_OWNER_ID = null;
    try{ APP_MAIN_PANEL = 'retention'; APP_RETENTION_VIEW = 'financial'; APP_RETENTION_OWNER_ID = null; }catch(e){}
    document.querySelectorAll('.panel').forEach(function(p){ p.classList.remove('active'); });
    var panel = byId('panel-retention-financial'); if(panel) panel.classList.add('active');
    var tabs = byId('tabsBar'); if(tabs) tabs.style.display = 'none';
    document.querySelectorAll('.nav-item').forEach(function(n){ n.classList.remove('active'); });
    var ret = byId('side-retention'); if(ret) ret.classList.add('active');
    var fin = byId('side-ret-financial'); if(fin) fin.classList.add('active');
    var title = byId('topbarTitle'); if(title) title.textContent = 'Retention · Financial Details';
  }
  window.retFinSetFilter = function(key,value){
    var y = window.scrollY;
    keepRetentionFinancialView();
    window.RET_FIN_SHEET_FILTERS = Object.assign({month:'All',rm:'All',csm:'All',product:'All',accountStatus:'All'}, window.RET_FIN_SHEET_FILTERS || {});
    window.RET_FIN_SHEET_FILTERS[key] = value || 'All';
    window.renderRetentionFinancialDetails();
    requestAnimationFrame(function(){ window.scrollTo(0,y); });
  };
  window.retFinResetFilters = function(){
    var y = window.scrollY;
    keepRetentionFinancialView();
    window.RET_FIN_SHEET_FILTERS = {month:'All',rm:'All',csm:'All',product:'All',accountStatus:'All'};
    window.renderRetentionFinancialDetails();
    requestAnimationFrame(function(){ window.scrollTo(0,y); });
  };
  window.openRetFinSheetDetails = function(kind){
    var f = filters(), month = f.month || 'All', product = f.product || 'All', rows = filteredAccounts();
    var titleMap = {renewal:'Renewal Value Accounts',booked:'Booked Value Total Accounts',cash:'Cash Collected Accounts',remaining:'Booked Not Cash Accounts',delayed:'Delayed Accounts',late:'Renewed Late Accounts'};
    var body = '', count = 0;
    if(kind === 'booked'){
      var booked = financialEntries(rows,'booked',month,product); count = booked.length;
      body = booked.length ? '<div style="overflow-x:auto"><table class="tbl">'+tableHead(['Client','RM 2026','CSM',':Product',':Booking Month',':Booked',':Booked Not Cash',':Account Status',':Renewal Status'])+'<tbody>'+booked.slice(0,150).map(function(e,i){ return bookedEntryRow(e,i,month,product).replace('class="ret-hidden"',''); }).join('')+'</tbody></table></div>'+(booked.length>150?'<div class="ret-drill-empty" style="padding:12px">Showing first 150 of '+booked.length.toLocaleString()+' rows.</div>':'') : '<div class="ret-drill-empty">No booked rows found with the current filters.</div>';
    }else if(kind === 'cash'){
      var cash = financialEntries(rows,'cash',month,product); count = cash.length;
      body = cash.length ? '<div style="overflow-x:auto"><table class="tbl">'+tableHead(['Client','RM 2026','CSM',':Product',':Collection Month',':Cash Collected',':Booked Not Cash',':Account Status',':Renewal Status'])+'<tbody>'+cash.slice(0,150).map(function(e,i){ return cashEntryRow(e,i,month,product).replace('class="ret-hidden"',''); }).join('')+'</tbody></table></div>'+(cash.length>150?'<div class="ret-drill-empty" style="padding:12px">Showing first 150 of '+cash.length.toLocaleString()+' rows.</div>':'') : '<div class="ret-drill-empty">No cash rows found with the current filters.</div>';
    }else if(kind === 'remaining'){
      var rem = remainingGroups(rows,month,product); count = rem.length;
      body = rem.length ? '<div style="overflow-x:auto"><table class="tbl">'+tableHead(['Client','RM 2026','CSM',':Product',':Month',':Booked',':Cash Collected',':Booked Not Cash',':Account Status',':Renewal Status'])+'<tbody>'+rem.slice(0,150).map(function(g,i){ var r = g.row; return '<tr><td>'+clientCell(r)+'</td><td>'+esc(rmOf(r)||'—')+'</td><td>'+esc(csmOf(r)||'—')+'</td><td class="c">'+esc(g.product)+'</td><td class="c">'+esc((month && month !== 'All') ? g.month : 'All')+'</td><td class="c">'+cellMoney(g.booked,'var(--purple)')+'</td><td class="c">'+cellMoney(g.cash,'var(--green)')+'</td><td class="c">'+cellMoney(g.remaining,'var(--blue)')+'</td><td class="c">'+badge(accountStatusLabel(r))+'</td><td class="c">'+badge(fullStatus(r))+'</td></tr>'; }).join('')+'</tbody></table></div>' : '<div class="ret-drill-empty">No booked-not-cash rows found with the current filters.</div>';
    }else{
      rows = dueAccounts(rows,month,product);
      if(kind === 'delayed') rows = rows.filter(function(row){ return renewalStatus(row) === 'Delayed' && !finalLost(row); });
      if(kind === 'late') rows = rows.filter(function(row){ return renewalStatus(row) === 'Renewed Late'; });
      if(kind === 'renewal') rows = rows.filter(function(row){ return renewalValue(row,month,product) !== 0; });
      count = rows.length;
      body = rows.length ? '<div style="overflow-x:auto"><table class="tbl">'+tableHead(['Client','RM 2026','CSM',':Product',':Renewal Month',':Renewal Value',':Booked',':Cash Collected',':Booked Not Cash',':Account Status',':Renewal Status'])+'<tbody>'+rows.slice(0,150).map(function(row,i){ return statusRow(row,i,month,product).replace('class="ret-hidden"',''); }).join('')+'</tbody></table></div>'+(rows.length>150?'<div class="ret-drill-empty" style="padding:12px">Showing first 150 of '+rows.length.toLocaleString()+' rows.</div>':'') : '<div class="ret-drill-empty">No accounts found with the current filters.</div>';
    }
    var old = byId('retFinSheetDetailsBackdrop'); if(old) old.remove();
    var node = document.createElement('div'); node.id = 'retFinSheetDetailsBackdrop'; node.className = 'acq-detail-backdrop'; node.onclick = function(e){ if(e.target === node) node.remove(); };
    node.innerHTML = '<div class="acq-detail-card" style="border-top:4px solid var(--cyan)"><div class="acq-detail-hd"><div><div class="acq-detail-title">'+esc(titleMap[kind] || 'Retention Financial Details')+' <span class="badge bb" style="margin-left:8px">'+count.toLocaleString()+' rows</span></div><div class="acq-detail-sub">Month: '+esc(monthLabel(month))+' · Product: '+esc(product)+' · RM: '+esc(f.rm||'All')+' · CSM: '+esc(f.csm||'All')+' · Account Status: '+esc(f.accountStatus||'All')+'</div></div><button class="acq-detail-close" onclick="document.getElementById(\'retFinSheetDetailsBackdrop\')?.remove()">×</button></div><div class="acq-detail-body">'+body+'</div></div>';
    document.body.appendChild(node);
  };
  window.renderRetentionFinancialDetails = function(){
    if(document.body) document.body.classList.add('retention-financial-wide');
    ensureLayout();
    var all = allAccounts();
    renderFilters(all);
    var rows = filteredAccounts();
    var f = filters();
    // Duplicate audit UI intentionally disabled by request. Totals still use the existing de-duplicated account logic.
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
    if(topbarSub && window.APP_MAIN_PANEL === 'retention' && window.APP_RETENTION_VIEW === 'financial') topbarSub.textContent = 'Budget + Booking + Collection · dynamic filters are applied to every number below';
    var sideBadge = document.querySelector('#side-ret-financial .nav-badge');
    if(sideBadge){ sideBadge.textContent = financialEntries(all,'booked','All','All').length + '/' + financialEntries(all,'cash','All','All').length; }
  };
  var previousSwitchRetentionFinancial = window.switchRetentionFinancial;
  window.switchRetentionFinancial = function(){
    if(typeof previousSwitchRetentionFinancial === 'function') previousSwitchRetentionFinancial.apply(this, arguments);
    window.APP_MAIN_PANEL = 'retention';
    window.APP_RETENTION_VIEW = 'financial';
    setTimeout(window.renderRetentionFinancialDetails,0);
  };
  try{ switchRetentionFinancial = window.switchRetentionFinancial; }catch(e){}
  window.fetchSupabaseRetentionTeamOverview = fetchSupabaseRetentionTeamOverview;
  window.buildRetentionFromSupabaseTeamOnly = function(supa){ return buildRetentionFromSupabaseTeam(supa || {}, {}); };
  window.__RETENTION_TEAM_SUPABASE_BUILDERS_READY__ = true;

  var previousLoadData = window.loadData;
  if(typeof previousLoadData === 'function' && !previousLoadData.__retFinDynamicFiltersV65){
    window.loadData = async function(){
      var out = previousLoadData.apply(this,arguments);
      if(out && typeof out.then === 'function') await out;
      try{ if(typeof R !== 'undefined' && R) window.R = R; }catch(e){}
      if(window.APP_MAIN_PANEL === 'retention' && window.APP_RETENTION_VIEW === 'financial') setTimeout(window.renderRetentionFinancialDetails,0);
      return out;
    };
    window.loadData.__retFinDynamicFiltersV65 = true;
    try{ loadData = window.loadData; }catch(e){}
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',function(){ if(window.APP_MAIN_PANEL === 'retention' && window.APP_RETENTION_VIEW === 'financial') window.renderRetentionFinancialDetails(); });
  else setTimeout(function(){ if(window.APP_MAIN_PANEL === 'retention' && window.APP_RETENTION_VIEW === 'financial') window.renderRetentionFinancialDetails(); },0);
})();
