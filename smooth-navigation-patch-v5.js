/*
  Supabase Contract Map Repair V3
  Purpose:
  - No legacy JSON fallback.
  - Maps old dashboard UI contracts to current Supabase views.
  - Keeps old layout intact and fills sections from Supabase-only data.
*/
(function(){
  if(window.__TALENTERA_SUPABASE_CONTRACT_MAP_REPAIR_V3__) return;
  window.__TALENTERA_SUPABASE_CONTRACT_MAP_REPAIR_V3__ = true;

  var SUPA_URL = window.SUPABASE_URL || 'https://czaxtwbmborxwzaboqxl.supabase.co';
  var SUPA_KEY = window.SUPABASE_KEY || 'sb_publishable_uVUdpVWggu1WvkSKCAi51w_9qsb-AjX';
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  window.__TALENTERA_MAPPING_AUDIT = {
    mode: 'Supabase-only',
    legacyJsonFallback: false,
    fixedAt: new Date().toISOString(),
    acquisition: {
      mapped: [
        'team focus/cards <- vw_acquisition_dashboard_summary + vw_acquisition_team_snapshot',
        'KPI periods <- vw_acquisition_kpi_snapshot_periods + vw_acquisition_rep_kpi_periods',
        'lead outreach <- vw_acquisition_leads_need_contact_v2',
        'rank coverage <- vw_acquisition_rank_coverage_v2 + vw_acquisition_country_coverage + vw_acquisition_rank_ab_no_touch_details',
        'pipeline/opportunity <- vw_acquisition_pipeline_details + vw_acquisition_pipeline_attention_details + vw_acquisition_pipeline_attention_summary'
      ],
      intentionallyEmpty: ['market news: no Supabase source yet; safe placeholder only']
    },
    retention: {
      mapped: [
        'team overview <- vw_retention_team_overview_focus',
        'smart actions <- vw_retention_smart_actions',
        'KPI snapshots <- vw_retention_kpi_snapshot',
        'monthly renewal pipeline <- vw_retention_monthly_renewal_pipeline',
        'unified renewal table + financial details <- vw_retention_renewal_logic',
        'owner/sidebar/financial summaries <- mapped SQL views from renewal logic',
        'follow-up matrix <- vw_retention_followup_due_details',
        'coverage quality <- vw_retention_coverage_quality',
        'churn reasons <- vw_retention_churn_reasons'
      ]
    },
    upsell: {
      mapped: ['features plan <- features_plan_rows']
    },
    pnl: {
      mapped: [
        'financeComparison chart contract <- vw_pnl_monthly_summary_v2',
        'executive / cost summaries <- mapped SQL views from monthly summary'
      ]
    }
  };

  function byId(id){ return document.getElementById(id); }
  function num(v){
    var x = Number(String(v == null ? 0 : v).replace(/[^0-9.-]/g,''));
    return Number.isFinite(x) ? x : 0;
  }
  function safe(v){ return String(v == null ? '' : v).trim(); }
  function slug(v){
    return String(v || 'item').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'item';
  }
  function bool(v){ return v === true || String(v).toLowerCase() === 'true' || String(v) === '1'; }
  function dateOnly(v){
    if(!v) return '';
    var d = new Date(v);
    if(isNaN(d.getTime())) return String(v).slice(0,10);
    return d.toISOString().slice(0,10);
  }
  function monthShort(v){
    if(!v) return '';
    if(MONTHS.indexOf(String(v).slice(0,3)) >= 0) return String(v).slice(0,3);
    var d = new Date(v);
    if(!isNaN(d.getTime())) return MONTHS[d.getMonth()];
    return String(v).slice(0,3);
  }
  function daysSince(v){
    if(!v) return null;
    var d = new Date(v);
    if(isNaN(d.getTime())) return null;
    var t = new Date();
    t.setHours(0,0,0,0);
    d.setHours(0,0,0,0);
    return Math.round((t - d) / 86400000);
  }
  function daysLeft(v){
    var ds = daysSince(v);
    return ds == null ? null : -ds;
  }
  function companyUrl(id, override){
    if(override) return override;
    return id ? 'https://app-eu1.hubspot.com/contacts/145742477/company/' + encodeURIComponent(String(id)) : '';
  }
  function dealUrl(id, override){
    if(override) return override;
    return id ? 'https://app-eu1.hubspot.com/contacts/145742477/deal/' + encodeURIComponent(String(id)) : '';
  }
  async function view(name, limit){
    var url = SUPA_URL + '/rest/v1/' + encodeURIComponent(name) + '?select=*&limit=' + (limit || 20000);
    var res = await fetch(url, { cache:'no-store', headers:{ apikey:SUPA_KEY, Authorization:'Bearer ' + SUPA_KEY } });
    if(!res.ok) throw new Error(name + ' HTTP ' + res.status);
    return await res.json();
  }
  async function fetchMany(map){
    var out = {};
    await Promise.all(Object.keys(map).map(async function(key){
      try { out[key] = await view(map[key], 20000); }
      catch(e){ console.warn('[Supabase map] view failed:', map[key], e); out[key] = []; }
    }));
    return out;
  }
  function sum(rows, fn){ return (rows || []).reduce(function(s,r){ return s + num(typeof fn === 'function' ? fn(r) : r && r[fn]); },0); }

  function accountRow(r){
    var renewalDate = dateOnly(r.renewal_date);
    var cid = safe(r.hubspot_company_id);
    var status = safe(r.renewal_status || r.status);
    if(bool(r.is_delayed)) status = 'Delayed';
    else if(num(r.collected_value) > 0) status = 'Cashed';
    else if(num(r.booked_value) > 0) status = 'Booked';
    else if(!status) status = 'Upcoming';

    return {
      id: safe(r.match_key || r.row_key || cid || r.company_name),
      matchKey: safe(r.match_key || r.row_key || cid || r.company_name),
      companyId: cid,
      hs_object_id: cid,
      accountId: safe(r.match_key || r.row_key || cid),
      name: safe(r.company_name || 'Unknown Account'),
      companyName: safe(r.company_name || 'Unknown Account'),
      accountName: safe(r.company_name || 'Unknown Account'),
      clientName: safe(r.company_name || 'Unknown Client'),
      gid: safe(r.gid || r.clean_gid || ''),
      location: safe(r.location || ''),
      companyUrl: companyUrl(cid, r.hubspot_company_url || r.hubspot_search_url),
      hubspotUrl: companyUrl(cid, r.hubspot_company_url || r.hubspot_search_url),
      product: safe(r.product || 'Talentera'),
      renewalMonth: monthShort(r.month || renewalDate),
      month: monthShort(r.month || renewalDate),
      renewalDate: renewalDate,
      contractRenewalDate: renewalDate,
      originalContractRenewalDate: renewalDate,
      renewalValue: num(r.renewal_value),
      renewalValue2026: num(r.renewal_value),
      amount: num(r.renewal_value),
      value: num(r.renewal_value),
      bookedValue: num(r.booked_value),
      collectedValue: num(r.collected_value || r.cash_collected),
      bookedNotCashValue: num(r.booked_not_cash_value || r.remaining_collection_value),
      remainingCollectionValue: num(r.remaining_collection_value),
      firstBookedDate: dateOnly(r.first_booked_date),
      firstCollectionDate: dateOnly(r.first_collection_date),
      bookingMonth: monthShort(r.first_booked_date) || monthShort(r.month || renewalDate),
      collectionMonth: monthShort(r.first_collection_date) || monthShort(r.month || renewalDate),
      bookingByMonth: {},
      collectionByMonth: {},
      status: status,
      renewalStatusFromSheet: status,
      accountStatus: safe(r.status || status),
      rm: safe(r.rm_owner),
      csm: safe(r.csm_owner),
      rmOwner: safe(r.rm_owner),
      csmOwner: safe(r.csm_owner),
      rmOwnerName: safe(r.rm_owner),
      csmOwnerName: safe(r.csm_owner),
      ownerName: safe(r.rm_owner || r.csm_owner),
      ownerId: safe(r.rm_owner) ? 'rm-' + slug(r.rm_owner) : '',
      companyTier: safe(r.company_tier || r.tier_group || ''),
      tier: safe(r.company_tier || r.tier_group || ''),
      lastActivity: r.last_activity_at || r.notes_last_contacted || '',
      lastActivityDate: r.last_activity_at || r.notes_last_contacted || '',
      daysSinceActivity: r.days_since_last_activity == null ? daysSince(r.last_activity_at || r.notes_last_contacted) : num(r.days_since_last_activity),
      daysOverdue: renewalDate ? Math.max(0, daysSince(renewalDate) || 0) : 0,
      daysLeft: daysLeft(renewalDate),
      callsLogged: num(r.calls_logged),
      connectedCalls: num(r.connected_calls),
      meetingsLogged: num(r.meetings_logged),
      meetingsCompleted: num(r.meetings_completed),
      isDelayed: bool(r.is_delayed),
      renewedLate: bool(r.renewed_late)
    };
  }
  function applyMonthlyMaps(a){
    var bk = a.bookingMonth || a.renewalMonth || 'All';
    var ck = a.collectionMonth || a.renewalMonth || 'All';
    a.bookingByMonth = {};
    a.collectionByMonth = {};
    if(a.bookedValue){
      a.bookingByMonth[bk] = {};
      a.bookingByMonth[bk][a.product || 'Talentera'] = a.bookedValue;
    }
    if(a.collectedValue){
      a.collectionByMonth[ck] = {};
      a.collectionByMonth[ck][a.product || 'Talentera'] = a.collectedValue;
    }
    return a;
  }

  function buildFinanceComparison(pnlRows){
    var rows = Array.isArray(pnlRows) ? pnlRows : [];
    var fc = { months: MONTHS.slice(), booking2025:[], booking2026:[], cashing2025:[], cashing2026:[], cost2025:[], cost2026:[] };
    function setArr(name, idx, val){ fc[name][idx] = (fc[name][idx] || 0) + num(val); }
    rows.forEach(function(r){
      var y = String(r.year || '').trim();
      var m = monthShort(r.month);
      var idx = MONTHS.indexOf(m);
      if(idx < 0) return;
      if(y === '2025'){
        setArr('booking2025', idx, r.booking);
        setArr('cashing2025', idx, r.cashing);
        setArr('cost2025', idx, r.total_cost);
      }
      if(y === '2026'){
        setArr('booking2026', idx, r.booking);
        setArr('cashing2026', idx, r.cashing);
        setArr('cost2026', idx, r.total_cost);
      }
    });
    ['booking2025','booking2026','cashing2025','cashing2026','cost2025','cost2026'].forEach(function(k){
      for(var i=0;i<12;i++) fc[k][i] = num(fc[k][i]);
    });
    return fc;
  }

  function buildRetentionFromViews(supa){
    supa = supa || {};
    var logicRaw = Array.isArray(supa.logic) ? supa.logic : [];
    var bridgeByKey = {};
    (supa.bridge || []).forEach(function(b){ bridgeByKey[safe(b.match_key)] = b; });

    var accounts = logicRaw.map(function(r){
      var b = bridgeByKey[safe(r.match_key)] || {};
      return applyMonthlyMaps(accountRow(Object.assign({}, r, {
        hubspot_company_id: b.hubspot_company_id,
        hubspot_company_url: b.hubspot_company_url,
        company_tier: b.company_tier,
        account_status: b.account_status,
        calls_logged: b.calls_logged,
        connected_calls: b.connected_calls,
        meetings_logged: b.meetings_logged,
        meetings_completed: b.meetings_completed,
        last_activity_at: b.last_activity_at,
        days_since_last_activity: b.days_since_last_activity
      })));
    });

    var kpi = {};
    (supa.kpi || []).forEach(function(r){
      var p = String(r.period || '').toLowerCase();
      var key = p.indexOf('yesterday') >= 0 || p === 'yest' ? 'yesterday' : p.indexOf('mtd') >= 0 ? 'mtd' : p.indexOf('ytd') >= 0 ? 'ytd' : p;
      if(!key) return;
      kpi[key] = {
        calls: num(r.connected_calls || r.calls_logged),
        callsLogged: num(r.calls_logged),
        meetings: num(r.meetings_completed || r.meetings_logged),
        meetingsLogged: num(r.meetings_logged),
        renewed: num(r.cashed_count) + num(r.booked_count),
        booked: num(r.booked_count),
        bookedAmt: num(r.booked_value),
        cashed: num(r.cashed_count),
        cashedAmt: num(r.cash_collected),
        churn: num(r.churned_count),
        delayed: num(r.delayed_count)
      };
    });
    ['yesterday','mtd','ytd'].forEach(function(k){ if(!kpi[k]) kpi[k] = {calls:0,meetings:0,renewed:0,booked:0,cashed:0,churn:0,delayed:0,bookedAmt:0,cashedAmt:0}; });

    var focus = (supa.focus || [])[0] || {};
    var summary = {
      accounts: accounts.length,
      renewalValue: sum(accounts, 'renewalValue'),
      bookedAccounts: accounts.filter(function(a){ return a.bookedValue > 0; }).length,
      bookedValue: sum(accounts, 'bookedValue'),
      cashedAccounts: accounts.filter(function(a){ return a.collectedValue > 0; }).length,
      cashCollected: sum(accounts, 'collectedValue'),
      bookedNotCash: sum(accounts, 'bookedNotCashValue'),
      remainingCollection: sum(accounts, 'remainingCollectionValue'),
      delayedAccounts: num(focus.delayed_renewals) || accounts.filter(function(a){ return a.isDelayed; }).length,
      delayedValue: num(focus.delayed_value) || sum(accounts.filter(function(a){ return a.isDelayed; }), 'renewalValue'),
      tierAOverdue: num(focus.tier_a_overdue),
      csmFollowUpDue: num(focus.csm_follow_up_due),
      rmFollowUpDue: num(focus.rm_follow_up_due)
    };

    var repMap = {};
    function touchRep(role, name){
      name = safe(name);
      if(!name || name.toLowerCase() === 'unassigned') return null;
      role = String(role || 'RM').toUpperCase() === 'CSM' ? 'CSM' : 'RM';
      var id = role.toLowerCase() + '-' + slug(name);
      if(!repMap[id]) repMap[id] = { id:id, name:name, role:role, color: role === 'RM' ? 'var(--blue)' : 'var(--cyan)', accounts:0, activeAccounts:0, delayed:0, calls:0, meetings:0, renewalValue:0, bookedValue:0, cashCollected:0 };
      return repMap[id];
    }
    accounts.forEach(function(a){
      var rm = touchRep('RM', a.rmOwnerName);
      var csm = touchRep('CSM', a.csmOwnerName);
      [rm,csm].forEach(function(rep){
        if(!rep) return;
        rep.accounts += 1;
        rep.activeAccounts += 1;
        rep.delayed += a.isDelayed ? 1 : 0;
        rep.calls += num(a.connectedCalls);
        rep.meetings += num(a.meetingsCompleted);
        rep.renewalValue += num(a.renewalValue);
        rep.bookedValue += num(a.bookedValue);
        rep.cashCollected += num(a.collectedValue);
      });
    });
    var repData = Object.values(repMap).sort(function(a,b){ return a.role === b.role ? a.name.localeCompare(b.name) : a.role.localeCompare(b.role); });

    var ownerDetails = {};
    repData.forEach(function(rep){
      var rows = accounts.filter(function(a){ return rep.role === 'RM' ? a.rmOwnerName === rep.name : a.csmOwnerName === rep.name; });
      ownerDetails[rep.id] = {
        id:rep.id, name:rep.name, role:rep.role, color:rep.color,
        metrics:{
          accounts:rows.length,
          activeAccounts:rows.length,
          delayed:rows.filter(function(a){ return a.isDelayed; }).length,
          noContact:rows.filter(function(a){ return num(a.connectedCalls) === 0 || num(a.daysSinceActivity) >= 30; }).length,
          noMeeting:rows.filter(function(a){ return num(a.meetingsCompleted) === 0; }).length,
          calls:sum(rows,'connectedCalls'),
          meetings:sum(rows,'meetingsCompleted'),
          bookedAmt:sum(rows,'bookedValue'),
          cashedAmt:sum(rows,'collectedValue'),
          renewedAmt:sum(rows,'bookedValue') + sum(rows,'collectedValue')
        },
        accounts:rows,
        delayedRenewals:rows.filter(function(a){ return a.isDelayed; }),
        noContactAccounts:rows.filter(function(a){ return num(a.connectedCalls) === 0 || num(a.daysSinceActivity) >= 30; }),
        noMeetingAccounts:rows.filter(function(a){ return num(a.meetingsCompleted) === 0; }),
        followupDue:(supa.followupDetails || []).filter(function(f){ return String(f.role || '').toUpperCase() === rep.role && safe(f.owner_name) === rep.name && bool(f.is_followup_due); })
      };
    });

    var monthlyRenewalPipeline = (supa.monthly || []).map(function(m){
      var label = monthShort(m.month || m.month_start);
      return {
        month: label || safe(m.month || m.month_start),
        due:num(m.due_accounts),
        renewed:num(m.booked_accounts) + num(m.cashed_accounts),
        booked:num(m.booked_accounts),
        cashed:num(m.cashed_accounts),
        delayed:num(m.delayed_accounts),
        upcoming:Math.max(0, num(m.due_accounts) - num(m.booked_accounts) - num(m.cashed_accounts) - num(m.delayed_accounts)),
        value:num(m.renewal_value)
      };
    });

    var coverageQuality = (supa.coverage || []).map(function(r){
      return {
        role:safe(r.role), ownerName:safe(r.owner_name), accounts:num(r.accounts), delayed:num(r.delayed_accounts),
        callsLogged:num(r.calls_logged), connectedCalls:num(r.connected_calls), meetingsLogged:num(r.meetings_logged), meetingsCompleted:num(r.meetings_completed),
        callCoverageScore:num(r.call_coverage_score), meetingCoverageScore:num(r.meeting_coverage_score), status:safe(r.coverage_status)
      };
    });

    var churnReasons = (supa.churnReasons || []).map(function(r){ return { reason:safe(r.reason || 'Other'), deals:num(r.deals), value:num(r.value), topAccount:safe(r.top_account), status:safe(r.status || 'Churn') }; });
    var smartActions = (supa.smartActions || []).sort(function(a,b){ return num(a.sort_order) - num(b.sort_order); }).map(function(r){ return { title:safe(r.title), description:safe(r.description), accounts:num(r.accounts), value:num(r.value), status:safe(r.status), actionType:safe(r.action_type) }; });

    var dealsSplit = {
      booked: accounts.filter(function(a){ return a.bookedValue > 0; }),
      cashed: accounts.filter(function(a){ return a.collectedValue > 0; }),
      renewed: accounts.filter(function(a){ return a.bookedValue > 0 || a.collectedValue > 0; }),
      delayed: accounts.filter(function(a){ return a.isDelayed; }),
      churn: accounts.filter(function(a){ return /lost|churn/i.test(a.status || a.accountStatus); }),
      upcoming: accounts.filter(function(a){ return !a.isDelayed && !a.bookedValue && !a.collectedValue; })
    };

    var financeComparison = buildFinanceComparison(supa.pnlMonthly || []);
    var featuresRows = (supa.features || []).map(function(r){
      return {
        product:r.product_line || r.product || '',
        productLine:r.product_line || r.product || '',
        clientName:r.company_name || r.client_name || r.company || '',
        companyName:r.company_name || r.client_name || r.company || '',
        csm:r.csm_owner || r.csm || '',
        csmOwner:r.csm_owner || r.csm || '',
        rm:r.owner_name || r.rm_owner || r.rm || '',
        rmOwner:r.owner_name || r.rm_owner || r.rm || '',
        renewalMonth:r.expected_month || r.renewal_month || r.month || '',
        expectedMonth:r.expected_month || r.renewal_month || r.month || '',
        renewalValue:num(r.renewal_value),
        feature:r.feature_name || r.feature || '',
        featureName:r.feature_name || r.feature || '',
        status:r.feature_status || r.status || '',
        featureStatus:r.feature_status || r.status || '',
        timeline:r.proposal_sent_date || r.timeline || '',
        proposalSentDate:r.proposal_sent_date || '',
        upsellValue:num(r.upsell_value),
        notes:r.notes || '',
        raw:r
      };
    });

    return {
      generatedAt:new Date().toISOString(),
      source:'Supabase',
      meta:{ source:'Supabase', legacyJson:false },
      summary:summary,
      kpi:kpi,
      kpis:kpi,
      accounts:accounts,
      renewalAccounts:accounts,
      monthlyRenewalPipeline:monthlyRenewalPipeline,
      smartActions:smartActions,
      coverageQuality:coverageQuality,
      churnReasons:churnReasons,
      ownerMatrix:repData,
      repData:repData,
      ownerDetails:ownerDetails,
      dealsSplit:dealsSplit,
      retentionSheets2026:{
        accounts:accounts,
        sourceSheets:{
          budget:'vw_retention_renewal_logic',
          booking:'vw_retention_renewal_logic.booked_value',
          collection:'vw_retention_renewal_logic.collected_value'
        },
        source:'Supabase mapped renewal logic'
      },
      sheetData:{ featuresPlanForUpselling:featuresRows },
      featuresPlanForUpselling:featuresRows,
      upsellingFeaturesPlan:featuresRows,
      featuresPlanRows:featuresRows,
      financeComparison:financeComparison,
      supabaseViews:supa
    };
  }

  window.fetchSupabaseRetentionTeamOverview = async function(){
    return await fetchMany({
      focus:'vw_retention_team_overview_focus',
      smartActions:'vw_retention_smart_actions',
      kpi:'vw_retention_kpi_snapshot',
      monthly:'vw_retention_monthly_renewal_pipeline',
      logic:'vw_retention_renewal_logic',
      bridge:'vw_retention_company_activity_bridge',
      coverage:'vw_retention_coverage_quality',
      churnReasons:'vw_retention_churn_reasons',
      followupDetails:'vw_retention_followup_due_details',
      followupSummary:'vw_retention_followup_due_summary',
      teamSummary:'vw_retention_team_summary',
      ownerFinancial:'vw_retention_owner_financial_summary',
      productFinancial:'vw_retention_product_financial_summary',
      sidebar:'vw_retention_sidebar_reps',
      dashboard:'vw_retention_dashboard_summary',
      pnlMonthly:'vw_pnl_monthly_summary_v2',
      pnlExec:'vw_pnl_exec_summary_v2',
      pnlCost:'vw_pnl_cost_breakdown_v2',
      features:'features_plan_rows'
    });
  };
  window.buildRetentionFromSupabaseTeamOnly = buildRetentionFromViews;
  try { buildRetentionFromSupabaseTeamOnly = window.buildRetentionFromSupabaseTeamOnly; } catch(e){}

  var previousEnhance = window.acqEnhanceSupabaseData;
  window.acqEnhanceSupabaseData = function(d, SUPA){
    if(typeof previousEnhance === 'function'){
      try{ d = previousEnhance(d, SUPA) || d; }catch(e){ console.warn('[Supabase map] previous acquisition enhance failed', e); }
    }
    SUPA = SUPA || {};
    d = d || {};

    var dashboard = (SUPA.dashboardSummary || [])[0] || {};
    if(d.team){
      d.team.callsMTD = d.team.callsMTD || num(dashboard.calls_logged);
      d.team.callsMTDConn = d.team.callsMTDConn || num(dashboard.connected_calls);
      d.team.meetingsMTD = d.team.meetingsMTD || num(dashboard.completed_meetings || dashboard.meetings_logged);
      d.team.contactCoveragePct = d.team.contactCoveragePct || num(dashboard.coverage_pct);
    }

    var needRows = Array.isArray(SUPA.need) ? SUPA.need : [];
    var rankRows = Array.isArray(SUPA.rank) ? SUPA.rank : [];
    var rankNoTouch = Array.isArray(SUPA.rankNoTouch) ? SUPA.rankNoTouch : [];
    var rankCov = Array.isArray(SUPA.rankCoverageV2) ? SUPA.rankCoverageV2 : [];
    var attention = Array.isArray(SUPA.attentionDetails) ? SUPA.attentionDetails : [];
    var attentionSummary = Array.isArray(SUPA.attentionSummary) ? SUPA.attentionSummary : [];
    var reps = Array.isArray(d.repData) ? d.repData : [];

    reps.forEach(function(rep){
      var owner = safe(rep.name || rep.ownerName);
      var ownerNeed = needRows.filter(function(r){ return safe(r.owner_name) === owner; });
      var ownerAttention = attention.filter(function(r){ return safe(r.owner_name) === owner; });
      rep.needsContactRows = ownerNeed;
      rep.needsContact = ownerNeed.length;
      rep.leadsMTD = rep.leadsMTD || ownerNeed.length;
      rep.leadsYTD = rep.leadsYTD || ownerNeed.length;
      rep.leadsMTDInbound = rep.leadsMTDInbound || ownerNeed.filter(function(r){ return /online|inbound/i.test(safe(r.source_type)); }).length;
      rep.leadsMTDOutbound = rep.leadsMTDOutbound || ownerNeed.filter(function(r){ return !/online|inbound/i.test(safe(r.source_type)); }).length;
      rep.leadsYTDInbound = rep.leadsYTDInbound || rep.leadsMTDInbound;
      rep.leadsYTDOutbound = rep.leadsYTDOutbound || rep.leadsMTDOutbound;
      rep.stuck = rep.stuck && rep.stuck.length ? rep.stuck : ownerAttention.filter(function(r){ return bool(r.is_stuck); }).slice(0,80).map(function(r){
        return { name:r.dealname, amount:num(r.amount), days: num(r.days_in_stage), stage:r.dealstage, hubspotUrl:dealUrl(r.hubspot_deal_id, r.hubspot_url), reasons:[r.lost_reason || r.closed_lost_reason || 'Stuck'] };
      });
      rep.cold = rep.cold && rep.cold.length ? rep.cold : ownerAttention.filter(function(r){ return bool(r.is_cold); }).slice(0,80).map(function(r){
        return { name:r.dealname, amount:num(r.amount), days: num(r.days_since_modified), stage:r.dealstage, hubspotUrl:dealUrl(r.hubspot_deal_id, r.hubspot_url), reasons:[r.lost_reason || r.closed_lost_reason || 'Cold'] };
      });
      rep.needsAttention = rep.needsAttention && rep.needsAttention.length ? rep.needsAttention : ownerAttention.slice(0,80).map(function(r){
        return { name:r.dealname, amount:num(r.amount), days:num(r.days_in_stage), stage:r.dealstage, hubspotUrl:dealUrl(r.hubspot_deal_id, r.hubspot_url), reasons:[r.is_stuck ? 'Stuck' : r.is_cold ? 'Cold' : 'Needs action'] };
      });

      var ownerRank = rankCov.filter(function(r){ return safe(r.owner_name) === owner; });
      if(ownerRank.length){
        rep.rankA = sum(ownerRank.filter(function(r){ return String(r.rank).toUpperCase() === 'A'; }), 'total_companies');
        rep.rankAContacted = sum(ownerRank.filter(function(r){ return String(r.rank).toUpperCase() === 'A'; }), 'touched_companies');
        rep.rankANotContacted = sum(ownerRank.filter(function(r){ return String(r.rank).toUpperCase() === 'A'; }), 'untouched_companies');
        rep.rankB = sum(ownerRank.filter(function(r){ return String(r.rank).toUpperCase() === 'B'; }), 'total_companies');
        rep.rankBContacted = sum(ownerRank.filter(function(r){ return String(r.rank).toUpperCase() === 'B'; }), 'touched_companies');
        rep.rankBNotContacted = sum(ownerRank.filter(function(r){ return String(r.rank).toUpperCase() === 'B'; }), 'untouched_companies');
      }
      if(!rep.rankAUntouched || !rep.rankAUntouched.length){
        rep.rankAUntouched = rankNoTouch.filter(function(r){ return safe(r.owner_name) === owner && String(r.rank_group || r.rank).toUpperCase() === 'A'; }).map(function(r){
          return { id:r.hubspot_company_id, name:r.company_name, country:r.country, rank:'A', hubspotUrl:companyUrl(r.hubspot_company_id, r.hubspot_url), ownerName:r.owner_name };
        });
      }
      if(!rep.rankBUntouched || !rep.rankBUntouched.length){
        rep.rankBUntouched = rankNoTouch.filter(function(r){ return safe(r.owner_name) === owner && String(r.rank_group || r.rank).toUpperCase() === 'B'; }).map(function(r){
          return { id:r.hubspot_company_id, name:r.company_name, country:r.country, rank:'B', hubspotUrl:companyUrl(r.hubspot_company_id, r.hubspot_url), ownerName:r.owner_name };
        });
      }
    });

    var totalRankA = sum(rankCov.filter(function(r){ return String(r.rank).toUpperCase() === 'A'; }), 'total_companies');
    var totalRankB = sum(rankCov.filter(function(r){ return String(r.rank).toUpperCase() === 'B'; }), 'total_companies');
    if(totalRankA || totalRankB){
      d.rankTotals = {
        A:totalRankA,
        B:totalRankB,
        AContacted:sum(rankCov.filter(function(r){ return String(r.rank).toUpperCase() === 'A'; }), 'touched_companies'),
        BContacted:sum(rankCov.filter(function(r){ return String(r.rank).toUpperCase() === 'B'; }), 'touched_companies'),
        ANotContacted:sum(rankCov.filter(function(r){ return String(r.rank).toUpperCase() === 'A'; }), 'untouched_companies'),
        BNotContacted:sum(rankCov.filter(function(r){ return String(r.rank).toUpperCase() === 'B'; }), 'untouched_companies')
      };
      d.rankTotals.total = d.rankTotals.A + d.rankTotals.B;
    }

    if(!d.topInactiveRankAccounts || !d.topInactiveRankAccounts.length){
      d.topInactiveRankAccounts = rankNoTouch.slice(0,80).map(function(r){
        return { rank:String(r.rank_group || r.rank).toUpperCase(), name:r.company_name, rep:r.owner_name, country:r.country, daysSinceActivity: num(r.days_since_activity || 0), hubspotUrl:companyUrl(r.hubspot_company_id, r.hubspot_url) };
      });
    }

    if(d.outreachCoverage && d.outreachCoverage.contacts){
      d.outreachCoverage.contacts.total = Math.max(num(d.outreachCoverage.contacts.total), needRows.length);
      d.outreachCoverage.contacts.notContacted = needRows.length;
      d.outreachCoverage.contacts.notContactedList = needRows.map(function(r){
        return {
          id:r.hubspot_contact_id, contactId:r.hubspot_contact_id, name:r.contact_name || r.email || r.company_name,
          email:r.email, phone:r.phone, ownerName:r.owner_name, source:r.source || 'Unknown', sourceBucket:r.source_type || 'Offline / Outbound',
          createdAt:r.created_at, ageDays:num(r.days_since_created), connectedCalls:num(r.connected_calls), completedMeetings:num(r.completed_meetings),
          companyIds:r.hubspot_company_id ? [String(r.hubspot_company_id)] : [], companyName:r.company_name, hubspotUrl:r.hubspot_url || r.company_url
        };
      });
    }

    d.autoRecs = [
      {type:'red', title:'Contact stale leads', text: needRows.length.toLocaleString() + ' leads/accounts need connected call or completed meeting.'},
      {type:'amber', title:'Review Rank A/B coverage', text: (rankNoTouch.length || 0).toLocaleString() + ' Rank A/B accounts still need owner-scoped touch.'},
      {type:'blue', title:'Fix pipeline attention', text: (attentionSummary.reduce(function(s,r){ return s + num(r.needs_attention_deals); },0) || attention.length).toLocaleString() + ' deals need action or stage hygiene.'}
    ];

    d.marketNews = d.marketNews || [];
    d.aiInsights = d.aiInsights || { summary:'Supabase-only mapping active. Sections are filled from live views where data exists.', patterns:[], quick_wins:[], risks:[] };
    d.meta = Object.assign({}, d.meta || {}, { source:'Supabase', legacyJson:false, contractMap:'v3' });
    return d;
  };
  try { acqEnhanceSupabaseData = window.acqEnhanceSupabaseData; } catch(e){}

  var oldRenderCurrent = window.renderCurrent;
  window.renderCurrent = function(options, scrollY){
    if(typeof oldRenderCurrent === 'function') return oldRenderCurrent(options, scrollY);
    try{ if(typeof window.render === 'function') window.render(); }catch(e){ console.error(e); }
    try{ if(typeof window.restoreCurrentView === 'function') window.restoreCurrentView({keepScroll:true, instant:true}); }catch(e){}
  };

  console.info('[Talentera] Supabase Contract Map Repair V3 loaded', window.__TALENTERA_MAPPING_AUDIT);
})();
