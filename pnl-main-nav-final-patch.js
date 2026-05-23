(function(){
  if(window.__RETENTION_FINANCIAL_SUPABASE_BRIDGE_V1__) return;
  window.__RETENTION_FINANCIAL_SUPABASE_BRIDGE_V1__ = true;

  var RF_URL = 'https://czaxtwbmborxwzaboqxl.supabase.co';
  var RF_KEY = 'sb_publishable_uVUdpVWggu1WvkSKCAi51w_9qsb-AjX';
  var RF_READY = false;
  var RF_INFLIGHT = null;

  function rfArr(v){ return Array.isArray(v) ? v : []; }
  function rfSafe(v){ return String(v == null ? '' : v).trim(); }
  function rfNum(v){
    if(v == null || v === '') return 0;
    if(typeof v === 'number') return Number.isFinite(v) ? v : 0;
    var s = String(v).replace(/,/g,'').replace(/\$/g,'').replace(/[−–—]/g,'-').trim();
    var neg = /^-/.test(s) || /-$/.test(s) || /\([^)]*\)/.test(s);
    s = s.replace(/[()\s-]/g,'').replace(/[^0-9.]/g,'');
    var n = Number(s);
    return Number.isFinite(n) ? (neg ? -n : n) : 0;
  }
  function rfNorm(v){ return rfSafe(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); }
  function rfBool(v){ return v === true || String(v).toLowerCase() === 'true' || String(v) === '1'; }
  function rfDate(v){
    if(!v) return '';
    var d = new Date(v);
    if(isNaN(d.getTime())) return String(v).slice(0,10);
    return d.toISOString().slice(0,10);
  }
  function rfMonthKey(v){
    if(!v) return '';
    var names = [
      ['jan','january','01'],['feb','february','02'],['mar','march','03'],['apr','april','04'],
      ['may','may','05'],['jun','june','06'],['jul','july','07'],['aug','august','08'],
      ['sep','september','09'],['oct','october','10'],['nov','november','11'],['dec','december','12']
    ];
    var raw = rfSafe(v);
    var iso = raw.match(/^(\d{4})-(\d{2})-/);
    if(iso){
      var mi = Number(iso[2]) - 1;
      return names[mi] ? names[mi][0].charAt(0).toUpperCase()+names[mi][0].slice(1) : raw;
    }
    var n = rfNorm(raw);
    for(var i=0;i<names.length;i++){
      if(names[i].indexOf(n) >= 0) return names[i][0].charAt(0).toUpperCase()+names[i][0].slice(1);
    }
    return raw;
  }
  function rfMonthFromDateOrLabel(dateVal, monthVal){ return rfMonthKey(dateVal) || rfMonthKey(monthVal) || '—'; }
  function rfStatus(r){
    var raw = rfSafe(r.renewal_status || r.status || r.status_normalized);
    var s = rfNorm(raw);
    if(s.indexOf('lost from 2025') >= 0 || s.indexOf('lost from 25') >= 0) return 'Lost From 2025';
    if(s === 'lost' || s.indexOf('churn') >= 0) return 'Lost';
    if(s.indexOf('expected') >= 0 && s.indexOf('lost') >= 0) return 'Expected To Be Lost';
    if(rfBool(r.is_delayed) || s.indexOf('delayed') >= 0) return 'Delayed';
    if(rfBool(r.renewed_late) || s.indexOf('late') >= 0) return 'Renewed Late';
    if(rfNum(r.collected_value) > 0 || r.first_collection_date) return 'Cashed';
    if(rfNum(r.booked_value) > 0 || r.first_booked_date) return 'Booked Pending Collection';
    if(s.indexOf('upcoming') >= 0) return 'Upcoming';
    return raw || 'Active';
  }
  function rfHubspotCompanyUrl(row){
    if(row.hubspot_company_url) return row.hubspot_company_url;
    if(row.hubspot_search_url) return row.hubspot_search_url;
    var id = rfSafe(row.hubspot_company_id || row.company_id || row.hs_object_id);
    return id ? 'https://app-eu1.hubspot.com/contacts/145742477/company/' + encodeURIComponent(id) : '';
  }
  function rfAddMonthValue(map, month, product, value){
    var v = rfNum(value);
    if(v === 0) return;
    var m = rfMonthKey(month) || '—';
    var p = rfSafe(product) || 'Unknown';
    if(!map[m]) map[m] = {};
    map[m][p] = rfNum(map[m][p]) + v;
  }
  function rfAccountFromLogic(r){
    var product = rfSafe(r.product) || 'Unknown';
    var renewalMonth = rfMonthFromDateOrLabel(r.renewal_date, r.month);
    var bookingMonth = rfMonthFromDateOrLabel(r.first_booked_date, r.month);
    var collectionMonth = rfMonthFromDateOrLabel(r.first_collection_date, r.month);
    var bookingByMonth = {};
    var collectionByMonth = {};
    rfAddMonthValue(bookingByMonth, bookingMonth, product, r.booked_value);
    rfAddMonthValue(collectionByMonth, collectionMonth, product, r.collected_value);
    var status = rfStatus(r);
    var accountStatus = (/lost|churn/i.test(status) || /expected/i.test(status)) ? status : 'Active';
    var company = rfSafe(r.company_name) || 'Unknown Client';
    var gid = rfSafe(r.clean_gid || r.gid || r.hubspot_company_id || r.match_key || r.row_key);
    return {
      id: rfSafe(r.row_key || r.match_key || gid || company),
      rowKey: rfSafe(r.row_key),
      matchKey: rfSafe(r.match_key),
      companyName: company,
      clientName: company,
      name: company,
      company: company,
      accountName: company,
      gid: gid,
      cleanGid: gid,
      companyId: rfSafe(r.hubspot_company_id || gid),
      hs_object_id: rfSafe(r.hubspot_company_id || gid),
      companyUrl: rfHubspotCompanyUrl(r),
      hubspotUrl: rfHubspotCompanyUrl(r),
      product: product,
      sheetProduct: product,
      rm: rfSafe(r.rm_owner),
      rm2026: rfSafe(r.rm_owner),
      rmOwnerName: rfSafe(r.rm_owner),
      ownerName: rfSafe(r.rm_owner),
      csm: rfSafe(r.csm_owner),
      csmName: rfSafe(r.csm_owner),
      csmOwnerName: rfSafe(r.csm_owner),
      customerSuccessManager: rfSafe(r.csm_owner),
      location: rfSafe(r.location),
      renewalDate: rfDate(r.renewal_date),
      contractRenewalDate: rfDate(r.renewal_date),
      renewalMonth: renewalMonth,
      month: renewalMonth,
      renewalValue: rfNum(r.renewal_value),
      renewalValue2026: rfNum(r.renewal_value),
      amount: rfNum(r.renewal_value),
      bookingMonth: rfNum(r.booked_value) ? bookingMonth : '—',
      collectionMonth: rfNum(r.collected_value) ? collectionMonth : '—',
      cashMonth: rfNum(r.collected_value) ? collectionMonth : '—',
      bookingByMonth: bookingByMonth,
      bookedByMonth: bookingByMonth,
      collectionByMonth: collectionByMonth,
      cashByMonth: collectionByMonth,
      collectedByMonth: collectionByMonth,
      bookedValue: rfNum(r.booked_value),
      bookingSheetValue: rfNum(r.booked_value),
      totalBookedValue: rfNum(r.booked_value),
      collectedValue: rfNum(r.collected_value),
      cashCollected: rfNum(r.collected_value),
      totalCollectedValue: rfNum(r.collected_value),
      bookedNotCashValue: Math.max(0, rfNum(r.booked_not_cash_value || r.remaining_collection_value)),
      remainingCollectionValue: Math.max(0, rfNum(r.remaining_collection_value || r.booked_not_cash_value)),
      firstBookedDate: rfDate(r.first_booked_date),
      firstCollectionDate: rfDate(r.first_collection_date),
      status: status,
      renewalStatus: status,
      renewal_status: status,
      calculatedRenewalStatus: status,
      financialStatus: status,
      accountStatus: accountStatus,
      account_status: accountStatus,
      budgetStatus: accountStatus,
      budgetStatusRaw: rfSafe(r.status),
      accountStatusForFilter: accountStatus,
      isDelayed: rfBool(r.is_delayed),
      renewedLate: rfBool(r.renewed_late),
      notInBudget2026: false,
      raw: r
    };
  }
  function rfAccountFromNotBudget(r){
    var product = rfSafe(r.product) || 'Unknown';
    var eventMonth = rfMonthFromDateOrLabel(r.event_date, r.month);
    var source = rfNorm(r.source).indexOf('cash') >= 0 || rfNorm(r.source).indexOf('collect') >= 0 ? 'cash' : 'booked';
    var bookingByMonth = {};
    var collectionByMonth = {};
    if(source === 'cash') rfAddMonthValue(collectionByMonth, eventMonth, product, r.value);
    else rfAddMonthValue(bookingByMonth, eventMonth, product, r.value);
    var company = rfSafe(r.company_name) || 'Unknown Client';
    var gid = rfSafe(r.clean_gid || r.gid || r.company_id || company);
    return {
      id: 'not-budget-' + source + '-' + gid + '-' + product + '-' + eventMonth,
      companyName: company,
      clientName: company,
      name: company,
      accountName: company,
      gid: gid,
      cleanGid: gid,
      companyId: gid,
      product: product,
      sheetProduct: product,
      rm: rfSafe(r.rm_owner || r.owner_name),
      rm2026: rfSafe(r.rm_owner || r.owner_name),
      rmOwnerName: rfSafe(r.rm_owner || r.owner_name),
      ownerName: rfSafe(r.rm_owner || r.owner_name),
      csm: rfSafe(r.csm_owner),
      csmName: rfSafe(r.csm_owner),
      csmOwnerName: rfSafe(r.csm_owner),
      location: rfSafe(r.location),
      renewalDate: '',
      contractRenewalDate: '',
      renewalMonth: '—',
      month: eventMonth,
      renewalValue: 0,
      renewalValue2026: 0,
      amount: 0,
      bookingMonth: source === 'booked' ? eventMonth : '—',
      collectionMonth: source === 'cash' ? eventMonth : '—',
      cashMonth: source === 'cash' ? eventMonth : '—',
      bookingByMonth: bookingByMonth,
      bookedByMonth: bookingByMonth,
      collectionByMonth: collectionByMonth,
      cashByMonth: collectionByMonth,
      collectedByMonth: collectionByMonth,
      bookedValue: source === 'booked' ? rfNum(r.value) : 0,
      bookingSheetValue: source === 'booked' ? rfNum(r.value) : 0,
      totalBookedValue: source === 'booked' ? rfNum(r.value) : 0,
      collectedValue: source === 'cash' ? rfNum(r.value) : 0,
      cashCollected: source === 'cash' ? rfNum(r.value) : 0,
      totalCollectedValue: source === 'cash' ? rfNum(r.value) : 0,
      bookedNotCashValue: source === 'booked' ? rfNum(r.value) : 0,
      remainingCollectionValue: source === 'booked' ? rfNum(r.value) : 0,
      status: 'Not In Budget',
      renewalStatus: 'Not In Budget',
      calculatedRenewalStatus: 'Not In Budget',
      accountStatus: 'Active',
      accountStatusForFilter: 'Active',
      budgetNote: rfSafe(r.flag || 'Not in budget'),
      notInBudget2026: true,
      raw: r
    };
  }
  function rfBuildSummary(accounts, notBudget){
    var summary = { accounts:accounts.length, renewalValue:0, bookedValue:0, cashCollected:0, bookedNotCash:0, delayedAccounts:0, renewedLateAccounts:0, source:'Supabase' };
    accounts.forEach(function(a){
      summary.renewalValue += rfNum(a.renewalValue);
      summary.bookedValue += rfNum(a.bookedValue);
      summary.cashCollected += rfNum(a.collectedValue);
      summary.bookedNotCash += Math.max(0, rfNum(a.bookedNotCashValue || a.remainingCollectionValue));
      if(a.isDelayed || /delayed/i.test(a.status)) summary.delayedAccounts++;
      if(a.renewedLate || /late/i.test(a.status)) summary.renewedLateAccounts++;
    });
    summary.notInBudgetRows = notBudget.length;
    return summary;
  }
  function rfView(name, limit){
    if(typeof supabaseView === 'function') return supabaseView(name, limit || 20000);
    var url = RF_URL + '/rest/v1/' + name + '?select=*&limit=' + (limit || 20000);
    return fetch(url, { cache:'no-store', headers:{ apikey:RF_KEY, Authorization:'Bearer ' + RF_KEY } }).then(function(res){
      if(!res.ok) throw new Error(name + ' HTTP ' + res.status);
      return res.json();
    });
  }
  async function rfEnsureFinancialData(force){
    if(RF_INFLIGHT && !force) return RF_INFLIGHT;
    RF_INFLIGHT = (async function(){
      var supa = window.RETENTION_SUPABASE_TEAM_DATA || {};
      if(force || !Array.isArray(supa.logic)){
        try{ supa.logic = await rfView('vw_retention_renewal_logic', 20000); }catch(e){ console.warn('Retention financial logic view failed', e); supa.logic = []; }
      }
      if(force || !Array.isArray(supa.notInBudget)){
        try{ supa.notInBudget = await rfView('vw_retention_not_in_budget', 20000); }catch(e){ console.warn('Retention not-in-budget view failed', e); supa.notInBudget = []; }
      }
      if(force || !Array.isArray(supa.ownerFinancial)){
        try{ supa.ownerFinancial = await rfView('vw_retention_owner_financial_summary', 20000); }catch(e){ supa.ownerFinancial = []; }
      }
      if(force || !Array.isArray(supa.productFinancial)){
        try{ supa.productFinancial = await rfView('vw_retention_product_financial_summary', 20000); }catch(e){ supa.productFinancial = []; }
      }
      window.RETENTION_SUPABASE_TEAM_DATA = supa;
      var budgetAccounts = rfArr(supa.logic).map(rfAccountFromLogic);
      var notBudgetAccounts = rfArr(supa.notInBudget).map(rfAccountFromNotBudget);
      var r = window.R || {};
      r.retentionSheets2026 = {
        source: 'Supabase',
        legacyJson: false,
        lastUpdated: new Date().toISOString(),
        sourceSheets: {
          budget: 'vw_retention_renewal_logic',
          booking: 'vw_retention_renewal_logic + vw_retention_not_in_budget',
          collection: 'vw_retention_renewal_logic + vw_retention_not_in_budget'
        },
        accounts: budgetAccounts,
        sheetOnlyNotInBudgetAccounts: notBudgetAccounts,
        summary: rfBuildSummary(budgetAccounts, notBudgetAccounts),
        ownerFinancialSummary: rfArr(supa.ownerFinancial),
        productFinancialSummary: rfArr(supa.productFinancial)
      };
      r.financialSupabaseReady = true;
      window.R = r;
      try{ R = r; }catch(e){}
      RF_READY = true;
      return r.retentionSheets2026;
    })();
    try{ return await RF_INFLIGHT; }
    finally{ RF_INFLIGHT = null; }
  }
  window.retentionFinancialEnsureSupabase = rfEnsureFinancialData;

  var oldLoad = window.loadData;
  if(typeof oldLoad === 'function' && !oldLoad.__retentionFinancialSupabaseBridgeV1){
    window.loadData = async function(){
      var wasFinancial = window.APP_MAIN_PANEL === 'retention' && window.APP_RETENTION_VIEW === 'financial';
      var scrollY = window.scrollY;
      var out = oldLoad.apply(this, arguments);
      if(out && typeof out.then === 'function') await out;
      await rfEnsureFinancialData(true);
      if(wasFinancial || (window.APP_MAIN_PANEL === 'retention' && window.APP_RETENTION_VIEW === 'financial')){
        if(typeof window.renderRetentionFinancialDetails === 'function') window.renderRetentionFinancialDetails();
        requestAnimationFrame(function(){ window.scrollTo(0, scrollY); });
      }
      return out;
    };
    window.loadData.__retentionFinancialSupabaseBridgeV1 = true;
    try{ loadData = window.loadData; }catch(e){}
  }

  var oldRender = window.renderRetentionFinancialDetails;
  if(typeof oldRender === 'function' && !oldRender.__retentionFinancialSupabaseBridgeV1){
    window.renderRetentionFinancialDetails = function(){
      if(!RF_READY){
        rfEnsureFinancialData(false).then(function(){
          if(window.APP_MAIN_PANEL === 'retention' && window.APP_RETENTION_VIEW === 'financial') oldRender.apply(window, []);
        }).catch(function(e){ console.error('Retention Financial Supabase prepare failed', e); });
      }
      return oldRender.apply(this, arguments);
    };
    window.renderRetentionFinancialDetails.__retentionFinancialSupabaseBridgeV1 = true;
    try{ renderRetentionFinancialDetails = window.renderRetentionFinancialDetails; }catch(e){}
  }

  var oldSwitch = window.switchRetentionFinancial;
  if(typeof oldSwitch === 'function' && !oldSwitch.__retentionFinancialSupabaseBridgeV1){
    window.switchRetentionFinancial = function(){
      var out = oldSwitch.apply(this, arguments);
      rfEnsureFinancialData(false).then(function(){
        if(typeof window.renderRetentionFinancialDetails === 'function') window.renderRetentionFinancialDetails();
      });
      return out;
    };
    window.switchRetentionFinancial.__retentionFinancialSupabaseBridgeV1 = true;
    try{ switchRetentionFinancial = window.switchRetentionFinancial; }catch(e){}
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ rfEnsureFinancialData(false).then(function(){ if(window.APP_MAIN_PANEL === 'retention' && window.APP_RETENTION_VIEW === 'financial' && typeof window.renderRetentionFinancialDetails === 'function') window.renderRetentionFinancialDetails(); }); });
  }else{
    setTimeout(function(){ rfEnsureFinancialData(false).then(function(){ if(window.APP_MAIN_PANEL === 'retention' && window.APP_RETENTION_VIEW === 'financial' && typeof window.renderRetentionFinancialDetails === 'function') window.renderRetentionFinancialDetails(); }); }, 0);
  }
})();
