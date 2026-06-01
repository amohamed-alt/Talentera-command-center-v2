(function(){
'use strict';

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const fmt=new Intl.NumberFormat('en-US');
const usd=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0});
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const n=v=>Number(v||0);
const num=v=>fmt.format(n(v));
const money=v=>usd.format(n(v));
const pct=v=>`${Math.round(n(v)*10)/10}%`;
const sum=(arr,key)=>(arr||[]).reduce((a,b)=>a+n(b[key]),0);
const ownerOf=r=>String(r.owner_name||'Unassigned').trim()||'Unassigned';
const stageOf=r=>String(r.dealstage||'Unknown').trim()||'Unknown';
const sourceOf=r=>String(r.source_bucket||'Unknown').trim()||'Unknown';
const isRiskDeal=r=>!r.next_activity_date||n(r.days_in_stage)>=21;
const todayLabel=()=>new Date().toLocaleString('en-US',{month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit'});
let charts=[];
let state={view:'overview',owner:'All',search:'',data:null};

const CORE_REPS=['Marita Chedid','Zein Fares','Ursula Waked','Ahmad Khawajah','Mohammed Faizan','Mohammad Jehad Al-Barqawi','Fadi Zanona'];

function cleanCharts(){charts.forEach(c=>{try{c.destroy()}catch(e){}});charts=[];}
function field(row,...keys){for(const k of keys){if(row&&row[k]!=null)return row[k]}return null;}
function rowsForOwner(rows){return (rows||[]).filter(r=>state.owner==='All'||ownerOf(r)===state.owner);}
function modal(title, rows, cols){
  $('#modalTitle').textContent=title;
  $('#modalSub').textContent=`${num(rows.length)} rows`;
  $('#modalBody').innerHTML=`<div style="padding:12px;border-bottom:1px solid var(--line);display:flex;gap:8px"><input id="modalSearchBox" class="select" placeholder="Search rows…" style="min-width:260px"><button id="modalExport" class="btn">Export CSV</button></div><div id="modalTableHost">${table(rows,cols)}</div>`;
  $('#modalBackdrop').style.display='flex';
  $('#modalSearchBox').oninput=e=>{
    const q=e.target.value.toLowerCase();
    const filtered=rows.filter(r=>Object.values(r||{}).join(' ').toLowerCase().includes(q));
    $('#modalSub').textContent=`${num(filtered.length)} rows`;
    $('#modalTableHost').innerHTML=table(filtered,cols);
  };
  $('#modalExport').onclick=()=>exportCsv(title,rows,cols);
}
function exportCsv(name,rows,cols){
  const headers=cols.map(c=>c.label);
  const body=rows.map(r=>cols.map(c=>String(c.csv?c.csv(r):(r[c.key]??'')).replace(/"/g,'""')));
  const csv=[headers,...body].map(r=>r.map(x=>`"${x}"`).join(',')).join('\n');
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download=name.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.csv';
  a.click();
}
function table(rows,cols,limit=300){
  if(!rows||!rows.length)return `<div class="loader" style="min-height:140px">No rows for this selection</div>`;
  return `<table class="table"><thead><tr>${cols.map(c=>`<th>${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${rows.slice(0,limit).map(r=>`<tr>${cols.map(c=>`<td>${c.render?c.render(r):esc(r[c.key]??'—')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

const dealCols=[
 {label:'Deal',key:'dealname',render:r=>r.hubspot_url?`<a class="link" href="${esc(r.hubspot_url)}" target="_blank">${esc(r.dealname||'Open deal')}</a>`:esc(r.dealname||'—')},
 {label:'Company',key:'company_name'},
 {label:'Owner',key:'owner_name'},
 {label:'Stage',key:'dealstage',render:r=>`<span class="stage-badge">${esc(stageOf(r))}</span>`},
 {label:'Amount',key:'amount',render:r=>`<span class="amount">${money(r.amount)}</span>`,csv:r=>n(r.amount)},
 {label:'Days',key:'days_in_stage',render:r=>`<span class="${n(r.days_in_stage)>=21?'risk':'ok'}">${num(r.days_in_stage)}</span>`},
 {label:'Next Activity',key:'next_activity_date',render:r=>r.next_activity_date?esc(String(r.next_activity_date).slice(0,10)):`<span class="risk">None</span>`},
 {label:'Open',key:'hubspot_url',render:r=>r.hubspot_url?`<a class="link" href="${esc(r.hubspot_url)}" target="_blank">HubSpot</a>`:'—'}
];
const leadCols=[
 {label:'Contact',key:'contact_name',render:r=>r.hubspot_url?`<a class="link" href="${esc(r.hubspot_url)}" target="_blank">${esc(r.contact_name||r.email||r.contact_id)}</a>`:esc(r.contact_name||r.email||r.contact_id||'—')},
 {label:'Company',key:'company_name'},
 {label:'Owner',key:'owner_name'},
 {label:'Source',key:'source_bucket',render:r=>`<span class="stage-badge">${esc(sourceOf(r))}</span>`},
 {label:'Status',key:'lead_status'},
 {label:'Days',key:'days_since_created'},
 {label:'Calls',key:'connected_calls'},
 {label:'Meetings',key:'completed_meetings'}
];
const rankCols=[
 {label:'Rank',key:'rank_group'}, {label:'Country',key:'country'}, {label:'Owner',key:'owner_name'},
 {label:'Companies',key:'companies'}, {label:'Touched',key:'touched_companies'}, {label:'Untouched',key:'no_touch_companies',render:r=>`<span class="${n(r.no_touch_companies)>0?'risk':'ok'}">${num(r.no_touch_companies)}</span>`},
 {label:'Touch Rate',key:'touch_rate_pct',render:r=>pct(r.touch_rate_pct||0)}, {label:'Calls',key:'connected_calls'}, {label:'Meetings',key:'completed_meetings'}
];

async function load(){
  $('#app').innerHTML='<div class="loader">Loading live Supabase Command Center…</div>';
  try{
    const [leadSummary,leads,source,rank,pipe,stuck,periods,reps,trend,stageMix]=await Promise.all([
      DB.fetchView('vw_acquisition_lead_summary',1).catch(()=>[]),
      DB.fetchView('vw_acquisition_priority_leads',2500).catch(()=>[]),
      DB.fetchView('vw_acquisition_lead_source_performance',150).catch(()=>[]),
      DB.fetchView('vw_dash_acq_rank_fast',2500).catch(()=>[]),
      DB.fetchView('vw_acquisition_pipeline_details',2500).catch(()=>[]),
      DB.fetchView('vw_acquisition_stuck_deals',700).catch(()=>[]),
      DB.fetchView('vw_acquisition_rep_kpi_periods',10000).catch(()=>[]),
      DB.fetchView('vw_dash_acq_sidebar_fast',150).catch(()=>[]),
      DB.fetchView('vw_acquisition_daily_trend',100).catch(()=>DB.fetchView('vw_acq_lovable_pipeline_trend',120).catch(()=>[])),
      DB.fetchView('vw_acquisition_deal_stage_mix',100).catch(()=>[])
    ]);
    state.data={leadSummary:leadSummary[0]||{},leads:leads||[],source:source||[],rank:rank||[],pipe:pipe||[],stuck:stuck||[],periods:periods||[],reps:reps||[],trend:trend||[],stageMix:stageMix||[]};
    render();
  }catch(e){
    $('#app').innerHTML=`<div class="loader">Failed to load Supabase data: ${esc(e.message||e)}</div>`;
  }
}

function filteredData(){
  const d=state.data;
  const owner=state.owner;
  const q=state.search.toLowerCase();
  const filterQ=r=>!q||Object.values(r||{}).join(' ').toLowerCase().includes(q);
  return {
    leads:rowsForOwner(d.leads).filter(filterQ),
    rank:rowsForOwner(d.rank).filter(filterQ),
    pipe:rowsForOwner(d.pipe).filter(filterQ),
    stuck:rowsForOwner(d.stuck).filter(filterQ),
    source:d.source,
    periods:owner==='All'?d.periods:d.periods.filter(r=>ownerOf(r)===owner),
    reps:d.reps
  };
}
function owners(){return ['All',...CORE_REPS,...new Set((state.data?.pipe||[]).map(ownerOf))].filter((v,i,a)=>v&&a.indexOf(v)===i);}
function repKpi(owner,period){return (state.data.periods||[]).find(r=>ownerOf(r)===owner&&r.period===period)||{};}

function kpi(label,value,sub,color,key,spark){return `<article class="kpi-card" data-modal="${key}"><div class="kpi-head"><div><div class="kpi-label">${esc(label)}</div><div class="kpi-value" style="color:var(--${color})">${value}</div><div class="kpi-sub">${esc(sub||'')}</div></div><span class="pill ${color==='red'?'red':color==='orange'?'orange':color==='green'?'green':'blue'}">Live</span></div>${spark?`<canvas class="spark" id="${spark}"></canvas>`:''}</article>`}
function mini(label,value,sub,key,color='blue'){return `<div class="mini-metric" data-modal="${key}"><div class="mini-value" style="color:var(--${color})">${value}</div><div class="mini-label">${esc(label)}</div><div class="mini-sub">${esc(sub)}</div></div>`}
function section(title,sub,icon,color,body,extra=''){return `<section class="section"><div class="section-head"><div><div class="section-title"><span class="section-icon" style="background:var(--${color})">${icon}</span>${esc(title)}</div><div class="section-sub">${esc(sub||'')}</div></div>${extra}</div><div class="body">${body}</div></section>`}
function tabs(){const items=[['overview','Executive'],['leads','Leads & Source'],['coverage','Rank A/B'],['pipeline','Pipeline'],['reps','Rep Details']];return `<div class="filters"><span class="filter-label">Views</span>${items.map(([id,l])=>`<button class="chip ${state.view===id?'active':''}" data-view="${id}"><span class="dot"></span>${l}</button>`).join('')}</div>`}
function header(){return `<div class="topbar"><div><div class="eyebrow">Supabase live · full acquisition command center</div><h1 class="page-title">Acquisition Team Overview</h1></div><div class="top-actions"><select id="ownerFilter" class="select">${owners().map(o=>`<option ${state.owner===o?'selected':''}>${esc(o)}</option>`).join('')}</select><input id="searchBox" class="select" placeholder="Search all visible data…" value="${esc(state.search)}"><button id="refreshBtn" class="btn primary">Refresh</button></div></div>${tabs()}`}
function insightCards(fd){
  const pipe=fd.pipe,leads=fd.leads,rank=fd.rank;
  const risk=pipe.filter(isRiskDeal);
  const ownerRisk=group(risk,'owner_name')[0];
  const stageMax=group(pipe,'dealstage')[0];
  const untouched=sum(rank,'no_touch_companies');
  const top5=pipe.slice().sort((a,b)=>n(b.amount)-n(a.amount)).slice(0,5);
  const top5Share=sum(pipe,'amount')?Math.round(sum(top5,'amount')/sum(pipe,'amount')*1000)/10:0;
  const rows=[
    {title:'Highest risk owner',value:ownerRisk?ownerRisk.name:'—',sub:ownerRisk?`${money(ownerRisk.value)} risk exposure`:''},
    {title:'Largest stage exposure',value:stageMax?stageMax.name:'—',sub:stageMax?`${money(stageMax.value)} open pipeline`:''},
    {title:'Lead backlog',value:num(leads.length),sub:'contacts need outreach'},
    {title:'Rank A/B untouched',value:num(untouched),sub:'company coverage gap'},
    {title:'Top 5 deal concentration',value:pct(top5Share),sub:'share of open pipeline'}
  ];
  return rows.map(x=>`<div class="mini-metric"><div class="mini-value">${esc(x.value)}</div><div class="mini-label">${esc(x.title)}</div><div class="mini-sub">${esc(x.sub)}</div></div>`).join('');
}
function group(rows,key){const m=new Map();(rows||[]).forEach(r=>{const k=String(r[key]||'Unknown');if(!m.has(k))m.set(k,{name:k,count:0,value:0,risk:0,riskValue:0});const o=m.get(k);o.count++;o.value+=n(r.amount||r.pipeline_value||r.companies||r.total_contacts);if(isRiskDeal(r)){o.risk++;o.riskValue+=n(r.amount)}});return [...m.values()].sort((a,b)=>b.value-a.value)}

function render(){
  if(!state.data)return;
  cleanCharts();
  const fd=filteredData();
  const d=state.data;
  const risk=fd.pipe.filter(isRiskDeal);
  const online=fd.leads.filter(r=>sourceOf(r)==='online');
  const offline=fd.leads.filter(r=>sourceOf(r)==='offline');
  const totalPipeline=sum(fd.pipe,'amount');
  const riskValue=sum(risk,'amount');
  const touched=sum(fd.rank,'touched_companies'), companies=sum(fd.rank,'companies');
  const contactRate=field(d.leadSummary,'lead_contact_rate_pct')||0;
  $('#app').innerHTML=header()+`<div class="metric-strip">${mini('Leads Need Contact',num(fd.leads.length),'Online '+num(online.length)+' · Offline '+num(offline.length),'leads','orange')}${mini('Rank A/B Companies',num(companies),'Untouched '+num(sum(fd.rank,'no_touch_companies')),'rank','blue')}${mini('Open Pipeline',money(totalPipeline),num(fd.pipe.length)+' deals','pipeline','green')}${mini('Deals at Risk',num(risk.length),money(riskValue)+' exposed','risk','red')}${mini('Lead Contact Rate',pct(contactRate),'live contact coverage','source','blue')}${mini('Company Touch Rate',pct(companies?touched/companies*100:0),num(touched)+' touched','rank','green')}</div>`+
  viewHtml(fd,d);
  bind();
  draw(fd,d);
}
function viewHtml(fd,d){
  if(state.view==='leads')return leadsView(fd,d);
  if(state.view==='coverage')return coverageView(fd,d);
  if(state.view==='pipeline')return pipelineView(fd,d);
  if(state.view==='reps')return repsView(fd,d);
  return overviewView(fd,d);
}
function overviewView(fd,d){
  const risk=fd.pipe.filter(isRiskDeal), online=fd.leads.filter(r=>sourceOf(r)==='online'), offline=fd.leads.filter(r=>sourceOf(r)==='offline');
  const daily=d.trend||[];
  return `<div class="kpi-grid grid">${kpi('Outreach Backlog',num(fd.leads.length),`${num(online.length)} online · ${num(offline.length)} offline`,'orange','leads','sparkLeads')}${kpi('Pipeline Health',money(sum(fd.pipe,'amount')),`${num(fd.pipe.length)} open deals`,'green','pipeline','sparkPipe')}${kpi('Risk Exposure',money(sum(risk,'amount')),`${num(risk.length)} deals at risk`,'red','risk','sparkRisk')}</div>`+
  `<div class="metric-strip">${insightCards(fd)}</div>`+
  `<div class="layout-2">${section('Activity & Pipeline Trend','Calls, leads, meetings and pipeline movement','⌁','cyan','<canvas id="activityChart" class="chart-lg"></canvas>')}${section('Priority Actions','Calculated from live leads, companies and deals','!','red',priorityActions(fd))}</div>`+
  `<div class="layout-3" style="margin-top:16px">${section('Lead Source Mix','Where the backlog comes from','◌','purple','<canvas id="sourceChart" class="chart-md"></canvas>')}${section('Pipeline by Owner','Open deal ownership','●','green','<canvas id="ownerChart" class="chart-md"></canvas>')}${section('Rank A/B Coverage','Touched vs untouched companies','▰','blue','<canvas id="coverageChart" class="chart-md"></canvas>')}</div>`+
  `<div class="layout-2" style="margin-top:16px">${section('Priority Leads & SLA Breaches','Real contacts requiring outreach','↗','orange',table(fd.leads,leadCols,10),'<button class="tab" data-modal="leads">Open all</button>')}${section('Open Pipeline','Active acquisition opportunities','▰','blue',table(fd.pipe,dealCols,10),'<button class="tab" data-modal="pipeline">Open all</button>')}</div>`;
}
function priorityActions(fd){
  const risk=fd.pipe.filter(isRiskDeal), noNext=fd.pipe.filter(r=>!r.next_activity_date), stuck=fd.pipe.filter(r=>n(r.days_in_stage)>=21), untouched=sum(fd.rank,'no_touch_companies');
  const actions=[
    ['Contact lead backlog',fd.leads.length,'Start with online leads, then offline backlog.','leads'],
    ['Fix no-next-activity deals',noNext.length,'Every open deal needs a next activity.','noNext'],
    ['Recover stuck pipeline',stuck.length,'Update stage movement or close stale deals.','stuck'],
    ['Clean Rank A/B untouched companies',untouched,'Company coverage must stay separate from contact SLA.','rank'],
    ['Review risk exposure',risk.length,`${money(sum(risk,'amount'))} open value is exposed.`,'risk']
  ].filter(a=>n(a[1])>0);
  return `<div class="bar-list">${actions.map(a=>`<div class="bar-row" data-modal="${a[3]}"><div><div class="bar-name">${esc(a[0])}</div><div class="bar-meta">${esc(a[2])}</div><div class="bar-track"><span class="bar-fill" style="background:var(--red);width:${Math.min(100,Math.max(4,n(a[1])/Math.max(1,fd.leads.length||a[1])*100))}%"></span></div></div><div class="bar-value">${num(a[1])}</div></div>`).join('')}</div>`;
}
function leadsView(fd,d){
  return `<div class="layout-2">${section('Online / Inbound Needs Contact','Contacts from online sources','↗','blue',table(fd.leads.filter(r=>sourceOf(r)==='online'),leadCols,50),'<button class="tab" data-modal="online">Open all</button>')}${section('Offline / Outbound Needs Contact','Contacts from offline/import/outbound sources','↘','orange',table(fd.leads.filter(r=>sourceOf(r)!=='online'),leadCols,50),'<button class="tab" data-modal="offline">Open all</button>')}</div>`+
  `<div class="layout-2" style="margin-top:16px">${section('Lead Source Performance','Eligible vs contacted vs need contact','▰','purple','<canvas id="sourcePerfChart" class="chart-lg"></canvas>')}${section('Source Details','Live source breakdown', '≡','cyan', table(fd.source, sourceCols(), 40),'<button class="tab" data-modal="source">Open all</button>')}</div>`;
}
function sourceCols(){return[{label:'Bucket',key:'source_bucket'},{label:'Source',key:'analytics_source'},{label:'Total',key:'total_contacts'},{label:'Eligible',key:'eligible_leads'},{label:'Contacted',key:'contacted_leads'},{label:'Need Contact',key:'needs_contact',render:r=>`<span class="risk">${num(r.needs_contact)}</span>`},{label:'Contact Rate',key:'contact_rate_pct',render:r=>pct(r.contact_rate_pct||0)}]}
function coverageView(fd,d){
  return `<div class="layout-2">${section('Rank A/B Country Coverage','Touched vs untouched companies by country','▰','blue','<canvas id="countryChart" class="chart-lg"></canvas>')}${section('Coverage Leaders & Gaps','Click rows for details','!','orange',coverageBars(fd.rank))}</div>`+
  `<div style="margin-top:16px">${section('Rank A/B Coverage Details','Company coverage is separate from contact backlog','≡','green',table(fd.rank,rankCols,120),'<button class="tab" data-modal="rank">Open all</button>')}</div>`;
}
function coverageBars(rows){
  const m={};rows.forEach(r=>{const k=r.country||'Unknown';m[k]=m[k]||{country:k,companies:0,touched:0,untouched:0};m[k].companies+=n(r.companies);m[k].touched+=n(r.touched_companies);m[k].untouched+=n(r.no_touch_companies)});
  const arr=Object.values(m).sort((a,b)=>b.companies-a.companies).slice(0,12), max=Math.max(1,...arr.map(r=>r.companies));
  return `<div class="bar-list">${arr.map(r=>`<div class="bar-row"><div><div class="bar-name">${esc(r.country)}</div><div class="bar-meta">${num(r.touched)} touched · ${num(r.untouched)} untouched</div><div class="bar-track"><span class="bar-fill" style="width:${Math.max(3,r.companies/max*100)}%;background:${r.untouched?'var(--orange)':'var(--green)'}"></span></div></div><div class="bar-value">${num(r.companies)}</div></div>`).join('')}</div>`;
}
function pipelineView(fd,d){
  const stage=group(fd.pipe,'dealstage'), owner=group(fd.pipe,'owner_name'), risk=group(fd.pipe.filter(isRiskDeal),'owner_name');
  return `<div class="kpi-grid grid">${kpi('Open Pipeline',money(sum(fd.pipe,'amount')),`${num(fd.pipe.length)} open deals`,'green','pipeline','sparkPipe')}${kpi('Deals at Risk',num(fd.pipe.filter(isRiskDeal).length),money(sum(fd.pipe.filter(isRiskDeal),'amount'))+' exposed','red','risk','sparkRisk')}${kpi('No Next Activity',num(fd.pipe.filter(r=>!r.next_activity_date).length),'follow-up required','orange','noNext','sparkNoNext')}</div>`+
  `<div class="layout-2">${section('Pipeline by Stage','Open value and risk distribution','▰','blue','<canvas id="stageChart" class="chart-lg"></canvas>')}${section('Stage Value Leaders','Click stage rows to drill down','↗','green',bars(stage,'dealstage'))}</div>`+
  `<div class="layout-3" style="margin-top:16px">${section('Pipeline by Owner','Open deal ownership','●','green','<canvas id="pipeOwnerChart" class="chart-md"></canvas>')}${section('Risk by Owner','Who needs follow-up cleanup','!','red','<canvas id="riskOwnerChart" class="chart-md"></canvas>')}${section('Pipeline Mix','Stage distribution','◌','purple','<canvas id="mixChart" class="chart-md"></canvas>')}</div>`+
  `<div style="margin-top:16px">${section('Open Pipeline Details','Every deal row is clickable and opens HubSpot','≡','blue',table(fd.pipe,dealCols,180),'<button class="tab" data-modal="pipeline">Open all</button>')}</div>`;
}
function bars(rows,type){const max=Math.max(1,...rows.map(r=>r.value));return `<div class="bar-list">${rows.slice(0,12).map(r=>`<div class="bar-row" data-filter-${type}="${esc(r.name)}"><div><div class="bar-name">${esc(r.name)}</div><div class="bar-meta">${num(r.count)} deals · ${num(r.risk)} risk</div><div class="bar-track"><span class="bar-fill" style="width:${Math.max(3,r.value/max*100)}%"></span></div></div><div class="bar-value">${money(r.value)}</div></div>`).join('')}</div>`}
function repsView(fd,d){
  const reps=owners().filter(o=>o!=='All');
  const selected=state.owner==='All'?reps[0]:state.owner;
  const y=repKpi(selected,'Yesterday'),m=repKpi(selected,'MTD'),yd=repKpi(selected,'YTD');
  const ownerData={leads:d.leads.filter(r=>ownerOf(r)===selected),pipe:d.pipe.filter(r=>ownerOf(r)===selected),rank:d.rank.filter(r=>ownerOf(r)===selected)};
  return `<div class="filters"><span class="filter-label">Rep Details</span>${reps.map(r=>`<button class="chip ${selected===r?'active':''}" data-rep="${esc(r)}"><span class="dot"></span>${esc(r)}</button>`).join('')}</div>`+
  `<div class="kpi-grid grid">${kpi('Yesterday Calls',num(y.calls_logged||0),`${num(y.connected_calls||0)} connected`,'blue','repCalls')}${kpi('MTD Meetings',num(m.meetings_completed||0),`${num(m.meetings_logged||0)} logged`,'purple','repMeetings')}${kpi('YTD Deals Won',num(yd.deals_won||0),money(yd.won_amount||0),'green','repWon')}</div>`+
  `<div class="layout-2">${section('Rep Needs Contact','Online and offline contacts assigned to this rep','↗','orange',table(ownerData.leads,leadCols,60),'<button class="tab" data-modal="repLeads">Open all</button>')}${section('Rep Open Deals','Pipeline owned by this rep','▰','blue',table(ownerData.pipe,dealCols,60),'<button class="tab" data-modal="repPipe">Open all</button>')}</div>`+
  `<div class="layout-2" style="margin-top:16px">${section('Rep Rank A/B Coverage','Company coverage by country and rank','●','green',table(ownerData.rank,rankCols,60),'<button class="tab" data-modal="repRank">Open all</button>')}${section('Rep Risk & Coaching Signals','Calculated from live pipeline and lead backlog','!','red',priorityActions({leads:ownerData.leads,pipe:ownerData.pipe,rank:ownerData.rank}))}</div>`;
}

function bind(){
  $('#modalClose').onclick=()=>$('#modalBackdrop').style.display='none';
  $('#modalBackdrop').onclick=e=>{if(e.target.id==='modalBackdrop')$('#modalBackdrop').style.display='none'};
  $('#ownerFilter').onchange=e=>{state.owner=e.target.value;render()};
  $('#searchBox').oninput=e=>{state.search=e.target.value;render()};
  $('#refreshBtn').onclick=load;
  $$('[data-view]').forEach(b=>b.onclick=()=>{state.view=b.dataset.view;render()});
  $$('[data-rep]').forEach(b=>b.onclick=()=>{state.owner=b.dataset.rep;render()});
  $$('[data-modal]').forEach(el=>el.onclick=()=>openModal(el.dataset.modal));
  $$('[data-filter-dealstage]').forEach(el=>el.onclick=()=>{state.search=el.dataset.filterDealstage;render()});
}
function openModal(key){
  const fd=filteredData(), d=state.data;
  if(key==='leads')return modal('Priority Leads Need Contact',fd.leads,leadCols);
  if(key==='online')return modal('Online Leads Need Contact',fd.leads.filter(r=>sourceOf(r)==='online'),leadCols);
  if(key==='offline')return modal('Offline Leads Need Contact',fd.leads.filter(r=>sourceOf(r)!=='online'),leadCols);
  if(key==='source')return modal('Lead Source Performance',fd.source,sourceCols());
  if(key==='rank')return modal('Rank A/B Coverage',fd.rank,rankCols);
  if(key==='pipeline')return modal('Open Pipeline',fd.pipe,dealCols);
  if(key==='risk')return modal('Deals at Risk',fd.pipe.filter(isRiskDeal),dealCols);
  if(key==='noNext')return modal('Deals with No Next Activity',fd.pipe.filter(r=>!r.next_activity_date),dealCols);
  if(key==='stuck')return modal('Stuck Deals 21+ Days',fd.pipe.filter(r=>n(r.days_in_stage)>=21),dealCols);
  if(key==='repLeads')return modal('Rep Leads Need Contact',d.leads.filter(r=>ownerOf(r)===state.owner),leadCols);
  if(key==='repPipe')return modal('Rep Open Pipeline',d.pipe.filter(r=>ownerOf(r)===state.owner),dealCols);
  if(key==='repRank')return modal('Rep Rank A/B Coverage',d.rank.filter(r=>ownerOf(r)===state.owner),rankCols);
}
function draw(fd,d){
  if(!window.Chart)return;
  const trend=d.trend||[], labels=trend.map(r=>String(r.day||'').slice(5));
  spark('sparkLeads',labels,trend.map(r=>n(r.leads_created||r.created_deals)), '#f59e0b');
  spark('sparkPipe',labels,trend.map(r=>n(r.pipeline_created_amount||r.created_value)), '#22c55e');
  spark('sparkRisk',labels,trend.map(r=>n(r.deals_created||r.created_deals)), '#ef4444');
  if($('#activityChart'))charts.push(new Chart($('#activityChart'),{type:'line',data:{labels,datasets:[{label:'Calls',data:trend.map(r=>n(r.calls_logged)),borderColor:'#2f6df6',backgroundColor:'rgba(47,109,246,.12)',fill:true,tension:.35,pointRadius:0},{label:'Leads',data:trend.map(r=>n(r.leads_created||r.created_deals)),borderColor:'#06b6d4',backgroundColor:'rgba(6,182,212,.10)',fill:true,tension:.35,pointRadius:0},{label:'Meetings',data:trend.map(r=>n(r.completed_meetings)),borderColor:'#8b5cf6',tension:.35,pointRadius:0}]},options:chartOpts()}));
  if($('#sourceChart'))donut('sourceChart',groupSource(fd.leads).map(x=>x.name),groupSource(fd.leads).map(x=>x.count));
  if($('#ownerChart'))bar('ownerChart',group(fd.pipe,'owner_name').slice(0,8),'value',true,'#22c55e');
  if($('#coverageChart'))bar('coverageChart',group(fd.rank,'country').slice(0,8),'count',true,'#2f6df6');
  if($('#sourcePerfChart'))bar('sourcePerfChart',(fd.source||[]).map(r=>({name:r.analytics_source||r.source_bucket,value:n(r.needs_contact),count:n(r.eligible_leads)})).sort((a,b)=>b.value-a.value).slice(0,10),'value',false,'#f59e0b');
  if($('#countryChart'))bar('countryChart',group(fd.rank,'country').slice(0,12),'count',true,'#2f6df6');
  if($('#stageChart'))bar('stageChart',group(fd.pipe,'dealstage').slice(0,10),'value',false,'#2f6df6');
  if($('#pipeOwnerChart'))bar('pipeOwnerChart',group(fd.pipe,'owner_name').slice(0,8),'value',true,'#22c55e');
  if($('#riskOwnerChart'))bar('riskOwnerChart',group(fd.pipe.filter(isRiskDeal),'owner_name').slice(0,8),'riskValue',true,'#ef4444');
  if($('#mixChart'))donut('mixChart',group(fd.pipe,'dealstage').slice(0,7).map(x=>x.name),group(fd.pipe,'dealstage').slice(0,7).map(x=>x.value));
}
function groupSource(rows){const m={};rows.forEach(r=>{const k=sourceOf(r);m[k]=m[k]||{name:k,count:0};m[k].count++});return Object.values(m).sort((a,b)=>b.count-a.count)}
function spark(id,labels,data,color){const el=$('#'+id);if(!el)return;charts.push(new Chart(el,{type:'line',data:{labels,datasets:[{data,borderColor:color,tension:.35,pointRadius:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{display:false},y:{display:false}}}}))}
function chartOpts(){return{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,position:'bottom',labels:{boxWidth:10,font:{size:10}}}},scales:{x:{grid:{display:false},ticks:{font:{size:10},maxTicksLimit:8}},y:{grid:{color:'#eef2f7'},ticks:{font:{size:10}}}}}}
function bar(id,rows,key,horizontal,color){const el=$('#'+id);if(!el)return;charts.push(new Chart(el,{type:'bar',data:{labels:rows.map(x=>x.name),datasets:[{label:'Value',data:rows.map(x=>n(x[key])),backgroundColor:color,borderRadius:8}]},options:{...chartOpts(),indexAxis:horizontal?'y':'x'}}))}
function donut(id,labels,data){const el=$('#'+id);if(!el)return;charts.push(new Chart(el,{type:'doughnut',data:{labels,datasets:[{data,backgroundColor:['#2f6df6','#f59e0b','#22c55e','#8b5cf6','#06b6d4','#ef4444','#64748b'],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:'62%',plugins:{legend:{display:true,position:'bottom',labels:{boxWidth:10,font:{size:10}}}}}}))}

function init(){load()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
