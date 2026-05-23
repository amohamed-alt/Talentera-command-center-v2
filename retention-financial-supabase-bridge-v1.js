(function(){
  if(window.__PNL_EXECUTIVE_V80__) return;
  window.__PNL_EXECUTIVE_V80__ = true;

  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var renderTimer = null;
  window.pnlV80Charts = window.pnlV80Charts || {};
  window.PNL_V80_FILTERS = Object.assign({year:'both', month:'all', metric:'all', mode:'monthly', costPart:'all'}, window.PNL_V80_FILTERS || window.RET_FIN_CHART_FILTERS || {});

  function byId(id){ return document.getElementById(id); }
  function safe(v){ return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
  function parseNum(v){
    if(v == null || v === '') return 0;
    if(typeof v === 'number') return Number.isFinite(v) ? v : 0;
    var s = String(v).trim();
    if(!s || s === '-' || s.toLowerCase() === 'n/a') return 0;
    s = s.replace(/[−–—]/g,'-');
    var lower = s.toLowerCase();
    var mult = lower.indexOf('m') > -1 ? 1000000 : lower.indexOf('k') > -1 ? 1000 : 1;
    var neg = /^\s*-/.test(s) || /-\s*$/.test(s) || (s.indexOf('(') > -1 && s.indexOf(')') > -1);
    var x = Number(s.replace(/[$,%\s,]/g,'').replace(/[()]/g,'').replace(/-/g,'').replace(/[^\d.]/g,''));
    return Number.isFinite(x) ? (neg ? -x : x) * mult : 0;
  }
  function pad(a){ a = Array.isArray(a) ? a.slice(0,12).map(parseNum) : []; while(a.length < 12) a.push(0); return a; }
  function arrHas(a){ return pad(a).some(function(v){ return Math.abs(parseNum(v)) > 0.0001; }); }
  function sumRange(a,start,end){ a = pad(a); var total = 0; start = Math.max(0,start); end = Math.min(11,end); for(var i=start;i<=end;i++) total += parseNum(a[i]); return Math.round(total); }
  function money(v){ return '$' + Math.round(parseNum(v)).toLocaleString('en-US'); }
  function shortMoney(v){ v = parseNum(v); if(Math.abs(v) >= 1000000) return '$' + (v/1000000).toFixed(1).replace('.0','') + 'M'; if(Math.abs(v) >= 1000) return '$' + Math.round(v/1000).toLocaleString('en-US') + 'K'; return money(v); }
  function signedMoney(v){ v = parseNum(v); return v < 0 ? '(' + money(Math.abs(v)) + ')' : money(v); }
  function rate(v){ return parseNum(v).toFixed(1).replace('.0','') + '%'; }
  function pct(now, prev){ now = parseNum(now); prev = parseNum(prev); return prev ? ((now - prev) / Math.abs(prev)) * 100 : 0; }
  function css(name, defaultValue){ var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || defaultValue; }
  function colors(){ return {green:css('--green','#16A34A'), purple:css('--purple','#7C3AED'), amber:css('--amber','#D97706'), blue:css('--blue','#2563EB'), cyan:css('--cyan','#0891B2'), red:css('--red','#DC2626'), muted:'#9CA3AF'}; }

  function sourceData(){
    var candidates = [];
    try{ if(window.R) candidates.push(window.R); }catch(e){}
    try{ if(typeof R !== 'undefined' && R) candidates.push(R); }catch(e){}
    try{ if(window.D) candidates.push(window.D); }catch(e){}
    try{ if(typeof D !== 'undefined' && D) candidates.push(D); }catch(e){}
    for(var i=0;i<candidates.length;i++){
      var item = candidates[i];
      if(item && item.financeComparison) return item.financeComparison;
      if(item && item.retentionData && item.retentionData.financeComparison) return item.retentionData.financeComparison;
    }
    return null;
  }
  function getRawArray(fc, names, year){
    var raw = fc.raw || {};
    for(var i=0;i<names.length;i++){
      var name = names[i];
      if(raw[name] && Array.isArray(raw[name][String(year)])) return pad(raw[name][String(year)]);
      if(raw[name] && Array.isArray(raw[name][year])) return pad(raw[name][year]);
      if(Array.isArray(fc[name + year])) return pad(fc[name + year]);
      if(Array.isArray(fc[name + String(year)])) return pad(fc[name + String(year)]);
      if(Array.isArray(fc[name + '_' + year])) return pad(fc[name + '_' + year]);
    }
    var out = Array(12).fill(0);
    if(Array.isArray(fc.monthly)) fc.monthly.forEach(function(row, idx){
      if(idx > 11 || !row) return;
      for(var n=0;n<names.length;n++){
        var base = names[n];
        var keys = [base + year, base + String(year), base + '_' + year, base + 'Year' + year];
        for(var k=0;k<keys.length;k++) if(row[keys[k]] != null){ out[idx] = parseNum(row[keys[k]]); return; }
      }
    });
    return out;
  }
  function normalize(fc){
    if(!fc || typeof fc !== 'object') return null;
    var months = Array.isArray(fc.months) && fc.months.length ? fc.months.slice(0,12) : MONTHS.slice();
    while(months.length < 12) months.push(MONTHS[months.length]);
    function m(names, year){ return getRawArray(fc, names, year); }
    var out = {source:fc.source || 'ForReporting', lastUpdated:fc.lastUpdated || '', months:months};
    out.booking2025 = m(['booking','bookings'],2025); out.booking2026 = m(['booking','bookings'],2026);
    out.cashing2025 = m(['cashing','cash','collection'],2025); out.cashing2026 = m(['cashing','cash','collection'],2026);
    out.cogs2025 = m(['cogs','COGS'],2025); out.cogs2026 = m(['cogs','COGS'],2026);
    out.overheads2025 = m(['overheads','overhead'],2025); out.overheads2026 = m(['overheads','overhead'],2026);
    out.supportAllocation2025 = m(['supportAllocation','supportAllocat','support','support_allocation'],2025);
    out.supportAllocation2026 = m(['supportAllocation','supportAllocat','support','support_allocation'],2026);
    var rawCost25 = m(['cost','totalCost','costTotal'],2025), rawCost26 = m(['cost','totalCost','costTotal'],2026);
    out.cost2025 = Array(12).fill(0); out.cost2026 = Array(12).fill(0);
    for(var i=0;i<12;i++){
      var comp25 = out.cogs2025[i] + out.overheads2025[i] + out.supportAllocation2025[i];
      var comp26 = out.cogs2026[i] + out.overheads2026[i] + out.supportAllocation2026[i];
      out.cost2025[i] = Math.abs(comp25) > 0.0001 ? comp25 : rawCost25[i];
      out.cost2026[i] = Math.abs(comp26) > 0.0001 ? comp26 : rawCost26[i];
    }
    var active = Number.isFinite(Number(fc.activeMonthIndex)) ? Number(fc.activeMonthIndex) : -1;
    if(active < 0){ ['booking2026','cashing2026','cost2026','cogs2026','overheads2026','supportAllocation2026'].forEach(function(key){ pad(out[key]).forEach(function(v,i){ if(parseNum(v) !== 0) active = Math.max(active,i); }); }); }
    out.activeMonthIndex = Math.max(0, Math.min(11, active < 0 ? new Date().getMonth() : active));
    out.activeMonth = out.months[out.activeMonthIndex] || MONTHS[out.activeMonthIndex];
    out.activeRangeLabel = (out.months[0] || 'Jan') + ' - ' + out.activeMonth;
    var has = ['booking2025','booking2026','cashing2025','cashing2026','cost2025','cost2026'].some(function(k){ return arrHas(out[k]); });
    return has ? out : null;
  }
  function getFC(){ return normalize(sourceData()); }
  function lastDataIndex(fc, year){ if(String(year)==='2025') return 11; var idx=-1; ['booking','cashing','cost','cogs','overheads','supportAllocation'].forEach(function(m){ pad(fc[m+year]).forEach(function(v,i){ if(parseNum(v)!==0) idx=Math.max(idx,i); }); }); idx = Math.max(idx, fc.activeMonthIndex); return Math.max(0, Math.min(11, idx)); }
  function filters(){ var f = window.PNL_V80_FILTERS || {}; return {year:f.year||'both', month:f.month||'all', metric:f.metric||'all', mode:f.mode||'monthly', costPart:f.costPart||'all'}; }
  function monthIndex(f){ return f.month === 'all' ? -1 : Math.max(0, Math.min(11, parseInt(f.month,10))); }
  function primaryYear(f){ return f.year === '2025' ? '2025' : '2026'; }
  function rangeFor(fc, year, f){ var mi=monthIndex(f); if(mi>=0) return {start:mi,end:mi,months:1,label:fc.months[mi]||MONTHS[mi]}; if(String(year)==='2025') return {start:0,end:11,months:12,label:'Jan - Dec'}; var end=lastDataIndex(fc,'2026'); return {start:0,end:end,months:end+1,label:'Jan - '+(fc.months[end]||MONTHS[end])}; }
  function compareRangeFor(fc, f){ var mi=monthIndex(f); if(mi>=0) return {start:mi,end:mi,months:1,label:fc.months[mi]||MONTHS[mi]}; var end=lastDataIndex(fc,'2026'); return {start:0,end:end,months:end+1,label:'Jan - '+(fc.months[end]||MONTHS[end])}; }
  function yearLabel(f){ return f.year === 'both' ? '2025 vs 2026' : f.year; }
  function scopeText(fc,f){ var mi=monthIndex(f); if(mi>=0) return (fc.months[mi]||MONTHS[mi])+' · '+yearLabel(f); if(f.year==='2025') return 'Jan - Dec 2025 · full closed year'; if(f.year==='2026') return rangeFor(fc,'2026',f).label+' 2026 · actual to date'; return compareRangeFor(fc,f).label+' · like-for-like comparison'; }
  function costKey(f){ if(f.costPart === 'cogs') return 'cogs'; if(f.costPart === 'overheads') return 'overheads'; if(f.costPart === 'supportAllocation') return 'supportAllocation'; return 'cost'; }
  function costLabel(f){ if(f.costPart === 'cogs') return 'COGS'; if(f.costPart === 'overheads') return 'Overheads'; if(f.costPart === 'supportAllocation') return 'Support Allocation'; return 'Total Cost'; }
  function metricLabel(metric,f){ if(metric==='booking') return 'Booking'; if(metric==='cashing') return 'Cashing'; if(metric==='cost') return costLabel(f); return 'All Metrics'; }
  function metricColor(metric,f){ var c=colors(); if(metric==='booking') return c.purple; if(metric==='cashing') return c.green; if(metric==='cost'){ if(f.costPart==='cogs') return c.blue; if(f.costPart==='overheads') return c.amber; if(f.costPart==='supportAllocation') return c.purple; return c.amber; } return c.blue; }
  function arrayFor(fc, metric, year, f){ metric = metric === 'cost' ? costKey(f) : metric; return pad(fc[metric + year]); }
  function total(fc, metric, year, range, f){ return sumRange(arrayFor(fc, metric, year, f || filters()), range.start, range.end); }
  function selectedTotals(fc,f){
    var py = primaryYear(f), r = f.year === 'both' ? compareRangeFor(fc,f) : rangeFor(fc,py,f), cr = f.year === '2025' ? rangeFor(fc,'2025',f) : compareRangeFor(fc,f);
    var booking = total(fc,'booking',py,r,f), cashing = total(fc,'cashing',py,r,f), cost = total(fc,'cost',py,r,f);
    return {primaryYear:py, range:r, compareRange:cr, booking:booking, cashing:cashing, cost:cost, net:cashing-cost, coverage:cost ? cashing/cost*100 : 0, conversion:booking ? cashing/booking*100 : 0, booking25:total(fc,'booking','2025',cr,f), booking26:total(fc,'booking','2026',cr,f), cashing25:total(fc,'cashing','2025',cr,f), cashing26:total(fc,'cashing','2026',cr,f), cost25:total(fc,'cost','2025',cr,f), cost26:total(fc,'cost','2026',cr,f)};
  }
  function labelsFor(fc,f){ var mi=monthIndex(f); return mi>=0 ? [fc.months[mi]||MONTHS[mi]] : fc.months.slice(0,12); }
  function chartValues(fc,metric,year,f){ var a=arrayFor(fc,metric,year,f); var mi=monthIndex(f); if(mi>=0) return [a[mi]]; if(String(year)==='2025') return a; var end=lastDataIndex(fc,'2026'); return a.map(function(v,i){ return i<=end || parseNum(v)!==0 ? v : null; }); }
  function cumulative(values){ var running=0; return values.map(function(v){ if(v==null) return null; running += parseNum(v); return running; }); }
  function destroyAll(){ Object.keys(window.pnlV80Charts || {}).forEach(function(id){ try{ window.pnlV80Charts[id].destroy(); }catch(e){} delete window.pnlV80Charts[id]; }); }
  function makeChart(id, config){ if(typeof Chart === 'undefined') return; var el=byId(id); if(!el) return; if(window.pnlV80Charts[id]){ try{ window.pnlV80Charts[id].destroy(); }catch(e){} } window.pnlV80Charts[id] = new Chart(el, config); }
  function chartOptions(extra){
    extra = extra || {};
    var base = {responsive:true, maintainAspectRatio:false, animation:{duration:700, easing:'easeOutQuart'}, interaction:{mode:'index', intersect:false}, plugins:{legend:{position:extra.legendPosition || 'top', labels:{boxWidth:10, usePointStyle:true, font:{size:10, weight:'700'}}}, tooltip:{callbacks:{label:function(ctx){ var raw = typeof ctx.parsed === 'object' ? (ctx.parsed.y != null ? ctx.parsed.y : ctx.parsed) : ctx.parsed; return (ctx.dataset && ctx.dataset.label ? ctx.dataset.label + ': ' : '') + money(raw); }}}}};
    if(extra.scales === false) base.scales = undefined; else base.scales = extra.scales || {x:{grid:{color:'rgba(15,42,26,.08)'}, ticks:{font:{size:10}}}, y:{grid:{color:'rgba(15,42,26,.08)'}, ticks:{font:{size:10}, callback:function(v){ return Math.abs(v)>=1000000?(v/1000000)+'M':Math.abs(v)>=1000?(v/1000)+'K':v; }}}};
    return Object.assign(base, extra);
  }
  function line(label,data,color,dashed){ return {label:label,data:data,borderColor:color,backgroundColor:color,borderWidth:3,tension:.35,pointRadius:3,pointHoverRadius:5,borderDash:dashed?[5,4]:[],fill:false,spanGaps:false}; }
  function bar(label,data,color,hidden){ return {label:label,data:data,backgroundColor:color,borderRadius:8,hidden:!!hidden}; }
  function doughnutData(labels,data,colorList){ return {labels:labels,datasets:[{data:data,backgroundColor:colorList,borderWidth:0,hoverOffset:5}]}; }
  function growthChip(now,prev){ var p=pct(now,prev); return (p>=0?'▲ ':'▼ ') + rate(Math.abs(p)); }
  function costParts(fc,year,range){ return {cogs:total(fc,'cogs',year,range,filters()), overheads:total(fc,'overheads',year,range,filters()), support:total(fc,'supportAllocation',year,range,filters())}; }
  function buildCards(fc,f){
    var c=colors(), t=selectedTotals(fc,f), py=t.primaryYear, comp=t.compareRange;
    var prevBooking=total(fc,'booking','2025',comp,f), prevCash=total(fc,'cashing','2025',comp,f), prevCost=total(fc,'cost','2025',comp,f);
    return [
      {k:'Booking '+py, v:t.booking, sub:'vs '+money(prevBooking)+' in 2025', chip:growthChip(t.booking,prevBooking), color:c.purple},
      {k:'Cashing '+py, v:t.cashing, sub:'vs '+money(prevCash)+' in 2025', chip:growthChip(t.cashing,prevCash), color:c.green},
      {k:costLabel(f)+' '+py, v:t.cost, sub:'COGS + Overheads + Support Allocation', chip:growthChip(t.cost,prevCost), color:c.amber, warn:true},
      {k:'Net Cash Position', v:t.net, sub:'Cashing - '+costLabel(f), chip:t.net>=0?'Above cost':'Below cost', color:t.net>=0?c.green:c.red, bad:t.net<0},
      {k:'Cash Coverage', v:t.coverage, rate:true, sub:'Cashing / '+costLabel(f), chip:t.coverage>=100?'Healthy':'Below cost', color:t.coverage>=100?c.green:c.red, bad:t.coverage<100},
      {k:'Booking → Cash', v:t.conversion, rate:true, sub:'Cashing / Booking', chip:t.conversion>=75?'Strong':'Watch', color:t.conversion>=75?c.green:c.amber, warn:t.conversion<75}
    ];
  }
  function selectHtml(fc){
    var f=filters(), months='<option value="all">All Months</option>';
    (fc ? fc.months : MONTHS).forEach(function(m,i){ months += '<option value="'+i+'">'+safe(m)+'</option>'; });
    return '<div class="pnl-v80-filters">'
      + '<select id="pnlV80Year"><option value="both">2025 vs 2026</option><option value="2025">2025 Only</option><option value="2026">2026 Only</option></select>'
      + '<select id="pnlV80Month">'+months+'</select>'
      + '<select id="pnlV80Metric"><option value="all">All Metrics</option><option value="booking">Booking</option><option value="cashing">Cashing</option><option value="cost">Cost</option></select>'
      + '<select id="pnlV80CostPart"><option value="all">Total Cost</option><option value="cogs">COGS</option><option value="overheads">Overheads</option><option value="supportAllocation">Support Allocation</option></select>'
      + '<select id="pnlV80Mode"><option value="monthly">Monthly</option><option value="ytd">Cumulative YTD</option></select>'
      + '</div>';
  }
  function bindFilters(){
    var map={pnlV80Year:'year',pnlV80Month:'month',pnlV80Metric:'metric',pnlV80Mode:'mode',pnlV80CostPart:'costPart'};
    Object.keys(map).forEach(function(id){ var el=byId(id); if(!el) return; var key=map[id]; el.value = filters()[key]; el.onchange=function(){ window.PNL_V80_FILTERS[key]=this.value; window.RET_FIN_CHART_FILTERS = Object.assign({}, window.RET_FIN_CHART_FILTERS || {}, {year:window.PNL_V80_FILTERS.year, month:window.PNL_V80_FILTERS.month, metric:window.PNL_V80_FILTERS.metric, mode:window.PNL_V80_FILTERS.mode}); renderRevenue(false); }; });
  }
  function takeaways(fc,f){
    var c=colors(), t=selectedTotals(fc,f), parts=costParts(fc,t.primaryYear,t.range), totalParts=parts.cogs+parts.overheads+parts.support;
    var biggest = [{k:'COGS',v:parts.cogs,c:c.blue},{k:'Overheads',v:parts.overheads,c:c.amber},{k:'Support Allocation',v:parts.support,c:c.purple}].sort(function(a,b){return Math.abs(b.v)-Math.abs(a.v);})[0];
    var prevCash=total(fc,'cashing','2025',t.compareRange,f), prevBooking=total(fc,'booking','2025',t.compareRange,f);
    var bestMonthIndex=0, bestCash=-Infinity; chartValues(fc,'cashing',t.primaryYear,f).forEach(function(v,i){ if(v!=null && parseNum(v)>bestCash){bestCash=parseNum(v);bestMonthIndex=i;} });
    return [
      {c:t.net>=0?c.green:c.red, t:'Net cash position is '+signedMoney(t.net)+' for '+scopeText(fc,f)+'.'},
      {c:pct(t.booking,prevBooking)>=0?c.green:c.red, t:'Booking is '+growthChip(t.booking,prevBooking)+' vs same 2025 scope.'},
      {c:pct(t.cashing,prevCash)>=0?c.green:c.red, t:'Cashing is '+growthChip(t.cashing,prevCash)+' vs same 2025 scope.'},
      {c:biggest.c, t:biggest.k+' is the largest cost component at '+money(biggest.v)+' ('+rate(totalParts ? biggest.v/totalParts*100 : 0)+' of total cost).'},
      {c:c.blue, t:'Best cashing month in the selected view is '+(fc.months[bestMonthIndex]||MONTHS[bestMonthIndex])+' with '+money(bestCash)+'.'}
    ];
  }
  function buildTable(fc,f,t){
    var py=t.primaryYear, rows='', r=t.range, end = monthIndex(f)>=0 ? r.end : 11;
    for(var i=r.start;i<=end;i++){
      if(f.year==='2026' && i>lastDataIndex(fc,'2026')) continue;
      var b25=fc.booking2025[i], b26=fc.booking2026[i], ca25=fc.cashing2025[i], ca26=fc.cashing2026[i];
      var cogs=fc['cogs'+py][i], oh=fc['overheads'+py][i], sup=fc['supportAllocation'+py][i], cost=cogs+oh+sup, cash=fc['cashing'+py][i], net=cash-cost, cov=cost?cash/cost*100:0;
      rows += '<tr><td><strong>'+safe(fc.months[i]||MONTHS[i])+'</strong></td><td class="c">'+money(b25)+'</td><td class="c">'+money(b26)+'</td><td class="c">'+money(ca25)+'</td><td class="c">'+money(ca26)+'</td><td class="c">'+money(cogs)+'</td><td class="c">'+money(oh)+'</td><td class="c">'+money(sup)+'</td><td class="c"><strong>'+money(cost)+'</strong></td><td class="c '+(net>=0?'pnl-v80-good':'pnl-v80-bad')+'"><strong>'+signedMoney(net)+'</strong></td><td class="c '+(cov>=100?'pnl-v80-good':'pnl-v80-bad')+'"><strong>'+rate(cov)+'</strong></td></tr>';
    }
    return '<div class="pnl-v80-table-wrap"><table class="pnl-v80-table"><thead><tr><th>Month</th><th class="c">Booking 2025</th><th class="c">Booking 2026</th><th class="c">Cashing 2025</th><th class="c">Cashing 2026</th><th class="c">COGS '+py+'</th><th class="c">Overheads '+py+'</th><th class="c">Support '+py+'</th><th class="c">Total Cost</th><th class="c">Net Cash</th><th class="c">Coverage</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  }
  function renderLoading(){ var block=mount(); if(!block) return; destroyAll(); block.innerHTML='<div class="pnl-v80-head"><div><div class="pnl-v80-title">Executive P&L Dashboard</div><div class="pnl-v80-sub">Preparing ForReporting data · calculating cost breakdown and finance charts</div></div><div class="pnl-v80-live"><span class="pnl-v80-pulse"></span>Loading live view</div></div><div class="pnl-v80-loader"><div class="pnl-v80-loader-top"><span class="pnl-v80-spinner"></span><span>Reading financeComparison, building P&L metrics, and drawing charts...</span></div><div class="pnl-v80-skeleton-grid"><div class="pnl-v80-skeleton"></div><div class="pnl-v80-skeleton"></div><div class="pnl-v80-skeleton"></div><div class="pnl-v80-skeleton"></div><div class="pnl-v80-skeleton chart"></div><div class="pnl-v80-skeleton chart"></div><div class="pnl-v80-skeleton chart"></div><div class="pnl-v80-skeleton chart"></div></div></div>'; }
  function ensurePanel(){ var panel=byId('panel-retention-revenue'); if(!panel){ panel=document.createElement('div'); panel.className='panel'; panel.id='panel-retention-revenue'; var dash=byId('dashMain')||document.querySelector('.content'); if(dash) dash.appendChild(panel); } panel.innerHTML = panel.innerHTML || '<div class="ret-fin-hero" style="border-left-color:var(--blue)"><div class="ret-fin-hero-icon">📊</div><div><div class="ret-fin-hero-title">P&amp;L</div><div class="ret-fin-hero-sub">Executive dynamic view from ForReporting with revenue, booking, cashing, cost, and break-even charts.</div></div></div><div id="retRevenueAnalysisMount"></div>'; var title=panel.querySelector('.ret-fin-hero-title'); if(title) title.innerHTML='P&amp;L'; var sub=panel.querySelector('.ret-fin-hero-sub'); if(sub) sub.textContent='Executive dynamic view from ForReporting with Booking, Cashing, Total Cost, COGS, Overheads, Support Allocation, and break-even analysis.'; var mount=byId('retRevenueAnalysisMount'); if(!mount){ mount=document.createElement('div'); mount.id='retRevenueAnalysisMount'; panel.appendChild(mount); } return panel; }
  function mount(){ ensurePanel(); var m=byId('retRevenueAnalysisMount'); if(!m) return null; var block=byId('retFinanceComparisonBlock'); if(!block){ block=document.createElement('div'); block.id='retFinanceComparisonBlock'; m.appendChild(block); } if(block.parentNode!==m) m.appendChild(block); block.className='pnl-v80-board'; return block; }
  function renderRevenue(animate){
    var block=mount(); if(!block) return; var fc=getFC(); if(!fc){ block.innerHTML='<div class="pnl-v80-head"><div><div class="pnl-v80-title">Executive P&L Dashboard</div><div class="pnl-v80-sub">Waiting for Supabase P&L views</div></div></div><div class="pnl-v80-empty">No financeComparison found yet. Run the Retention workflow, then refresh the dashboard.</div>'; return; }
    var f=filters(), t=selectedTotals(fc,f), c=colors(), cards=buildCards(fc,f), py=t.primaryYear, avgCost=t.cost/Math.max(1,t.range.months), avgCash=t.cashing/Math.max(1,t.range.months), parts=costParts(fc,py,t.range), totalParts=parts.cogs+parts.overheads+parts.support, scope=scopeText(fc,f), monthActive=monthIndex(f)>=0;
    block.innerHTML='<div class="pnl-v80-head"><div><div class="pnl-v80-title">Executive P&L Dashboard</div><div class="pnl-v80-sub">Source: '+safe(fc.source)+' · Scope: '+safe(scope)+' · Updated '+safe(fc.lastUpdated||'live')+'</div></div><div class="pnl-v80-actions"><div class="pnl-v80-live"><span class="pnl-v80-pulse"></span>Dynamic · ForReporting</div>'+selectHtml(fc)+'</div></div><div class="pnl-v80-note"><strong>Total Cost = COGS + Overheads + Support Allocation.</strong> 2025 can be viewed as the full closed year. 2026 uses actual available months to date unless a specific month is selected.</div><div class="pnl-v80-kpis">'+cards.map(function(card){ return '<div class="pnl-v80-kpi" style="--kc:'+card.color+'"><div class="pnl-v80-kpi-label">'+safe(card.k)+'</div><div class="pnl-v80-kpi-value" data-pnl-count="'+safe(card.v)+'" data-pnl-rate="'+(card.rate?'1':'0')+'">'+(card.rate?rate(card.v):shortMoney(card.v))+'</div><div class="pnl-v80-kpi-note">'+safe(card.sub)+'</div><div class="pnl-v80-chip '+(card.bad?'bad':card.warn?'warn':'')+'">'+safe(card.chip)+'</div></div>'; }).join('')+'</div><div class="pnl-v80-body"><div class="pnl-v80-card"><div class="pnl-v80-card-title">YTD / Period comparison</div><div class="pnl-v80-card-sub">'+safe(scope)+'</div><div class="pnl-v80-chart-wrap"><canvas id="pnlV80YtdChart"></canvas></div></div><div class="pnl-v80-card"><div class="pnl-v80-card-title">Break-even analysis</div><div class="pnl-v80-card-sub">Cash coverage against '+safe(costLabel(f))+'</div><div class="pnl-v80-mini-grid"><div class="pnl-v80-mini"><div class="pnl-v80-mini-k">Avg cost / month</div><div class="pnl-v80-mini-v" style="--mc:var(--amber)">'+money(avgCost)+'</div></div><div class="pnl-v80-mini"><div class="pnl-v80-mini-k">Avg cashing / month</div><div class="pnl-v80-mini-v" style="--mc:var(--green)">'+money(avgCash)+'</div></div><div class="pnl-v80-mini"><div class="pnl-v80-mini-k">Monthly gap</div><div class="pnl-v80-mini-v" style="--mc:'+(avgCash-avgCost>=0?'var(--green)':'var(--red)')+'">'+signedMoney(avgCash-avgCost)+'</div></div><div class="pnl-v80-mini"><div class="pnl-v80-mini-k">Coverage</div><div class="pnl-v80-mini-v" style="--mc:'+(t.coverage>=100?'var(--green)':'var(--red)')+'">'+rate(t.coverage)+'</div></div></div><div class="pnl-v80-chart-wrap"><canvas id="pnlV80CoverageChart"></canvas></div></div><div class="pnl-v80-card"><div class="pnl-v80-card-title">Monthly trend</div><div class="pnl-v80-card-sub">'+(f.mode==='ytd'?'Cumulative YTD movement':'Month-by-month movement')+'</div><div class="pnl-v80-chart-wrap tall"><canvas id="pnlV80TrendChart"></canvas></div></div><div class="pnl-v80-card"><div class="pnl-v80-card-title">Cost breakdown</div><div class="pnl-v80-card-sub">COGS · Overheads · Support Allocation for '+safe(py)+'</div><div class="pnl-v80-cost-grid"><div class="pnl-v80-cost-box" style="--cc:var(--blue)"><div class="pnl-v80-cost-v">'+shortMoney(parts.cogs)+'</div><div class="pnl-v80-cost-l">COGS</div><div class="pnl-v80-cost-s">'+rate(totalParts?parts.cogs/totalParts*100:0)+' of cost</div></div><div class="pnl-v80-cost-box" style="--cc:var(--amber)"><div class="pnl-v80-cost-v">'+shortMoney(parts.overheads)+'</div><div class="pnl-v80-cost-l">Overheads</div><div class="pnl-v80-cost-s">'+rate(totalParts?parts.overheads/totalParts*100:0)+' of cost</div></div><div class="pnl-v80-cost-box" style="--cc:var(--purple)"><div class="pnl-v80-cost-v">'+shortMoney(parts.support)+'</div><div class="pnl-v80-cost-l">Support Allocation</div><div class="pnl-v80-cost-s">'+rate(totalParts?parts.support/totalParts*100:0)+' of cost</div></div></div><div class="pnl-v80-chart-wrap"><canvas id="pnlV80CostStackedChart"></canvas></div></div><div class="pnl-v80-card"><div class="pnl-v80-card-title">Cash vs cost gap</div><div class="pnl-v80-card-sub">Cash - '+safe(costLabel(f))+' gap trajectory</div><div class="pnl-v80-chart-wrap"><canvas id="pnlV80GapChart"></canvas></div></div><div class="pnl-v80-card"><div class="pnl-v80-card-title">Value mix</div><div class="pnl-v80-card-sub">Booking · Cashing · '+safe(costLabel(f))+' for '+safe(py)+'</div><div class="pnl-v80-chart-wrap"><canvas id="pnlV80MixChart"></canvas></div></div><div class="pnl-v80-card wide"><div class="pnl-v80-card-title">Monthly P&L table</div><div class="pnl-v80-card-sub">2025 and 2026 visible together, with '+safe(py)+' cost breakdown columns</div>'+buildTable(fc,f,t)+'</div><div class="pnl-v80-card wide"><div class="pnl-v80-card-title">Key takeaways</div><div class="pnl-v80-card-sub">Auto-generated from the selected filters</div>'+takeaways(fc,f).map(function(x){return '<div class="pnl-v80-takeaway"><span class="pnl-v80-dot" style="--tc:'+x.c+'"></span><div>'+safe(x.t)+'</div></div>';}).join('')+'</div></div>';
    bindFilters();
    if(animate !== false) document.querySelectorAll('#retFinanceComparisonBlock [data-pnl-count]').forEach(function(el){ var val=parseNum(el.getAttribute('data-pnl-count')); var isRate=el.getAttribute('data-pnl-rate')==='1'; countUp(el,val,isRate?rate:shortMoney); });
    if(typeof Chart === 'undefined') return; destroyAll();
    var include25=f.year!=='2026', include26=f.year!=='2025', labels=labelsFor(fc,f), mode=f.mode||'monthly', metricLabels=f.metric==='all'?['Booking','Cashing',costLabel(f)]:[metricLabel(f.metric,f)];
    var bar25=f.metric==='all'?[t.booking25,t.cashing25,t.cost25]:[total(fc,f.metric,'2025',t.compareRange,f)], bar26=f.metric==='all'?[t.booking26,t.cashing26,t.cost26]:[total(fc,f.metric,'2026',t.compareRange,f)];
    if(f.year==='2025') bar25=f.metric==='all'?[total(fc,'booking','2025',t.range,f),total(fc,'cashing','2025',t.range,f),total(fc,'cost','2025',t.range,f)]:[total(fc,f.metric,'2025',t.range,f)];
    if(f.year==='2026') bar26=f.metric==='all'?[total(fc,'booking','2026',t.range,f),total(fc,'cashing','2026',t.range,f),total(fc,'cost','2026',t.range,f)]:[total(fc,f.metric,'2026',t.range,f)];
    makeChart('pnlV80YtdChart',{type:'bar',data:{labels:metricLabels,datasets:[bar('2025',bar25,c.muted,!include25),bar('2026',bar26,c.blue,!include26)]},options:chartOptions()});
    var sets=[]; function add(metric,year,color,dashed){ var vals=chartValues(fc,metric,year,f); sets.push(line(metricLabel(metric,f)+' '+year,mode==='ytd'?cumulative(vals):vals,color,dashed)); }
    if(f.metric==='all'){ if(include26){ add('booking','2026',c.purple,false); add('cashing','2026',c.green,false); add('cost','2026',c.amber,false); } if(include25){ add('booking','2025',c.purple,true); add('cashing','2025',c.green,true); add('cost','2025',c.amber,true); } } else { var mc=metricColor(f.metric,f); if(include25) add(f.metric,'2025',f.year==='both'?c.muted:mc,true); if(include26) add(f.metric,'2026',f.year==='both'?c.blue:mc,false); }
    makeChart('pnlV80TrendChart',{type:'line',data:{labels:labels,datasets:sets},options:chartOptions()});
    var covered=Math.min(t.cashing,t.cost), gapAbs=Math.abs(t.net); makeChart('pnlV80CoverageChart',{type:'doughnut',data:doughnutData([t.coverage>=100?'Cost covered':'Cash covered',t.coverage>=100?'Surplus':'Shortfall'],[covered,gapAbs],[c.green,t.coverage>=100?c.blue:c.red]),options:chartOptions({scales:false,legendPosition:'bottom'})});
    makeChart('pnlV80MixChart',{type:'doughnut',data:doughnutData(['Booking '+py,'Cashing '+py,costLabel(f)+' '+py],[t.booking,t.cashing,t.cost],[c.purple,c.green,c.amber]),options:chartOptions({scales:false,legendPosition:'bottom'})});
    var cogsVals=chartValues(fc,'cogs',py,f), ohVals=chartValues(fc,'overheads',py,f), supVals=chartValues(fc,'supportAllocation',py,f); makeChart('pnlV80CostStackedChart',{type:'bar',data:{labels:labels,datasets:[{label:'COGS',data:cogsVals,backgroundColor:c.blue,stack:'cost'},{label:'Overheads',data:ohVals,backgroundColor:c.amber,stack:'cost'},{label:'Support Allocation',data:supVals,backgroundColor:c.purple,stack:'cost'}]},options:chartOptions({scales:{x:{stacked:true,grid:{color:'rgba(15,42,26,.08)'},ticks:{font:{size:10}}},y:{stacked:true,grid:{color:'rgba(15,42,26,.08)'},ticks:{font:{size:10},callback:function(v){return Math.abs(v)>=1000000?(v/1000000)+'M':Math.abs(v)>=1000?(v/1000)+'K':v;}}}}})});
    var gapValues = monthActive ? [arrayFor(fc,'cashing',py,f)[monthIndex(f)] - arrayFor(fc,'cost',py,f)[monthIndex(f)]] : chartValues(fc,'cashing',py,f).map(function(v,i){ if(v==null) return null; return sumRange(arrayFor(fc,'cashing',py,f),0,i) - sumRange(arrayFor(fc,'cost',py,f),0,i); });
    makeChart('pnlV80GapChart',{type:'bar',data:{labels:labels,datasets:[bar('Cash - '+costLabel(f)+' gap '+py,gapValues,t.net>=0?c.green:c.red,false)]},options:chartOptions()});
  }
  function countUp(el,target,formatter){ var start=performance.now(),duration=650; function tick(now){ var p=Math.min(1,(now-start)/duration), eased=1-Math.pow(1-p,3); el.textContent=formatter(target*eased); if(p<1)requestAnimationFrame(tick); } requestAnimationFrame(tick); }
  function cleanNav(active){ var main=byId('side-revenue-analysis-main'); if(main){ main.innerHTML='<span class="nav-icon" style="color:var(--blue)">📊</span> P&amp;L'; main.setAttribute('onclick','switchRetentionRevenueAnalysis()'); main.classList.toggle('active',!!active); } document.querySelectorAll('#side-ret-revenue-analysis').forEach(function(el){ el.remove(); }); }
  function activate(skipScroll){
    window.APP_MAIN_PANEL='retention'; window.APP_RETENTION_VIEW='revenue'; window.APP_RETENTION_OWNER_ID=null; window.RET_SELECTED_OWNER_ID=null; window.RETENTION_SUBVIEW='revenue';
    try{ APP_MAIN_PANEL='retention'; APP_RETENTION_VIEW='revenue'; APP_RETENTION_OWNER_ID=null; RET_SELECTED_OWNER_ID=null; RETENTION_SUBVIEW='revenue'; }catch(e){}
    ensurePanel(); document.querySelectorAll('.tab-btn,.panel,.nav-item').forEach(function(x){ x.classList.remove('active'); }); var tabs=byId('tabsBar'); if(tabs) tabs.style.display='none'; var panel=byId('panel-retention-revenue'); if(panel) panel.classList.add('active'); if(typeof window.renderRetentionSidebar==='function'){ try{ window.renderRetentionSidebar('revenue'); }catch(e){} } cleanNav(true); var title=byId('topbarTitle'); if(title) title.textContent='P&L · Revenue Analysis'; var sub=byId('topbarSub'); if(sub) sub.textContent='ForReporting · 2025 full year · 2026 actual to date · COGS + Overheads + Support Allocation'; renderLoading(); clearTimeout(renderTimer); renderTimer=setTimeout(function(){ renderRevenue(true); },260); if(!skipScroll) window.scrollTo({top:0,behavior:'smooth'});
  }
  window.switchRetentionRevenueAnalysis=function(){ activate(false); };
  window.renderFinanceComparisonCharts=function(){ renderRevenue(false); };
  try{ switchRetentionRevenueAnalysis=window.switchRetentionRevenueAnalysis; }catch(e){}
  var oldSidebar=window.renderRetentionSidebar; if(typeof oldSidebar==='function'&&!oldSidebar.__pnlV80){ window.renderRetentionSidebar=function(activeMode){ var result=oldSidebar.apply(this,arguments); cleanNav(activeMode==='revenue'||window.APP_RETENTION_VIEW==='revenue'); return result; }; window.renderRetentionSidebar.__pnlV80=true; try{ renderRetentionSidebar=window.renderRetentionSidebar; }catch(e){} }
  var oldRestore=window.restoreCurrentView; if(typeof oldRestore==='function'&&!oldRestore.__pnlV80){ window.restoreCurrentView=function(){ if(window.APP_MAIN_PANEL==='retention'&&window.APP_RETENTION_VIEW==='revenue'){ activate(true); return; } return oldRestore.apply(this,arguments); }; window.restoreCurrentView.__pnlV80=true; try{ restoreCurrentView=window.restoreCurrentView; }catch(e){} }
  var oldLoad=window.loadData; if(typeof oldLoad==='function'&&!oldLoad.__pnlV80){ window.loadData=async function(){ var wasPnl=window.APP_MAIN_PANEL==='retention'&&window.APP_RETENTION_VIEW==='revenue'; if(wasPnl) renderLoading(); var out=oldLoad.apply(this,arguments); if(out&&typeof out.then==='function') await out; try{ if(typeof R!=='undefined'&&R) window.R=R; if(typeof D!=='undefined'&&D) window.D=D; }catch(e){} if(wasPnl||window.APP_RETENTION_VIEW==='revenue') setTimeout(function(){ activate(true); },0); return out; }; window.loadData.__pnlV80=true; try{ loadData=window.loadData; }catch(e){} }
  function init(){ ensurePanel(); cleanNav(window.APP_RETENTION_VIEW==='revenue'); if(window.APP_MAIN_PANEL==='retention'&&window.APP_RETENTION_VIEW==='revenue') activate(true); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else setTimeout(init,0); setTimeout(init,500);
})();
