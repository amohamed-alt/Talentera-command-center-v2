/* HARD LOCK: Supabase-only runtime. No legacy JSON reads. */
(function(){
  if(window.__TALENTERA_SUPABASE_ONLY_HARD_LOCK_V1__) return;
  window.__TALENTERA_SUPABASE_ONLY_HARD_LOCK_V1__ = true;
  window.TALENTERA_SUPABASE_ONLY = true;
  window.TALENTERA_AUTO_REFRESH_DISABLED = true;
  if(window.__dashboardAutoRefreshTimer){ clearInterval(window.__dashboardAutoRefreshTimer); window.__dashboardAutoRefreshTimer = null; }

  var SUPA_URL = 'https://czaxtwbmborxwzaboqxl.supabase.co';
  var SUPA_KEY = 'sb_publishable_uVUdpVWggu1WvkSKCAi51w_9qsb-AjX';
  var ACQ_VIEWS = {
    acqReps:'vw_acquisition_sidebar_reps',
    acqRep:'vw_acquisition_rep_kpi_periods',
    acqTeam:'vw_acquisition_team_snapshot',
    rank:'vw_acquisition_rank_details',
    rankTouch:'vw_acquisition_rank_ab_touch_summary',
    rankNoTouch:'vw_acquisition_rank_ab_no_touch_details',
    need:'vw_acquisition_leads_need_contact_v2',
    pipe:'vw_acquisition_pipeline_by_owner',
    pipeSnapshot:'vw_acquisition_pipeline_snapshot',
    deals:'vw_acquisition_pipeline_details',
    stage:'vw_acquisition_pipeline_by_stage',
    stuck:'vw_acquisition_stuck_deals',
    cold:'vw_acquisition_cold_deals',
    dashboardSummary:'vw_acquisition_dashboard_summary',
    kpiPeriods:'vw_acquisition_kpi_snapshot_periods',
    ownerCoverage:'vw_acquisition_owner_coverage',
    countryCoverage:'vw_acquisition_country_coverage',
    rankCoverageV2:'vw_acquisition_rank_coverage_v2',
    dealSummary:'vw_acquisition_deal_summary',
    attentionDetails:'vw_acquisition_pipeline_attention_details',
    attentionSummary:'vw_acquisition_pipeline_attention_summary'
  };

  function byId(id){ return document.getElementById(id); }
  function spin(on){ var ri=byId('ri'); if(ri) ri.classList.toggle('spin', !!on); }
  function setTop(title, sub){ var t=byId('topbarTitle'), s=byId('topbarSub'); if(t) t.textContent=title; if(s) s.textContent=sub; }
  function num(v){ var x=Number(String(v == null ? 0 : v).replace(/[^0-9.-]/g,'')); return Number.isFinite(x)?x:0; }
  function text(v){ return String(v == null ? '' : v).trim(); }
  function escLocal(v){ return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }

  async function view(name, limit){
    if(typeof window.supabaseView === 'function') return window.supabaseView(name, limit || 10000);
    if(typeof supabaseView === 'function') return supabaseView(name, limit || 10000);
    var url = SUPA_URL + '/rest/v1/' + encodeURIComponent(name) + '?select=*&limit=' + (limit || 10000);
    var res = await fetch(url, { cache:'no-store', headers:{ apikey:SUPA_KEY, Authorization:'Bearer ' + SUPA_KEY } });
    if(!res.ok) throw new Error(name + ' HTTP ' + res.status);
    return await res.json();
  }

  async function fetchAcquisitionOnly(){
    var out = {};
    await Promise.all(Object.keys(ACQ_VIEWS).map(async function(key){
      try{ out[key] = await view(ACQ_VIEWS[key], 20000); }
      catch(e){ console.warn('Supabase Acquisition view failed:', ACQ_VIEWS[key], e); out[key] = []; }
    }));
    return out;
  }

  function mapFeaturesPlanRows(rows){
    return (Array.isArray(rows) ? rows : []).map(function(r){
      return {
        product: r.product_line || r.product || '',
        productLine: r.product_line || r.product || '',
        clientName: r.company_name || r.client_name || r.company || '',
        companyName: r.company_name || r.client_name || r.company || '',
        csm: r.csm_owner || r.csm || '',
        csmOwner: r.csm_owner || r.csm || '',
        rm: r.owner_name || r.rm_owner || r.rm || '',
        rmOwner: r.owner_name || r.rm_owner || r.rm || '',
        renewalMonth: r.expected_month || r.renewal_month || r.month || '',
        expectedMonth: r.expected_month || r.renewal_month || r.month || '',
        renewalValue: num(r.renewal_value),
        feature: r.feature_name || r.feature || '',
        featureName: r.feature_name || r.feature || '',
        ownership: r.ownership || '',
        status: r.feature_status || r.status || '',
        featureStatus: r.feature_status || r.status || '',
        timeline: r.proposal_sent_date || r.timeline || '',
        proposalSentDate: r.proposal_sent_date || '',
        upsellValue: num(r.upsell_value),
        notes: r.notes || '',
        raw: r
      };
    });
  }

  async function loadRetentionOnly(){
    var supa = {};
    if(typeof window.fetchSupabaseRetentionTeamOverview === 'function'){
      supa = await window.fetchSupabaseRetentionTeamOverview();
    }else{
      var views = {
        focus:'vw_retention_team_overview_focus', smartActions:'vw_retention_smart_actions', kpi:'vw_retention_kpi_snapshot',
        monthly:'vw_retention_monthly_renewal_pipeline', logic:'vw_retention_renewal_logic', bridge:'vw_retention_company_activity_bridge',
        coverage:'vw_retention_coverage_quality', churnReasons:'vw_retention_churn_reasons', followupDetails:'vw_retention_followup_due_details', followupSummary:'vw_retention_followup_due_summary'
      };
      await Promise.all(Object.keys(views).map(async function(key){
        try{ supa[key] = await view(views[key], 20000); }
        catch(e){ console.warn('Supabase Retention view failed:', views[key], e); supa[key] = []; }
      }));
    }
    var built;
    if(typeof window.buildRetentionFromSupabaseTeamOnly === 'function'){
      built = window.buildRetentionFromSupabaseTeamOnly(supa);
    }else{
      built = { generatedAt:new Date().toISOString(), meta:{source:'Supabase'}, source:'Supabase', summary:{}, kpi:{}, accounts:[], repData:[], ownerMatrix:[], dealsSplit:{booked:[],cashed:[],renewed:[],churn:[]}, supabaseViews:supa };
    }
    window.RETENTION_SUPABASE_TEAM_DATA = supa;

    try{
      var features = await view('features_plan_rows', 20000);
      built.featuresPlanForUpselling = mapFeaturesPlanRows(features);
      built.upsellingFeaturesPlan = built.featuresPlanForUpselling;
      built.featuresPlanRows = built.featuresPlanForUpselling;
      window.RETENTION_FEATURES_PLAN_READY = true;
    }catch(e){
      console.warn('Supabase Features Plan table failed:', e);
      built.featuresPlanForUpselling = [];
      built.upsellingFeaturesPlan = [];
      built.featuresPlanRows = [];
    }

    built.meta = Object.assign({}, built.meta || {}, { source:'Supabase', legacyJson:false });
    built.source = 'Supabase';
    return built;
  }

  async function loadPnlIfActive(){
    try{
      if(window.APP_MAIN_PANEL === 'retention' && window.APP_RETENTION_VIEW === 'revenue' && typeof window.switchRetentionRevenueAnalysis === 'function'){
        window.switchRetentionRevenueAnalysis();
      }
    }catch(e){ console.warn('P&L lazy reload skipped:', e); }
  }

  function renderCurrent(options, scrollY){
    try{ if(typeof window.render === 'function') window.render(); }catch(e){ console.error('Render failed:', e); }
    try{
      if(window.APP_MAIN_PANEL === 'retention'){
        if(window.APP_RETENTION_VIEW === 'financial' && typeof window.renderRetentionFinancialDetails === 'function') window.renderRetentionFinancialDetails();
        if(window.APP_RETENTION_VIEW === 'upselling' && typeof window.renderRetentionUpsellingFeaturesPlan === 'function') window.renderRetentionUpsellingFeaturesPlan();
        if(window.APP_RETENTION_VIEW === 'owner' && typeof window.renderRetentionOwnerDetails === 'function' && window.APP_RETENTION_OWNER_ID) window.renderRetentionOwnerDetails(window.APP_RETENTION_OWNER_ID);
      }
      if(typeof window.restoreCurrentView === 'function') window.restoreCurrentView({ keepScroll:true, instant:true });
    }catch(e){ console.warn('Restore current view skipped:', e); }
    if(options && options.keepScroll !== false){ requestAnimationFrame(function(){ window.scrollTo(0, scrollY || 0); }); }
  }

  async function supabaseOnlyLoadData(options){
    options = Object.assign({ keepScroll:true, keepView:true, manual:true }, options || {});
    var scrollY = window.scrollY;
    spin(true);
    try{
      var acqSupa = await fetchAcquisitionOnly();
      if(typeof window.buildAcquisitionFromSupabase === 'function'){
        window.D = window.buildAcquisitionFromSupabase(acqSupa);
        if(typeof window.acqEnhanceSupabaseData === 'function') window.D = window.acqEnhanceSupabaseData(window.D, acqSupa);
      }else if(typeof buildAcquisitionFromSupabase === 'function'){
        window.D = buildAcquisitionFromSupabase(acqSupa);
        if(typeof acqEnhanceSupabaseData === 'function') window.D = acqEnhanceSupabaseData(window.D, acqSupa);
      }else{
        throw new Error('Acquisition Supabase mapper is not available');
      }
      window.D.meta = Object.assign({}, window.D.meta || {}, { source:'Supabase', legacyJson:false });
      try{ D = window.D; }catch(e){}

      window.R = await loadRetentionOnly();
      try{ R = window.R; }catch(e){}
      window.DATA_LOADED_FROM = 'Supabase';
      window.RETENTION_JSON_LOADED_FROM = 'Supabase';
      window.__acqCompletedMeetingCompanyIndex = null;
      renderCurrent(options, scrollY);
      await loadPnlIfActive();
      setTop(
        window.APP_MAIN_PANEL === 'retention' ? (window.APP_RETENTION_VIEW === 'financial' ? 'Retention · Financial Details' : window.APP_RETENTION_VIEW === 'revenue' ? 'P&L · Revenue Analysis' : window.APP_RETENTION_VIEW === 'upselling' ? 'Retention · Features Plan' : 'Retention · Team Overview') : 'Acquisition · Team Overview',
        'Supabase only · manual refresh · no legacy JSON'
      );
    }catch(e){
      console.error('Supabase-only load failed:', e);
      setTop('Dashboard · Supabase load error', e && e.message ? e.message : String(e));
    }finally{
      spin(false);
    }
  }

  // Block legacy JSON loader usage from this point onward.
  window.fetchJsonFromSources = async function(){ throw new Error('Legacy JSON is disabled. Supabase is the only data source.'); };
  window.loadData = supabaseOnlyLoadData;
  try{ loadData = window.loadData; }catch(e){}

  window.addEventListener('DOMContentLoaded', function(){ window.loadData({ keepView:true, keepScroll:true }); }, { once:true });
})();
