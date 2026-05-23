/* FINAL MANAGER ORDER — clean version only.
   Reorders existing Acquisition Team Overview sections; does not recreate removed sections,
   does not change data logic, Retention, filters, or rep pages. */
(function(){
  var running = false;
  function byId(id){ return document.getElementById(id); }
  function cardByChild(id){ var el = byId(id); return el ? el.closest('.card') : null; }
  function sectionByChild(id){ var el = byId(id); return el ? el.parentElement : null; }
  function labelByText(panel, text){
    text = String(text || '').trim().toLowerCase();
    return Array.prototype.slice.call(panel.children || []).find(function(el){
      return el.classList && el.classList.contains('manager-section-label') &&
        String(el.textContent || '').trim().toLowerCase() === text;
    }) || null;
  }
  function moveTopInOrder(panel, items){
    var frag = document.createDocumentFragment();
    items.forEach(function(el){
      if(el && el.parentNode){ frag.appendChild(el); }
    });
    panel.insertBefore(frag, panel.firstChild);
  }
  function orderAcquisitionManagerOverview(){
    if(running) return;
    running = true;
    try{
      var panel = byId('panel-team');
      if(!panel) return;

      var commandPreview = byId('commandPreview');
      var perfCard = cardByChild('perfBody');

      var criticalLabel = labelByText(panel, 'Critical Follow-ups');
      var priorityLeads = byId('priorityLeadsSection');
      var leadFunnel = byId('leadFunnelSection');
      var leadsOverview = cardByChild('leadsPeriods');

      var coverageLabel = labelByText(panel, 'Coverage Control');
      var outreach = byId('outreachCard');
      var rankCoverage = byId('rankCoverageCard');

      var acquisitionPipeline = cardByChild('pipeHorizContainer');
      var openPipeline = sectionByChild('pipeCards');
      var aiCoaching = cardByChild('aiGrid');
      var wonLost = byId('wonContainer') ? byId('wonContainer').closest('.g2') : null;
      var recCard = cardByChild('recContainer');
      var aiSales = cardByChild('aiInsightsContainer');
      var marketNews = cardByChild('newsContainer');
      var legacyKpi = byId('legacyKpiWrap');

      // Put the manager decision flow at the very top of Acquisition Team Overview.
      // Keep removed sections removed; only reorder visible sections.
      // Requested: Insights + Detailed KPI Cards should appear after Team Performance,
      // and Detailed KPI Cards should be visible by default.
      if(legacyKpi){
        legacyKpi.classList.add('open');
        var legacyBody = legacyKpi.querySelector('.collapsible-body');
        if(legacyBody) legacyBody.style.display = 'block';
      }
      moveTopInOrder(panel, [
        commandPreview,              // 1 Today’s Focus + Health Snapshot + Priority Actions
        perfCard,                    // 2 Team Performance
        recCard,                     // 3 Insights & Recommendations
        legacyKpi,                   // 4 Detailed KPI Cards visible by default
        criticalLabel,               // 5 Critical Follow-ups label
        priorityLeads,               // 6 Priority Leads / SLA
        leadFunnel,                  // 7 Lead Funnel / Source Performance
        leadsOverview,               // 8 Leads Overview
        coverageLabel,               // 9 Coverage Control label
        outreach,                    // 10 Outreach Coverage
        rankCoverage,                // 11 Rank A/B Coverage
        acquisitionPipeline,         // 12 Acquisition Pipeline
        openPipeline,                // 13 Open Pipeline by Rep
        aiCoaching,                  // 14 AI Coaching
        wonLost,                     // 15 Closed Won / Lost
        aiSales,                     // 16 AI Sales Insights
        marketNews                   // 17 Market News
      ]);
    } finally {
      running = false;
    }
  }

  window.orderAcquisitionManagerOverview = orderAcquisitionManagerOverview;

  function scheduleOrder(){
    setTimeout(orderAcquisitionManagerOverview, 0);
    setTimeout(orderAcquisitionManagerOverview, 250);
    setTimeout(orderAcquisitionManagerOverview, 900);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', scheduleOrder);
  } else {
    scheduleOrder();
  }

  // Re-apply after refresh/render without touching the original logic.
  if(typeof window.loadData === 'function' && !window.loadData.__managerOrderWrapped){
    var oldLoadData = window.loadData;
    window.loadData = function(){
      var result = oldLoadData.apply(this, arguments);
      try{
        if(result && typeof result.then === 'function') result.then(scheduleOrder).catch(scheduleOrder);
        else scheduleOrder();
      }catch(e){ scheduleOrder(); }
      return result;
    };
    window.loadData.__managerOrderWrapped = true;
  }

  if(typeof window.switchTab === 'function' && !window.switchTab.__managerOrderWrapped){
    var oldSwitchTab = window.switchTab;
    window.switchTab = function(){
      var result = oldSwitchTab.apply(this, arguments);
      scheduleOrder();
      return result;
    };
    window.switchTab.__managerOrderWrapped = true;
  }
})();
