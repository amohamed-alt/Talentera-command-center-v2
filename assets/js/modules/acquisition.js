(function(){
'use strict';

const {esc,money,num,pct,date,relDate,hsLink,setTitle,setContent,showLoading,unavailable}=window.U;
const {card,table}=window.Components;
const {get}=window.State;

function n(v){return Number(v||0);}
function rows(r){return r.status==='fulfilled'&&Array.isArray(r.value)?r.value:[];}
function one(r){return rows(r)[0]||{};}
function sum(arr,key){return arr.reduce((a,b)=>a+n(b[key]),0);}
function ownerKey(v){return String(v||'Unassigned').trim()||'Unassigned';}
function ownerRows(arr,owner){return arr.filter(r=>ownerKey(r.owner_name)===ownerKey(owner));}
function unique(arr,key){return [...new Set(arr.map(r=>r[key]).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b)));}
function rate(total,part){return total?Math.round((part/total)*1000)/10:0;}
function sourceLabel(v){return String(v||'other').replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());}

const LEAD_COLS=[
  {label:'Contact',key:'contact_name',render:r=>r.hubspot_url?`<a class="record-link" href="${esc(r.hubspot_url)}" target="_blank" rel="noopener">${esc(r.contact_name||r.email||r.contact_id)}</a>`:esc(r.contact_name||r.email||r.contact_id)},
  {label:'Company',key:'company_name',render:r=>esc(r.company_name||'—')},
  {label:'Owner',key:'owner_name',render:r=>esc(r.owner_name||'Unassigned')},
  {label:'Source',key:'source_bucket',center:true,render:r=>`<span class="badge ${r.source_bucket==='online'?'bb':r.source_bucket==='offline'?'ba':'bp'}">${esc(sourceLabel(r.source_bucket))}</span>`},
  {label:'Status',key:'lead_status',center:true,render:r=>esc(r.lead_status||'—')},
  {label:'Created',key:'createdate',center:true,render:r=>date(r.createdate)},
  {label:'Days',key:'days_since_created',center:true,render:r=>num(r.days_since_created)},
  {label:'Calls',key:'connected_calls',center:true,render:r=>num(r.connected_calls)},
  {label:'Meetings',key:'completed_meetings',center:true,render:r=>num(r.completed_meetings)},
  {label:'Open',key:'hubspot_url',center:true,render:r=>hsLink(r.hubspot_url)},
];

const COMPANY_COLS=[
  {label:'Company',key:'company_name',render:r=>r.company_url?`<a class="record-link" href="${esc(r.company_url)}" target="_blank" rel="noopener">${esc(r.company_name)}</a>`:esc(r.company_name)},
  {label:'Owner',key:'owner_name'},
  {label:'Country',key:'country'},
  {label:'Rank',key:'rank',center:true,render:r=>`<span class="${String(r.rank).toUpperCase()==='A'?'rank-a':'rank-b'}">${esc(r.rank||'—')}</span>`},
  {label:'Calls',key:'calls_logged',center:true,render:r=>num(r.calls_logged)},
  {label:'Meetings',key:'completed_meetings',center:true,render:r=>num(r.completed_meetings)},
  {label:'Last Touch',key:'last_touch_at',center:true,render:r=>relDate(r.last_touch_at)},
  {label:'Days',key:'days_since_created',center:true,render:r=>num(r.days_since_created)},
  {label:'Open',key:'hubspot_url',center:true,render:r=>hsLink(r.hubspot_url||r.company_url)},
];

const RANK_COLS=[
  {label:'Rank',key:'rank_group'},
  {label:'Country',key:'country'},
  {label:'Owner',key:'owner_name'},
  {label:'Companies',key:'companies',center:true,render:r=>num(r.companies)},
  {label:'Touched',key:'touched_companies',center:true,render:r=>num(r.touched_companies)},
  {label:'Untouched',key:'no_touch_companies',center:true,render:r=>`<strong style="color:${n(r.no_touch_companies)>0?'var(--red)':'var(--green)'}">${num(r.no_touch_companies)}</strong>`},
  {label:'Touch Rate',key:'touch_rate_pct',center:true,render:r=>pct(r.touch_rate_pct||0)},
  {label:'Connected Calls',key:'connected_calls',center:true,render:r=>num(r.connected_calls)},
  {label:'Completed Meetings',key:'completed_meetings',center:true,render:r=>num(r.completed_meetings)},
];

const PIPE_COLS=[
  {label:'Deal',key:'dealname',render:r=>r.hubspot_url?`<a class="record-link" href="${esc(r.hubspot_url)}" target="_blank" rel="noopener">${esc(r.dealname)}</a>`:esc(r.dealname)},
  {label:'Company',key:'company_name'},
  {label:'Owner',key:'owner_name'},
  {label:'Stage',key:'dealstage'},
  {label:'Product',key:'product'},
  {label:'Amount',key:'amount',center:true,render:r=>money(r.amount)},
  {label:'Days Stage',key:'days_in_stage',center:true,render:r=>num(r.days_in_stage)},
  {label:'Next Activity',key:'next_activity_date',center:true,render:r=>relDate(r.next_activity_date)},
  {label:'Open',key:'hubspot_url',center:true,render:r=>hsLink(r.hubspot_url)},
];

const RISK_COLS=[
  {label:'Deal',key:'dealname',render:r=>r.hubspot_url?`<a class="record-link" href="${esc(r.hubspot_url)}" target="_blank" rel="noopener">${esc(r.dealname)}</a>`:esc(r.dealname)},
  {label:'Owner',key:'owner_name'},
  {label:'Stage',key:'dealstage'},
  {label:'Risk',key:'risk_reason',render:r=>`<span class="badge br">${esc(r.risk_reason||'At Risk')}</span>`},
  {label:'Days',key:'days_in_stage',center:true,render:r=>`<strong style="color:${n(r.days_in_stage)>=21?'var(--red)':'var(--amber)'}">${num(r.days_in_stage)}</strong>`},
  {label:'Amount',key:'amount',center:true,render:r=>money(r.amount)},
  {label:'Next Activity',key:'next_activity_date',center:true,render:r=>relDate(r.next_activity_date)},
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
  {label:'Owner',key:'owner_name',render:r=>`<button class="badge bb" type="button" data-acq-rep="${esc(r.owner_name)}">${esc(r.owner_name)}</button>`},
  {label:'Calls',key:'calls_logged',center:true,render:r=>num(r.calls_logged)},
  {label:'Connected',key:'connected_calls',center:true,render:r=>num(r.connected_calls)},
  {label:'Meetings',key:'meetings_logged',center:true,render:r=>num(r.meetings_logged)},
  {label:'Completed',key:'meetings_completed',center:true,render:r=>num(r.meetings_completed)},
  {label:'Last Activity',key:'last_activity_at',center:true,render:r=>relDate(r.last_activity_at)},
];

const SOURCE_COLS=[
  {label:'Source Bucket',key:'source_bucket',render:r=>sourceLabel(r.source_bucket)},
  {label:'Analytics Source',key:'analytics_source',render:r=>esc(r.analytics_source||'Unknown')},
  {label:'Total Contacts',key:'total_contacts',center:true,render:r=>num(r.total_contacts)},
  {label:'Eligible Leads',key:'eligible_leads',center:true,render:r=>num(r.eligible_leads)},
  {label:'Contacted Leads',key:'contacted_leads',center:true,render:r=>num(r.contacted_leads)},
  {label:'Need Contact',key:'needs_contact',center:true,render:r=>`<strong style="color:${n(r.needs_contact)>0?'var(--red)':'var(--green)'}">${num(r.needs_contact)}</strong>`},
  {label:'Connected Calls',key:'connected_calls',center:true,render:r=>num(r.connected_calls)},
  {label:'Meetings',key:'completed_meetings',center:true,render:r=>num(r.completed_meetings)},
  {label:'Contact Rate',key:'contact_rate_pct',center:true,render:r=>pct(r.contact_rate_pct||0)},
];

const ACTION_COLS=[
  {label:'#',key:'priority',center:true},
  {label:'Action',key:'title',render:r=>`<strong>${esc(r.title)}</strong><div style="font-size:10px;color:var(--muted);margin-top:3px">${esc(r.reason||'')}</div>`},
  {label:'Owner',key:'owner_name'},
  {label:'Count',key:'count',center:true,render:r=>num(r.count)},
  {label:'Value',key:'value',center:true,render:r=>money(r.value)},
  {label:'Status',key:'status',center:true,render:r=>`<span class="badge ${r.status==='Critical'?'br':r.status==='High'?'ba':'bb'}">${esc(r.status)}</span>`},
];

const COACH_COLS=[
  {label:'Owner',key:'owner_name'},
  {label:'Signal',key:'signal'},
  {label:'Recommendation',key:'recommendation'},
  {label:'Impact',key:'impact',center:true,render:r=>`<span class="badge ${r.impact==='High'?'br':r.impact==='Medium'?'ba':'bb'}">${esc(r.impact)}</span>`},
];

function metric(label,value,sub,color,key){
  return `<button class="sum-card" type="button" data-acq-modal="${esc(key||'')}" style="text-align:left;cursor:${key?'pointer':'default'}">
    <div class="sum-card-accent" style="background:${color||'var(--blue)'}"></div>
    <div class="sum-val" style="color:${color||'var(--blue)'}">${value}</div>
    <div class="sum-lbl">${esc(label)}</div>
    ${sub?`<div class="sum-sub">${esc(sub)}</div>`:''}
  </button>`;
}

function section(label,sub){
  return `<div class="manager-section-label" style="display:flex;justify-content:space-between;align-items:end;gap:12px">
    <span>${esc(label)}</span>${sub?`<span style="font-size:11px;color:var(--muted);font-weight:600;text-transform:none;letter-spacing:0">${esc(sub)}</span>`:''}
  </div>`;
}

function health(title,value,label,mini,color,key){
  return `<div class="command-card" ${key?`data-acq-modal="${esc(key)}"`:''} style="cursor:${key?'pointer':'default'}">
    <div class="command-card-top"><div class="command-card-title">${esc(title)}</div><span class="command-card-accent" style="background:${color}"></span></div>
    <div class="command-main-value" style="color:${color}">${value}</div>
    <div class="command-main-label">${esc(label)}</div>
    <div class="command-sub-row">${mini.map(x=>`<div><div class="command-mini-v" style="color:${x.color||color}">${x.value}</div><div class="command-mini-l">${esc(x.label)}</div></div>`).join('')}</div>
  </div>`;
}

function riskRows(pipe,stuck){
  const map=new Map();
  stuck.forEach(r=>map.set(String(r.deal_id||r.hubspot_url||r.dealname),{...r,risk_reason:'Stuck 21+ days'}));
  pipe.forEach(r=>{
    const key=String(r.deal_id||r.hubspot_url||r.dealname);
    if(!r.next_activity_date&&!map.has(key)) map.set(key,{...r,risk_reason:'No next activity'});
  });
  return [...map.values()].sort((a,b)=>n(b.amount)-n(a.amount));
}

function groupByOwner(arr,valueKey='amount'){
  const map=new Map();
  arr.forEach(r=>{
    const key=ownerKey(r.owner_name);
    if(!map.has(key)) map.set(key,{owner_name:key,items:0,value:0});
    const o=map.get(key);o.items++;o.value+=n(r[valueKey]);
  });
  return [...map.values()].sort((a,b)=>b.items-a.items);
}

function buildActions(d){
  const actions=[];
  const rankA=d.rank.filter(r=>String(r.rank_group).toUpperCase()==='A');
  const rankB=d.rank.filter(r=>String(r.rank_group).toUpperCase()==='B');
  const rankAUntouched=sum(rankA,'no_touch_companies');
  const rankBUntouched=sum(rankB,'no_touch_companies');
  const noNext=d.pipe.filter(r=>!r.next_activity_date);
  const lowRep=d.reps.filter(r=>n(r.calls_logged)>0).sort((a,b)=>rate(n(a.calls_logged),n(a.connected_calls))-rate(n(b.calls_logged),n(b.connected_calls)))[0];
  if(d.priorityLeads.length) actions.push({priority:1,title:'Contact lead backlog',reason:'Eligible contacts/leads with no connected call and no completed meeting.',owner_name:'Sales Team',count:d.priorityLeads.length,value:0,status:'Critical'});
  if(d.leadSummary.online_need_contact) actions.push({priority:2,title:'Work online leads first',reason:'Online/inbound contacts need faster SLA handling.',owner_name:'Sales Team',count:d.leadSummary.online_need_contact,value:0,status:'High'});
  if(rankAUntouched) actions.push({priority:3,title:'Recover Rank A untouched companies',reason:'Rank A company coverage is separate from lead contact backlog.',owner_name:'Sales Team',count:rankAUntouched,value:0,status:'Critical'});
  if(d.risk.length) actions.push({priority:4,title:'Fix deals at risk',reason:'Open deals are stuck 21+ days or missing next activity.',owner_name:'Pipeline Owners',count:d.risk.length,value:sum(d.risk,'amount'),status:'High'});
  if(noNext.length) actions.push({priority:5,title:'Schedule next activities',reason:'No open deal should be left without a next step.',owner_name:'Pipeline Owners',count:noNext.length,value:sum(noNext,'amount'),status:'High'});
  if(lowRep) actions.push({priority:6,title:'Coach lowest connection-rate rep',reason:`${lowRep.owner_name} connection rate is ${pct(rate(n(lowRep.calls_logged),n(lowRep.connected_calls)))}.`,owner_name:lowRep.owner_name,count:n(lowRep.calls_logged),value:0,status:'Watch'});
  if(rankBUntouched) actions.push({priority:7,title:'Clean Rank B untouched companies',reason:'Rank B coverage can become tomorrow’s pipeline.',owner_name:'Sales Team',count:rankBUntouched,value:0,status:'Watch'});
  return actions;
}

function buildCoaching(d){
  const out=[];
  d.reps.slice(0,14).forEach(r=>{
    const owner=ownerKey(r.owner_name);
    const leadNeed=ownerRows(d.priorityLeads,owner).length;
    const onlineNeed=ownerRows(d.priorityLeads,owner).filter(x=>x.source_bucket==='online').length;
    const companyNeed=ownerRows(d.companyNeeds,owner).length;
    const risk=ownerRows(d.risk,owner).length;
    const cr=rate(n(r.calls_logged),n(r.connected_calls));
    if(leadNeed>0) out.push({owner_name:owner,signal:`${leadNeed} contacts need contact`,recommendation:onlineNeed?`Start with ${onlineNeed} online leads, then offline backlog.`:'Start with oldest offline leads and log connected outcomes.',impact:leadNeed>100?'High':'Medium'});
    if(companyNeed>0) out.push({owner_name:owner,signal:`${companyNeed} Rank A/B companies untouched`,recommendation:'Run company coverage block separate from contact/lead SLA.',impact:companyNeed>20?'High':'Medium'});
    if(risk>0) out.push({owner_name:owner,signal:`${risk} deals at risk`,recommendation:'Add next activities and update stage movement today.',impact:'High'});
    if(n(r.calls_logged)>20&&cr<25) out.push({owner_name:owner,signal:`Low connection rate ${pct(cr)}`,recommendation:'Improve call timing and prioritize fresh lead sources.',impact:'Medium'});
  });
  if(!out.length) out.push({owner_name:'Team',signal:'No critical coaching signal',recommendation:'Keep lead SLA, company coverage, and next activities updated.',impact:'Low'});
  return out.slice(0,16);
}

function renderCoverage(d,country){
  const rank=d.rank.filter(r=>country==='All'||r.country===country);
  const a=rank.filter(r=>String(r.rank_group).toUpperCase()==='A');
  const b=rank.filter(r=>String(r.rank_group).toUpperCase()==='B');
  const cards=`<div class="summary-grid" style="grid-template-columns:repeat(6,1fr);margin-bottom:12px">
    ${metric('Companies',num(sum(rank,'companies')),country,'var(--blue)','rank')}
    ${metric('Touched Companies',num(sum(rank,'touched_companies')),pct(rate(sum(rank,'companies'),sum(rank,'touched_companies'))),'var(--green)','rank')}
    ${metric('Untouched Companies',num(sum(rank,'no_touch_companies')),'Company coverage only','var(--red)','companyNeeds')}
    ${metric('Rank A Untouched',num(sum(a,'no_touch_companies')),'Highest priority','var(--red)','rankA')}
    ${metric('Rank B Untouched',num(sum(b,'no_touch_companies')),'Second priority','var(--amber)','rankB')}
    ${metric('Meetings Associated',num(sum(rank,'completed_meetings')),'Company-level','var(--purple)','rank')}
  </div>`;
  const el=document.getElementById('coverageBlock');
  if(el) el.innerHTML=cards+table(rank,RANK_COLS,12);
}

function periodCards(kpi){
  return `<div class="ret-period-grid">${kpi.map(p=>`<div class="ret-period-card">
    <div class="ret-period-label">${esc(p.period)}</div>
    <div class="ret-period-row"><div class="ret-period-key">Calls</div><div class="ret-period-val">${num(p.calls_logged)}</div></div>
    <div class="ret-period-row"><div class="ret-period-key">Connected</div><div class="ret-period-val">${num(p.connected_calls)}</div></div>
    <div class="ret-period-row"><div class="ret-period-key">Meetings</div><div class="ret-period-val">${num(p.meetings_completed)}</div></div>
    <div class="ret-period-row"><div class="ret-period-key">Conn Rate</div><div class="ret-period-val">${pct(p.connection_rate||0)}</div></div>
  </div>`).join('')}</div>`;
}

function sourceRollup(sourceRows){
  const byBucket=new Map();
  sourceRows.forEach(r=>{
    const k=r.source_bucket||'other';
    if(!byBucket.has(k)) byBucket.set(k,{source_bucket:k,analytics_source:'All '+sourceLabel(k),total_contacts:0,eligible_leads:0,contacted_leads:0,needs_contact:0,connected_calls:0,completed_meetings:0,contact_rate_pct:0});
    const x=byBucket.get(k);
    ['total_contacts','eligible_leads','contacted_leads','needs_contact','connected_calls','completed_meetings'].forEach(key=>x[key]+=n(r[key]));
  });
  return [...byBucket.values()].map(r=>({...r,contact_rate_pct:rate(r.eligible_leads,r.contacted_leads)})).sort((a,b)=>b.eligible_leads-a.eligible_leads);
}

function renderMain(d){
  setTitle('Acquisition · Command Center','Contacts, companies and deals are separated — Supabase only');
  const rankA=d.rank.filter(r=>String(r.rank_group).toUpperCase()==='A');
  const rankB=d.rank.filter(r=>String(r.rank_group).toUpperCase()==='B');
  const pipeValue=sum(d.pipe,'amount');
  const riskValue=sum(d.risk,'amount');
  const countries=['All',...unique(d.rank,'country')];
  const ownerPipe=groupByOwner(d.pipe);
  const ownerRisk=groupByOwner(d.risk);
  const sourceBucketRows=sourceRollup(d.sourcePerf);
  const repGrid=d.reps.slice(0,12).map(r=>`<button class="pcard" type="button" data-acq-rep="${esc(r.owner_name)}" style="text-align:left;cursor:pointer">
    <div class="pcard-top"><strong>${esc(r.owner_name)}</strong><span class="badge bb">Open</span></div>
    <div class="pcard-body"><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center">
      <div><div class="sum-val" style="font-size:16px;color:var(--blue)">${num(r.calls_logged)}</div><div class="sum-lbl">Calls</div></div>
      <div><div class="sum-val" style="font-size:16px;color:var(--green)">${num(r.connected_calls)}</div><div class="sum-lbl">Connected</div></div>
      <div><div class="sum-val" style="font-size:16px;color:var(--purple)">${num(r.meetings_completed)}</div><div class="sum-lbl">Meetings</div></div>
    </div><div class="sum-sub" style="margin-top:8px">Last activity: ${relDate(r.last_activity_at)}</div></div>
  </button>`).join('');
  const OWNER_PIPE_COLS=[
    {label:'Owner',key:'owner_name'},
    {label:'Open Deals',key:'items',center:true,render:r=>num(r.items)},
    {label:'Pipeline Value',key:'value',center:true,render:r=>money(r.value)},
  ];

  const html=`
    ${section('Today’s Acquisition Focus','Lead metrics now come from contacts; Rank A/B metrics come from companies')}
    <div class="summary-grid">
      ${metric('Leads Need Contact',num(d.leadSummary.leads_need_contact),`${num(d.leadSummary.online_need_contact)} online · ${num(d.leadSummary.offline_need_contact)} offline`,'var(--amber)','leads')}
      ${metric('Rank A Untouched',num(sum(rankA,'no_touch_companies')),'Companies only','var(--red)','rankA')}
      ${metric('Rank B Untouched',num(sum(rankB,'no_touch_companies')),'Companies only','var(--amber)','rankB')}
      ${metric('Deals at Risk',num(d.risk.length),money(riskValue)+' exposed','var(--red)','risk')}
      ${metric('Lead Contact Rate',pct(d.leadSummary.lead_contact_rate_pct||0),`${num(d.leadSummary.contacted_leads)} / ${num(d.leadSummary.eligible_leads)} leads`,'var(--green)','source')}
      ${metric('Company Contact Rate',pct(d.companySnap.contacted_pct||0),`${num(d.companySnap.contacted_companies)} / ${num(d.companySnap.total_companies)} companies`,'var(--cyan)','rank')}
      ${metric('Open Pipeline',money(pipeValue),num(d.pipe.length)+' open deals','var(--blue)','pipe')}
      ${metric('Meetings Done',num(d.companySnap.completed_meetings),'Company associated','var(--purple)','kpi')}
    </div>

    <div class="command-health-grid" style="margin-top:14px">
      ${health('Revenue Health',money(pipeValue),'Open Pipeline',[{label:'At Risk',value:money(riskValue),color:'var(--red)'},{label:'Open Deals',value:num(d.pipe.length),color:'var(--cyan)'}],'var(--green)','pipe')}
      ${health('Outreach Health',pct(d.leadSummary.lead_contact_rate_pct||0),'Lead Contact Rate',[{label:'Need Contact',value:num(d.leadSummary.leads_need_contact),color:'var(--red)'},{label:'Online SLA',value:num(d.leadSummary.online_need_contact),color:'var(--blue)'}],'var(--cyan)','leads')}
      ${health('Rep Execution',num(d.companySnap.calls_logged),'Calls Logged',[{label:'Connected',value:num(d.companySnap.connected_calls),color:'var(--green)'},{label:'Meetings',value:num(d.companySnap.completed_meetings),color:'var(--purple)'}],'var(--blue)','reps')}
    </div>

    ${section('Priority Actions','Contacts/leads, company coverage and deal risk are separate actions')}
    ${card('<div class="card-title-icon" style="background:var(--red-bg)">⚡</div> Priority Actions',`${d.actions.length} actions`,table(d.actions,ACTION_COLS,8))}

    ${section('Yesterday Performance + Detailed KPI Cards','Rep activity + team periods')}
    <div class="two-col">
      ${card('<div class="card-title-icon" style="background:var(--blue-bg)">👥</div> Rep Execution',`${d.reps.length} reps`,table(d.reps,REP_COLS,12))}
      ${card('<div class="card-title-icon" style="background:var(--green-bg)">📊</div> Detailed KPI Cards','Yesterday · MTD · YTD',periodCards(d.kpi))}
    </div>

    ${section('Priority Leads & SLA Breaches','Real contacts/leads, not companies')}
    <div class="two-col">
      ${card('<div class="card-title-icon" style="background:var(--cyan-bg)">🌐</div> Online Leads Need Contact',`${d.onlineLeads.length} contacts`,table(d.onlineLeads,LEAD_COLS,8,r=>r.hubspot_url))}
      ${card('<div class="card-title-icon" style="background:var(--amber-bg)">📞</div> Offline Leads Need Contact',`${d.offlineLeads.length} contacts`,table(d.offlineLeads,LEAD_COLS,8,r=>r.hubspot_url))}
    </div>

    ${section('Lead Funnel & Source Performance','Contact source performance from hubspot_contacts')}
    <div class="two-col">
      ${card('<div class="card-title-icon" style="background:var(--purple-bg)">🧭</div> Lead Source Buckets','Online / Offline',table(sourceBucketRows,SOURCE_COLS,10))}
      ${card('<div class="card-title-icon" style="background:var(--blue-bg)">🔎</div> Source Details',`${d.sourcePerf.length} sources`,table(d.sourcePerf,SOURCE_COLS,12))}
    </div>

    ${section('Rank A/B Company Coverage','Company coverage is separate from lead/contact SLA')}
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap">
      <select class="pnl-select" id="acqCountryFilter">${countries.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select>
      <button class="badge bb" type="button" data-acq-modal="rank">Open All Coverage</button>
      <button class="badge ba" type="button" data-acq-modal="companyNeeds">Open Untouched Companies</button>
    </div>
    <div id="coverageBlock"></div>

    ${section('Acquisition Pipeline','Open pipeline, by rep and risk')}
    <div class="two-col">
      ${card('<div class="card-title-icon" style="background:var(--cyan-bg)">💰</div> Open Pipeline by Rep',`${ownerPipe.length} owners`,table(ownerPipe,OWNER_PIPE_COLS,10))}
      ${card('<div class="card-title-icon" style="background:var(--red-bg)">🔥</div> Risk by Rep',`${ownerRisk.length} owners`,table(ownerRisk,OWNER_PIPE_COLS,10))}
    </div>
    ${card('<div class="card-title-icon" style="background:var(--green-bg)">📌</div> Open Pipeline Details',`${d.pipe.length} deals`,table(d.pipe,PIPE_COLS,12,r=>r.hubspot_url))}

    ${section('AI Coaching Insights','Rule-based from clean views')}
    ${card('<div class="card-title-icon" style="background:var(--purple-bg)">💡</div> AI Coaching',`${d.coach.length} signals`,table(d.coach,COACH_COLS,12))}

    ${section('Acquisition Rep Details','Click a rep to open a dedicated page')}
    <div class="pipe-cards-grid">${repGrid}</div>
  `;
  setContent(html);
  renderCoverage(d,'All');
  wire(d);
}

function renderRep(ownerName){
  const d=window._acqData;
  const owner=ownerKey(ownerName);
  const rep=d.reps.find(r=>ownerKey(r.owner_name)===owner)||{owner_name:owner};
  const leads=ownerRows(d.priorityLeads,owner);
  const online=leads.filter(r=>r.source_bucket==='online');
  const offline=leads.filter(r=>r.source_bucket==='offline');
  const companyNeeds=ownerRows(d.companyNeeds,owner);
  const pipe=ownerRows(d.pipe,owner);
  const risk=ownerRows(d.risk,owner);
  const rank=ownerRows(d.rank,owner);
  const rankA=rank.filter(r=>String(r.rank_group).toUpperCase()==='A');
  const rankB=rank.filter(r=>String(r.rank_group).toUpperCase()==='B');
  const coach=d.coach.filter(r=>ownerKey(r.owner_name)===owner);
  const source=d.sourcePerf.filter(r=>ownerRows(d.priorityLeads,owner).some(l=>l.source_bucket===r.source_bucket));
  const countries=unique(rank,'country');
  const countryRows=countries.map(c=>{
    const x=rank.filter(r=>r.country===c);
    return {country:c,companies:sum(x,'companies'),touched:sum(x,'touched_companies'),untouched:sum(x,'no_touch_companies'),meetings:sum(x,'completed_meetings'),calls:sum(x,'connected_calls'),touch_rate:rate(sum(x,'companies'),sum(x,'touched_companies'))};
  }).sort((a,b)=>b.untouched-a.untouched);
  const COUNTRY_COLS=[
    {label:'Country',key:'country'},
    {label:'Companies',key:'companies',center:true,render:r=>num(r.companies)},
    {label:'Touched',key:'touched',center:true,render:r=>num(r.touched)},
    {label:'Untouched',key:'untouched',center:true,render:r=>`<strong style="color:${r.untouched?'var(--red)':'var(--green)'}">${num(r.untouched)}</strong>`},
    {label:'Meetings',key:'meetings',center:true,render:r=>num(r.meetings)},
    {label:'Connected Calls',key:'calls',center:true,render:r=>num(r.calls)},
    {label:'Touch Rate',key:'touch_rate',center:true,render:r=>pct(r.touch_rate)},
  ];
  setTitle(`Acquisition · ${owner}`,'Dedicated rep detail page — leads, companies and deals are separated');
  const html=`
    <div style="margin-bottom:14px"><button class="badge bb" type="button" id="acqBackBtn">← Back to Acquisition Command Center</button></div>
    ${section(`${owner} — Rep Summary`,'No n8n fallback. Supabase-only data model')}
    <div class="summary-grid">
      ${metric('Calls Logged',num(rep.calls_logged),'Rep activity','var(--blue)','reps')}
      ${metric('Connected Calls',num(rep.connected_calls),pct(rate(n(rep.calls_logged),n(rep.connected_calls)))+' connection','var(--green)','reps')}
      ${metric('Meetings Done',num(rep.meetings_completed),'Completed meetings','var(--purple)','reps')}
      ${metric('Leads Need Contact',num(leads.length),`${num(online.length)} online · ${num(offline.length)} offline`,'var(--amber)','repLeads')}
      ${metric('Open Deals',num(pipe.length),money(sum(pipe,'amount')),'var(--cyan)','repPipe')}
      ${metric('Deals at Risk',num(risk.length),money(sum(risk,'amount')),'var(--red)','repRisk')}
      ${metric('Rank A Untouched',num(sum(rankA,'no_touch_companies')),'Company coverage','var(--red)','repRank')}
      ${metric('Rank B Untouched',num(sum(rankB,'no_touch_companies')),'Company coverage','var(--amber)','repRank')}
    </div>

    ${section('Needs to Contact — Online / Offline','Real contacts assigned to this rep')}
    <div class="two-col">
      ${card('<div class="card-title-icon" style="background:var(--cyan-bg)">🌐</div> Online Needs Contact',`${online.length} contacts`,table(online,LEAD_COLS,8,r=>r.hubspot_url))}
      ${card('<div class="card-title-icon" style="background:var(--amber-bg)">📞</div> Offline Needs Contact',`${offline.length} contacts`,table(offline,LEAD_COLS,8,r=>r.hubspot_url))}
    </div>

    ${section('AI Coaching + SLA Breaches','Rep-specific coaching')}
    <div class="two-col">
      ${card('<div class="card-title-icon" style="background:var(--purple-bg)">💡</div> AI Coaching',`${coach.length||1} signals`,table(coach.length?coach:[{owner_name:owner,signal:'No critical signal',recommendation:'Keep lead SLA and next activities updated.',impact:'Low'}],COACH_COLS,8))}
      ${card('<div class="card-title-icon" style="background:var(--red-bg)">🚨</div> Deals at Risk',`${risk.length} deals`,table(risk,RISK_COLS,8,r=>r.hubspot_url))}
    </div>

    ${section('Open Deals + Company Coverage','Deals and Rank A/B coverage are separate from contacts')}
    <div class="two-col">
      ${card('<div class="card-title-icon" style="background:var(--green-bg)">💰</div> Open Deals',`${pipe.length} deals`,table(pipe,PIPE_COLS,8,r=>r.hubspot_url))}
      ${card('<div class="card-title-icon" style="background:var(--blue-bg)">🌍</div> Country Coverage',`${countryRows.length} countries`,table(countryRows,COUNTRY_COLS,12))}
    </div>

    ${section('Rank A/B Company Details','Companies only')}
    ${card('<div class="card-title-icon" style="background:var(--amber-bg)">🏆</div> Rank A/B Coverage Details',`${rank.length} rows`,table(rank,RANK_COLS,12))}

    ${section('Lead Source Performance','Rep lead source signal')}
    ${card('<div class="card-title-icon" style="background:var(--cyan-bg)">🧭</div> Source Performance',`${source.length} sources`,table(source.length?source:sourceRollup(leads.map(l=>({source_bucket:l.source_bucket,analytics_source:l.analytics_source,total_contacts:1,eligible_leads:1,contacted_leads:0,needs_contact:1,connected_calls:l.connected_calls,completed_meetings:l.completed_meetings,contact_rate_pct:0}))),SOURCE_COLS,12))}
  `;
  setContent(html);
  document.getElementById('acqBackBtn')?.addEventListener('click',()=>renderMain(d));
  wire(d);
}

function openModal(key){
  const d=window._acqData;if(!d)return;
  const cfg={
    leads:{title:'Priority Leads Need Contact',rows:d.priorityLeads,cols:LEAD_COLS,url:r=>r.hubspot_url},
    online:{title:'Online Leads Need Contact',rows:d.onlineLeads,cols:LEAD_COLS,url:r=>r.hubspot_url},
    offline:{title:'Offline Leads Need Contact',rows:d.offlineLeads,cols:LEAD_COLS,url:r=>r.hubspot_url},
    companyNeeds:{title:'Rank A/B Untouched Companies',rows:d.companyNeeds,cols:COMPANY_COLS,url:r=>r.hubspot_url||r.company_url},
    rank:{title:'Rank A/B Company Coverage',rows:d.rank,cols:RANK_COLS},
    rankA:{title:'Rank A Company Coverage',rows:d.rank.filter(r=>String(r.rank_group).toUpperCase()==='A'),cols:RANK_COLS},
    rankB:{title:'Rank B Company Coverage',rows:d.rank.filter(r=>String(r.rank_group).toUpperCase()==='B'),cols:RANK_COLS},
    pipe:{title:'Open Pipeline',rows:d.pipe,cols:PIPE_COLS,url:r=>r.hubspot_url},
    risk:{title:'Deals at Risk',rows:d.risk,cols:RISK_COLS,url:r=>r.hubspot_url},
    kpi:{title:'Detailed KPIs',rows:d.kpi,cols:KPI_COLS},
    reps:{title:'Rep Execution',rows:d.reps,cols:REP_COLS},
    source:{title:'Lead Source Performance',rows:d.sourcePerf,cols:SOURCE_COLS},
    coach:{title:'AI Coaching',rows:d.coach,cols:COACH_COLS},
    repLeads:{title:'Rep Leads Need Contact',rows:[],cols:LEAD_COLS},
    repPipe:{title:'Rep Open Deals',rows:[],cols:PIPE_COLS},
    repRisk:{title:'Rep Deals at Risk',rows:[],cols:RISK_COLS},
    repRank:{title:'Rep Rank Coverage',rows:[],cols:RANK_COLS},
  }[key];
  if(cfg) window.Modal.open({title:cfg.title,rows:cfg.rows,cols:cfg.cols,rowUrlFn:cfg.url});
}

function wire(d){
  document.querySelectorAll('[data-acq-modal]').forEach(el=>{
    const key=el.getAttribute('data-acq-modal');
    if(key) el.addEventListener('click',()=>openModal(key));
  });
  document.querySelectorAll('[data-acq-rep]').forEach(el=>{
    el.addEventListener('click',ev=>{ev.preventDefault();renderRep(el.getAttribute('data-acq-rep'));});
  });
  const country=document.getElementById('acqCountryFilter');
  if(country) country.addEventListener('change',()=>renderCoverage(d,country.value));
}

async function render(){
  setTitle('Acquisition · Command Center','Loading clean Supabase views');
  showLoading('Loading Acquisition Command Center…');
  const [companySnapR,leadSnapR,priorityLeadsR,sourcePerfR,kpiR,repsR,rankR,companyNeedsR,pipeR,stuckR]=await Promise.allSettled([
    get('vw_dash_acq_team_fast',1),
    get('vw_acquisition_lead_summary',1),
    get('vw_acquisition_priority_leads',2500),
    get('vw_acquisition_lead_source_performance',100),
    get('vw_acquisition_kpi_snapshot_periods',10),
    get('vw_dash_acq_sidebar_fast',100),
    get('vw_dash_acq_rank_fast',2000),
    get('vw_dash_acq_needs_fast',2000),
    get('vw_acquisition_pipeline_details',1000),
    get('vw_acquisition_stuck_deals',500),
  ]);
  const d={
    companySnap:one(companySnapR),
    leadSummary:one(leadSnapR),
    priorityLeads:rows(priorityLeadsR),
    sourcePerf:rows(sourcePerfR),
    kpi:rows(kpiR),
    reps:rows(repsR),
    rank:rows(rankR),
    companyNeeds:rows(companyNeedsR),
    pipe:rows(pipeR),
    stuck:rows(stuckR),
  };
  d.onlineLeads=d.priorityLeads.filter(r=>r.source_bucket==='online');
  d.offlineLeads=d.priorityLeads.filter(r=>r.source_bucket==='offline');
  d.risk=riskRows(d.pipe,d.stuck);
  d.actions=buildActions(d);
  d.coach=buildCoaching(d);
  d.errors=[companySnapR,leadSnapR,priorityLeadsR,sourcePerfR,kpiR,repsR,rankR,companyNeedsR,pipeR,stuckR].filter(r=>r.status==='rejected').map(r=>r.reason?.message||String(r.reason));
  window._acqData=d;
  window._acqV2={openModal,openRep:renderRep,back:()=>renderMain(window._acqData)};
  renderMain(d);
  if(d.errors.length){
    document.getElementById('appContent')?.insertAdjacentHTML('afterbegin',unavailable('Some acquisition views',d.errors.join(' | ')));
  }
}

window.AcquisitionModule={render};
})();
