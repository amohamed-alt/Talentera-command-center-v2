(function(){
  if(window.__retentionFinancialWideStateV58) return;
  window.__retentionFinancialWideStateV58 = true;

  function syncWideClass(){
    if(!document.body) return;
    var active = window.APP_MAIN_PANEL === 'retention' && window.APP_RETENTION_VIEW === 'financial';
    document.body.classList.toggle('retention-financial-wide', !!active);
  }

  var oldSwitchMainPanel = window.switchMainPanel;
  if(typeof oldSwitchMainPanel === 'function' && !oldSwitchMainPanel.__wideStateV58){
    window.switchMainPanel = function(){
      var out = oldSwitchMainPanel.apply(this, arguments);
      setTimeout(syncWideClass, 0);
      return out;
    };
    window.switchMainPanel.__wideStateV58 = true;
    try{ switchMainPanel = window.switchMainPanel; }catch(e){}
  }

  var oldSwitchTab = window.switchTab;
  if(typeof oldSwitchTab === 'function' && !oldSwitchTab.__wideStateV58){
    window.switchTab = function(){
      var out = oldSwitchTab.apply(this, arguments);
      setTimeout(syncWideClass, 0);
      return out;
    };
    window.switchTab.__wideStateV58 = true;
    try{ switchTab = window.switchTab; }catch(e){}
  }

  var oldSwitchRetentionFinancial = window.switchRetentionFinancial;
  if(typeof oldSwitchRetentionFinancial === 'function' && !oldSwitchRetentionFinancial.__wideStateV58){
    window.switchRetentionFinancial = function(){
      var out = oldSwitchRetentionFinancial.apply(this, arguments);
      if(document.body) document.body.classList.add('retention-financial-wide');
      setTimeout(syncWideClass, 0);
      return out;
    };
    window.switchRetentionFinancial.__wideStateV58 = true;
    try{ switchRetentionFinancial = window.switchRetentionFinancial; }catch(e){}
  }

  syncWideClass();
})();
