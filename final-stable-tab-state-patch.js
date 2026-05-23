(function(){
  if(window.__PNL_SUPABASE_LAZY_LOAD_V1__) return;
  window.__PNL_SUPABASE_LAZY_LOAD_V1__ = true;

  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var MONTH_INDEX = {jan:0,january:0,feb:1,february:1,mar:2,march:2,apr:3,april:3,may:4,jun:5,june:5,jul:6,july:6,aug:7,august:7,sep:8,september:8,oct:9,october:9,nov:10,november:10,dec:11,december:11};
  var PNL_CACHE = null;
  var PNL_LOADING = null;

  function byId(id){ return document.getElementById(id); }
  function n(v){ var x = Number(String(v == null ? 0 : v).replace(/[$,%\s,]/g,'')); return Number.isFinite(x) ? x : 0; }
  function esc(v){ return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
  function monthIdx(v){
    if(v == null || v === '') return -1;
    if(typeof v === 'number') return Math.max(0, Math.min(11, Math.round(v)-1));
    var s = String(v).trim().toLowerCase();
    if(/^\d+$/.test(s)) return Math.max(0, Math.min(11, Number(s)-1));
    s = s.slice(0,3);
    return MONTH_INDEX[s] != null ? MONTH_INDEX[s] : -1;
  }
  function emptyArrays(){
    return {booking2025:Array(12).fill(0),booking2026:Array(12).fill(0),cashing2025:Array(12).fill(0),cashing2026:Array(12).fill(0),cogs2025:Array(12).fill(0),cogs2026:Array(12).fill(0),overheads2025:Array(12).fill(0),overheads2026:Array(12).fill(0),supportAllocation2025:Array(12).fill(0),supportAllocation2026:Array(12).fill(0),cost2025:Array(12).fill(0),cost2026:Array(12).fill(0)};
  }
  function setMetric(out, year, idx, key, value){
    if(idx < 0 || idx > 11) return;
    var y = String(year) === '2025' ? '2025' : '2026';
    var map = {booking:'booking', cashing:'cashing', revenue:'cashing', cogs:'cogs', overheads:'overheads', support_allocation:'supportAllocation', supportAllocation:'supportAllocation', total_cost:'cost', cost:'cost'};
    var k = map[key] || key;
    var arr = out[k + y];
    if(Array.isArray(arr)) arr[idx] += n(value);
  }
  function buildFinanceComparison(rows){
    rows = Array.isArray(rows) ? rows : [];
    var out = emptyArrays();
    rows.forEach(function(r){
      var idx = monthIdx(r.month);
      var year = String(r.year || '').trim();
      if(year !== '2025' && year !== '2026') return;
      setMetric(out, year, idx, 'booking', r.booking);
      setMetric(out, year, idx, 'cashing', r.cashing);
      setMetric(out, year, idx, 'cogs', r.cogs);
      setMetric(out, year, idx, 'overheads', r.overheads);
      setMetric(out, year, idx, 'supportAllocation', r.support_allocation);
      var componentCost = n(r.cogs) + n(r.overheads) + n(r.support_allocation);
      setMetric(out, year, idx, 'cost', Math.abs(componentCost) > 0.0001 ? componentCost : r.total_cost);
    });
    var latest = -1;
    ['booking2026','cashing2026','cost2026','cogs2026','overheads2026','supportAllocation2026'].forEach(function(k){
      out[k].forEach(function(v,i){ if(Math.abs(n(v)) > 0.0001) latest = Math.max(latest, i); });
    });
    if(latest < 0) latest = Math.max(0, Math.min(11, new Date().getMonth()));
    var fc = Object.assign({
      source:'Supabase · vw_pnl_monthly_summary_v2',
      lastUpdated:new Date().toISOString(),
      months:MONTHS.slice(),
      activeMonthIndex:latest,
      activeMonth:MONTHS[latest],
      activeRangeLabel:'Jan - ' + MONTHS[latest]
    }, out);
    fc.raw = {
      booking:{'2025':out.booking2025,'2026':out.booking2026},
      cashing:{'2025':out.cashing2025,'2026':out.cashing2026},
      cogs:{'2025':out.cogs2025,'2026':out.cogs2026},
      overheads:{'2025':out.overheads2025,'2026':out.overheads2026},
      supportAllocation:{'2025':out.supportAllocation2025,'2026':out.supportAllocation2026},
      cost:{'2025':out.cost2025,'2026':out.cost2026}
    };
    return fc;
  }
  function injectFinanceComparison(fc){
    window.R = window.R || {};
    window.R.financeComparison = fc;
    if(typeof R !== 'undefined' && R){ try{ R.financeComparison = fc; }catch(e){} }
    window.RETENTION_PNL_SUPABASE = fc;
  }
  function supabaseFetch(view, limit){
    if(typeof window.supabaseView === 'function') return window.supabaseView(view, limit || 10000);
    if(typeof supabaseView === 'function') return supabaseView(view, limit || 10000);
    var url = String(window.SUPABASE_URL || 'https://czaxtwbmborxwzaboqxl.supabase.co') + '/rest/v1/' + encodeURIComponent(view) + '?select=*&limit=' + (limit || 10000);
    var key = window.SUPABASE_KEY || 'sb_publishable_uVUdpVWggu1WvkSKCAi51w_9qsb-AjX';
    return fetch(url,{cache:'no-store',headers:{apikey:key,Authorization:'Bearer ' + key}}).then(function(res){ if(!res.ok) throw new Error(view + ' ' + res.status); return res.json(); });
  }
  async function loadPnlFromSupabase(force){
    if(PNL_CACHE && !force) return PNL_CACHE;
    if(PNL_LOADING && !force) return PNL_LOADING;
    PNL_LOADING = supabaseFetch('vw_pnl_monthly_summary_v2', 5000).then(function(rows){
      var fc = buildFinanceComparison(rows || []);
      PNL_CACHE = fc;
      injectFinanceComparison(fc);
      PNL_LOADING = null;
      return fc;
    }).catch(function(err){
      PNL_LOADING = null;
      throw err;
    });
    return PNL_LOADING;
  }
  function ensurePnlShell(){
    var panel = byId('panel-retention-revenue');
    if(!panel){
      panel = document.createElement('div');
      panel.className = 'panel';
      panel.id = 'panel-retention-revenue';
      var dash = byId('dashMain') || document.querySelector('.content') || document.body;
      dash.appendChild(panel);
    }
    if(!byId('retRevenueAnalysisMount')){
      panel.innerHTML = '<div class="ret-fin-hero" style="border-left-color:var(--blue)"><div class="ret-fin-hero-icon" style="background:var(--blue-bg);border-color:var(--blue-bd)">📊</div><div><div class="ret-fin-hero-title">P&amp;L</div><div class="ret-fin-hero-sub">Executive dynamic view from Supabase P&L rows with Booking, Cashing, Total Cost, COGS, Overheads, Support Allocation, and break-even analysis.</div></div></div><div id="retRevenueAnalysisMount"></div>';
    }
    var m = byId('retRevenueAnalysisMount');
    var block = byId('retFinanceComparisonBlock');
    if(!block && m){ block = document.createElement('div'); block.id = 'retFinanceComparisonBlock'; block.className = 'pnl-v80-board'; m.appendChild(block); }
    return block;
  }
  function markPnlActive(){
    window.APP_MAIN_PANEL='retention'; window.APP_RETENTION_VIEW='revenue'; window.APP_RETENTION_OWNER_ID=null; window.RET_SELECTED_OWNER_ID=null; window.RETENTION_SUBVIEW='revenue';
    try{ APP_MAIN_PANEL='retention'; APP_RETENTION_VIEW='revenue'; APP_RETENTION_OWNER_ID=null; RET_SELECTED_OWNER_ID=null; RETENTION_SUBVIEW='revenue'; }catch(e){}
    if(document.body) document.body.classList.add('pnl-active');
    document.querySelectorAll('.tab-btn,.panel,.nav-item').forEach(function(x){ x.classList.remove('active'); });
    var tabs = byId('tabsBar'); if(tabs) tabs.style.display = 'none';
    var pnl = byId('panel-retention-revenue'); if(pnl) pnl.classList.add('active');
    var sideRet = byId('side-retention'); if(sideRet) sideRet.classList.add('active');
    var sidePnl = byId('side-revenue-analysis-main') || byId('side-ret-revenue-analysis');
    if(sidePnl){ sidePnl.classList.add('active'); sidePnl.setAttribute('onclick','switchRetentionRevenueAnalysis()'); }
    var title = byId('topbarTitle'); if(title) title.textContent = 'P&L · Revenue Analysis';
    var sub = byId('topbarSub'); if(sub) sub.textContent = 'Supabase · 2025 full year · 2026 actual to date · COGS + Overheads + Support Allocation';
  }
  function showPnlLoading(){
    var block = ensurePnlShell();
    if(!block) return;
    block.className = 'pnl-v80-board';
    block.innerHTML = '<div class="pnl-v80-head"><div><div class="pnl-v80-title">Executive P&L Dashboard</div><div class="pnl-v80-sub">Reading Supabase P&L views · lazy loaded only when P&L opens</div></div><div class="pnl-v80-live"><span class="pnl-v80-pulse"></span>Loading Supabase</div></div><div class="pnl-v80-loader"><div class="pnl-v80-loader-top"><span class="pnl-v80-spinner"></span><span>Fetching vw_pnl_monthly_summary_v2 and building charts...</span></div><div class="pnl-v80-skeleton-grid"><div class="pnl-v80-skeleton"></div><div class="pnl-v80-skeleton"></div><div class="pnl-v80-skeleton"></div><div class="pnl-v80-skeleton"></div><div class="pnl-v80-skeleton chart"></div><div class="pnl-v80-skeleton chart"></div><div class="pnl-v80-skeleton chart"></div><div class="pnl-v80-skeleton chart"></div></div></div>';
  }
  function showPnlError(err){
    var block = ensurePnlShell();
    if(!block) return;
    block.innerHTML = '<div class="pnl-v80-head"><div><div class="pnl-v80-title">Executive P&L Dashboard</div><div class="pnl-v80-sub">Supabase P&L could not load</div></div></div><div class="pnl-v80-empty">'+esc(err && err.message ? err.message : err)+'</div>';
  }
  async function activateSupabasePnl(options){
    options = options || {};
    ensurePnlShell();
    markPnlActive();
    showPnlLoading();
    try{
      await loadPnlFromSupabase(!!options.force);
      markPnlActive();
      if(typeof window.renderFinanceComparisonCharts === 'function') window.renderFinanceComparisonCharts(true);
    }catch(err){
      console.error('P&L Supabase lazy load failed', err);
      showPnlError(err);
    }
    if(!options.keepScroll) window.scrollTo({top:0,behavior:options.instant?'auto':'smooth'});
  }

  var previousSwitch = window.switchRetentionRevenueAnalysis;
  window.switchRetentionRevenueAnalysis = function(){ return activateSupabasePnl({instant:false}); };
  try{ switchRetentionRevenueAnalysis = window.switchRetentionRevenueAnalysis; }catch(e){}

  var previousRender = window.renderFinanceComparisonCharts;
  window.renderFinanceComparisonCharts = function(){
    if(window.APP_MAIN_PANEL === 'retention' && window.APP_RETENTION_VIEW === 'revenue' && !window.RETENTION_PNL_SUPABASE){
      activateSupabasePnl({keepScroll:true, instant:true});
      return;
    }
    if(typeof previousRender === 'function') return previousRender.apply(this, arguments);
  };

  var previousLoadData = window.loadData;
  if(typeof previousLoadData === 'function' && !previousLoadData.__pnlSupabaseLazyV1){
    window.loadData = async function(){
      var wasPnl = window.APP_MAIN_PANEL === 'retention' && window.APP_RETENTION_VIEW === 'revenue';
      var out = previousLoadData.apply(this, arguments);
      if(out && typeof out.then === 'function') await out;
      if(wasPnl) setTimeout(function(){ activateSupabasePnl({force:true,keepScroll:true,instant:true}); },0);
      return out;
    };
    window.loadData.__pnlSupabaseLazyV1 = true;
    try{ loadData = window.loadData; }catch(e){}
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ if(window.APP_MAIN_PANEL === 'retention' && window.APP_RETENTION_VIEW === 'revenue') activateSupabasePnl({keepScroll:true,instant:true}); });
  else setTimeout(function(){ if(window.APP_MAIN_PANEL === 'retention' && window.APP_RETENTION_VIEW === 'revenue') activateSupabasePnl({keepScroll:true,instant:true}); }, 0);
})();
