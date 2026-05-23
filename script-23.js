(function(){
  window.__RET_REVENUE_FILTERS_V70__ = true;
  window.RET_FIN_CHART_FILTERS = Object.assign({metric:'all', mode:'monthly', year:'both', month:'all'}, window.RET_FIN_CHART_FILTERS || {});
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var renderTimer = null;
  function byId(id){ return document.getElementById(id); }
  function safe(v){ return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
  function n(v){ var x = Number(String(v == null ? '' : v).replace(/[$,%\s,]/g,'')); return Number.isFinite(x) ? x : 0; }
  function pad(v){ var a = Array.isArray(v) ? v.slice(0,12).map(n) : []; while(a.length < 12) a.push(0); return a; }
  function sumRange(a,start,end){ a = pad(a); var total = 0; for(var i=start;i<=end;i++) total += n(a[i]); return total; }
  function money(v){ return '$' + Math.round(n(v)).toLocaleString('en-US'); }
  function shortMoney(v){ v = n(v); if(Math.abs(v) >= 1000000) return '$' + (v/1000000).toFixed(1).replace('.0','') + 'M'; if(Math.abs(v) >= 1000) return '$' + Math.round(v/1000).toLocaleString('en-US') + 'K'; return money(v); }
  function signedMoney(v){ v = n(v); return v < 0 ? '(' + money(Math.abs(v)) + ')' : money(v); }
  function rate(v){ return n(v).toFixed(1).replace('.0','') + '%'; }
  function pct(now, prev){ now = n(now); prev = n(prev); return prev ? ((now - prev) / Math.abs(prev)) * 100 : 0; }
  function css(name, defaultValue){ var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || defaultValue; }
  function colors(){ return {green:css('--green','#16A34A'), purple:css('--purple','#7C3AED'), amber:css('--amber','#D97706'), blue:css('--blue','#2563EB'), cyan:css('--cyan','#0891B2'), red:css('--red','#DC2626'), muted:'#9CA3AF'}; }
  function sourceData(){
    var candidates = [];
    try{ if(window.R) candidates.push(window.R); }catch(e){}
    try{ if(typeof R !== 'undefined' && R) candidates.push(R); }catch(e){}
    try{ if(window.D) candidates.push(window.D); }catch(e){}
    try{ if(typeof D !== 'undefined' && D) candidates.push(D); }catch(e){}
    for(var i=0;i<candidates.length;i++){
      if(candidates[i] && candidates[i].financeComparison) return candidates[i].financeComparison;
      if(candidates[i] && candidates[i].retentionData && candidates[i].retentionData.financeComparison) return candidates[i].retentionData.financeComparison;
    }
    return null;
  }
  function metricArray(fc, metric, year){
    if(!fc) return pad([]);
    var raw = fc.raw || {};
    if(raw[metric] && raw[metric][String(year)]) return pad(raw[metric][String(year)]);
    if(Array.isArray(fc[metric + year])) return pad(fc[metric + year]);
    if(Array.isArray(fc[metric + String(year)])) return pad(fc[metric + String(year)]);
    var out = Array(12).fill(0);
    if(Array.isArray(fc.monthly)) fc.monthly.forEach(function(row,i){
      if(i > 11 || !row) return;
      var keys = [metric + year, metric + String(year), metric + '_' + year, metric + 'Year' + year];
      for(var k=0;k<keys.length;k++) if(row[keys[k]] != null){ out[i] = n(row[keys[k]]); return; }
    });
    return out;
  }
  function normalize(fc){
    if(!fc || typeof fc !== 'object') return null;
    var out = {source:fc.source || 'ForReporting', lastUpdated:fc.lastUpdated || '', activeMonthIndex:Number.isFinite(Number(fc.activeMonthIndex)) ? Number(fc.activeMonthIndex) : 4, months:Array.isArray(fc.months) && fc.months.length ? fc.months.slice(0,12) : MONTHS.slice()};
    ['booking','cashing','cost','cogs','overheads','supportAllocation'].forEach(function(m){ out[m+'2025'] = metricArray(fc,m,2025); out[m+'2026'] = metricArray(fc,m,2026); });
    for(var i=0;i<12;i++){
      if(!out.cost2025[i]) out.cost2025[i] = out.cogs2025[i] + out.overheads2025[i];
      if(!out.cost2026[i]) out.cost2026[i] = out.cogs2026[i] + out.overheads2026[i];
    }
    var has = ['booking2025','booking2026','cashing2025','cashing2026','cost2025','cost2026'].some(function(k){ return out[k].some(function(v){ return n(v) !== 0; }); });
    return has ? out : null;
  }
  function getFC(){ return normalize(sourceData()); }
  function lastDataIndex(fc, year){
    var idx = -1;
    ['booking','cashing','cost'].forEach(function(m){ pad(fc[m + year]).forEach(function(v,i){ if(n(v) !== 0) idx = Math.max(idx,i); }); });
    if(String(year) === '2026') idx = Math.max(idx, Math.min(11, Math.max(0, n(fc.activeMonthIndex))));
    if(String(year) === '2025') idx = 11;
    return idx < 0 ? 0 : Math.min(11, idx);
  }
  function filters(){ var f = window.RET_FIN_CHART_FILTERS || {}; return {metric:f.metric || 'all', mode:f.mode || 'monthly', year:f.year || 'both', month:f.month || 'all'}; }
  function monthIndex(f){ return f.month === 'all' ? -1 : Math.max(0, Math.min(11, n(f.month))); }
  function rangeFor(fc, year, f){
    var mi = monthIndex(f);
    if(mi >= 0) return {start:mi, end:mi, label:fc.months[mi] || MONTHS[mi], months:1};
    if(String(year) === '2025') return {start:0, end:11, label:'Jan - Dec', months:12};
    var end = lastDataIndex(fc,'2026');
    return {start:0, end:end, label:'Jan - ' + (fc.months[end] || MONTHS[end]), months:end + 1};
  }
  function compareRangeFor(fc, f){
    var mi = monthIndex(f);
    if(mi >= 0) return {start:mi, end:mi, label:fc.months[mi] || MONTHS[mi], months:1};
    var end = lastDataIndex(fc,'2026');
    return {start:0, end:end, label:'Jan - ' + (fc.months[end] || MONTHS[end]), months:end + 1};
  }
  function primaryYear(f){ return f.year === '2025' ? '2025' : '2026'; }
  function yearLabel(f){ if(f.year === '2025') return '2025'; if(f.year === '2026') return '2026'; return '2025 vs 2026'; }
  function scopeText(fc, f){
    var mi = monthIndex(f);
    if(mi >= 0) return (fc.months[mi] || MONTHS[mi]) + ' · ' + yearLabel(f);
    if(f.year === '2025') return 'Jan - Dec 2025 · full closed year';
    if(f.year === '2026') return rangeFor(fc,'2026',f).label + ' 2026 · actual to date';
    return compareRangeFor(fc,f).label + ' · like-for-like comparison';
  }
  function metricMeta(metric){
    if(metric === 'booking') return {label:'Booking', color:colors().purple};
    if(metric === 'cashing') return {label:'Cashing', color:colors().green};
    if(metric === 'cost') return {label:'Cost', color:colors().amber};
    return {label:'All Metrics', color:colors().blue};
  }
  function total(fc, metric, year, range){ return sumRange(fc[metric + year], range.start, range.end); }
  function selectedTotals(fc, f){
    var py = primaryYear(f), r = f.year === 'both' ? compareRangeFor(fc,f) : rangeFor(fc,py,f), cr = f.year === '2025' ? rangeFor(fc,'2025',f) : compareRangeFor(fc,f);
    var booking = total(fc,'booking',py,r), cashing = total(fc,'cashing',py,r), cost = total(fc,'cost',py,r);
    var b25 = total(fc,'booking','2025',cr), b26 = total(fc,'booking','2026',cr), ca25 = total(fc,'cashing','2025',cr), ca26 = total(fc,'cashing','2026',cr), co25 = total(fc,'cost','2025',cr), co26 = total(fc,'cost','2026',cr);
    return {primaryYear:py, range:r, compareRange:cr, booking:booking, cashing:cashing, cost:cost, coverage:cost ? cashing / cost * 100 : 0, gap:cashing - cost, booking25:b25, booking26:b26, cashing25:ca25, cashing26:ca26, cost25:co25, cost26:co26};
  }
  function chartValues(fc, metric, year, f){
    var a = pad(fc[metric + year]);
    var mi = monthIndex(f);
    if(mi >= 0) return [a[mi]];
    if(String(year) === '2025') return a;
    var end = lastDataIndex(fc,'2026');
    return a.map(function(v,i){ return i <= end || n(v) !== 0 ? v : null; });
  }
  function cumulative(values){ var running = 0; return values.map(function(v){ if(v == null) return null; running += n(v); return running; }); }
  function labelsFor(fc, f){ var mi = monthIndex(f); return mi >= 0 ? [fc.months[mi] || MONTHS[mi]] : fc.months.slice(0,12); }
  function destroyAll(){ if(!window.retExecCharts) window.retExecCharts = {}; Object.keys(window.retExecCharts).forEach(function(id){ try{ window.retExecCharts[id].destroy(); }catch(e){} delete window.retExecCharts[id]; }); }
  function makeChart(id, config){ if(typeof Chart === 'undefined') return; var el = byId(id); if(!el) return; if(!window.retExecCharts) window.retExecCharts = {}; if(window.retExecCharts[id]){ try{ window.retExecCharts[id].destroy(); }catch(e){} } window.retExecCharts[id] = new Chart(el, config); }
  function chartOptions(extra){
    extra = extra || {};
    return Object.assign({responsive:true, maintainAspectRatio:false, animation:{duration:700, easing:'easeOutQuart'}, interaction:{mode:'index', intersect:false}, plugins:{legend:{position:extra.legendPosition || 'top', labels:{boxWidth:10, usePointStyle:true, font:{size:10, weight:'700'}}}, tooltip:{callbacks:{label:function(ctx){ return (ctx.dataset.label ? ctx.dataset.label + ': ' : '') + money(ctx.parsed.y == null ? ctx.parsed : ctx.parsed.y); }}}}, scales:extra.scales === false ? undefined : {x:{grid:{color:'rgba(15,42,26,.08)'}, ticks:{font:{size:10}}}, y:{grid:{color:'rgba(15,42,26,.08)'}, ticks:{font:{size:10}, callback:function(v){ return Math.abs(v) >= 1000000 ? (v/1000000)+'M' : Math.abs(v) >= 1000 ? (v/1000)+'K' : v; }}}}}, extra);
  }
  function line(label, data, color, dashed){ return {label:label, data:data, borderColor:color, backgroundColor:color, borderWidth:3, tension:.35, pointRadius:3, pointHoverRadius:5, borderDash:dashed ? [5,4] : [], fill:false, spanGaps:false}; }
  function bar(label, data, color, hidden){ return {label:label, data:data, backgroundColor:color, borderRadius:8, hidden:!!hidden}; }
  function doughnutData(labels, data, colorList){ return {labels:labels, datasets:[{data:data, backgroundColor:colorList, borderWidth:0, hoverOffset:5}]}; }
  function growthChip(now, prev){ var p = pct(now, prev); return (p >= 0 ? '▲ ' : '▼ ') + rate(Math.abs(p)); }
  function buildCards(fc, f){
    var c = colors(), t = selectedTotals(fc,f), py = t.primaryYear, r = t.range, compare = f.year === '2025' ? null : t.compareRange;
    var bPrev = compare ? t.booking25 : 0, caPrev = compare ? t.cashing25 : 0, coPrev = compare ? t.cost25 : 0;
    var monthMode = monthIndex(f) >= 0;
    var suffix = monthMode ? r.label + ' ' + py : (py === '2025' ? '2025 Full Year' : '2026 YTD');
    return [
      {k:'Booking ' + suffix, v:t.booking, c:c.blue, sub:compare ? 'vs ' + money(bPrev) + ' in 2025 · ' + t.compareRange.label : 'Full 2025 actuals from Jan to Dec', chip:compare ? growthChip(t.booking,bPrev) : 'Closed year'},
      {k:'Cashing ' + suffix, v:t.cashing, c:c.green, sub:compare ? 'vs ' + money(caPrev) + ' in 2025 · ' + t.compareRange.label : 'Full 2025 actuals from Jan to Dec', chip:compare ? growthChip(t.cashing,caPrev) : 'Closed year'},
      {k:'Cost ' + suffix, v:t.cost, c:c.amber, sub:compare ? 'vs ' + money(coPrev) + ' in 2025 · ' + t.compareRange.label : 'Full 2025 actuals from Jan to Dec', chip:compare ? growthChip(t.cost,coPrev) : 'Closed year'},
      {k:'Cash Coverage', v:t.coverage, c:t.coverage >= 100 ? c.green : c.red, sub:money(t.cashing) + ' cash vs ' + money(t.cost) + ' cost', chip:t.coverage >= 100 ? 'Above cost' : 'Below cost', rate:true, bad:t.coverage < 100}
    ];
  }
  function takeaways(fc, f){
    var c = colors(), t = selectedTotals(fc,f), m = metricMeta(f.metric), out = [];
    if(f.year === '2025') out.push({c:c.blue, t:'2025 filter is showing the complete closed year from January to December, not only the current 2026 active range.'});
    else if(f.year === '2026') out.push({c:c.green, t:'2026 filter is showing actual data available to date and keeps the current active month included in the totals.'});
    else out.push({c:c.blue, t:'2025 vs 2026 is using a like-for-like range so 2026 is not unfairly compared against the full closed 2025 year.'});
    if(monthIndex(f) >= 0) out.push({c:c.purple, t:'Month filter is active for ' + t.range.label + ', so all KPIs and charts are scoped to that month only.'});
    if(t.coverage < 100) out.push({c:c.red, t:'Cash coverage is ' + rate(t.coverage) + ', leaving a cash-vs-cost gap of ' + signedMoney(t.gap) + ' for the selected scope.'});
    else out.push({c:c.green, t:'Cash coverage is ' + rate(t.coverage) + ', so cashing is above the selected cost base.'});
    if(f.metric !== 'all') out.push({c:m.color, t:'Metric filter is focused on ' + m.label + ', while the KPI cards still keep the executive booking/cashing/cost context visible.'});
    return out;
  }
  function selectHtml(){
    var f = filters();
    var monthOptions = '<option value="all">All Months</option>' + MONTHS.map(function(m,i){ return '<option value="'+i+'">'+m+'</option>'; }).join('');
    return '<div class="ret-exec-filters"><select id="retFinChartYear"><option value="both">2025 vs 2026</option><option value="2025">2025</option><option value="2026">2026</option></select><select id="retFinChartMonth">'+monthOptions+'</select><select id="retFinChartMetric"><option value="all">All Metrics</option><option value="booking">Booking</option><option value="cashing">Cashing</option><option value="cost">Cost</option></select><select id="retFinChartMode"><option value="monthly">Monthly</option><option value="ytd">Cumulative YTD</option></select></div>';
  }
  function bindFilters(){
    [['retFinChartMetric','metric'],['retFinChartMode','mode'],['retFinChartYear','year'],['retFinChartMonth','month']].forEach(function(pair){
      var el = byId(pair[0]);
      if(!el) return;
      el.value = (window.RET_FIN_CHART_FILTERS && window.RET_FIN_CHART_FILTERS[pair[1]]) || el.value;
      el.onchange = function(){ window.RET_FIN_CHART_FILTERS[pair[1]] = this.value; renderRevenue(false); };
    });
  }
  function ensureRevenuePanel(){
    var panel = byId('panel-retention-revenue');
    if(!panel){
      panel = document.createElement('div');
      panel.id = 'panel-retention-revenue';
      panel.className = 'panel';
      var dash = byId('dashMain') || document.querySelector('.content') || document.body;
      dash.appendChild(panel);
    }
    return panel;
  }
  function ensureNav(active){
    var mainBtn = byId('side-revenue-analysis-main');
    if(mainBtn) mainBtn.classList.toggle('active', !!active);
    var side = byId('sideRepLinks');
    if(!side) return;
    var existing = byId('side-ret-revenue-analysis');
    if(!existing){
      existing = document.createElement('button');
      existing.className = 'nav-item';
      existing.id = 'side-ret-revenue-analysis';
      existing.setAttribute('onclick','switchRetentionRevenueAnalysis()');
      existing.innerHTML = '<span class="nav-icon" style="color:var(--blue)">📊</span>Revenue Analysis<span class="view-tag">NEW</span>';
      var fin = byId('side-ret-financial');
      if(fin && fin.parentNode) fin.parentNode.insertBefore(existing, fin.nextSibling); else side.appendChild(existing);
    }
    existing.classList.toggle('active', !!active);
  }
  function mount(){
    var panel = ensureRevenuePanel();
    var block = byId('retFinanceComparisonBlock');
    if(!block){ block = document.createElement('div'); block.id = 'retFinanceComparisonBlock'; panel.appendChild(block); }
    block.className = 'ret-exec-board ret-exec-v70';
    if(block.parentNode !== panel) panel.appendChild(block);
    return block;
  }
  function renderLoading(){
    var block = mount();
    destroyAll();
    block.innerHTML = '<div class="ret-exec-head"><div><div class="ret-exec-title">Executive Revenue Dashboard</div><div class="ret-exec-sub">Preparing filters, KPIs, and finance charts</div></div><div class="ret-exec-live"><span class="ret-exec-pulse"></span>Loading live view</div></div><div class="ret-exec-loader"><div class="ret-exec-loader-top"><span class="ret-exec-spinner"></span><span>Reading financeComparison and applying year/month filters...</span></div><div class="ret-exec-skeleton-grid"><div class="ret-exec-skeleton"></div><div class="ret-exec-skeleton"></div><div class="ret-exec-skeleton"></div><div class="ret-exec-skeleton"></div><div class="ret-exec-skeleton chart"></div><div class="ret-exec-skeleton chart"></div><div class="ret-exec-skeleton chart"></div><div class="ret-exec-skeleton chart"></div></div></div>';
  }
  function renderRevenue(animate){
    clearTimeout(renderTimer);
    var block = mount(), fc = getFC(), c = colors();
    if(!fc){ block.innerHTML = '<div class="ret-exec-head"><div><div class="ret-exec-title">Executive Revenue Dashboard</div><div class="ret-exec-sub">Waiting for Supabase P&L views</div></div></div><div class="ret-exec-empty">No financeComparison found yet. Run the Retention workflow, then refresh the dashboard.</div>'; return; }
    var f = filters(), t = selectedTotals(fc,f), cards = buildCards(fc,f), avgCost = t.cost / Math.max(1,t.range.months), avgCash = t.cashing / Math.max(1,t.range.months), scope = scopeText(fc,f), monthActive = monthIndex(f) >= 0;
    block.innerHTML = '<div class="ret-exec-head"><div><div class="ret-exec-title">Executive Revenue Dashboard</div><div class="ret-exec-sub">Source: '+safe(fc.source)+' · Scope: '+safe(scope)+' · Updated '+safe(fc.lastUpdated || 'live')+'</div></div><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end"><div class="ret-exec-live"><span class="ret-exec-pulse"></span>Dynamic · ForReporting</div>'+selectHtml()+'</div></div><div class="ret-exec-note">2025 shows the full closed year when selected. 2026 uses actual available data to date and keeps the active month included. Future 2026 months will appear automatically when the sheet has values.</div><div class="ret-exec-kpis">'+cards.map(function(card){ return '<div class="ret-exec-kpi" style="--fc:'+card.c+'"><div class="ret-exec-kpi-label">'+safe(card.k)+'</div><div class="ret-exec-kpi-value" data-ret-count="'+safe(card.v)+'" data-ret-rate="'+(card.rate?'1':'0')+'">'+(card.rate?rate(card.v):shortMoney(card.v))+'</div><div class="ret-exec-kpi-note">'+safe(card.sub)+'</div><div class="ret-exec-chip '+(card.bad?'bad':'')+'">'+safe(card.chip)+'</div></div>'; }).join('')+'</div><div class="ret-exec-body"><div class="ret-exec-card"><div class="ret-exec-card-title">YTD / Period comparison</div><div class="ret-exec-card-sub">'+safe(scope)+'</div><div class="ret-exec-chart-wrap"><canvas id="retExecYtdChart"></canvas></div></div><div class="ret-exec-card"><div class="ret-exec-card-title">Break-even analysis</div><div class="ret-exec-card-sub">Cash coverage against selected cost scope</div><div class="ret-exec-mini-grid"><div class="ret-exec-mini"><div class="ret-exec-mini-k">Avg cost / month</div><div class="ret-exec-mini-v" style="--mc:var(--amber)">'+money(avgCost)+'</div></div><div class="ret-exec-mini"><div class="ret-exec-mini-k">Avg cashing / month</div><div class="ret-exec-mini-v" style="--mc:var(--green)">'+money(avgCash)+'</div></div><div class="ret-exec-mini"><div class="ret-exec-mini-k">Monthly gap</div><div class="ret-exec-mini-v" style="--mc:'+(avgCash-avgCost>=0?'var(--green)':'var(--red)')+'">'+signedMoney(avgCash-avgCost)+'</div></div><div class="ret-exec-mini"><div class="ret-exec-mini-k">Coverage</div><div class="ret-exec-mini-v" style="--mc:'+(t.coverage>=100?'var(--green)':'var(--red)')+'">'+rate(t.coverage)+'</div></div></div><div class="ret-exec-chart-wrap"><canvas id="retExecCoveragePie"></canvas></div></div><div class="ret-exec-card"><div class="ret-exec-card-title">Monthly trend</div><div class="ret-exec-card-sub">'+(f.mode === 'ytd' ? 'Cumulative YTD movement' : 'Month-by-month movement')+'</div><div class="ret-exec-chart-wrap tall"><canvas id="retExecTrendChart"></canvas></div></div><div class="ret-exec-card"><div class="ret-exec-card-title">Value mix</div><div class="ret-exec-card-sub">Booking · Cashing · Cost share for '+safe(t.primaryYear)+'</div><div class="ret-exec-chart-wrap tall"><canvas id="retExecMixPie"></canvas></div></div><div class="ret-exec-card"><div class="ret-exec-card-title">Cost breakdown</div><div class="ret-exec-card-sub">COGS · Overheads · Support allocation</div><div class="ret-exec-chart-wrap"><canvas id="retExecCostPie"></canvas></div></div><div class="ret-exec-card"><div class="ret-exec-card-title">Cash vs cost gap</div><div class="ret-exec-card-sub">Gap trajectory for selected year view</div><div class="ret-exec-chart-wrap"><canvas id="retExecGapChart"></canvas></div></div><div class="ret-exec-card ret-exec-takeaways"><div class="ret-exec-card-title">Key takeaways</div><div class="ret-exec-card-sub">Auto-generated from current filters</div>'+takeaways(fc,f).map(function(x){ return '<div class="ret-exec-takeaway"><span class="ret-exec-dot" style="--tc:'+x.c+'"></span><div>'+safe(x.t)+'</div></div>'; }).join('')+'</div></div>';
    bindFilters();
    if(animate !== false) document.querySelectorAll('#retFinanceComparisonBlock [data-ret-count]').forEach(function(el){ var val = n(el.getAttribute('data-ret-count')); var isRate = el.getAttribute('data-ret-rate') === '1'; countUp(el,val,isRate ? rate : shortMoney); });
    if(typeof Chart === 'undefined') return;
    destroyAll();
    var metricLabels = f.metric === 'all' ? ['Booking','Cashing','Cost'] : [metricMeta(f.metric).label];
    var bar25 = f.metric === 'all' ? [t.booking25,t.cashing25,t.cost25] : [total(fc,f.metric,'2025',t.compareRange)];
    var bar26 = f.metric === 'all' ? [t.booking26,t.cashing26,t.cost26] : [total(fc,f.metric,'2026',t.compareRange)];
    var include25 = f.year !== '2026', include26 = f.year !== '2025';
    if(f.year === '2025') bar25 = f.metric === 'all' ? [total(fc,'booking','2025',t.range), total(fc,'cashing','2025',t.range), total(fc,'cost','2025',t.range)] : [total(fc,f.metric,'2025',t.range)];
    if(f.year === '2026') bar26 = f.metric === 'all' ? [total(fc,'booking','2026',t.range), total(fc,'cashing','2026',t.range), total(fc,'cost','2026',t.range)] : [total(fc,f.metric,'2026',t.range)];
    makeChart('retExecYtdChart',{type:'bar',data:{labels:metricLabels,datasets:[bar('2025',bar25,c.muted,!include25),bar('2026',bar26,c.blue,!include26)]},options:chartOptions()});
    var labels = labelsFor(fc,f), mode = f.mode || 'monthly', sets = [];
    function add(metric, year, color, dashed){ var values = chartValues(fc,metric,year,f); sets.push(line(metricMeta(metric).label + ' ' + year, mode === 'ytd' ? cumulative(values) : values, color, dashed)); }
    if(f.metric === 'all'){
      if(include26){ add('booking','2026',c.purple,false); add('cashing','2026',c.green,false); add('cost','2026',c.amber,false); }
      if(include25){ add('booking','2025',c.purple,true); add('cashing','2025',c.green,true); add('cost','2025',c.amber,true); }
    } else {
      var mc = metricMeta(f.metric).color;
      if(include25) add(f.metric,'2025',f.year === 'both' ? c.muted : mc,true);
      if(include26) add(f.metric,'2026',f.year === 'both' ? c.blue : mc,false);
    }
    makeChart('retExecTrendChart',{type:'line',data:{labels:labels,datasets:sets},options:chartOptions()});
    var covered = Math.min(t.cashing,t.cost), gapAbs = Math.abs(t.gap);
    makeChart('retExecCoveragePie',{type:'doughnut',data:doughnutData([t.coverage >= 100 ? 'Cost covered' : 'Cash covered', t.coverage >= 100 ? 'Surplus' : 'Shortfall'],[covered,gapAbs],[c.green,t.coverage >= 100 ? c.blue : c.red]),options:chartOptions({scales:false,legendPosition:'bottom'})});
    makeChart('retExecMixPie',{type:'doughnut',data:doughnutData(['Booking '+t.primaryYear,'Cashing '+t.primaryYear,'Cost '+t.primaryYear],[t.booking,t.cashing,t.cost],[c.purple,c.green,c.amber]),options:chartOptions({scales:false,legendPosition:'bottom'})});
    var cogs = total(fc,'cogs',t.primaryYear,t.range), oh = total(fc,'overheads',t.primaryYear,t.range), sup = total(fc,'supportAllocation',t.primaryYear,t.range);
    makeChart('retExecCostPie',{type:'pie',data:doughnutData(['COGS','Overheads','Support Allocation'],[cogs,oh,sup],[c.blue,c.amber,c.purple]),options:chartOptions({scales:false,legendPosition:'bottom'})});
    var gapSeriesYear = t.primaryYear, gapValues;
    if(monthActive) gapValues = [n(fc['cashing'+gapSeriesYear][monthIndex(f)]) - n(fc['cost'+gapSeriesYear][monthIndex(f)])];
    else gapValues = chartValues(fc,'cashing',gapSeriesYear,f).map(function(v,i){ if(v == null) return null; var cash = sumRange(fc['cashing'+gapSeriesYear],0,i), cost = sumRange(fc['cost'+gapSeriesYear],0,i); return cash - cost; });
    makeChart('retExecGapChart',{type:'bar',data:{labels:labels,datasets:[bar('Cash - Cost gap '+gapSeriesYear,gapValues,t.gap >= 0 ? c.green : c.red,false)]},options:chartOptions()});
  }
  function countUp(el, target, formatter){
    var start = performance.now(), duration = 650;
    function tick(now){ var p = Math.min(1,(now - start) / duration); var eased = 1 - Math.pow(1 - p, 3); el.textContent = formatter(target * eased); if(p < 1) requestAnimationFrame(tick); }
    requestAnimationFrame(tick);
  }
  function activateRevenue(skipScroll){
    window.APP_MAIN_PANEL = 'retention'; window.APP_RETENTION_VIEW = 'revenue'; window.APP_RETENTION_OWNER_ID = null;
    try{ APP_MAIN_PANEL = 'retention'; APP_RETENTION_VIEW = 'revenue'; RET_SELECTED_OWNER_ID = null; RETENTION_SUBVIEW = 'revenue'; }catch(e){}
    ensureRevenuePanel();
    document.querySelectorAll('.tab-btn,.panel,.nav-item').forEach(function(x){ x.classList.remove('active'); });
    var tabs = byId('tabsBar'); if(tabs) tabs.style.display = 'none';
    var side = byId('side-revenue-analysis-main'); if(side) side.classList.add('active');
    var panel = byId('panel-retention-revenue'); if(panel) panel.classList.add('active');
    if(typeof window.renderRetentionSidebar === 'function') window.renderRetentionSidebar('revenue');
    ensureNav(true);
    var title = byId('topbarTitle'); if(title) title.textContent = 'Revenue Analysis';
    var sub = byId('topbarSub'); if(sub) sub.textContent = 'Revenue filters · 2025 full year · 2026 actual to date · Monthly view';
    renderLoading();
    renderTimer = setTimeout(function(){ renderRevenue(true); }, 320);
    if(!skipScroll) window.scrollTo(0,0);
  }
  window.switchRetentionRevenueAnalysis = function(){ activateRevenue(false); };
  window.renderFinanceComparisonCharts = function(){ renderRevenue(false); };
  try{ switchRetentionRevenueAnalysis = window.switchRetentionRevenueAnalysis; }catch(e){}
  var oldLoad = window.loadData;
  if(typeof oldLoad === 'function' && !oldLoad.__retRevenueFiltersV70){
    window.loadData = async function(){
      var revenueActive = window.APP_MAIN_PANEL === 'retention' && window.APP_RETENTION_VIEW === 'revenue';
      if(revenueActive) renderLoading();
      var out = oldLoad.apply(this, arguments);
      if(out && typeof out.then === 'function') await out;
      try{ if(typeof R !== 'undefined' && R) window.R = R; if(typeof D !== 'undefined' && D) window.D = D; }catch(e){}
      if(window.APP_MAIN_PANEL === 'retention' && window.APP_RETENTION_VIEW === 'revenue') setTimeout(function(){ renderRevenue(true); }, 640);
      return out;
    };
    window.loadData.__retRevenueFiltersV70 = true;
    try{ loadData = window.loadData; }catch(e){}
  }
  var oldRestore = window.restoreCurrentView;
  if(typeof oldRestore === 'function' && !oldRestore.__retRevenueFiltersV70){
    window.restoreCurrentView = function(){ if(window.APP_MAIN_PANEL === 'retention' && window.APP_RETENTION_VIEW === 'revenue'){ activateRevenue(true); return; } return oldRestore.apply(this, arguments); };
    window.restoreCurrentView.__retRevenueFiltersV70 = true;
    try{ restoreCurrentView = window.restoreCurrentView; }catch(e){}
  }
  function init(){ ensureRevenuePanel(); ensureNav(window.APP_RETENTION_VIEW === 'revenue'); if(window.APP_MAIN_PANEL === 'retention' && window.APP_RETENTION_VIEW === 'revenue') activateRevenue(true); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  setTimeout(init,350);
})();
