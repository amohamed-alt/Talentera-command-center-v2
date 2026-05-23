(function(){
  window.RET_FIN_CHART_FILTERS = window.RET_FIN_CHART_FILTERS || { metric: 'all', mode: 'monthly', year: 'both' };
  window.retFinanceComparisonCharts = window.retFinanceComparisonCharts || {};

  function byId(id){ return document.getElementById(id); }
  function safe(v){ return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
  function num(v){ var n = Number(String(v == null ? '' : v).replace(/[$,]/g,'')); return Number.isFinite(n) ? n : null; }
  function moneyFull(v){ return '$' + Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 0 }); }
  function shortMoney(v){
    v = Number(v || 0);
    if(Math.abs(v) >= 1000000) return '$' + (v / 1000000).toFixed(1).replace('.0','') + 'M';
    if(Math.abs(v) >= 1000) return '$' + Math.round(v / 1000).toLocaleString('en-US') + 'K';
    return moneyFull(v);
  }
  function arr(v){ return Array.isArray(v) ? v : []; }
  function filledIndex(values){
    var idx = -1;
    arr(values).forEach(function(v,i){ if(v !== null && v !== undefined && v !== '' && Number(v) !== 0) idx = i; });
    return idx;
  }
  function sum(values, endIndex){
    var list = arr(values);
    var end = endIndex == null ? list.length - 1 : endIndex;
    return list.slice(0, end + 1).reduce(function(t,v){ return t + (Number(v) || 0); }, 0);
  }
  function chartColors(){
    return {
      cashing: getComputedStyle(document.documentElement).getPropertyValue('--green').trim() || '#16A34A',
      booking: getComputedStyle(document.documentElement).getPropertyValue('--purple').trim() || '#7C3AED',
      cost: getComputedStyle(document.documentElement).getPropertyValue('--amber').trim() || '#D97706',
      blue: getComputedStyle(document.documentElement).getPropertyValue('--blue').trim() || '#2563EB',
      cyan: getComputedStyle(document.documentElement).getPropertyValue('--cyan').trim() || '#0891B2',
      red: getComputedStyle(document.documentElement).getPropertyValue('--red').trim() || '#DC2626'
    };
  }
  function getFC(){ return (window.R && window.R.financeComparison) || (window.D && window.D.financeComparison) || null; }
  function ensureFinanceComparisonBlock(){
    var panel = byId('panel-retention-financial');
    if(!panel) return null;
    var block = byId('retFinanceComparisonBlock');
    if(block) return block;
    var anchor = byId('retFinTopGrid') || panel.querySelector('.ret-fin-hero');
    block = document.createElement('div');
    block.id = 'retFinanceComparisonBlock';
    block.className = 'ret-fin-comparison-board';
    block.innerHTML = ''+
      '<div class="ret-fin-comparison-hd">'+
        '<div><div class="ret-fin-comparison-title">📈 Finance Comparison</div><div class="ret-fin-comparison-sub">Month vs month and year-to-year view from the finance comparison sheet.</div></div>'+
        '<div class="ret-fin-comparison-filters">'+
          '<select id="retFinChartMetric" class="ret-sheet-select"><option value="all">All Metrics</option><option value="cashing">Cashing</option><option value="booking">Booking</option><option value="cost">Cost</option></select>'+
          '<select id="retFinChartMode" class="ret-sheet-select"><option value="monthly">Monthly</option><option value="ytd">YTD</option></select>'+
          '<select id="retFinChartYear" class="ret-sheet-select"><option value="both">2025 vs 2026</option><option value="2025">2025 Only</option><option value="2026">2026 Only</option></select>'+
        '</div>'+
      '</div>'+
      '<div class="ret-fin-comparison-kpis" id="retFinanceComparisonKpis"></div>'+
      '<div class="ret-fin-comparison-grid">'+
        '<div class="ret-fin-chart-card" data-chart-card="cashing"><div class="ret-fin-chart-title">Cashing Month vs Month</div><canvas id="retCashingMonthChart"></canvas></div>'+
        '<div class="ret-fin-chart-card" data-chart-card="booking"><div class="ret-fin-chart-title">Booking Month vs Month</div><canvas id="retBookingMonthChart"></canvas></div>'+
        '<div class="ret-fin-chart-card" data-chart-card="cost"><div class="ret-fin-chart-title">Cost Month vs Month</div><canvas id="retCostMonthChart"></canvas></div>'+
        '<div class="ret-fin-chart-card" data-chart-card="ytd"><div class="ret-fin-chart-title" id="retYearToYearTitle">Year to Year</div><canvas id="retYearToYearChart"></canvas></div>'+
      '</div>';
    if(anchor && anchor.parentNode) anchor.parentNode.insertBefore(block, anchor.nextSibling);
    else panel.insertBefore(block, panel.firstChild);

    ['retFinChartMetric','retFinChartMode','retFinChartYear'].forEach(function(id){
      var el = byId(id);
      if(!el) return;
      var key = id === 'retFinChartMetric' ? 'metric' : id === 'retFinChartMode' ? 'mode' : 'year';
      el.value = window.RET_FIN_CHART_FILTERS[key] || el.value;
      el.onchange = function(){ window.RET_FIN_CHART_FILTERS[key] = this.value; renderFinanceComparisonCharts(); };
    });
    return block;
  }
  function destroyChart(id){
    if(window.retFinanceComparisonCharts[id]){
      window.retFinanceComparisonCharts[id].destroy();
      delete window.retFinanceComparisonCharts[id];
    }
  }
  function createChart(id, config){
    var el = byId(id);
    if(!el || typeof Chart === 'undefined') return;
    destroyChart(id);
    window.retFinanceComparisonCharts[id] = new Chart(el, config);
  }
  function lineData(label, data, color, hidden){
    return { label: label, data: arr(data), borderColor: color, backgroundColor: color, borderWidth: 3, tension: 0.35, pointRadius: 3, spanGaps: true, hidden: !!hidden };
  }
  function commonOptions(){
    return { responsive:true, maintainAspectRatio:false, interaction:{mode:'index',intersect:false}, plugins:{ legend:{position:'top'}, tooltip:{callbacks:{label:function(ctx){return ctx.dataset.label + ': ' + moneyFull(ctx.raw || 0);}}}}, scales:{ y:{ticks:{callback:function(v){return shortMoney(v);}}}} };
  }
  function renderKpis(fc, endIndex, ytdLabel){
    var kpis = [
      {label:'Cashing 2025', value:sum(fc.cashing2025,endIndex), color:'var(--green)'},
      {label:'Cashing 2026', value:sum(fc.cashing2026,endIndex), color:'var(--green)'},
      {label:'Booking 2025', value:sum(fc.booking2025,endIndex), color:'var(--purple)'},
      {label:'Booking 2026', value:sum(fc.booking2026,endIndex), color:'var(--purple)'},
      {label:'Cost 2025', value:sum(fc.cost2025,endIndex), color:'var(--amber)'},
      {label:'Cost 2026', value:sum(fc.cost2026,endIndex), color:'var(--amber)'}
    ];
    var box = byId('retFinanceComparisonKpis');
    if(box) box.innerHTML = kpis.map(function(k){ return '<div class="ret-fin-comparison-kpi" style="--fc:'+k.color+'"><div class="ret-fin-comparison-kpi-v">'+shortMoney(k.value)+'</div><div class="ret-fin-comparison-kpi-l">'+safe(k.label)+'</div><div class="ret-fin-comparison-kpi-s">'+safe(ytdLabel)+'</div></div>'; }).join('');
  }
  function setCardVisibility(metric, mode){
    document.querySelectorAll('#retFinanceComparisonBlock [data-chart-card]').forEach(function(card){
      var kind = card.getAttribute('data-chart-card');
      var show = true;
      if(mode === 'ytd') show = kind === 'ytd';
      else if(metric !== 'all') show = kind === metric || kind === 'ytd';
      card.style.display = show ? '' : 'none';
    });
  }
  window.renderFinanceComparisonCharts = function(){
    var block = ensureFinanceComparisonBlock();
    if(!block) return;
    var fc = getFC();
    if(!fc){
      block.querySelector('.ret-fin-comparison-grid').innerHTML = '<div class="ret-fin-chart-card" style="grid-column:1/-1"><div class="ret-fin-empty">No financeComparison found in Supabase retention views. Run the Retention workflow first.</div></div>';
      return;
    }
    if(typeof Chart === 'undefined') return;
    var filters = window.RET_FIN_CHART_FILTERS || {metric:'all',mode:'monthly',year:'both'};
    var months = arr(fc.months).length ? fc.months : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var endIndex = Math.max(filledIndex(fc.cashing2026), filledIndex(fc.booking2026), filledIndex(fc.cost2026));
    if(endIndex < 0) endIndex = months.length - 1;
    var ytdLabel = months[0] + ' - ' + months[endIndex];
    var c = chartColors();
    renderKpis(fc, endIndex, ytdLabel);
    setCardVisibility(filters.metric || 'all', filters.mode || 'monthly');
    var include25 = filters.year !== '2026';
    var include26 = filters.year !== '2025';
    var opt = commonOptions();
    createChart('retCashingMonthChart', { type:'line', data:{ labels:months, datasets:[ lineData('Cashing 2025', fc.cashing2025, c.green, !include25), lineData('Cashing 2026', fc.cashing2026, c.cyan, !include26) ] }, options: opt });
    createChart('retBookingMonthChart', { type:'line', data:{ labels:months, datasets:[ lineData('Booking 2025', fc.booking2025, c.purple || '#7C3AED', !include25), lineData('Booking 2026', fc.booking2026, c.blue, !include26) ] }, options: opt });
    createChart('retCostMonthChart', { type:'line', data:{ labels:months, datasets:[ lineData('Cost 2025', fc.cost2025, c.amber, !include25), lineData('Cost 2026', fc.cost2026, c.red, !include26) ] }, options: opt });
    var title = byId('retYearToYearTitle');
    if(title) title.textContent = 'Year to Year (' + ytdLabel + ')';
    createChart('retYearToYearChart', { type:'bar', data:{ labels:['Cashing','Booking','Cost'], datasets:[ {label:'2025 ('+ytdLabel+')', data:[sum(fc.cashing2025,endIndex),sum(fc.booking2025,endIndex),sum(fc.cost2025,endIndex)], backgroundColor:c.cyan, borderWidth:1, hidden:!include25}, {label:'2026 ('+ytdLabel+')', data:[sum(fc.cashing2026,endIndex),sum(fc.booking2026,endIndex),sum(fc.cost2026,endIndex)], backgroundColor:c.green, borderWidth:1, hidden:!include26} ] }, options: commonOptions() });
  };
  function wrapRetentionFinancialRender(){
    if(!window.renderRetentionFinancialDetails || window.renderRetentionFinancialDetails.__financeComparisonWrapped) return;
    var original = window.renderRetentionFinancialDetails;
    window.renderRetentionFinancialDetails = function(){
      var result = original.apply(this, arguments);
      setTimeout(function(){ window.renderFinanceComparisonCharts(); }, 0);
      return result;
    };
    window.renderRetentionFinancialDetails.__financeComparisonWrapped = true;
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ wrapRetentionFinancialRender(); setTimeout(window.renderFinanceComparisonCharts, 250); });
  else { wrapRetentionFinancialRender(); setTimeout(window.renderFinanceComparisonCharts, 250); }
})();
