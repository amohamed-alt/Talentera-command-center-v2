/* RETENTION TEAM OVERVIEW · SUPABASE ONLY DATA BRIDGE */
(function(){
  if(window.__retentionTeamOverviewSupabaseBridgeV1) return;
  window.__retentionTeamOverviewSupabaseBridgeV1 = true;

  var RETENTION_SUPABASE_VIEWS = {
    focus: 'vw_retention_team_overview_focus',
    smartActions: 'vw_retention_smart_actions',
    kpi: 'vw_retention_kpi_snapshot',
    monthly: 'vw_retention_monthly_renewal_pipeline',
    logic: 'vw_retention_renewal_logic',
    bridge: 'vw_retention_company_activity_bridge',
    coverage: 'vw_retention_coverage_quality',
    churnReasons: 'vw_retention_churn_reasons',
    followupDetails: 'vw_retention_followup_due_details',
    followupSummary: 'vw_retention_followup_due_summary'
  };

  function rtNum(v){
    var n = Number(String(v == null ? 0 : v).replace(/[^0-9.-]/g,''));
    return Number.isFinite(n) ? n : 0;
  }
  function rtSafe(v){ return String(v == null ? '' : v).trim(); }
  function rtBool(v){ return v === true || String(v).toLowerCase() === 'true' || String(v) === '1'; }
  function rtSlug(v){
    return String(v || 'item').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'item';
  }
  function rtDate(v){
    if(!v) return '';
    var d = new Date(v);
    if(isNaN(d.getTime())) return String(v).slice(0,10);
    return d.toISOString().slice(0,10);
  }
  function rtIso(v){
    if(!v) return '';
    var d = new Date(v);
    if(isNaN(d.getTime())) return String(v);
    return d.toISOString();
  }
  function rtDaysFromToday(v){
    if(!v) return null;
    var d = new Date(v);
    if(isNaN(d.getTime())) return null;
    var today = new Date();
    today.setHours(0,0,0,0);
    d.setHours(0,0,0,0);
    return Math.round((today - d) / 86400000);
  }
  function rtDaysLeft(v){
    var x = rtDaysFromToday(v);
    return x == null ? null : -x;
  }
  function rtMonthName(v){
    if(!v) return '';
    var d = new Date(v);
    if(isNaN(d.getTime())) return String(v);
    return d.toLocaleString('en-US', { month:'long' });
  }
  function rtStatusFromLogic(r){
    var s = rtSafe(r.renewal_status || r.status);
    if(rtBool(r.is_delayed)) return 'Delayed';
    if(rtNum(r.collected_value) > 0 || r.first_collection_date) return 'Renewed';
    if(rtNum(r.booked_value) > 0 || r.first_booked_date) return 'Renewed';
    if(/lost|churn/i.test(s)) return s || 'Churn';
    return s || 'Upcoming';
  }
  function rtHubspotCompanyUrl(id, urlOverride){
    if(urlOverride) return urlOverride;
    return id ? 'https://app-eu1.hubspot.com/contacts/145742477/company/' + encodeURIComponent(String(id)) : '';
  }
  function rtView(name, limit){
    if(typeof supabaseView === 'function') return supabaseView(name, limit || 10000);
    var url = String(window.SUPABASE_URL || 'https://czaxtwbmborxwzaboqxl.supabase.co') + '/rest/v1/' + name + '?select=*&limit=' + (limit || 10000);
    var key = window.SUPABASE_KEY || 'sb_publishable_uVUdpVWggu1WvkSKCAi51w_9qsb-AjX';
    return fetch(url, { cache:'no-store', headers:{ apikey:key, Authorization:'Bearer ' + key } }).then(function(res){
      if(!res.ok) throw new Error(name + ' HTTP ' + res.status);
      return res.json();
    });
  }
  async function fetchSupabaseRetentionTeamOverview(){
    var out = {};
    await Promise.all(Object.keys(RETENTION_SUPABASE_VIEWS).map(async function(key){
      var view = RETENTION_SUPABASE_VIEWS[key];
      try{ out[key] = await rtView(view, 10000); }
      catch(e){ console.warn('Retention Supabase view failed', view, e); out[key] = []; }
    }));
    return out;
  }
  function rtAccountRow(r){
    var companyId = rtSafe(r.hubspot_company_id);
    var renewalDate = rtDate(r.renewal_date);
    var daysOverdue = renewalDate ? Math.max(0, rtDaysFromToday(renewalDate) || 0) : 0;
    var daysLeft = renewalDate ? rtDaysLeft(renewalDate) : null;
    var status = rtStatusFromLogic(r);
    var url = rtHubspotCompanyUrl(companyId, r.hubspot_company_url || r.hubspot_search_url);
    return {
      id: rtSafe(r.match_key || r.row_key || companyId || r.company_name),
      companyId: companyId,
      hs_object_id: companyId,
      accountId: rtSafe(r.match_key || r.row_key || companyId),
      name: r.company_name || 'Unknown account',
      companyName: r.company_name || 'Unknown account',
      accountName: r.company_name || 'Unknown account',
      companyUrl: url,
      hubspotUrl: url,
      product: r.product || '',
      gid: r.gid || '',
      location: r.location || '',
      company_tier: r.company_tier || r.tier_group || '',
      companyTier: r.company_tier || r.tier_group || '',
      tier: r.company_tier || r.tier_group || '',
      renewalValue: rtNum(r.renewal_value),
      amount: rtNum(r.renewal_value),
      value: rtNum(r.renewal_value),
      contractRenewalDate: renewalDate,
      renewalDate: renewalDate,
      originalContractRenewalDate: renewalDate,
      renewalMonth: r.month || rtMonthName(renewalDate),
      daysOverdue: daysOverdue,
      daysLeft: daysLeft,
      status: status,
      renewalStatusFromSheet: r.renewal_status || status,
      accountStatus: r.account_status || r.status || '',
      rmOwnerName: r.rm_owner || '',
      rmOwner: r.rm_owner || '',
      rmOwnerId: r.rm_owner ? 'rm-' + rtSlug(r.rm_owner) : '',
      csmOwnerName: r.csm_owner || '',
      csmOwner: r.csm_owner || '',
      csmOwnerId: r.csm_owner ? 'csm-' + rtSlug(r.csm_owner) : '',
      ownerName: r.rm_owner || r.csm_owner || '',
      ownerId: r.rm_owner ? 'rm-' + rtSlug(r.rm_owner) : '',
      lastActivityDate: rtIso(r.last_activity_at || r.notes_last_contacted),
      lastActivity: rtIso(r.last_activity_at || r.notes_last_contacted),
      rmLastTouch: rtIso(r.last_activity_at || r.notes_last_contacted),
      rmLastActivity: rtIso(r.last_activity_at || r.notes_last_contacted),
      csmLastTouch: rtIso(r.last_activity_at || r.notes_last_contacted),
      csmLastActivity: rtIso(r.last_activity_at || r.notes_last_contacted),
      rmDaysSinceTouch: r.days_since_last_activity == null ? null : rtNum(r.days_since_last_activity),
      csmDaysSinceTouch: r.days_since_last_activity == null ? null : rtNum(r.days_since_last_activity),
      daysSinceActivity: r.days_since_last_activity == null ? null : rtNum(r.days_since_last_activity),
      callsLogged: rtNum(r.calls_logged),
      connectedCalls: rtNum(r.connected_calls),
      meetingsLogged: rtNum(r.meetings_logged),
      meetingsCompleted: rtNum(r.meetings_completed),
      bookedValue: rtNum(r.booked_value),
      collectedValue: rtNum(r.collected_value || r.cash_collected),
      bookedNotCashValue: rtNum(r.booked_not_cash_value || r.remaining_collection_value),
      remainingCollectionValue: rtNum(r.remaining_collection_value),
      firstBookedDate: rtDate(r.first_booked_date),
      firstCollectionDate: rtDate(r.first_collection_date),
      bookedDateEntered: rtDate(r.first_booked_date),
      cashedDateEntered: rtDate(r.first_collection_date),
      isDelayed: rtBool(r.is_delayed),
      renewedLate: rtBool(r.renewed_late)
    };
  }
  function rtUniqueBy(rows, fn){
    var seen = new Set();
    var out = [];
    (rows || []).forEach(function(row){
      var key = fn(row);
      if(!key || seen.has(key)) return;
      seen.add(key);
      out.push(row);
    });
    return out;
  }
  function rtMapKpi(rows){
    var out = {};
    (rows || []).forEach(function(r){
      var p = String(r.period || '').toLowerCase();
      var key = p.indexOf('yesterday') >= 0 || p === 'yest' ? 'yesterday' : p.indexOf('mtd') >= 0 ? 'mtd' : p.indexOf('ytd') >= 0 ? 'ytd' : p;
      if(!key) return;
      out[key] = {
        calls: rtNum(r.connected_calls || r.calls_logged),
        callsLogged: rtNum(r.calls_logged),
        meetings: rtNum(r.meetings_completed || r.meetings_logged),
        meetingsLogged: rtNum(r.meetings_logged),
        renewed: rtNum(r.cashed_count || 0) + rtNum(r.booked_count || 0),
        booked: rtNum(r.booked_count),
        bookedAmt: rtNum(r.booked_value),
        cashed: rtNum(r.cashed_count),
        cashedAmt: rtNum(r.cash_collected),
        churn: rtNum(r.churned_count),
        delayed: rtNum(r.delayed_count)
      };
    });
    ['yesterday','mtd','ytd'].forEach(function(k){ if(!out[k]) out[k] = {calls:0,meetings:0,renewed:0,booked:0,cashed:0,churn:0,delayed:0,bookedAmt:0,cashedAmt:0}; });
    return out;
  }
  function rtBuildMonthly(monthlyRows, accountRows){
    var byMonth = {};
    (accountRows || []).forEach(function(r){
      var key = r.renewalMonth || rtMonthName(r.contractRenewalDate) || 'Unknown';
      if(!byMonth[key]) byMonth[key] = [];
      byMonth[key].push(r);
    });
    return (monthlyRows || []).map(function(m){
      var label = m.month || rtMonthName(m.month_start) || 'Unknown';
      var rows = byMonth[label] || [];
      return {
        month: m.month_start || label,
        due: rtNum(m.due_accounts),
        renewed: rtNum(m.booked_accounts) + rtNum(m.cashed_accounts),
        booked: rtNum(m.booked_accounts),
        cashed: rtNum(m.cashed_accounts),
        delayed: rtNum(m.delayed_accounts),
        upcoming: Math.max(0, rtNum(m.due_accounts) - rtNum(m.booked_accounts) - rtNum(m.cashed_accounts) - rtNum(m.delayed_accounts)),
        value: rtNum(m.renewal_value),
        rows: rows
      };
    });
  }
  function rtOwnerId(role, name){ return String(role || '').toLowerCase() + '-' + rtSlug(name); }
  function rtBuildRepData(coverageRows, followSummaryRows, accounts){
    var map = {};
    function add(role, name){
      name = rtSafe(name);
      if(!name || name === 'Unassigned') return;
      role = String(role || 'RM').toUpperCase() === 'CSM' ? 'CSM' : 'RM';
      var id = rtOwnerId(role, name);
      if(!map[id]){
        map[id] = {
          id: id,
          name: name,
          role: role,
          color: role === 'RM' ? 'var(--blue)' : 'var(--cyan)',
          accounts: 0,
          activeAccounts: 0,
          delayed: 0,
          calls: 0,
          meetings: 0
        };
      }
    }
    (coverageRows || []).forEach(function(r){ add(r.role, r.owner_name); });
    (followSummaryRows || []).forEach(function(r){ add(r.role, r.owner_name); });
    (accounts || []).forEach(function(a){
      add('RM', a.rmOwnerName);
      add('CSM', a.csmOwnerName);
    });
    Object.keys(map).forEach(function(id){
      var rep = map[id];
      var rows = (accounts || []).filter(function(a){
        return rep.role === 'RM' ? a.rmOwnerName === rep.name : a.csmOwnerName === rep.name;
      });
      rep.accounts = rows.length;
      rep.activeAccounts = rows.length;
      rep.delayed = rows.filter(function(a){ return a.isDelayed || /delayed/i.test(a.status); }).length;
      rep.calls = rows.reduce(function(s,a){ return s + rtNum(a.connectedCalls); },0);
      rep.meetings = rows.reduce(function(s,a){ return s + rtNum(a.meetingsCompleted); },0);
    });
    return Object.values(map).sort(function(a,b){
      return (a.role === b.role ? a.name.localeCompare(b.name) : a.role.localeCompare(b.role));
    });
  }
  function rtBuildOwnerDetails(repData, accounts, delayedRows, followRows){
    var out = {};
    (repData || []).forEach(function(rep){
      var rows = (accounts || []).filter(function(a){ return rep.role === 'RM' ? a.rmOwnerName === rep.name : a.csmOwnerName === rep.name; });
      var delayed = rows.filter(function(a){ return a.isDelayed || /delayed/i.test(a.status); });
      var follow = (followRows || []).filter(function(r){ return String(r.role || '').toUpperCase() === rep.role && r.owner_name === rep.name && rtBool(r.is_followup_due); });
      var noContact = rows.filter(function(a){ return rtNum(a.connectedCalls) === 0 || rtNum(a.daysSinceActivity) > 30; });
      var noMeeting = rows.filter(function(a){ return rtNum(a.meetingsCompleted) === 0; });
      out[rep.id] = {
        id: rep.id,
        name: rep.name,
        role: rep.role,
        color: rep.color,
        metrics: {
          accounts: rows.length,
          activeAccounts: rows.length,
          delayed: delayed.length,
          noContact: noContact.length,
          noMeeting: noMeeting.length,
          calls: rows.reduce(function(s,a){ return s + rtNum(a.connectedCalls); },0),
          meetings: rows.reduce(function(s,a){ return s + rtNum(a.meetingsCompleted); },0),
          bookedAmt: rows.reduce(function(s,a){ return s + rtNum(a.bookedValue); },0),
          cashedAmt: rows.reduce(function(s,a){ return s + rtNum(a.collectedValue); },0),
          renewedAmt: rows.reduce(function(s,a){ return s + (rtNum(a.bookedValue) || rtNum(a.collectedValue) ? rtNum(a.renewalValue) : 0); },0)
        },
        accounts: rows,
        delayedRenewals: delayed,
        noContactAccounts: noContact,
        noMeetingAccounts: noMeeting,
        followupDue: follow,
        calls: [],
        meetings: [],
        connectedCalls: [],
        completedMeetings: [],
        loggedCalls: [],
        loggedMeetings: [],
        activityKpis: null
      };
    });
    return out;
  }
  function rtBuildCoverageDetails(coverageRows, accounts){
    var total = (accounts || []).length || (coverageRows || []).reduce(function(s,r){ return s + rtNum(r.accounts); },0);
    var connected = (accounts || []).filter(function(a){ return rtNum(a.connectedCalls) > 0; }).length;
    var meetings = (accounts || []).filter(function(a){ return rtNum(a.meetingsCompleted) > 0; }).length;
    var rmAssigned = (accounts || []).filter(function(a){ return !!a.rmOwnerName; }).length;
    var csmAssigned = (accounts || []).filter(function(a){ return !!a.csmOwnerName; }).length;
    var rmTouched = (accounts || []).filter(function(a){ return !!a.rmOwnerName && (rtNum(a.connectedCalls) > 0 || rtNum(a.meetingsCompleted) > 0); }).length;
    var csmTouched = (accounts || []).filter(function(a){ return !!a.csmOwnerName && (rtNum(a.connectedCalls) > 0 || rtNum(a.meetingsCompleted) > 0); }).length;
    function pct(a,b){ return b ? Math.round((a / b) * 100) : 0; }
    return {
      totalAccounts: total,
      callCoverage: pct(connected, total),
      meetingCoverage: pct(meetings, total),
      rmTouchCoverage: pct(rmTouched, rmAssigned),
      csmTouchCoverage: pct(csmTouched, csmAssigned)
    };
  }
  function buildRetentionFromSupabaseTeam(supa, oldRetention){
    oldRetention = oldRetention || {};
    var logicRows = (supa.logic || []).map(rtAccountRow);
    var bridgeRows = (supa.bridge || []).map(rtAccountRow);
    var mergedMap = new Map();
    logicRows.concat(bridgeRows).forEach(function(row){
      var key = row.id || row.companyId || row.companyName;
      if(!key) return;
      var old = mergedMap.get(key) || {};
      mergedMap.set(key, Object.assign({}, old, row, {
        callsLogged: rtNum(old.callsLogged || row.callsLogged),
        connectedCalls: rtNum(old.connectedCalls || row.connectedCalls),
        meetingsLogged: rtNum(old.meetingsLogged || row.meetingsLogged),
        meetingsCompleted: rtNum(old.meetingsCompleted || row.meetingsCompleted),
        lastActivityDate: row.lastActivityDate || old.lastActivityDate,
        rmLastTouch: row.rmLastTouch || old.rmLastTouch,
        csmLastTouch: row.csmLastTouch || old.csmLastTouch
      }));
    });
    var accounts = Array.from(mergedMap.values());
    var delayed = accounts.filter(function(a){ return a.isDelayed || /delayed/i.test(a.status); });
    var booked = accounts.filter(function(a){ return rtNum(a.bookedValue) > 0; });
    var cashed = accounts.filter(function(a){ return rtNum(a.collectedValue) > 0; });
    var renewed = rtUniqueBy(booked.concat(cashed), function(a){ return a.id || a.companyName; });
    var churn = accounts.filter(function(a){ return /lost|churn/i.test(a.status || a.accountStatus); });
    var repData = rtBuildRepData(supa.coverage || [], supa.followupSummary || [], accounts);
    var focus = (supa.focus || [])[0] || {};
    var R2 = {
      generatedAt: new Date().toISOString(),
      meta: {
        generatedAt: new Date().toISOString(),
        source: 'Supabase',
        legacyJson: false
      },
      source: 'Supabase',
      summary: {
        activeAccounts: accounts.length,
        delayedAccounts: delayed.length,
        delayedValue: rtNum(focus.delayed_value) || delayed.reduce(function(s,a){ return s + rtNum(a.renewalValue); },0),
        renewedAccounts: renewed.length,
        bookedAccounts: booked.length,
        cashedAccounts: cashed.length,
        churnAccounts: churn.length
      },
      team: {
        callsYTD: accounts.reduce(function(s,a){ return s + rtNum(a.connectedCalls); },0),
        meetingsYTD: accounts.reduce(function(s,a){ return s + rtNum(a.meetingsCompleted); },0)
      },
      kpi: rtMapKpi(supa.kpi || []),
      accounts: accounts,
      dealsSplit: {
        renewed: renewed,
        booked: booked,
        cashed: cashed,
        churn: churn
      },
      renewalPipeline: accounts.filter(function(a){ return !/lost|churn/i.test(a.status); }),
      renewalDeals: accounts.filter(function(a){ return !/lost|churn/i.test(a.status); }),
      renewalAttention: accounts.filter(function(a){ return a.isDelayed || a.daysSinceActivity == null || rtNum(a.daysSinceActivity) > 30; }),
      monthlyRenewalPipeline: rtBuildMonthly(supa.monthly || [], accounts),
      delayedRenewals: delayed,
      accountsToRenew: delayed,
      coverageDetails: rtBuildCoverageDetails(supa.coverage || [], accounts),
      churnAnalysis: {
        reasons: (supa.churnReasons || []).map(function(r){
          return { reason:r.reason || 'Other', deals:rtNum(r.deals), value:rtNum(r.value), topAccount:r.top_account || '', status:r.status || 'Churn' };
        })
      },
      repData: repData,
      ownerMatrix: repData,
      ownerDetails: rtBuildOwnerDetails(repData, accounts, delayed, supa.followupDetails || []),
      activityDetails: { calls:[], meetings:[] },
      supabaseViews: supa,
      retentionSheets2026: oldRetention.retentionSheets2026 || null,
      financeComparison: oldRetention.financeComparison || null
    };
    return R2;
  }

  var previousLoadData = window.loadData;
  window.loadData = async function(options){
    options = options || {};
    var scrollY = window.scrollY;
    var oldRetention = window.R || (typeof R !== 'undefined' ? R : null);
    var result;
    try{
      if(typeof previousLoadData === 'function'){
        result = previousLoadData.call(this, Object.assign({}, options, { keepScroll:true }));
        if(result && typeof result.then === 'function') await result;
      }
    }catch(e){
      console.warn('Base dashboard load had an issue before Retention Supabase bridge.', e);
    }
    oldRetention = oldRetention || window.R || null;
    try{
      var supa = await fetchSupabaseRetentionTeamOverview();
      var built = buildRetentionFromSupabaseTeam(supa, oldRetention || {});
      window.R = built;
      try{ R = built; }catch(e){}
      window.RETENTION_SUPABASE_TEAM_DATA = supa;
    }catch(e){
      console.error('Retention Team Overview Supabase load failed. Rendering empty Supabase-only Retention state.', e);
      var empty = buildRetentionFromSupabaseTeam({}, {});
      empty.meta.error = String(e && e.message || e);
      window.R = empty;
      try{ R = empty; }catch(err){}
    }

    try{
      if(typeof renderRetention === 'function') renderRetention();
      if(window.APP_MAIN_PANEL === 'retention'){
        if(window.APP_RETENTION_VIEW === 'financial' && typeof renderRetentionFinancialDetails === 'function') renderRetentionFinancialDetails();
        if(typeof renderRetentionSidebar === 'function'){
          renderRetentionSidebar(window.APP_RETENTION_VIEW === 'financial' ? 'financial' : window.APP_RETENTION_VIEW === 'owner' ? 'owner' : 'overview');
        }
      }
      if(typeof restoreCurrentView === 'function') restoreCurrentView({keepScroll:true});
    }catch(e){
      console.error('Retention Supabase render failed', e);
    }

    if(!options || options.keepScroll !== false){
      requestAnimationFrame(function(){ window.scrollTo(0, scrollY); });
    }
    return result;
  };
  window.loadData.__retentionSupabaseTeamOverview = true;
  try{ loadData = window.loadData; }catch(e){}
})();
