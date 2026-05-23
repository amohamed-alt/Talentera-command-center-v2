(function(){
  if(window.__RETENTION_KPI_DIRECT_FIX__) return;
  window.__RETENTION_KPI_DIRECT_FIX__ = true;

  function set(id,val){
    var el=document.getElementById(id);
    if(el) el.textContent = val ?? 0;
  }

  function money(v){
    return new Intl.NumberFormat("en-US",{
      style:"currency",
      currency:"USD",
      maximumFractionDigits:0,
      minimumFractionDigits:0
    }).format(Number(v||0));
  }

  function fixRetentionKpis(){
    var k = window.R?.kpi || window.R?.kpis || {};
    var y = k.yesterday || k.yest || {};
    var m = k.mtd || {};
    var t = k.ytd || {};

    set("retYCalls", y.calls);
    set("retYMeetings", y.meetings);
    set("retYRenewed", y.renewed);
    set("retYBooked", y.booked);
    set("retYCashed", y.cashed);
    set("retYChurn", y.churn);
    set("retYDelayed", y.delayed);

    set("retMCalls", m.calls);
    set("retMMeetings", m.meetings);
    set("retMRenewed", m.renewed);
    set("retMBooked", m.booked);
    set("retMCashed", m.cashed);
    set("retMChurn", m.churn);
    set("retMDelayed", m.delayed);
    set("retMBookedValue", money(m.bookedAmt));
    set("retMCashedValue", money(m.cashedAmt));

    set("retYtdCalls", t.calls);
    set("retYtdMeetings", t.meetings);
    set("retYtdRenewed", t.renewed);
    set("retYtdBooked", t.booked);
    set("retYtdCashed", t.cashed);
    set("retYtdChurn", t.churn);
    set("retYtdDelayed", t.delayed);
  }

  window.fixRetentionKpis = fixRetentionKpis;

  var oldRenderRetention = window.renderRetention;
  if(typeof oldRenderRetention === "function"){
    window.renderRetention = function(){
      var out = oldRenderRetention.apply(this, arguments);
      fixRetentionKpis();
      setTimeout(fixRetentionKpis, 100);
      setTimeout(fixRetentionKpis, 500);
      return out;
    };
    try{ renderRetention = window.renderRetention; }catch(e){}
  }

  var oldSwitchMainPanel = window.switchMainPanel;
  if(typeof oldSwitchMainPanel === "function"){
    window.switchMainPanel = function(panel){
      var out = oldSwitchMainPanel.apply(this, arguments);
      if(panel === "retention"){
        fixRetentionKpis();
        setTimeout(fixRetentionKpis, 100);
        setTimeout(fixRetentionKpis, 500);
      }
      return out;
    };
    try{ switchMainPanel = window.switchMainPanel; }catch(e){}
  }

  var oldLoadData = window.loadData;
  if(typeof oldLoadData === "function"){
    window.loadData = async function(){
      var out = await oldLoadData.apply(this, arguments);
      fixRetentionKpis();
      setTimeout(fixRetentionKpis, 300);
      return out;
    };
    try{ loadData = window.loadData; }catch(e){}
  }

  setTimeout(fixRetentionKpis, 500);
  setTimeout(fixRetentionKpis, 1500);
})();
