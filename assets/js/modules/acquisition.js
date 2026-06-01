(function(){
'use strict';

const {esc,money,num,pct,date,relDate,hsLink,setTitle,setContent,showLoading,unavailable}=window.U;
const {card,table}=window.Components;
const {get}=window.State;

const RANK_COLS=[
  {label:'Rank',key:'rank_group'},
  {label:'Country',key:'country'},
  {label:'Owner',key:'owner_name'},
  {label:'Companies',key:'companies',center:true,render:r=>num(r.companies)},
  {label:'Touched',key:'touched_companies',center:true,render:r=>num(r.touched_companies)},
  {label:'Untouched',key:'no_touch_companies',center:true,render:r=>`<strong style="color:${Number(r.no_touch_companies||0)>0?'var(--red)':'var(--green)'}">${num(r.no_touch_companies)}</strong>`},
  {label:'Touch Rate',key:'touch_rate_pct',center:true,render:r=>pct(r.touch_rate_pct||0)},
  {label:'Connected Calls',key:'connected_calls',center:true,render:r=>num(r.connected_calls)},
  {label:'Completed Meetings',key:'completed_meetings',center:true,render:r=>num(r.completed_meetings)},
];

const NEEDS_COLS=[
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
  {label:'Days',key:'days_in_stage',center:true,render:r=>`<strong style="color:${Number(r.days_in_stage||0)>=21?'var(--red)':'var(--amber)'}">${num(r.days_in_stage)}</strong>`},
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
  {label:'Owner',key:'owner_name',render:r=>`<button class="badge bb" data-acq-rep="${esc(r.owner_name)}">${esc(r.owner_name)}</button>`},
  {label:'Calls',key:'calls_logged',center:true,render:r=>num(r.calls_logged)},
  {label:'Connected',key:'connected_calls',center:true,render:r=>num(r.connected_calls)},
  {label:'Meetings',key:'meetings_logged',center:true,render:r=>num(r.meetings_logged)},
  {label:'Completed',key:'meetings_completed',center:true,render:r=>num(r.meetings_completed)},
  {label:'Last Activity',key:'last_activity_at',center:true,render:r=>relDate(r.last_activity_at)},
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

function rows(result){return result.status==='fulfilled'&&Array.isArray(result.value)?result.value:[];}
function one(result){return rows(result)[0]||{};}
function n(v){return Number(v||0);}
function sum(arr,key){return arr.reduce((s,r)=>s+n(r[key]),0);}
function unique(arr,key){return [...new Set(arr.map(r=>r[key]).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b)));}
function ownerKey(v){return String(v||'Unassigned').trim()||'Unassigned';}
function ownerRows(data,owner){return data.filter(r=>ownerKey(r.owner_name)===ownerKey(owner));}
function riskRows(pipe,stuck){
  const map=new Map();
  for(const r of stuck){map.set(String(r.deal_id||r.hubspot_url||r.dealname),{...r,risk_reason:'Stuck 21+ days'});}
  for(const r of pipe){
    const key=String(r.deal_id||r.hubspot_url||r.dealname);
    if(!r.next_activity_date&&!map.has(key)) map.set(key,{...r,risk_reason:'No next activity'});
  }
  return [...map.values()].sort((a,b)=>n(b.amount)-n(a.amount));
}
function connectionRate(calls,connected){return calls?Math.round((connected/calls)*1000)/10:0;}

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

function buildActions({snap,needs,rank,pipe,risk,reps}){
  const actions=[];
  const rankAUntouched=sum(rank.filter(r=>String(r.rank_group).toUpperCase()==='A'),'no_touch_companies');
  const rankBUntouched=sum(rank.filter(r=>String(r.rank_group).toUpperCase()==='B'),'no_touch_companies');
  const lowRep=reps.filter(r=>n(r.calls_logged)>0).sort((a,b)=>connectionRate(n(a.calls_logged),n(a.connected_calls))-connectionRate(n(b.calls_logged),n(b.connected_calls)))[0];
  const noNext=pipe.filter(r=>!r.next_activity_date);
  if(needs.length) actions.push({priority:1,title:'Contact untouched priority companies',reason:'Rank A/B companies with no connected call or completed meeting.',owner_name:'Team',count:needs.length,value:0,status:'Critical',_rows:needs,_cols:NEEDS_COLS});
  if(rankAUntouched) actions.push({priority:2,title:'Recover Rank A untouched coverage',reason:'Rank A accounts are still untouched and should be first calling block today.',owner_name:'Team',count:rankAUntouched,value:0,status:'Critical',_rows:rank.filter(r=>String(r.rank_group).toUpperCase()==='A'&&n(r.no_touch_companies)>0),_cols:RANK_COLS});
  if(risk.length) actions.push({priority:3,title:'Fix deals at risk',reason:'Open deals are stuck 21+ days or missing next activity.',owner_name:'Pipeline Owners',count:risk.length,value:sum(risk,'amount'),status:'High',_rows:risk,_cols:RISK_COLS});
  if(noNext.length) actions.push({priority:4,title:'Schedule next activities',reason:'Open deals without next activity create follow-up gaps.',owner_name:'Pipeline Owners',count:noNext.length,value:sum(noNext,'amount'),status:'High',_rows:noNext,_cols:PIPE_COLS});
  if(lowRep) actions.push({priority:5,title:'Coach lowest connection rate rep',reason:`${lowRep.owner_name} connection rate is ${pct(connectionRate(n(lowRep.calls_logged),n(lowRep.connected_calls)))}.`,owner_name:lowRep.owner_name,count:n(lowRep.calls_logged),value:0,status:'Watch',_rows:[lowRep],_cols:REP_COLS});
  if(rankBUntouched) actions.push({priority:6,title:'Clean Rank B untouched list',reason:'Rank B coverage can become tomorrow’s pipeline if outreach is consistent.',owner_name:'Team',count:rankBUntouched,value:0,status:'Watch',_rows:rank.filter(r=>String(r.rank_group).toUpperCase()==='B'&&n(r.no_touch_companies)>0),_cols:RANK_COLS});
  return actions.slice(0,8);
}

function buildCoaching({reps,rank,needs,pipe,risk}){
  const out=[];
  for(const r of reps.slice(0,12)){
    const cr=connectionRate(n(r.calls_logged),n(r.connected_calls));
    const owner=ownerKey(r.owner_name);
    const ownerNeeds=ownerRows(needs,owner).length;
    const ownerRisk=ownerRows(risk,owner).length;
    const ownerPipe=ownerRows(pipe,owner);
    if(ownerNeeds>0) out.push({owner_name:owner,signal:`${ownerNeeds} untouched priority companies`,recommendation:'Start with Rank A/B untouched accounts before normal follow-ups.',impact:ownerNeeds>10?'High':'Medium'});
    if(ownerRisk>0) out.push({owner_name:owner,signal:`${ownerRisk} deals at risk`,recommendation:'Add next activity, update stage, and escalate stale proposals today.',impact:'High'});
    if(n(r.calls_logged)>20&&cr<25) out.push({owner_name:owner,signal:`Low connection rate ${pct(cr)}`,recommendation:'Shift calling windows and prioritise fresh leads or direct numbers.',impact:'Medium'});
    if(ownerPipe.length>0&&!ownerPipe.some(d=>d.next_activity_date)) out.push({owner_name:owner,signal:'Pipeline missing follow-up dates',recommendation:'No open deal should end the day without a next activity.',impact:'High'});
  }
  if(!out.length) out.push({owner_name:'Team',signal:'No critical coaching signal',recommendation:'Maintain current cadence and keep next activities updated.',impact:'Low'});
  return out.slice(0,12);
}

function groupByOwner(rowsIn){
  const map=new Map();
  for(const r of rowsIn){
    const key=ownerKey(r.owner_name);
    if(!map.has(key)) map.set(key,{owner_name:key,items:0,value:0});
    const o=map.get(key);o.items++;o.value+=n(r.amount||r.renewal_value);
  }
  return [...map.values()].sort((a,b)=>b.items-a.items);
}

function renderCoverage(data,country){
  const rank=data.rank.filter(r=>country==='All'||r.country===country);
  const a=rank.filter(r=>String(r.rank_group).toUpperCase()==='A');
  const b=rank.filter(r=>String(r.rank_group).toUpperCase()==='B');
  const cards=`<div class="summary-grid" style="grid-template-columns:repeat(6,1fr);margin-bottom:12px">
    ${metric('Companies',num(sum(rank,'companies')),country,'var(--blue)','rank')}
    ${metric('Touched',num(sum(rank,'touched_companies')),pct(connectionRate(sum(rank,'companies'),sum(rank,'touched_companies'))),'var(--green)','rank')}
    ${metric('Untouched',num(sum(rank,'no_touch_companies')),'Need outreach','var(--red)','rank')}
    ${metric('Rank A Untouched',num(sum(a,'no_touch_companies')),'Highest priority','var(--red)','rankA')}
    ${metric('Rank B Untouched',num(sum(b,'no_touch_companies')),'Second priority','var(--amber)','rankB')}
    ${metric('Meetings Associated',num(sum(rank,'completed_meetings')),'Company-level','var(--purple)','rank')}
  </div>`;
  const el=document.getElementById('coverageBlock');
  if(el) el.innerHTML=cards+table(rank,RANK_COLS,12);
}

function renderMain(data){
  setTitle('Acquisition · Command Center','Today’s focus, priority actions, rep execution and pipeline risk');
  const {snap,kpi,reps,rank,needs,pipe,stuck,risk,actions,coach}=data;
  const rankA=rank.filter(r=>String(r.rank_group).toUpperCase()==='A');
  const rankB=rank.filter(r=>String(r.rank_group).toUpperCase()==='B');
  const countries=['All',...unique(rank,'country')];
  const pipeValue=sum(pipe,'amount');
  const riskValue=sum(risk,'amount');
  const contactRate=n(snap.contacted_pct||0);
  const periodCards=kpi.map(p=>`<div class="ret-period-card">
    <div class="ret-period-label">${esc(p.period)}</div>
    <div class="ret-period-row"><div class="ret-period-key">Calls</div><div class="ret-period-val">${num(p.calls_logged)}</div></div>
    <div class="ret-period-row"><div class="ret-period-key">Connected</div><div class="ret-period-val">${num(p.connected_calls)}</div></div>
    <div class="ret-period-row"><div class="ret-period-key">Meetings</div><div class="ret-period-val">${num(p.meetings_completed)}</div></div>
    <div class="ret-period-row"><div class="ret-period-key">Conn Rate</div><div class="ret-period-val">${pct(p.connection_rate||0)}</div></div>
  </div>`).join('');
  const repGrid=reps.slice(0,12).map(r=>`<button class="pcard" type="button" data-acq-rep="${esc(r.owner_name)}" style="text-align:left;cursor:pointer">
    <div class="pcard-top"><strong>${esc(r.owner_name)}</strong><span class="badge bb">Open</span></div>
    <div class="pcard-body">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center">
        <div><div class="sum-val" style="font-size:16px;color:var(--blue)">${num(r.calls_logged)}</div><div class="sum-lbl">Calls</div></div>
        <div><div class="sum-val" style="font-size:16px;color:var(--green)">${num(r.connected_calls)}</div><div class="sum-lbl">Connected</div></div>
        <div><div class="sum-val" style="font-size:16px;color:var(--purple)">${num(r.meetings_completed)}</div><div class="sum-lbl">Meetings</div></div>
      </div>
      <div class="sum-sub" style="margin-top:8px">Last activity: ${relDate(r.last_activity_at)}</div>
    </div>
  </button>`).join('');
  const ownerPipe=groupByOwner(pipe);
  const ownerRisk=groupByOwner(risk);
  const sourceRows=[
    {source:'All Companies',total:n(snap.total_companies),contacted:n(snap.contacted_companies),not_contacted:Math.max(0,n(snap.total_companies)-n(snap.contacted_companies)),contact_rate:contactRate},
    {source:'Rank A',total:sum(rankA,'companies'),contacted:sum(rankA,'touched_companies'),not_contacted:sum(rankA,'no_touch_companies'),contact_rate:connectionRate(sum(rankA,'companies'),sum(rankA,'touched_companies'))},
    {source:'Rank B',total:sum(rankB,'companies'),contacted:sum(rankB,'touched_companies'),not_contacted:sum(rankB,'no_touch_companies'),contact_rate:connectionRate(sum(rankB,'companies'),sum(rankB,'touched_companies'))},
    {source:'Priority Needs Contact',total:needs.length,contacted:0,not_contacted:needs.length,contact_rate:0},
  ];
  const SOURCE_COLS=[
    {label:'Segment',key:'source'},
    {label:'Total',key:'total',center:true,render:r=>num(r.total)},
    {label:'Touched',key:'contacted',center:true,render:r=>num(r.contacted)},
    {label:'Untouched',key:'not_contacted',center:true,render:r=>num(r.not_contacted)},
    {label:'Contact Rate',key:'contact_rate',center:true,render:r=>pct(r.contact_rate||0)},
  ];
  const OWNER_PIPE_COLS=[
    {label:'Owner',key:'owner_name'},
    {label:'Open Deals',key:'items',center:true,render:r=>num(r.items)},
    {label:'Pipeline Value',key:'value',center:true,render:r=>money(r.value)},
  ];

  const html=`
    ${section('Today’s Acquisition Focus','Live from Supabase raw data only')}
    <div class="summary-grid">
      ${metric('Leads Need Contact',num(needs.length),'Rank A/B untouched companies','var(--amber)','needs')}
      ${metric('Rank A Untouched',num(sum(rankA,'no_touch_companies')),'Highest priority','var(--red)','rankA')}
      ${metric('Rank B Untouched',num(sum(rankB,'no_touch_companies')),'Second priority','var(--amber)','rankB')}
      ${metric('Deals at Risk',num(risk.length),money(riskValue)+' exposed','var(--red)','risk')}
      ${metric('Lead Contact Rate',pct(contactRate),num(snap.contacted_companies)+' touched','var(--green)','rank')}
      ${metric('Open Pipeline',money(pipeValue),num(pipe.length)+' open deals','var(--cyan)','pipe')}
      ${metric('Connected Calls',num(snap.connected_calls),'Quality conversations','var(--blue)','kpi')}
      ${metric('Meetings Done',num(snap.completed_meetings),'Company associated','var(--purple)','kpi')}
    </div>

    <div class="command-health-grid" style="margin-top:14px">
      ${health('Revenue Health',money(pipeValue),'Open Pipeline',[{label:'At Risk',value:money(riskValue),color:'var(--red)'},{label:'Open Deals',value:num(pipe.length),color:'var(--cyan)'}],'var(--green)','pipe')}
      ${health('Outreach Health',pct(contactRate),'Company Contact Rate',[{label:'Touched',value:num(snap.contacted_companies),color:'var(--green)'},{label:'Need Contact',value:num(needs.length),color:'var(--red)'}],'var(--cyan)','needs')}
      ${health('Rep Execution',num(snap.calls_logged),'Calls Logged',[{label:'Connected',value:num(snap.connected_calls),color:'var(--green)'},{label:'Meetings',value:num(snap.completed_meetings),color:'var(--purple)'}],'var(--blue)','reps')}
    </div>

    ${section('Priority Actions','What the team should do first')}
    ${card('<div class="card-title-icon" style="background:var(--red-bg)">⚡</div> Priority Actions',`${actions.length} actions`,table(actions,ACTION_COLS,8))}

    ${section('Yesterday Performance + Detailed KPIs','Yesterday · MTD · YTD')}
    <div class="two-col">
      ${card('<div class="card-title-icon" style="background:var(--blue-bg)">👥</div> Rep Execution',`${reps.length} reps`,table(reps,REP_COLS,12))}
      ${card('<div class="card-title-icon" style="background:var(--green-bg)">📊</div> Detailed KPI Cards','Team periods',`<div class="ret-period-grid">${periodCards}</div>`)}
    </div>

    ${section('Priority Leads & SLA Breaches','Companies/leads that need immediate outreach')}
    <div class="two-col">
      ${card('<div class="card-title-icon" style="background:var(--amber-bg)">🎯</div> Priority Needs Contact',`${needs.length} rows`,table(needs,NEEDS_COLS,8,r=>r.hubspot_url||r.company_url))}
      ${card('<div class="card-title-icon" style="background:var(--red-bg)">🚨</div> SLA Breaches & Deal Risk',`${risk.length} rows`,table(risk,RISK_COLS,8,r=>r.hubspot_url))}
    </div>

    ${section('Lead Funnel & Source Performance','Current source contract from Supabase coverage signals')}
    <div class="two-col">
      ${card('<div class="card-title-icon" style="background:var(--cyan-bg)">🧭</div> Lead Overview / Outreach Coverage','Segments',table(sourceRows,SOURCE_COLS,10))}
      ${card('<div class="card-title-icon" style="background:var(--purple-bg)">💡</div> AI Coaching Insights','Rule-based',table(coach,COACH_COLS,10))}
    </div>

    ${section('Rank A/B Coverage','Filter by country, then open rep detail for execution')}
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
      <select class="pnl-select" id="acqCountryFilter">
        ${countries.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}
      </select>
      <button class="badge bb" type="button" data-acq-modal="rank">Open All Coverage</button>
      <button class="badge ba" type="button" data-acq-modal="needs">Open Untouched</button>
    </div>
    <div id="coverageBlock"></div>

    ${section('Acquisition Pipeline','Open pipeline, by rep and risk')}
    <div class="two-col">
      ${card('<div class="card-title-icon" style="background:var(--cyan-bg)">💰</div> Open Pipeline by Rep',`${ownerPipe.length} owners`,table(ownerPipe,OWNER_PIPE_COLS,10))}
      ${card('<div class="card-title-icon" style="background:var(--red-bg)">🔥</div> Risk by Rep',`${ownerRisk.length} owners`,table(ownerRisk,OWNER_PIPE_COLS,10))}
    </div>
    ${card('<div class="card-title-icon" style="background:var(--green-bg)">📌</div> Open Pipeline Details',`${pipe.length} deals`,table(pipe,PIPE_COLS,12,r=>r.hubspot_url))}

    ${section('Acquisition Rep Details','Click any rep to open a dedicated execution page')}
    <div class="pipe-cards-grid">${repGrid}</div>
  `;
  setContent(html);
  renderCoverage(data,'All');
  wire(data);
}

function renderRepDetail(ownerName){
  const data=window._acqData;
  if(!data)return;
  const owner=ownerKey(ownerName);
  const needs=ownerRows(data.needs,owner);
  const pipe=ownerRows(data.pipe,owner);
  const risk=ownerRows(data.risk,owner);
  const rank=ownerRows(data.rank,owner);
  const rep=data.reps.find(r=>ownerKey(r.owner_name)===owner)||{};
  const rankA=rank.filter(r=>String(r.rank_group).toUpperCase()==='A');
  const rankB=rank.filter(r=>String(r.rank_group).toUpperCase()==='B');
  const countries=unique(rank,'country');
  const coaching=data.coach.filter(r=>ownerKey(r.owner_name)===owner);
  const countryRows=countries.map(c=>{
    const rows=rank.filter(r=>r.country===c);
    return {country:c,companies:sum(rows,'companies'),touched:sum(rows,'touched_companies'),untouched:sum(rows,'no_touch_companies'),meetings:sum(rows,'completed_meetings'),calls:sum(rows,'connected_calls'),touch_rate:connectionRate(sum(rows,'companies'),sum(rows,'touched_companies'))};
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
  setTitle(`${owner} · Acquisition Detail`,'Dedicated rep execution page — not a dashboard filter');
  const html=`
    <div style="margin-bottom:14px"><button class="badge bb" type="button" id="acqBackBtn">← Back to Acquisition Command Center</button></div>
    ${section(`${owner} — Execution Summary`,'Yesterday/MTD/YTD engine will use the same Supabase-only contract')}
    <div class="summary-grid">
      ${metric('Calls Logged',num(rep.calls_logged),'All synced activity','var(--blue)','reps')}
      ${metric('Connected Calls',num(rep.connected_calls),pct(connectionRate(n(rep.calls_logged),n(rep.connected_calls)))+' connection','var(--green)','reps')}
      ${metric('Meetings Done',num(rep.meetings_completed),'Completed meetings','var(--purple)','reps')}
      ${metric('Needs Contact',num(needs.length),'Rep-owned untouched','var(--amber)','repNeeds')}
      ${metric('Open Deals',num(pipe.length),money(sum(pipe,'amount')),'var(--cyan)','repPipe')}
      ${metric('Deals at Risk',num(risk.length),money(sum(risk,'amount')),'var(--red)','repRisk')}
      ${metric('Rank A Untouched',num(sum(rankA,'no_touch_companies')),'Priority block','var(--red)','repRank')}
      ${metric('Rank B Untouched',num(sum(rankB,'no_touch_companies')),'Second block','var(--amber)','repRank')}
    </div>

    ${section('Needs to Contact — Online / Offline','Current view is company coverage; source split will bind to contact source once api_acq_rep_needs_contact_online/offline is added')}
    <div class="two-col">
      ${card('<div class="card-title-icon" style="background:var(--cyan-bg)">🌐</div> Needs Contact — Online Signal','Coverage rows',table(needs.filter((_,i)=>i%2===0),NEEDS_COLS,8,r=>r.hubspot_url||r.company_url))}
      ${card('<div class="card-title-icon" style="background:var(--amber-bg)">📞</div> Needs Contact — Offline Signal','Coverage rows',table(needs.filter((_,i)=>i%2!==0),NEEDS_COLS,8,r=>r.hubspot_url||r.company_url))}
    </div>

    ${section('AI Coaching + SLA Breaches','Rule-based coaching from Supabase views')}
    <div class="two-col">
      ${card('<div class="card-title-icon" style="background:var(--purple-bg)">💡</div> AI Coaching Insights',`${coaching.length||1} signals`,table(coaching.length?coaching:[{owner_name:owner,signal:'No critical signal',recommendation:'Keep cadence and update next activities.',impact:'Low'}],COACH_COLS,8))}
      ${card('<div class="card-title-icon" style="background:var(--red-bg)">🚨</div> Deals at Risk',`${risk.length} deals`,table(risk,RISK_COLS,8,r=>r.hubspot_url))}
    </div>

    ${section('Open Deals + Rank A/B Coverage','Pipeline and country/company coverage')}
    <div class="two-col">
      ${card('<div class="card-title-icon" style="background:var(--green-bg)">💰</div> Open Deals',`${pipe.length} deals`,table(pipe,PIPE_COLS,8,r=>r.hubspot_url))}
      ${card('<div class="card-title-icon" style="background:var(--blue-bg)">🌍</div> Country Coverage',`${countryRows.length} countries`,table(countryRows,COUNTRY_COLS,12))}
    </div>

    ${card('<div class="card-title-icon" style="background:var(--amber-bg)">🏆</div> Rank A/B Coverage Details',`${rank.length} rows`,table(rank,RANK_COLS,12))}
  `;
  setContent(html);
  document.getElementById('acqBackBtn')?.addEventListener('click',()=>renderMain(data));
  wire(data);
}

function openModal(key){
  const d=window._acqData;if(!d)return;
  const map={
    needs:{title:'Priority Needs Contact',rows:d.needs,cols:NEEDS_COLS,url:r=>r.hubspot_url||r.company_url},
    rank:{title:'Rank A/B Coverage',rows:d.rank,cols:RANK_COLS},
    rankA:{title:'Rank A Coverage',rows:d.rank.filter(r=>String(r.rank_group).toUpperCase()==='A'),cols:RANK_COLS},
    rankB:{title:'Rank B Coverage',rows:d.rank.filter(r=>String(r.rank_group).toUpperCase()==='B'),cols:RANK_COLS},
    pipe:{title:'Open Pipeline',rows:d.pipe,cols:PIPE_COLS,url:r=>r.hubspot_url},
    risk:{title:'Deals at Risk',rows:d.risk,cols:RISK_COLS,url:r=>r.hubspot_url},
    stuck:{title:'Stuck Deals',rows:d.stuck,cols:RISK_COLS,url:r=>r.hubspot_url},
    kpi:{title:'Detailed KPIs',rows:d.kpi,cols:KPI_COLS},
    reps:{title:'Rep Execution',rows:d.reps,cols:REP_COLS},
    actions:{title:'Priority Actions',rows:d.actions,cols:ACTION_COLS},
    coach:{title:'AI Coaching Insights',rows:d.coach,cols:COACH_COLS},
    repNeeds:{title:'Rep Needs Contact',rows:[],cols:NEEDS_COLS},
    repPipe:{title:'Rep Open Deals',rows:[],cols:PIPE_COLS},
    repRisk:{title:'Rep Deals at Risk',rows:[],cols:RISK_COLS},
    repRank:{title:'Rep Rank Coverage',rows:[],cols:RANK_COLS},
  };
  const cfg=map[key];
  if(!cfg)return;
  window.Modal.open({title:cfg.title,rows:cfg.rows,cols:cfg.cols,rowUrlFn:cfg.url});
}

function wire(data){
  document.querySelectorAll('[data-acq-modal]').forEach(el=>{
    const key=el.getAttribute('data-acq-modal');
    if(!key)return;
    el.addEventListener('click',()=>openModal(key));
  });
  document.querySelectorAll('[data-acq-rep]').forEach(el=>{
    el.addEventListener('click',(ev)=>{ev.preventDefault();renderRepDetail(el.getAttribute('data-acq-rep'));});
  });
  const country=document.getElementById('acqCountryFilter');
  if(country) country.addEventListener('change',()=>renderCoverage(data,country.value));
}

async function render(){
  setTitle('Acquisition · Command Center','Loading Supabase command center');
  showLoading('Loading Acquisition Command Center…');
  const [snapR,kpiR,repsR,rankR,needsR,pipeR,stuckR]=await Promise.allSettled([
    get('vw_dash_acq_team_fast',1),
    get('vw_acquisition_kpi_snapshot_periods',10),
    get('vw_dash_acq_sidebar_fast',100),
    get('vw_dash_acq_rank_fast',2000),
    get('vw_dash_acq_needs_fast',2000),
    get('vw_acquisition_pipeline_details',1000),
    get('vw_acquisition_stuck_deals',500),
  ]);
  const data={
    snap:one(snapR),
    kpi:rows(kpiR),
    reps:rows(repsR),
    rank:rows(rankR),
    needs:rows(needsR),
    pipe:rows(pipeR),
    stuck:rows(stuckR),
    errors:[snapR,kpiR,repsR,rankR,needsR,pipeR,stuckR].filter(r=>r.status==='rejected').map(r=>r.reason?.message||String(r.reason)),
  };
  data.risk=riskRows(data.pipe,data.stuck);
  data.actions=buildActions(data);
  data.coach=buildCoaching(data);
  window._acqData=data;
  window._acqV2={openModal,openRep:renderRepDetail,back:()=>renderMain(window._acqData)};
  renderMain(data);
  if(data.errors.length){
    const el=document.getElementById('appContent');
    el?.insertAdjacentHTML('afterbegin',unavailable('Some acquisition views',data.errors.join(' | ')));
  }
}

window.AcquisitionModule={render};
})();
