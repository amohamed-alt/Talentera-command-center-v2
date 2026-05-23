(function(){
  if(window.__RETENTION_REVENUE_DYNAMIC_V60__) return;
  window.__RETENTION_REVENUE_DYNAMIC_V60__ = true;

  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  window.RET_FIN_CHART_FILTERS = window.RET_FIN_CHART_FILTERS || { metric:'all', mode:'monthly', year:'both' };
  window.retFinanceComparisonCharts = window.retFinanceComparisonCharts || {};

  function byId(id){ return document.getElementById(id); }
  function safe(v){ return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
  function asNumber(v){
    if(v == null || v === '') return 0;
    if(typeof v === 'number') return Number.isFinite(v) ? v : 0;
    var text = String(v).trim();
    var neg = /^-/.test(text) || /-$/.test(text) || (text.indexOf('(') > -1 && text.indexOf(')') > -1);
    var mult = /m/i.test(text) ? 1000000 : /k/i.test(text) ? 1000 : 1;
    var n = Number(text.replace(/[$,%\s,]/g,'').replace(/[()]/g,'').replace(/-/g,'').replace(/[^\d.]/g,''));
    if(!Number.isFinite(n)) return 0;
    return (neg ? -n : n) * mult;
  }
  function arr(v){ return Array.isArray(v) ? v : []; }
  function pad(v){ var a = arr(v).map(asNumber); while(a.length < 12) a.push(0); return a.slice(0,12); }
  function sum(values, endIndex){ var list = pad(values); var end = endIndex == null ? list.length - 1 : Math.max(0, Math.min(11, endIndex)); return list.slice(0,end+1).reduce(function(t,v){ return t + asNumber(v); },0); }
  function pct(now, prev){ return prev ? ((now - prev) / Math.abs(prev)) * 100 : 0; }
  function money(v){ return '$' + Math.round(asNumber(v)).toLocaleString('en-US'); }
  function shortMoney(v){ v = asNumber(v); if(Math.abs(v) >= 1000000) return '$' + (v/1000000).toFixed(1).replace('.0','') + 'M'; if(Math.abs(v) >= 1000) return '$' + Math.round(v/1000).toLocaleString('en-US') + 'K'; return money(v); }
  function signedMoney(v){ return (asNumber(v) < 0 ? '(' + money(Math.abs(v)) + ')' : money(v)); }
  function rate(v){ return (Number(v || 0)).toFixed(1).replace('.0','') + '%'; }
  function sourceData(){
    var candidates = [];
    try{ if(window.R) candidates.push(window.R); }catch(e){}
    try{ if(typeof R !== 'undefined' && R) candidates.push(R); }catch(e){}
    try{ if(window.D) candidates.push(window.D); }catch(e){}
    try{ if(typeof D !== 'undefined' && D) candidates.push(D); }catch(e){}
    for(var i=0;i<candidates.length;i++){
      if(candidates[i] && candidates[i].financeComparison) return candidates[i];
      if(candidates[i] && candidates[i].retentionData && candidates[i].retentionData.financeComparison) return candidates[i].retentionData;
    }
    return null;
  }
  function rawMetric(fc, metric, year){
    var raw = fc && fc.raw ? fc.raw : {};
    if(raw[metric] && raw[metric][String(year)]) return pad(raw[metric][String(year)]);
    var flat = fc ? fc[metric + String(year)] : null;
    if(Array.isArray(flat)) return pad(flat);
    var out = Array(12).fill(0);
    arr(fc && fc.monthly).forEach(function(row, i){
      if(i >= 12) return;
      var keys = [metric + String(year), metric + year, metric + '_' + year, metric + 'Year' + year];
      for(var k=0;k<keys.length;k++){
        if(row && row[keys[k]] != null){ out[i] = asNumber(row[keys[k]]); return; }
      }
    });
    return out;
  }
  function lastFilledIndex(list){ var idx = -1; pad(list).forEach(function(v,i){ if(asNumber(v) !== 0) idx = i; }); return idx; }
  function colorVars(){
    var root = getComputedStyle(document.documentElement);
    return {
      green: root.getPropertyValue('--green').trim() || '#16A34A',
      purple: root.getPropertyValue('--purple').trim() || '#7C3AED',
      amber: root.getPropertyValue('--amber').trim() || '#D97706',
      blue: root.getPropertyValue('--blue').trim() || '#2563EB',
      cyan: root.getPropertyValue('--cyan').trim() || '#0891B2',
      red: root.getPropertyValue('--red').trim() || '#DC2626',
      muted: '#9CA3AF'
    };
  }
  function normalizeFinanceComparison(input){
    if(!input || typeof input !== 'object') return null;
    var fc = input.financeComparison ? input.financeComparison : input;
    var cashing2025 = rawMetric(fc,'cashing',2025);
    var cashing2026 = rawMetric(fc,'cashing',2026);
    var booking2025 = rawMetric(fc,'booking',2025);
    var booking2026 = rawMetric(fc,'booking',2026);
    var cost2025 = rawMetric(fc,'cost',2025);
    var cost2026 = rawMetric(fc,'cost',2026);
    var cogs2025 = rawMetric(fc,'cogs',2025);
    var cogs2026 = rawMetric(fc,'cogs',2026);
    var overheads2025 = rawMetric(fc,'overheads',2025);
    var overheads2026 = rawMetric(fc,'overheads',2026);
    var supportAllocation2025 = rawMetric(fc,'supportAllocation',2025);
    var supportAllocation2026 = rawMetric(fc,'supportAllocation',2026);

    for(var i=0;i<12;i++){
      if(!cost2025[i]) cost2025[i] = cogs2025[i] + overheads2025[i] + supportAllocation2025[i];
      if(!cost2026[i]) cost2026[i] = cogs2026[i] + overheads2026[i] + supportAllocation2026[i];
    }

    var hasData = [cashing2025,cashing2026,booking2025,booking2026,cost2025,cost2026].some(function(a){ return a.some(function(v){ return asNumber(v) !== 0; }); });
    if(!hasData) return null;

    var months = arr(fc.months).length ? arr(fc.months).slice(0,12) : MONTHS;
    while(months.length < 12) months.push(MONTHS[months.length]);
    var activeMonthIndex = Number.isInteger(fc.activeMonthIndex) ? fc.activeMonthIndex : Math.max(lastFilledIndex(cashing2026), lastFilledIndex(booking2026), lastFilledIndex(cost2026));
    if(activeMonthIndex < 0) activeMonthIndex = new Date().getMonth();
    activeMonthIndex = Math.max(0, Math.min(11, activeMonthIndex));
    var activeRangeLabel = fc.activeRangeLabel || (months[0] + ' - ' + months[activeMonthIndex]);
    var monthCount = activeMonthIndex + 1;

    var normalized = {
      source: fc.source || 'ForReporting',
      lastUpdated: fc.lastUpdated || input.lastUpdated || '',
      months: months,
      activeMonthIndex: activeMonthIndex,
      activeMonth: fc.activeMonth || months[activeMonthIndex],
      activeRangeLabel: activeRangeLabel,
      cashing2025: cashing2025,
      cashing2026: cashing2026,
      booking2025: booking2025,
      booking2026: booking2026,
      cost2025: cost2025,
      cost2026: cost2026,
      cogs2025: cogs2025,
      cogs2026: cogs2026,
      overheads2025: overheads2025,
      overheads2026: overheads2026,
      supportAllocation2025: supportAllocation2025,
      supportAllocation2026: supportAllocation2026
    };

    normalized.summary = {
      booking2025Total: sum(booking2025, activeMonthIndex),
      booking2026Total: sum(booking2026, activeMonthIndex),
      cashing2025Total: sum(cashing2025, activeMonthIndex),
      cashing2026Total: sum(cashing2026, activeMonthIndex),
      cost2025Total: sum(cost2025, activeMonthIndex),
      cost2026Total: sum(cost2026, activeMonthIndex)
    };
    normalized.summary.bookingGrowth = pct(normalized.summary.booking2026Total, normalized.summary.booking2025Total);
    normalized.summary.cashingGrowth = pct(normalized.summary.cashing2026Total, normalized.summary.cashing2025Total);
    normalized.summary.costGrowth = pct(normalized.summary.cost2026Total, normalized.summary.cost2025Total);
    normalized.breakEven = fc.breakEven || {
      avgMonthlyCost2026: normalized.summary.cost2026Total / monthCount,
      avgMonthlyCashing2026: normalized.summary.cashing2026Total / monthCount,
      monthlyGap: (normalized.summary.cashing2026Total / monthCount) - (normalized.summary.cost2026Total / monthCount),
      ytdCashGap: normalized.summary.cashing2026Total - normalized.summary.cost2026Total,
      cashCoverage: normalized.summary.cost2026Total ? normalized.summary.cashing2026Total / normalized.summary.cost2026Total * 100 : 0
    };
    return normalized;
  }
  window.normalizeRetentionFinanceComparison = normalizeFinanceComparison;

  function getFC(){
    var data = sourceData();
    return data ? normalizeFinanceComparison(data.financeComparison) : null;
  }

  function ensureRevenuePanel(){
    var panel = byId('panel-retention-revenue');
    if(panel) return panel;
    panel = document.createElement('div');
    panel.className = 'panel';
    panel.id = 'panel-retention-revenue';
    panel.innerHTML = '<div class="ret-fin-hero" style="border-left-color:var(--blue)"><div class="ret-fin-hero-icon" style="background:var(--blue-bg);border-color:var(--blue-bd)">📊</div><div><div class="ret-fin-hero-title">Revenue Analysis</div><div class="ret-fin-hero-sub">Dynamic retention revenue view from ForReporting: month vs month, year-to-year, cashing, booking, and cost.</div></div></div><div id="retRevenueAnalysisMount"></div>';
    var dash = byId('dashMain') || document.querySelector('.content');
    if(dash) dash.appendChild(panel);
    return panel;
  }

  function ensureRevenueNav(active){
    var side = byId('sideRepLinks');
    if(!side) return;
    var existing = byId('side-ret-revenue-analysis');
    if(!existing){
      existing = document.createElement('button');
      existing.className = 'nav-item';
      existing.id = 'side-ret-revenue-analysis';
      existing.setAttribute('onclick','switchRetentionRevenueAnalysis()');
      existing.innerHTML = '<span class="nav-icon" style="color:var(--blue)">📊</span>Revenue Analysis<span class="view-tag">NEW</span>';
      var financial = byId('side-ret-financial');
      if(financial && financial.parentNode) financial.parentNode.insertBefore(existing, financial.nextSibling);
      else side.insertBefore(existing, side.firstChild);
    }
    existing.classList.toggle('active', !!active);
  }

  function ensureBlock(){
    ensureRevenuePanel();
    var mount = byId('retRevenueAnalysisMount');
    if(!mount) return null;
    var block = byId('retFinanceComparisonBlock');
    if(!block){
      block = document.createElement('div');
      block.id = 'retFinanceComparisonBlock';
      block.className = 'ret-fin-comparison-board';
      mount.appendChild(block);
    }else if(block.parentNode !== mount){
      mount.appendChild(block);
    }
    if(!block.querySelector('#retFinanceComparisonKpis') || !block.querySelector('#retRevenueHealthGrid')){
      block.innerHTML = '<div class="ret-fin-comparison-hd"><div><div class="ret-fin-comparison-title">📈 Finance Comparison</div><div class="ret-fin-comparison-sub" id="retFinanceComparisonSubtitle">Month vs month and year-to-year view from the finance comparison sheet.</div></div><div class="ret-fin-comparison-filters"><select id="retFinChartMetric" class="ret-sheet-select"><option value="all">All Metrics</option><option value="cashing">Cashing</option><option value="booking">Booking</option><option value="cost">Cost</option></select><select id="retFinChartMode" class="ret-sheet-select"><option value="monthly">Monthly</option><option value="ytd">Cumulative YTD</option></select><select id="retFinChartYear" class="ret-sheet-select"><option value="both">2025 vs 2026</option><option value="2025">2025 Only</option><option value="2026">2026 Only</option></select></div></div><div class="ret-fin-comparison-kpis" id="retFinanceComparisonKpis"></div><div class="ret-revenue-health-grid" id="retRevenueHealthGrid"></div><div class="ret-fin-comparison-grid"><div class="ret-fin-chart-card" data-chart-card="ytd"><div class="ret-fin-chart-title" id="retYearToYearTitle">YTD comparison</div><canvas id="retYearToYearChart"></canvas></div><div class="ret-fin-chart-card" data-chart-card="trend"><div class="ret-fin-chart-title" id="retTrendTitle">Monthly trend</div><canvas id="retCashingMonthChart"></canvas></div><div class="ret-fin-chart-card" data-chart-card="metric"><div class="ret-fin-chart-title" id="retMetricTitle">Monthly metric detail</div><canvas id="retBookingMonthChart"></canvas></div><div class="ret-fin-chart-card" data-chart-card="cost"><div class="ret-fin-chart-title" id="retCostBreakdownTitle">Cost breakdown</div><canvas id="retCostMonthChart"></canvas></div></div>';
    }
    ['retFinChartMetric','retFinChartMode','retFinChartYear'].forEach(function(id){
      var el = byId(id);
      if(!el) return;
      var key = id === 'retFinChartMetric' ? 'metric' : id === 'retFinChartMode' ? 'mode' : 'year';
      el.value = window.RET_FIN_CHART_FILTERS[key] || el.value;
      el.onchange = function(){ window.RET_FIN_CHART_FILTERS[key] = this.value; window.renderFinanceComparisonCharts(); };
    });
    return block;
  }

  function destroyChart(id){
    if(window.retFinanceComparisonCharts && window.retFinanceComparisonCharts[id]){
      try{ window.retFinanceComparisonCharts[id].destroy(); }catch(e){}
      delete window.retFinanceComparisonCharts[id];
    }
  }
  function makeChart(id, config){
    if(typeof Chart === 'undefined') return;
    var el = byId(id);
    if(!el) return;
    destroyChart(id);
    window.retFinanceComparisonCharts[id] = new Chart(el, config);
  }
  function chartOptions(stacked){
    return { responsive:true, maintainAspectRatio:false, interaction:{mode:'index',intersect:false}, plugins:{legend:{position:'top'},tooltip:{callbacks:{label:function(ctx){return ctx.dataset.label + ': ' + money(ctx.raw || 0);}}}}, scales:{x:{stacked:!!stacked}, y:{stacked:!!stacked, ticks:{callback:function(v){return shortMoney(v);}}}} };
  }
  function maybeCumulative(list, mode){
    var total = 0;
    return pad(list).map(function(v){ total += asNumber(v); return mode === 'ytd' ? total : asNumber(v); });
  }
  function line(label, data, color, hidden, dashed){
    return { label:label, data:data, borderColor:color, backgroundColor:color, borderWidth:3, tension:.32, pointRadius:3, spanGaps:true, hidden:!!hidden, borderDash:dashed ? [6,4] : undefined };
  }
  function bar(label, data, color, hidden){ return { label:label, data:data, backgroundColor:color, borderWidth:1, hidden:!!hidden }; }
  function renderKpis(fc){
    var end = fc.activeMonthIndex;
    var rows = [
      {label:'Booking 2025', value:sum(fc.booking2025,end), color:'var(--purple)'},
      {label:'Booking 2026', value:sum(fc.booking2026,end), color:'var(--purple)'},
      {label:'Cashing 2025', value:sum(fc.cashing2025,end), color:'var(--green)'},
      {label:'Cashing 2026', value:sum(fc.cashing2026,end), color:'var(--green)'},
      {label:'Cost 2025', value:sum(fc.cost2025,end), color:'var(--amber)'},
      {label:'Cost 2026', value:sum(fc.cost2026,end), color:'var(--amber)'}
    ];
    var box = byId('retFinanceComparisonKpis');
    if(box) box.innerHTML = rows.map(function(k){ return '<div class="ret-fin-comparison-kpi" style="--fc:'+k.color+'"><div class="ret-fin-comparison-kpi-v">'+shortMoney(k.value)+'</div><div class="ret-fin-comparison-kpi-l">'+safe(k.label)+'</div><div class="ret-fin-comparison-kpi-s">'+safe(fc.activeRangeLabel)+'</div></div>'; }).join('');
  }
  function renderHealth(fc){
    var s = fc.summary;
    var b = fc.breakEven || {};
    var monthlyCost = asNumber(b.avgMonthlyCost2026 || (s.cost2026Total / (fc.activeMonthIndex + 1)));
    var monthlyCash = asNumber(b.avgMonthlyCashing2026 || (s.cashing2026Total / (fc.activeMonthIndex + 1)));
    var ytdGap = asNumber(b.ytdCashGap != null ? b.ytdCashGap : s.cashing2026Total - s.cost2026Total);
    var coverage = asNumber(b.cashCoverage != null ? b.cashCoverage : (s.cost2026Total ? s.cashing2026Total / s.cost2026Total * 100 : 0));
    var grid = byId('retRevenueHealthGrid');
    if(grid) grid.innerHTML = [
      {k:'Booking Growth', v:rate(s.bookingGrowth), s:'2026 vs 2025 · '+fc.activeRangeLabel, c:s.bookingGrowth >= 0 ? 'var(--green)' : 'var(--red)'},
      {k:'Cashing Growth', v:rate(s.cashingGrowth), s:'2026 vs 2025 · '+fc.activeRangeLabel, c:s.cashingGrowth >= 0 ? 'var(--green)' : 'var(--red)'},
      {k:'Avg Monthly Cost', v:money(monthlyCost), s:'2026 run-rate', c:'var(--amber)'},
      {k:'Cash Coverage', v:rate(coverage), s:'YTD cash vs cost · gap '+signedMoney(ytdGap), c:coverage >= 100 ? 'var(--green)' : 'var(--red)'}
    ].map(function(x){ return '<div class="ret-revenue-health-card" style="--hc:'+x.c+'"><div class="ret-revenue-health-k">'+safe(x.k)+'</div><div class="ret-revenue-health-v">'+safe(x.v)+'</div><div class="ret-revenue-health-s">'+safe(x.s)+'</div></div>'; }).join('');
    var sub = byId('retFinanceComparisonSubtitle');
    if(sub) sub.textContent = 'Source: ' + (fc.source || 'ForReporting') + ' · Active range: ' + fc.activeRangeLabel + (fc.lastUpdated ? ' · Updated ' + fc.lastUpdated : '');
  }
  function selectedMetricArrays(fc, metric){
    if(metric === 'cashing') return {label:'Cashing', y25:fc.cashing2025, y26:fc.cashing2026, color:'green'};
    if(metric === 'booking') return {label:'Booking', y25:fc.booking2025, y26:fc.booking2026, color:'purple'};
    if(metric === 'cost') return {label:'Cost', y25:fc.cost2025, y26:fc.cost2026, color:'amber'};
    return null;
  }
  function showRevenueView(skipScroll){
    try{ APP_MAIN_PANEL = 'retention'; }catch(e){}
    try{ APP_RETENTION_VIEW = 'revenue'; }catch(e){}
    window.APP_MAIN_PANEL = 'retention';
    window.APP_RETENTION_VIEW = 'revenue';
    window.APP_RETENTION_OWNER_ID = null;
    try{ RET_SELECTED_OWNER_ID = null; RETENTION_SUBVIEW = 'revenue'; }catch(e){}
    ensureRevenuePanel();
    document.querySelectorAll('.tab-btn').forEach(function(x){ x.classList.remove('active'); });
    document.querySelectorAll('.panel').forEach(function(x){ x.classList.remove('active'); });
    document.querySelectorAll('.nav-item').forEach(function(x){ x.classList.remove('active'); });
    var tabs = byId('tabsBar'); if(tabs) tabs.style.display = 'none';
    var side = byId('side-retention'); if(side) side.classList.add('active');
    var panel = byId('panel-retention-revenue'); if(panel) panel.classList.add('active');
    if(typeof window.renderRetentionSidebar === 'function') window.renderRetentionSidebar('revenue');
    ensureRevenueNav(true);
    var title = byId('topbarTitle'); if(title) title.textContent = 'Retention · Revenue Analysis';
    var sub = byId('topbarSub'); if(sub) sub.textContent = 'ForReporting · Month vs month · Year-to-year · Cashing / Booking / Cost';
    window.renderFinanceComparisonCharts();
    if(!skipScroll) window.scrollTo(0,0);
  }
  window.switchRetentionRevenueAnalysis = function(){ showRevenueView(false); };
  try{ switchRetentionRevenueAnalysis = window.switchRetentionRevenueAnalysis; }catch(e){}

  window.renderFinanceComparisonCharts = function(){
    var block = ensureBlock();
    if(!block) return;
    var fc = getFC();
    if(!fc){
      ['retCashingMonthChart','retBookingMonthChart','retCostMonthChart','retYearToYearChart'].forEach(destroyChart);
      var kpi = byId('retFinanceComparisonKpis');
      var health = byId('retRevenueHealthGrid');
      if(kpi) kpi.innerHTML = '<div class="ret-fin-empty" style="grid-column:1/-1">No financeComparison found in Supabase retention views. Run the Retention workflow and make sure Code — Merge Final Supabase Retention writes financeComparison at the top level.</div>';
      if(health) health.innerHTML = '';
      return;
    }
    renderKpis(fc);
    renderHealth(fc);
    if(typeof Chart === 'undefined') return;

    var filters = window.RET_FIN_CHART_FILTERS || {metric:'all',mode:'monthly',year:'both'};
    var include25 = filters.year !== '2026';
    var include26 = filters.year !== '2025';
    var c = colorVars();
    var mode = filters.mode || 'monthly';
    var metric = filters.metric || 'all';
    var months = fc.months;
    var end = fc.activeMonthIndex;
    var labelsYtd = ['Booking','Cashing','Cost'];

    var ytdTitle = byId('retYearToYearTitle');
    if(ytdTitle) ytdTitle.innerHTML = 'YTD comparison<small>'+safe(fc.activeRangeLabel)+' · 2025 vs 2026</small>';
    makeChart('retYearToYearChart', { type:'bar', data:{ labels:labelsYtd, datasets:[ bar('2025', [sum(fc.booking2025,end),sum(fc.cashing2025,end),sum(fc.cost2025,end)], c.muted, !include25), bar('2026', [sum(fc.booking2026,end),sum(fc.cashing2026,end),sum(fc.cost2026,end)], c.blue, !include26) ] }, options:chartOptions(false) });

    var trendTitle = byId('retTrendTitle');
    if(trendTitle) trendTitle.innerHTML = (mode === 'ytd' ? 'Cumulative trend' : 'Monthly trend') + '<small>Booking · Cashing · Cost</small>';
    var trendSets = [];
    if(metric === 'all'){
      trendSets.push(line('Booking 2026', maybeCumulative(fc.booking2026,mode), c.purple, !include26, false));
      trendSets.push(line('Cashing 2026', maybeCumulative(fc.cashing2026,mode), c.green, !include26, false));
      trendSets.push(line('Cost 2026', maybeCumulative(fc.cost2026,mode), c.amber, !include26, false));
      trendSets.push(line('Booking 2025', maybeCumulative(fc.booking2025,mode), c.purple, !include25, true));
      trendSets.push(line('Cashing 2025', maybeCumulative(fc.cashing2025,mode), c.green, !include25, true));
      trendSets.push(line('Cost 2025', maybeCumulative(fc.cost2025,mode), c.amber, !include25, true));
    }else{
      var selected = selectedMetricArrays(fc, metric);
      var color = selected.color === 'green' ? c.green : selected.color === 'purple' ? c.purple : c.amber;
      trendSets.push(line(selected.label + ' 2025', maybeCumulative(selected.y25,mode), color, !include25, true));
      trendSets.push(line(selected.label + ' 2026', maybeCumulative(selected.y26,mode), c.blue, !include26, false));
    }
    makeChart('retCashingMonthChart', { type:'line', data:{ labels:months, datasets:trendSets }, options:chartOptions(false) });

    var metricTitle = byId('retMetricTitle');
    var metricSets = [];
    if(metric === 'all'){
      if(include26){ metricSets.push(bar('Booking 2026', fc.booking2026, c.purple, false)); metricSets.push(bar('Cashing 2026', fc.cashing2026, c.green, false)); metricSets.push(bar('Cost 2026', fc.cost2026, c.amber, false)); }
      if(include25){ metricSets.push(bar('Booking 2025', fc.booking2025, c.purple, false)); metricSets.push(bar('Cashing 2025', fc.cashing2025, c.green, false)); metricSets.push(bar('Cost 2025', fc.cost2025, c.muted, false)); }
      if(metricTitle) metricTitle.innerHTML = 'Monthly metric detail<small>All selected metrics</small>';
    }else{
      var sm = selectedMetricArrays(fc, metric);
      if(metricTitle) metricTitle.innerHTML = sm.label + ' monthly detail<small>Actual monthly values</small>';
      metricSets.push(bar(sm.label + ' 2025', sm.y25, c.muted, !include25));
      metricSets.push(bar(sm.label + ' 2026', sm.y26, c.blue, !include26));
    }
    makeChart('retBookingMonthChart', { type:'bar', data:{ labels:months, datasets:metricSets }, options:chartOptions(false) });

    var costTitle = byId('retCostBreakdownTitle');
    if(costTitle) costTitle.innerHTML = 'Cost breakdown<small>COGS + Overheads + Support Allocation, 2026</small>';
    var hasBreakdown = fc.cogs2026.some(Boolean) || fc.overheads2026.some(Boolean) || fc.supportAllocation2026.some(Boolean);
    var costSets = hasBreakdown ? [bar('COGS 2026', fc.cogs2026, c.blue, false), bar('Overheads 2026', fc.overheads2026, c.amber, false), bar('Support Allocation 2026', fc.supportAllocation2026, c.purple, false)] : [bar('Cost 2026', fc.cost2026, c.amber, false)];
    makeChart('retCostMonthChart', { type:'bar', data:{ labels:months, datasets:costSets }, options:chartOptions(hasBreakdown) });
  };

  var oldSidebar = window.renderRetentionSidebar;
  if(typeof oldSidebar === 'function' && !oldSidebar.__revenueDynamicV60){
    window.renderRetentionSidebar = function(activeMode){
      var out = oldSidebar.apply(this, arguments);
      ensureRevenueNav(activeMode === 'revenue' || window.APP_RETENTION_VIEW === 'revenue');
      return out;
    };
    window.renderRetentionSidebar.__revenueDynamicV60 = true;
    try{ renderRetentionSidebar = window.renderRetentionSidebar; }catch(e){}
  }

  var oldRestore = window.restoreCurrentView;
  if(typeof oldRestore === 'function' && !oldRestore.__revenueDynamicV60){
    window.restoreCurrentView = function(options){
      if(window.APP_MAIN_PANEL === 'retention' && window.APP_RETENTION_VIEW === 'revenue'){
        showRevenueView(true);
        return;
      }
      return oldRestore.apply(this, arguments);
    };
    window.restoreCurrentView.__revenueDynamicV60 = true;
    try{ restoreCurrentView = window.restoreCurrentView; }catch(e){}
  }

  var oldLoad = window.loadData;
  if(typeof oldLoad === 'function' && !oldLoad.__revenueDynamicV60){
    window.loadData = async function(){
      var result = oldLoad.apply(this, arguments);
      if(result && typeof result.then === 'function') await result;
      try{
        if(typeof R !== 'undefined' && R && !window.R) window.R = R;
        if(typeof D !== 'undefined' && D && !window.D) window.D = D;
      }catch(e){}
      if(window.APP_MAIN_PANEL === 'retention' && window.APP_RETENTION_VIEW === 'revenue') showRevenueView(true);
      if(window.APP_MAIN_PANEL === 'retention' && window.APP_RETENTION_VIEW === 'financial') setTimeout(window.renderFinanceComparisonCharts, 0);
      return result;
    };
    window.loadData.__revenueDynamicV60 = true;
    try{ loadData = window.loadData; }catch(e){}
  }

  var oldFin = window.renderRetentionFinancialDetails;
  if(typeof oldFin === 'function' && !oldFin.__revenueDynamicV60){
    window.renderRetentionFinancialDetails = function(){
      var out = oldFin.apply(this, arguments);
      setTimeout(function(){ if(window.APP_RETENTION_VIEW === 'revenue') window.renderFinanceComparisonCharts(); },0);
      return out;
    };
    window.renderRetentionFinancialDetails.__revenueDynamicV60 = true;
    try{ renderRetentionFinancialDetails = window.renderRetentionFinancialDetails; }catch(e){}
  }

  function init(){
    ensureRevenuePanel();
    if(typeof window.renderRetentionSidebar === 'function') ensureRevenueNav(window.APP_RETENTION_VIEW === 'revenue');
    if(window.APP_MAIN_PANEL === 'retention' && window.APP_RETENTION_VIEW === 'revenue') showRevenueView(true);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  setTimeout(init, 300);
  setTimeout(function(){ if(window.APP_RETENTION_VIEW === 'revenue') window.renderFinanceComparisonCharts(); }, 1000);
})();
