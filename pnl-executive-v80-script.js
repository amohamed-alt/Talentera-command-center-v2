(function(){
  if(window.__RET_REVENUE_ANALYSIS_TAB__) return;
  window.__RET_REVENUE_ANALYSIS_TAB__ = true;

  function byId(id){ return document.getElementById(id); }
  function show(el, display){ if(el) el.style.display = display; }
  function removeActive(selector){ document.querySelectorAll(selector).forEach(function(x){ x.classList.remove('active'); }); }

  function ensureRevenuePanel(){
    var panel = byId('panel-retention-revenue');
    if(panel) return panel;

    panel = document.createElement('div');
    panel.className = 'panel';
    panel.id = 'panel-retention-revenue';
    panel.innerHTML = ''+
      '<div class="ret-fin-hero" style="border-left-color:var(--blue)">'+
        '<div class="ret-fin-hero-icon" style="background:var(--blue-bg);border-color:var(--blue-bd)">📊</div>'+
        '<div>'+ 
          '<div class="ret-fin-hero-title">Revenue Analysis</div>'+ 
          '<div class="ret-fin-hero-sub">A separate retention view for revenue trends: month vs month, year-to-year, cashing, booking, and cost from the finance comparison sheet.</div>'+ 
        '</div>'+ 
      '</div>'+ 
      '<div id="retRevenueAnalysisMount"></div>';

    var dash = byId('dashMain');
    if(dash) dash.appendChild(panel);
    return panel;
  }

  function ensureRevenueNav(active){
    var mainBtn = byId('side-revenue-analysis-main');
    if(mainBtn) mainBtn.classList.toggle('active', !!active);
    var side = byId('sideRepLinks');
    if(!side) return;
    var existing = byId('side-ret-revenue-analysis');
    if(!existing){
      var btn = document.createElement('button');
      btn.className = 'nav-item';
      btn.id = 'side-ret-revenue-analysis';
      btn.setAttribute('onclick','switchRetentionRevenueAnalysis()');
      btn.innerHTML = '<span class="nav-icon" style="color:var(--blue)">📊</span>Revenue Analysis<span class="view-tag">NEW</span>';
      var financial = byId('side-ret-financial');
      if(financial && financial.parentNode) financial.parentNode.insertBefore(btn, financial.nextSibling);
      else side.insertBefore(btn, side.firstChild);
      existing = btn;
    }
    if(active) existing.classList.add('active');
    else existing.classList.remove('active');
  }

  function moveComparisonBlock(){
    ensureRevenuePanel();
    var block = byId('retFinanceComparisonBlock');
    var mount = byId('retRevenueAnalysisMount');
    if(block && mount && block.parentElement !== mount){
      mount.appendChild(block);
    }
  }

  var previousRenderCharts = window.renderFinanceComparisonCharts;
  if(typeof previousRenderCharts === 'function' && !previousRenderCharts.__revenueTabWrapped){
    window.renderFinanceComparisonCharts = function(){
      var result = previousRenderCharts.apply(this, arguments);
      moveComparisonBlock();
      return result;
    };
    window.renderFinanceComparisonCharts.__revenueTabWrapped = true;
  }

  var previousSidebar = window.renderRetentionSidebar;
  if(typeof previousSidebar === 'function' && !previousSidebar.__revenueTabWrapped){
    window.renderRetentionSidebar = function(activeMode){
      var result = previousSidebar.apply(this, arguments);
      ensureRevenueNav(activeMode === 'revenue');
      return result;
    };
    window.renderRetentionSidebar.__revenueTabWrapped = true;
  }

  window.switchRetentionRevenueAnalysis = function(){
    window.APP_MAIN_PANEL = 'retention';
    window.APP_RETENTION_VIEW = 'revenue';
    window.APP_RETENTION_OWNER_ID = null;
    window.RET_SELECTED_OWNER_ID = null;
    window.RETENTION_SUBVIEW = 'revenue';

    ensureRevenuePanel();

    removeActive('.tab-btn');
    removeActive('.panel');
    removeActive('.nav-item');

    show(byId('tabsBar'), 'none');
    byId('side-retention') && byId('side-retention').classList.add('active');
    byId('panel-retention-revenue') && byId('panel-retention-revenue').classList.add('active');

    if(typeof window.renderRetentionSidebar === 'function') window.renderRetentionSidebar('revenue');
    ensureRevenueNav(true);

    var title = byId('topbarTitle');
    var sub = byId('topbarSub');
    if(title) title.textContent = 'Retention · Revenue Analysis';
    if(sub) sub.textContent = 'Month vs month · Year-to-year · Cashing / Booking / Cost';

    if(typeof window.renderFinanceComparisonCharts === 'function') window.renderFinanceComparisonCharts();
    moveComparisonBlock();
    window.scrollTo(0,0);
  };

  function init(){
    ensureRevenuePanel();
    ensureRevenueNav(false);
    moveComparisonBlock();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  setTimeout(init, 300);
  setTimeout(init, 1000);
})();
