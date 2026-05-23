(function(){
'use strict';
const {esc,money,num,pct,date,relDate,hsLink,setTitle,setContent,showLoading,unavailable}=window.U;
const {sumCard,card,table,openAllBtn}=window.Components;
const {get}=window.State;

const RANK_COLS=[
  {label:'Rank',key:'rank_group'},{label:'Country',key:'country'},{label:'Owner',key:'owner_name'},
  {label:'Companies',key:'companies',center:true,render:r=>num(r.companies)},
  {label:'Touched',key:'touched_companies',center:true,render:r=>num(r.touched_companies)},
  {label:'No Touch',key:'no_touch_companies',center:true,render:r=>num(r.no_touch_companies||Math.max(0,(r.companies||0)-(r.touched_companies||0)))},
  {label:'Touch Rate',key:'touch_rate_pct',center:true,render:r=>pct(r.touch_rate_pct||0)},
  {label:'Calls',key:'connected_calls',center:true,render:r=>num(r.connected_calls)},
  {label:'Meetings',key:'completed_meetings',center:true,render:r=>num(r.completed_meetings)},
];
const NEEDS_COLS=[
  {label:'Company',key:'company_name',render:r=>r.company_url?`<a class="record-link" href="${esc(r.company_url)}" target="_blank">${esc(r.company_name)}</a>`:esc(r.company_name)},
  {label:'Owner',key:'owner_name'},{label:'Country',key:'country'},
  {label:'Rank',key:'rank',center:true,render:r=>`<span class="${r.rank==='A'?'rank-a':'rank-b'}">${esc(r.rank||'—')}</span>`},
  {label:'Calls',key:'calls_logged',center:true,render:r=>num(r.calls_logged)},
  {label:'Meetings',key:'completed_meetings',center:true,render:r=>num(r.completed_meetings)},
  {label:'Last Touch',key:'last_touch_at',center:true,render:r=>relDate(r.last_touch_at)},
  {label:'Days',key:'days_since_created',center:true,render:r=>num(r.days_since_created)},
  {label:'Open',key:'hubspot_url',center:true,render:r=>hsLink(r.hubspot_url||r.company_url)},
];
const PIPE_COLS=[
  {label:'Deal',key:'dealname',render:r=>r.hubspot_url?`<a class="record-link" href="${esc(r.hubspot_url)}" target="_blank">${esc(r.dealname)}</a>`:esc(r.dealname)},
  {label:'Owner',key:'owner_name'},{label:'Stage',key:'dealstage'},{label:'Product',key:'product'},
  {label:'Amount',key:'amount',center:true,render:r=>money(r.amount)},
  {label:'Close',key:'closedate',center:true,render:r=>date(r.closedate)},
  {label:'Next Act.',key:'next_activity_date',center:true,render:r=>relDate(r.next_activity_date)},
  {label:'Open',key:'hubspot_url',center:true,render:r=>hsLink(r.hubspot_url)},
];
const STUCK_COLS=[
  {label:'Deal',key:'dealname',render:r=>r.hubspot_url?`<a class="record-link" href="${esc(r.hubspot_url)}" target="_blank">${esc(r.dealname)}</a>`:esc(r.dealname)},
  {label:'Owner',key:'owner_name'},{label:'Stage',key:'dealstage'},
  {label:'Days in Stage',key:'days_in_stage',center:true,render:r=>`<span style="color:${r.days_in_stage>30?'var(--red)':r.days_in_stage>14?'var(--amber)':'var(--text2)'};font-family:var(--mono);font-weight:900">${num(r.days_in_stage)}</span>`},
  {label:'Amount',key:'amount',center:true,render:r=>money(r.amount)},
  {label:'Open',key:'hubspot_url',center:true,render:r=>hsLink(r.hubspot_url)},
];
const KPI_COLS=[
  {label:'Period',key:'period'},
  {label:'Calls',key:'calls_logged',center:true,render:r=>num(r.calls_logged)},
  {label:'Connected',key:'connected_calls',center:true,render:r=>num(r.connected_calls)},
  {label:'Meetings',key:'meetings_logged',center:true,render:r=>num(r.meetings_logged)},
  {label:'Completed',key:'meetings_completed',center:true,render:r=>num(r.meetings_completed)},
  {label:'Conn Rate',key:'connection_rate',center:true,render:r=>pct(r.connection_rate||0)},
];
const REP_COLS=[
  {label:'Owner',key:'owner_name'},
  {label:'Calls',key:'calls_logged',center:true,render:r=>num(r.calls_logged)},
  {label:'Connected',key:'connected_calls',center:true,render:r=>num(r.connected_calls)},
  {label:'Meetings',key:'meetings_logged',center:true,render:r=>num(r.meetings_logged)},
  {label:'Completed',key:'meetings_completed',center:true,render:r=>num(r.meetings_completed)},
  {label:'Last Activity',key:'last_activity_at',center:true,render:r=>relDate(r.last_activity_at)},
];

async function render(){
  setTitle('Acquisition · Team Overview','Coverage, activity quality and pipeline health');
  showLoading('Loading Acquisition…');

  const [snapR,kpiR,repsR,rankR,needsR,pipeR,stuckR]=await Promise.allSettled([
    get('vw_dash_acq_team_fast',1),
    get('vw_acquisition_kpi_snapshot_periods',10).catch(()=>get('vw_dash_acq_kpi_fast',10)),
    get('vw_dash_acq_sidebar_fast',50),
    get('vw_dash_acq_rank_fast',200),
    get('vw_dash_acq_needs_fast',2000),
    get('vw_acquisition_pipeline_details',500),
    get('vw_acquisition_stuck_deals',200),
  ]);

  const snap=snapR.status==='fulfilled'?snapR.value[0]||{}:{};
  const kpi=kpiR.status==='fulfilled'?kpiR.value:null;
  const reps=repsR.status==='fulfilled'?repsR.value:[];
  const rank=rankR.status==='fulfilled'?rankR.value:[];
  const needs=needsR.status==='fulfilled'?needsR.value:[];
  const pipe=pipeR.status==='fulfilled'?pipeR.value:[];
  const stuck=stuckR.status==='fulfilled'?stuckR.value:[];

  // Update sidebar
  const repEl=document.getElementById('sideRepLinks');
  if(repEl&&reps.length){
    repEl.innerHTML=reps.map(r=>`<button class="nav-item nav-sub" style="font-size:11px">
      <span class="nav-icon">👤</span>${esc(r.owner_name)}<span class="nav-badge">${num(r.meetings_completed||0)}</span>
    </button>`).join('');
  }

  // Derived
  const rankA=rank.filter(r=>String(r.rank_group).toUpperCase()==='A');
  const rankB=rank.filter(r=>String(r.rank_group).toUpperCase()==='B');
  const aTotal=rankA.reduce((s,r)=>s+Number(r.companies||0),0);
  const aTouched=rankA.reduce((s,r)=>s+Number(r.touched_companies||0),0);
  const aNoTouch=rankA.reduce((s,r)=>s+Number(r.no_touch_companies||0),0);
  const bTotal=rankB.reduce((s,r)=>s+Number(r.companies||0),0);
  const bTouched=rankB.reduce((s,r)=>s+Number(r.touched_companies||0),0);
  const bNoTouch=rankB.reduce((s,r)=>s+Number(r.no_touch_companies||0),0);
  const pipeVal=pipe.reduce((s,r)=>s+Number(r.amount||0),0);
  const repsModal=()=>window.Modal.open({title:'Rep Performance',rows:reps,cols:REP_COLS});
  const needsModal=()=>window.Modal.open({title:'Needs Contact',rows:needs,cols:NEEDS_COLS,rowUrlFn:r=>r.hubspot_url||r.company_url});
  const rankAModal=()=>window.Modal.open({title:'Rank A Coverage',rows:rankA,cols:RANK_COLS});
  const rankBModal=()=>window.Modal.open({title:'Rank B Coverage',rows:rankB,cols:RANK_COLS});
  const pipeModal=()=>window.Modal.open({title:'Open Pipeline',rows:pipe,cols:PIPE_COLS,rowUrlFn:r=>r.hubspot_url});
  const stuckModal=()=>window.Modal.open({title:'Stuck Deals',rows:stuck,cols:STUCK_COLS,rowUrlFn:r=>r.hubspot_url});
  const kpiModal=()=>kpi&&window.Modal.open({title:'Activity KPIs',rows:kpi,cols:KPI_COLS});

  // Register modal helpers
  window._acq={repsModal,needsModal,rankAModal,rankBModal,pipeModal,stuckModal,kpiModal};

  const summaryCards=`<div class="summary-grid">
    ${sumCard('Total Companies',num(snap.total_companies),'HubSpot','var(--blue)')}
    ${sumCard('Contacted',num(snap.contacted_companies),pct(snap.contacted_pct||0)+' coverage','var(--green)','window._acq.rankAModal()')}
    ${sumCard('Needs Contact',num(snap.needs_contact_companies||needs.length),'No activity','var(--amber)','window._acq.needsModal()')}
    ${sumCard('Meetings Done',num(snap.completed_meetings),'Completed','var(--purple)','window._acq.repsModal()')}
    ${sumCard('Rank A',num(aTotal),aTouched+' touched','var(--red)','window._acq.rankAModal()')}
    ${sumCard('Rank A Untouched',num(aNoTouch),'Need contact','var(--red)','window._acq.rankAModal()')}
    ${sumCard('Rank B',num(bTotal),bTouched+' touched','var(--amber)','window._acq.rankBModal()')}
    ${sumCard('Open Pipeline',money(pipeVal),pipe.length+' deals','var(--cyan)','window._acq.pipeModal()')}
  </div>`;

  const focusStrip=`<div class="focus-strip">
    <div class="focus-top">
      <div><div class="focus-title">Today's Acquisition Focus</div>
        <div class="focus-sub">Team coverage, rank A/B reach, lead contact quality and pipeline health</div></div>
      <div class="focus-date">Live Snapshot<span class="focus-date-val">${new Date().toLocaleString('en-SA',{timeZone:'Asia/Riyadh'})}</span></div>
    </div>
    <div class="focus-grid">
      <div class="focus-pill" style="--fp-c:var(--amber)" onclick="window._acq.needsModal()">
        <div class="focus-pill-value">${num(snap.needs_contact_companies||needs.length)}</div>
        <div class="focus-pill-label">Needs Contact</div>
        <div class="focus-pill-sub">Companies, no activity</div>
      </div>
      <div class="focus-pill" style="--fp-c:var(--red)" onclick="window._acq.rankAModal()">
        <div class="focus-pill-value">${num(aNoTouch)}</div>
        <div class="focus-pill-label">Rank A Untouched</div>
        <div class="focus-pill-sub">${num(aTotal)} total Rank A</div>
      </div>
      <div class="focus-pill" style="--fp-c:var(--red)" onclick="window._acq.stuckModal()">
        <div class="focus-pill-value">${num(stuck.length)}</div>
        <div class="focus-pill-label">Stuck Deals</div>
        <div class="focus-pill-sub">Need attention</div>
      </div>
      <div class="focus-pill" style="--fp-c:var(--green)" onclick="window._acq.repsModal()">
        <div class="focus-pill-value">${pct(snap.contacted_pct||0)}</div>
        <div class="focus-pill-label">Contact Rate</div>
        <div class="focus-pill-sub">${num(snap.contacted_companies)} contacted</div>
      </div>
    </div>
    <div class="command-health-grid">
      <div class="command-card">
        <div class="command-card-top"><div class="command-card-title">Revenue Health</div><span class="command-card-accent" style="background:var(--green)"></span></div>
        <div class="command-main-value" style="color:var(--green)">${money(pipeVal)}</div>
        <div class="command-main-label">Open Pipeline</div>
        <div class="command-sub-row">
          <div><div class="command-mini-v" style="color:var(--green)">${num(pipe.filter(r=>r.deal_status==='Won'||/won/i.test(r.dealstage)).length)}</div><div class="command-mini-l">Won Deals</div></div>
          <div><div class="command-mini-v" style="color:var(--red)">${num(stuck.length)}</div><div class="command-mini-l">Stuck</div></div>
        </div>
      </div>
      <div class="command-card">
        <div class="command-card-top"><div class="command-card-title">Outreach Health</div><span class="command-card-accent" style="background:var(--cyan)"></span></div>
        <div class="command-main-value" style="color:var(--cyan)">${pct(snap.contacted_pct||0)}</div>
        <div class="command-main-label">Contact Rate</div>
        <div class="command-bar"><div class="command-bar-fill" style="background:var(--cyan);width:${Math.min(100,Number(snap.contacted_pct||0))}%"></div></div>
        <div class="command-sub-row">
          <div><div class="command-mini-v" style="color:var(--green)">${num(snap.contacted_companies)}</div><div class="command-mini-l">Contacted</div></div>
          <div><div class="command-mini-v" style="color:var(--red)">${num(snap.needs_contact_companies||needs.length)}</div><div class="command-mini-l">Not Contacted</div></div>
        </div>
      </div>
      <div class="command-card">
        <div class="command-card-top"><div class="command-card-title">Rep Execution</div><span class="command-card-accent" style="background:var(--blue)"></span></div>
        <div class="command-main-value" style="color:var(--blue)" onclick="window._acq.kpiModal()" style="cursor:pointer">${num(snap.calls_logged)}</div>
        <div class="command-main-label">Calls Logged</div>
        <div class="command-sub-row">
          <div><div class="command-mini-v" style="color:var(--green)">${num(snap.connected_calls)}</div><div class="command-mini-l">Connected</div></div>
          <div><div class="command-mini-v" style="color:var(--purple)">${num(snap.completed_meetings)}</div><div class="command-mini-l">Meetings Done</div></div>
        </div>
      </div>
    </div>
    <div class="focus-row"><span>▶</span> <span id="focusText">Fetching focus insight…</span></div>
  </div>`;

  // KPI table
  let kpiSection='';
  if(kpi){
    kpiSection=`<div class="manager-section-label">Activity KPIs — Yesterday · MTD · YTD</div>
    ${card('<div class="card-title-icon" style="background:var(--blue-bg)">📊</div> Activity KPI Snapshot',
      `<button class="badge bb" onclick="window._acq.kpiModal()">Open All</button>`,
      table(kpi,KPI_COLS,10))}`;
  } else {
    kpiSection=unavailable('vw_acquisition_kpi_snapshot_periods',kpiR.reason?.message||'');
  }

  // Rank A/B coverage
  const rankSection=`<div class="manager-section-label">Rank A/B Coverage</div>
  <div class="two-col">
    ${card(`<div class="card-title-icon" style="background:var(--red-bg)">🎯</div> Rank A Coverage`,
      `<span class="rank-a">${num(aTotal)} total</span>`,
      `<div class="acq-rank-grid">
        <div class="acq-rank-box" onclick="window._acq.rankAModal()"><div class="acq-rank-v" style="color:var(--green)">${num(aTouched)}</div><div class="acq-rank-l">Touched</div></div>
        <div class="acq-rank-box" onclick="window._acq.rankAModal()"><div class="acq-rank-v" style="color:var(--red)">${num(aNoTouch)}</div><div class="acq-rank-l">Untouched</div></div>
        <div class="acq-rank-box" onclick="window._acq.rankAModal()"><div class="acq-rank-v" style="color:var(--purple)">${num(rankA.reduce((s,r)=>s+Number(r.completed_meetings||0),0))}</div><div class="acq-rank-l">Meetings</div></div>
        <div class="acq-rank-box" onclick="window._acq.rankAModal()"><div class="acq-rank-v" style="color:var(--cyan)">${num(rankA.reduce((s,r)=>s+Number(r.connected_calls||0),0))}</div><div class="acq-rank-l">Connected</div></div>
        <div class="acq-rank-box" onclick="window._acq.rankAModal()"><div class="acq-rank-v" style="color:var(--blue)">${aTotal>0?pct((aTouched/aTotal)*100):'—'}</div><div class="acq-rank-l">Coverage</div></div>
        <div class="acq-rank-box" onclick="window._acq.rankAModal()"><div class="acq-rank-v" style="color:var(--text2)">${[...new Set(rankA.map(r=>r.country))].length}</div><div class="acq-rank-l">Countries</div></div>
      </div>
      ${table(rankA,RANK_COLS,5)}`)}
    ${card(`<div class="card-title-icon" style="background:var(--amber-bg)">🎯</div> Rank B Coverage`,
      `<span class="rank-b">${num(bTotal)} total</span>`,
      `<div class="acq-rank-grid">
        <div class="acq-rank-box" onclick="window._acq.rankBModal()"><div class="acq-rank-v" style="color:var(--green)">${num(bTouched)}</div><div class="acq-rank-l">Touched</div></div>
        <div class="acq-rank-box" onclick="window._acq.rankBModal()"><div class="acq-rank-v" style="color:var(--amber)">${num(bNoTouch)}</div><div class="acq-rank-l">Untouched</div></div>
        <div class="acq-rank-box" onclick="window._acq.rankBModal()"><div class="acq-rank-v" style="color:var(--purple)">${num(rankB.reduce((s,r)=>s+Number(r.completed_meetings||0),0))}</div><div class="acq-rank-l">Meetings</div></div>
        <div class="acq-rank-box" onclick="window._acq.rankBModal()"><div class="acq-rank-v" style="color:var(--cyan)">${num(rankB.reduce((s,r)=>s+Number(r.connected_calls||0),0))}</div><div class="acq-rank-l">Connected</div></div>
        <div class="acq-rank-box" onclick="window._acq.rankBModal()"><div class="acq-rank-v" style="color:var(--blue)">${bTotal>0?pct((bTouched/bTotal)*100):'—'}</div><div class="acq-rank-l">Coverage</div></div>
        <div class="acq-rank-box" onclick="window._acq.rankBModal()"><div class="acq-rank-v" style="color:var(--text2)">${[...new Set(rankB.map(r=>r.country))].length}</div><div class="acq-rank-l">Countries</div></div>
      </div>
      ${table(rankB,RANK_COLS,5)}`)}
  </div>`;

  // Needs Contact
  const needsSection=`<div class="manager-section-label">Needs Contact</div>
  ${card(`<div class="card-title-icon" style="background:var(--amber-bg)">📋</div> Companies Needing Contact`,
    `<button class="badge ba" onclick="window._acq.needsModal()">Open All ${needs.length}</button>`,
    table(needs,NEEDS_COLS,8,r=>r.hubspot_url||r.company_url))}`;

  // Pipeline
  const pipeSection=`<div class="manager-section-label">Pipeline</div>
  <div class="two-col">
    ${card(`<div class="card-title-icon" style="background:var(--green-bg)">💼</div> Open Pipeline`,
      `<button class="badge bg" onclick="window._acq.pipeModal()">Open All ${pipe.length}</button>`,
      table(pipe,PIPE_COLS,6,r=>r.hubspot_url))}
    ${card(`<div class="card-title-icon" style="background:var(--red-bg)">⚠️</div> Stuck Deals`,
      `<button class="badge br" onclick="window._acq.stuckModal()">Open All ${stuck.length}</button>`,
      table(stuck,STUCK_COLS,6,r=>r.hubspot_url))}
  </div>`;

  // Rep performance
  const repSection=`<div class="manager-section-label">Rep Performance</div>
  ${card(`<div class="card-title-icon" style="background:var(--blue-bg)">👥</div> Rep Performance`,
    `<button class="badge bb" onclick="window._acq.repsModal()">Open All</button>`,
    table(reps,REP_COLS,10))}`;

  setContent(focusStrip+summaryCards+kpiSection+rankSection+needsSection+pipeSection+repSection);

  // Focus text
  const fEl=document.getElementById('focusText');
  if(fEl){
    const un=Number(snap.needs_contact_companies||needs.length);
    const st=stuck.length;
    if(un>100) fEl.innerHTML=`<strong>Lead Outreach</strong> — ${num(un)} companies still need contact.`;
    else if(aNoTouch>20) fEl.innerHTML=`<strong>Account Coverage</strong> — ${num(aNoTouch)} Rank A accounts untouched.`;
    else if(st>5) fEl.innerHTML=`<strong>Pipeline Hygiene</strong> — ${st} stuck deals need attention.`;
    else fEl.innerHTML=`<strong>On Track</strong> — no critical gaps detected.`;
  }
}

window.AcquisitionModule={render};
})();
