(function(){
  if(window.__RETENTION_FINANCIAL_FINAL_GUARD_NO_AUDIT_PATCH__) return;
  window.__RETENTION_FINANCIAL_FINAL_GUARD_NO_AUDIT_PATCH__ = true;

  function byId(id){ return document.getElementById(id); }
  function keepFinancialActive(){
    window.APP_MAIN_PANEL = 'retention';
    window.APP_RETENTION_VIEW = 'financial';
    window.APP_RETENTION_OWNER_ID = null;
    try{ APP_MAIN_PANEL = 'retention'; APP_RETENTION_VIEW = 'financial'; APP_RETENTION_OWNER_ID = null; }catch(e){}
    document.querySelectorAll('.panel').forEach(function(panel){ panel.classList.remove('active'); });
    var financialPanel = byId('panel-retention-financial');
    if(financialPanel) financialPanel.classList.add('active');
    var tabs = byId('tabsBar');
    if(tabs) tabs.style.display = 'none';
    document.querySelectorAll('.nav-item').forEach(function(item){ item.classList.remove('active'); });
    var retentionMain = byId('side-retention');
    if(retentionMain) retentionMain.classList.add('active');
    var retentionFinancial = byId('side-ret-financial');
    if(retentionFinancial) retentionFinancial.classList.add('active');
    var title = byId('topbarTitle');
    if(title) title.textContent = 'Retention · Financial Details';
  }
  function removeAudit(){
    document.querySelectorAll('#retFinAuditBoard').forEach(function(el){ el.remove(); });
  }
  function bindFilters(){
    var map = {
      retFinFilterMonth:'month',
      retFinFilterRm:'rm',
      retFinFilterCsm:'csm',
      retFinFilterProduct:'product',
      retFinFilterAccountStatus:'accountStatus'
    };
    Object.keys(map).forEach(function(id){
      var el = byId(id);
      if(!el || el.__retFinFinalBound) return;
      el.__retFinFinalBound = true;
      el.addEventListener('change', function(){
        if(typeof window.retFinSetFilter === 'function') window.retFinSetFilter(map[id], el.value || 'All');
      });
    });
  }

  var oldRender = window.renderRetentionFinancialDetails;
  if(typeof oldRender === 'function' && !oldRender.__retFinFinalGuardNoAudit){
    window.renderRetentionFinancialDetails = function(){
      keepFinancialActive();
      var out = oldRender.apply(this, arguments);
      removeAudit();
      bindFilters();
      keepFinancialActive();
      return out;
    };
    window.renderRetentionFinancialDetails.__retFinFinalGuardNoAudit = true;
    try{ renderRetentionFinancialDetails = window.renderRetentionFinancialDetails; }catch(e){}
  }

  var oldSwitch = window.switchRetentionFinancial;
  if(typeof oldSwitch === 'function' && !oldSwitch.__retFinFinalGuardNoAudit){
    window.switchRetentionFinancial = function(){
      keepFinancialActive();
      var out = oldSwitch.apply(this, arguments);
      setTimeout(function(){
        keepFinancialActive();
        removeAudit();
        bindFilters();
      }, 0);
      return out;
    };
    window.switchRetentionFinancial.__retFinFinalGuardNoAudit = true;
    try{ switchRetentionFinancial = window.switchRetentionFinancial; }catch(e){}
  }

  var oldRestore = window.restoreCurrentView;
  if(typeof oldRestore === 'function' && !oldRestore.__retFinFinalGuardNoAudit){
    window.restoreCurrentView = function(){
      if(window.APP_MAIN_PANEL === 'retention' && window.APP_RETENTION_VIEW === 'financial'){
        keepFinancialActive();
        if(typeof window.renderRetentionFinancialDetails === 'function') window.renderRetentionFinancialDetails();
        return;
      }
      return oldRestore.apply(this, arguments);
    };
    window.restoreCurrentView.__retFinFinalGuardNoAudit = true;
    try{ restoreCurrentView = window.restoreCurrentView; }catch(e){}
  }

  var oldLoad = window.loadData;
  if(typeof oldLoad === 'function' && !oldLoad.__retFinFinalGuardNoAudit){
    window.loadData = async function(){
      var wasFinancial = window.APP_MAIN_PANEL === 'retention' && window.APP_RETENTION_VIEW === 'financial';
      var scrollY = window.scrollY;
      var out = oldLoad.apply(this, arguments);
      if(out && typeof out.then === 'function') await out;
      if(wasFinancial || (window.APP_MAIN_PANEL === 'retention' && window.APP_RETENTION_VIEW === 'financial')){
        keepFinancialActive();
        if(typeof window.renderRetentionFinancialDetails === 'function') window.renderRetentionFinancialDetails();
        requestAnimationFrame(function(){ window.scrollTo(0, scrollY); });
      }
      removeAudit();
      bindFilters();
      return out;
    };
    window.loadData.__retFinFinalGuardNoAudit = true;
    try{ loadData = window.loadData; }catch(e){}
  }

  document.addEventListener('change', function(e){
    var id = e.target && e.target.id;
    var map = {
      retFinFilterMonth:'month',
      retFinFilterRm:'rm',
      retFinFilterCsm:'csm',
      retFinFilterProduct:'product',
      retFinFilterAccountStatus:'accountStatus'
    };
    if(map[id] && typeof window.retFinSetFilter === 'function'){
      keepFinancialActive();
    }
  }, true);

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ removeAudit(); bindFilters(); });
  }else{
    setTimeout(function(){ removeAudit(); bindFilters(); }, 0);
  }
})();
