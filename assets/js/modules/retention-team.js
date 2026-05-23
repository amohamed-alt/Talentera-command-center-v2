(function(){
'use strict';
const {esc,money,num,pct,date,relDate,hsLink,setTitle,setContent,showLoading,unavailable,statusClass}=window.U;
const {card,table}=window.Components;
const {get}=window.State;

const RENEWAL_COLS=[
  {label:'Account',key:'company_name',render:r=>r.hubspot_search_url?`<a class="record-link" href="${esc(r.hubspot_search_url)}" target="_blank">${esc(r.company_name)}</a>`:esc(r.company_name)},
  {label:'Product',key:'product'},{label:'RM',key:'rm_owner'},{label:'CSM',key:'csm_owner'},
  {label:'Renewal Value',key:'renewal_value',center:true,render:r=>money(r.renewal_value)},
  {label:'Month',key:'month',center:true},{label:'Renewal Date',key:'renewal_date',center:true,render:r=>date(r.renewal_date)},
  {label:'Booked',key:'booked_value',center:true,render:r=>money(r.booked_value)},
  {label:'Collected',key:'collected_value',center:true,render:r=>money(r.collected_value)},
  {label:'Status',key:'status',center:true,render:r=>{const s=r.renewal_status||r.status||'';const c=statusClass(s);return `<span class="fin-status ${c}">${esc(s)}</span>`;}},
  {label:'Open',key:'hubspot_search_url',center:true,render:r=>hsLink(r.hubspot_search_url)},
];
const FOLLOW_COLS=[
  {label:'Role',key:'role'},{label:'Owner',key:'owner_name'},
  {label:'Account',key:'company_name',render:r=>r.hubspot_company_url?`<a class="record-link" href="${esc(r.hubspot_company_url)}" target="_blank">${esc(r.company_name)}</a>`:esc(r.company_name)},
  {label:'Tier',key:'tier_group'},{label:'Renewal Value',key:'renewal_value',center:true,render:r=>money(r.renewal_value)},
  {label:'Last Activity',key:'last_activity_at',center:true,render:r=>relDate(r.last_activity_at)},
  {label:'Days',key:'days_since_last_activity',center:true,render:r=>num(r.days_since_last_activity)},
  {label:'Alert',key:'alert'},{label:'Open',key:'hubspot_company_url',center:true,render:r=>hsLink(r.hubspot_company_url)},
];
const MONTH_COLS=[
  {label:'Month',key:'month'},{label:'Year',key:'year',center:true},
  {label:'Due',key:'due_accounts',center:true,render:r=>num(r.due_accounts)},
  {label:'Renewal Value',key:'renewal_value',center:true,render:r=>money(r.renewal_value)},
  {label:'Booked',key:'booked_accounts',center:true,render:r=>num(r.booked_accounts)},
  {label:'Cashed',key:'cashed_accounts',center:true,render:r=>num(r.cashed_accounts)},
  {label:'Delayed',key:'delayed_accounts',center:true,render:r=>`<span style="color:${r.delayed_accounts>0?'var(--red)':'var(--green)'};font-weight:900">${num(r.delayed_accounts)}</span>`},
  {label:'Renewed Late',key:'renewed_late_accounts',center:true,render:r=>num(r.renewed_late_accounts||0)},
  {label:'Lost',key:'lost_accounts',center:true,render:r=>num(r.lost_accounts||0)},
];
const CHURN_COLS=[
  {label:'Reason',key:'reason'},
  {label:'Deals',key:'deals',center:true,render:r=>num(r.deals)},
  {label:'Value',key:'value',center:true,render:r=>money(r.value)},
  {label:'Top Account',key:'top_account'},{label:'Status',key:'status'},
];
const COV_COLS=[
  {label:'Role',key:'role'},{label:'Owner',key:'owner_name'},
  {label:'Accounts',key:'accounts',center:true,render:r=>num(r.accounts)},
  {label:'Delayed',key:'delayed_accounts',center:true,render:r=>`<span style="color:${r.delayed_accounts>0?'var(--red)':'var(--green)'};font-weight:900">${num(r.delayed_accounts)}</span>`},
  {label:'Calls',key:'calls_logged',center:true,render:r=>num(r.calls_logged)},
  {label:'Meetings',key:'meetings_completed',center:true,render:r=>num(r.meetings_completed)},
  {label:'Call Coverage',key:'call_coverage_score',center:true,render:r=>`<span style="color:${r.call_coverage_score>=70?'var(--green)':r.call_coverage_score>=40?'var(--amber)':'var(--red)'}">${pct(r.call_coverage_score)}</span>`},
  {label:'Status',key:'coverage_status'},
];
const KPI_COLS=[
  {label:'Period',key:'period'},
  {label:'Calls',key:'calls_logged',center:true,render:r=>num(r.calls_logged)},
  {label:'Meetings',key:'meetings_completed',center:true,render:r=>num(r.meetings_completed)},
  {label:'Booked',key:'booked_count',center:true,render:r=>`${num(r.booked_count)} / ${money(r.booked_value)}`},
  {label:'Cashed',key:'cashed_count',center:true,render:r=>`${num(r.cashed_count)} / ${money(r.cash_collected)}`},
  {label:'Delayed',key:'delayed_count',center:true,render:r=>`<span style="color:var(--red);font-weight:900">${num(r.delayed_count)}</span>`},
];
const SMART_COLS=[
  {label:'#',key:'sort_order',center:true},
  {label:'Action',key:'title',render:r=>`<strong>${esc(r.title)}</strong>`},
  {label:'Description',key:'description'},
  {label:'Accounts',key:'accounts',center:true,render:r=>num(r.accounts)},
  {label:'Value',key:'value',center:true,render:r=>money(r.value||0)},
  {label:'Status',key:'status',center:true},
];

async function render(){
  setTitle('Retention · Team Overview','Renewal movement and follow-up focus');
  showLoading('Loading Retention…');

  const [focusR,smartR,kpiR,logicR,monthR,churnR,covR,followR]=await Promise.allSettled([
    get('vw_retention_team_overview_focus',1).catch(()=>get('vw_dash_ret_focus_fast',1)),
    get('vw_retention_smart_actions',20).catch(()=>get('vw_dash_ret_smart_fast',20)),
    get('vw_retention_kpi_snapshot',10),
    get('vw_retention_renewal_logic',500),
    get('vw_retention_monthly_renewal_pipeline',20),
    get('vw_retention_churn_reasons',30),
    get('vw_retention_coverage_quality',50),
    get('vw_retention_followup_due_details',300),
  ]);

  const renewals=logicR.status==='fulfilled'?logicR.value:[];
  const delayed=renewals.filter(r=>r.is_delayed===true);
  const snap=focusR.status==='fulfilled'?focusR.value[0]||{}:{};
  const f={
    delayed_renewals:snap.delayed_renewals||delayed.length,
    tier_a_overdue:snap.tier_a_overdue||delayed.filter(r=>Number(r.renewal_value)>5000).length,
    csm_follow_up_due:snap.csm_follow_up_due||delayed.filter(r=>r.csm_owner).length,
    rm_follow_up_due:snap.rm_follow_up_due||delayed.filter(r=>r.rm_owner).length,
    delayed_value:snap.delayed_value||delayed.reduce((s,r)=>s+Number(r.renewal_value||0),0),
  };
  const smart=smartR.status==='fulfilled'?smartR.value:[];
  const kpi=kpiR.status==='fulfilled'?kpiR.value:null;
  const monthly=monthR.status==='fulfilled'?monthR.value:[];
  const churn=churnR.status==='fulfilled'?churnR.value:[];
  const coverage=covR.status==='fulfilled'?covR.value:[];
  const followup=followR.status==='fulfilled'?followR.value:[];

  // Sidebar
  const repEl=document.getElementById('sideRepLinks');
  if(repEl&&coverage.length){
    repEl.innerHTML=coverage.slice(0,12).map(r=>`<button class="nav-item nav-sub" style="font-size:11px">
      <span class="nav-icon">${r.role==='RM'?'◆':'●'}</span>${esc(r.owner_name)}<span class="ret-tag">${esc(r.role)}</span><span class="nav-badge">${r.accounts||0}</span>
    </button>`).join('');
    document.getElementById('sideRepTitle').textContent='Retention Team';
  }

  // Retention KPI focus cards
  const focusCards=`<div class="ret-kpi-bar" style="grid-template-columns:repeat(4,1fr)">
    <div class="ret-kpi" style="border-left:4px solid var(--red)" onclick="window._ret.delayedModal()">
      <div class="ret-kpi-v" style="color:var(--red)">${num(f.delayed_renewals)}</div>
      <div class="ret-kpi-l">Delayed Renewals</div>
      <div class="ret-kpi-s">${money(f.delayed_value)} exposure</div>
    </div>
    <div class="ret-kpi" style="border-left:4px solid var(--amber)" onclick="window._ret.tierAModal()">
      <div class="ret-kpi-v" style="color:var(--amber)">${num(f.tier_a_overdue)}</div>
      <div class="ret-kpi-l">High Value Overdue</div>
      <div class="ret-kpi-s">Over $5K value</div>
    </div>
    <div class="ret-kpi" style="border-left:4px solid var(--cyan)" onclick="window._ret.csmModal()">
      <div class="ret-kpi-v" style="color:var(--cyan)">${num(f.csm_follow_up_due)}</div>
      <div class="ret-kpi-l">CSM Follow-up Due</div>
      <div class="ret-kpi-s">Assigned CSM accounts</div>
    </div>
    <div class="ret-kpi" style="border-left:4px solid var(--blue)" onclick="window._ret.rmModal()">
      <div class="ret-kpi-v" style="color:var(--blue)">${num(f.rm_follow_up_due)}</div>
      <div class="ret-kpi-l">RM Follow-up Due</div>
      <div class="ret-kpi-s">Assigned RM accounts</div>
    </div>
  </div>`;

  // Register modal helpers
  window._ret={
    delayedModal:()=>window.Modal.open({title:'Delayed Renewals',rows:delayed,cols:RENEWAL_COLS,rowUrlFn:r=>r.hubspot_search_url}),
    tierAModal:()=>window.Modal.open({title:'High Value Overdue',rows:delayed.filter(r=>Number(r.renewal_value)>5000),cols:RENEWAL_COLS,rowUrlFn:r=>r.hubspot_search_url}),
    csmModal:()=>window.Modal.open({title:'CSM Follow-up Due',rows:delayed.filter(r=>r.csm_owner),cols:RENEWAL_COLS,rowUrlFn:r=>r.hubspot_search_url}),
    rmModal:()=>window.Modal.open({title:'RM Follow-up Due',rows:delayed.filter(r=>r.rm_owner),cols:RENEWAL_COLS,rowUrlFn:r=>r.hubspot_search_url}),
    renewalModal:()=>window.Modal.open({title:'All Renewals',rows:renewals,cols:RENEWAL_COLS,rowUrlFn:r=>r.hubspot_search_url}),
    monthlyModal:(m)=>window.Modal.open({title:`Renewals — ${m}`,rows:renewals.filter(r=>r.month===m),cols:RENEWAL_COLS,rowUrlFn:r=>r.hubspot_search_url}),
  };

  // Smart actions
  const smartSection=smart.length?
    `<div class="manager-section-label">Smart Actions</div>
     ${card('<div class="card-title-icon" style="background:var(--green-bg)">⚡</div> Prioritised Actions','',table(smart,SMART_COLS,10))}`:
    '';

  // KPI snapshot
  const kpiSection=kpi?
    `<div class="manager-section-label">KPI Snapshot — Yesterday · MTD · YTD</div>
     ${card('<div class="card-title-icon" style="background:var(--blue-bg)">📊</div> Retention KPIs','',
       `<div class="ret-period-grid">
         ${kpi.map(p=>`<div class="ret-period-card">
           <div class="ret-period-label">${esc(p.period)}</div>
           ${[['Calls',num(p.calls_logged)],['Meetings',num(p.meetings_completed)],['Booked',`${num(p.booked_count)} / ${money(p.booked_value)}`],['Cashed',`${num(p.cashed_count)} / ${money(p.cash_collected)}`],['Delayed',`<span style="color:var(--red);font-weight:900">${num(p.delayed_count)}</span>`]].map(([k,v])=>
             `<div class="ret-period-row"><div class="ret-period-key">${k}</div><div class="ret-period-val">${v}</div></div>`).join('')}
         </div>`).join('')}
       </div>`)}`:
    (kpiR.status!=='fulfilled'?`<div class="manager-section-label">KPI Snapshot</div>${unavailable('vw_retention_kpi_snapshot',kpiR.reason?.message)}`:'' );

  // Monthly renewal pipeline
  const monthSection=monthly.length?
    `<div class="manager-section-label">Monthly Renewal Pipeline</div>
     ${card('<div class="card-title-icon" style="background:var(--amber-bg)">📅</div> Monthly Renewal Pipeline',
       `<span class="badge ba">${monthly.length} months</span>`,
       table(monthly,MONTH_COLS,13))}`:
    '';

  // Coverage quality + churn reasons
  const covHtml=coverage.length?
    `<div class="ret-coverage">${coverage.map(o=>`
      <div class="ret-coverage-line">
        <div class="ret-coverage-label">${esc(o.owner_name)} <span class="ret-tag">${esc(o.role)}</span></div>
        <div class="ret-bar"><div class="ret-fill" style="--rc:${o.role==='RM'?'var(--blue)':'var(--cyan)'};width:${Math.min(100,Number(o.call_coverage_score||0))}%"></div></div>
        <div class="ret-pct">${pct(o.call_coverage_score||0)}</div>
      </div>`).join('')}</div>`
    :`<div style="padding:14px;color:var(--muted);font-size:12px">No coverage data</div>`;

  const sideSection=`<div class="manager-section-label">Coverage & Churn</div>
  <div class="two-col">
    ${card('<div class="card-title-icon" style="background:var(--cyan-bg)">📊</div> Coverage Quality',
      `<button class="badge bc" onclick="window.Modal.open({title:'Coverage Quality',rows:window._retData.coverage,cols:${JSON.stringify(COV_COLS.map(c=>({...c,render:null})))}})">Details</button>`,
      covHtml)}
    ${churn.length?card('<div class="card-title-icon" style="background:var(--blue-bg)">📉</div> Churn Reasons','',table(churn,CHURN_COLS,8)):''}
  </div>`;

  // Unified Renewal Table
  const renewalSection=renewals.length?
    `<div class="manager-section-label">Unified Renewal Table</div>
     ${card('<div class="card-title-icon" style="background:var(--red-bg)">🔁</div> Unified Renewal Table',
       `<button class="badge br" onclick="window._ret.renewalModal()">Open All ${renewals.length}</button>`,
       `<div style="font-size:11px;color:var(--muted);padding:10px 14px;border-bottom:1px solid var(--border)">One row per renewal. Delayed, upcoming, and all renewal statuses in one table.</div>
       ${table(renewals,RENEWAL_COLS,8,r=>r.hubspot_search_url)}`)}`:
    unavailable('vw_retention_renewal_logic',logicR.reason?.message);

  // Follow-up metrics
  const followSection=followup.length?
    `<div class="manager-section-label">RM / CSM Follow-up Metrics</div>
     ${card('<div class="card-title-icon" style="background:var(--purple-bg)">👥</div> Follow-up Metrics',
       `<button class="badge bp" onclick="window.Modal.open({title:'Follow-up Due',rows:window._retData.followup,cols:${JSON.stringify(FOLLOW_COLS.map(c=>({...c,render:null})))}})">Open All ${followup.length}</button>`,
       table(followup,FOLLOW_COLS,8,r=>r.hubspot_company_url))}`:
    '';

  window._retData={coverage,followup};

  setContent(focusCards+smartSection+kpiSection+monthSection+sideSection+renewalSection+followSection);
}

window.RetentionTeamModule={render};
})();
