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
const sum=(rows,key)=>(rows||[]).reduce((a,r)=>a+n(r[key]),0);
const uniq=rows=>[...new Set(rows.filter(v=>v!==undefined&&v!==null&&String(v).trim()!==''))].sort((a,b)=>String(a).localeCompare(String(b)));
const safeRows=v=>Array.isArray(v)?v:[];
const date=v=>v?String(v).slice(0,10):'—';

const SOURCES={
  acqPersonSummary:'vw_acq_person_summary_v3',
  acqPersonDeals:'vw_acq_person_deals_v3',
  acqRankCoverage:'vw_acq_rank_coverage_v1',
  acqOverviewSummary:'vw_acq_overview_summary_v1',
  acqActivityDetails:'vw_acq_activity_details_v1',
  retentionPersonSummary:'vw_retention_person_summary_v3',
  retentionPersonAccounts:'vw_retention_person_accounts_v3',
  retentionPersonDeals:'vw_retention_person_deals_v3',
  retentionActivityDetails:'vw_retention_activity_details_v1',
  retentionOverviewSummary:'vw_retention_overview_summary_v1',
  pnlSummary:'vw_pnl_exec_summary_v2',
  pnlMonthly:'vw_pnl_monthly_summary_v2',
  pnlCosts:'vw_pnl_cost_breakdown_v2'
};

let charts=[];
let state={
  area:'acquisition',
  page:'overview',
  search:'',
  filters:{country:'All',rank:'All',tier:'All',year:'All',month:'All',product:'All',status:'All'},
  data:null
};

function destroyCharts(){charts.forEach(c=>{try{c.destroy()}catch(e){}});charts=[]}
async function view(name,limit=5000){
  if(!window.DB||!DB.fetchView) throw new Error('Supabase DB client is not loaded');
  try{return safeRows(await DB.fetchView(name,limit))}
  catch(e){console.warn('View unavailable:',name,e);return []}
}
async function load(){
  $('#app').innerHTML='<div class="loader">Loading live Supabase dashboard…</div>';
  const [
    acqPersonSummary,acqPersonDeals,acqRankCoverage,acqOverviewSummary,acqActivityDetails,
    retentionPersonSummary,retentionPersonAccounts,retentionPersonDeals,retentionActivityDetails,retentionOverviewSummary,
    pnlSummary,pnlMonthly,pnlCosts
  ]=await Promise.all([
    view(SOURCES.acqPersonSummary,200),
    view(SOURCES.acqPersonDeals,5000),
    view(SOURCES.acqRankCoverage,5000),
    view(SOURCES.acqOverviewSummary,1000),
    view(SOURCES.acqActivityDetails,8000),
    view(SOURCES.retentionPersonSummary,200),
    view(SOURCES.retentionPersonAccounts,5000),
    view(SOURCES.retentionPersonDeals,5000),
    view(SOURCES.retentionActivityDetails,10000),
    view(SOURCES.retentionOverviewSummary,2000),
    view(SOURCES.pnlSummary,200),
    view(SOURCES.pnlMonthly,2000),
    view(SOURCES.pnlCosts,500)
  ]);
  state.data={acqPersonSummary,acqPersonDeals,acqRankCoverage,acqOverviewSummary,acqActivityDetails,retentionPersonSummary,retentionPersonAccounts,retentionPersonDeals,retentionActivityDetails,retentionOverviewSummary,pnlSummary,pnlMonthly,pnlCosts};
  render();
}
function setRail(){
  const rails=$$('.rail-btn');
  const map=['acquisition','retention','retention','pnl','marketing'];
  rails.forEach((btn,i)=>{
    btn.classList.toggle('active',map[i]===state.area);
    btn.onclick=()=>{
      const next=map[i]||'acquisition';
      state.area=next==='marketing'?'acquisition':next;
      state.page='overview';
      render();
    };
  });
}
function resetFilters(){
  state.filters={country:'All',rank:'All',tier:'All',year:'All',month:'All',product:'All',status:'All'};
  state.search='';
}
function matchSearch(r){
  const q=state.search.trim().toLowerCase();
  return !q||Object.values(r||{}).join(' ').toLowerCase().includes(q);
}
function setPage(area,page){
  state.area=area;
  state.page=page;
  state.search='';
  render();
}
function currentTitle(){
  if(state.area==='acquisition') return state.page==='overview'?'Acquisition Command Center':`Acquisition · ${displayPageName(state.page)}`;
  if(state.area==='retention') return state.page==='overview'?'Retention Command Center':`Retention · ${displayPageName(state.page)}`;
  if(state.area==='pnl') return 'P&L Command Center';
  return 'Talentera Command Center';
}
function displayPageName(key){
  const all=[...(state.data?.acqPersonSummary||[]),...(state.data?.retentionPersonSummary||[])];
  return all.find(r=>r.person_key===key)?.display_name||key;
}
function topbar(){
  return `<div class="topbar">
    <div>
      <div class="eyebrow">Talentera · Live Supabase Dashboard</div>
      <h1 class="title">${esc(currentTitle())}</h1>
      <div class="subtitle">Fixed person pages, clean card mapping, live SQL views, mint glass light UI. Touched = same owner connected call or completed meeting.</div>
    </div>
    <div class="top-actions">
      <div class="live"><i></i> LIVE · SUPABASE</div>
      <input id="searchBox" class="select search" placeholder="Search visible data…" value="${esc(state.search)}" />
      <button id="resetBtn" class="btn">Reset</button>
      <button id="refreshBtn" class="btn primary">Refresh</button>
    </div>
  </div>`;
}
function mainTabs(){
  const tabs=[['acquisition','Acquisition'],['retention','Retention'],['pnl','P&L']];
  return `<div class="viewbar main-tabs"><span class="view-label">Main</span>${tabs.map(([id,label])=>`<button class="chip ${state.area===id?'active':''}" data-area="${id}"><i></i>${label}</button>`).join('')}</div>`;
}
function pageTabs(){
  const d=state.data||{};
  if(state.area==='acquisition'){
    const rows=[{person_key:'overview',display_name:'Overview'},...d.acqPersonSummary.sort((a,b)=>n(a.sort_order)-n(b.sort_order))];
    return `<div class="viewbar sub-tabs"><span class="view-label">Pages</span>${rows.map(r=>`<button class="chip ${state.page===r.person_key?'active':''}" data-page="${esc(r.person_key)}">${esc(firstName(r.display_name))}</button>`).join('')}</div>`;
  }
  if(state.area==='retention'){
    const rows=[{person_key:'overview',display_name:'Overview'},...d.retentionPersonSummary.sort((a,b)=>n(a.sort_order)-n(b.sort_order))];
    return `<div class="viewbar sub-tabs"><span class="view-label">Pages</span>${rows.map(r=>`<button class="chip ${state.page===r.person_key?'active':''}" data-page="${esc(r.person_key)}">${esc(firstName(r.display_name))}</button>`).join('')}</div>`;
  }
  return `<div class="viewbar sub-tabs"><span class="view-label">Views</span>${['Overview','Monthly','Cost','Product'].map((x,i)=>`<button class="chip ${i===0?'active':''}">${x}</button>`).join('')}</div>`;
}
function firstName(name){return String(name||'').split(/\s+/)[0]||name}
function filterSelect(id,label,options,current){
  return `<label class="filter"><span>${esc(label)}</span><select id="${id}" class="select">${['All',...options.filter(o=>String(o)!=='All')].map(o=>`<option value="${esc(o)}" ${String(current)===String(o)?'selected':''}>${o===''?'Empty Tier':esc(o)}</option>`).join('')}</select></label>`;
}
function filtersBar(){
  const d=state.data||{};
  if(state.area==='acquisition'){
    return `<div class="filters">
      ${filterSelect('filterCountry','Country',uniq(d.acqRankCoverage.map(r=>r.country||'Unknown')),state.filters.country)}
      ${filterSelect('filterRank','Rank',['A','B'],state.filters.rank)}
    </div>`;
  }
  if(state.area==='retention'){
    return `<div class="filters">
      ${filterSelect('filterYear','Year',uniq(d.retentionOverviewSummary.map(r=>r.year)),state.filters.year)}
      ${filterSelect('filterMonth','Month',uniq(d.retentionOverviewSummary.map(r=>r.month)),state.filters.month)}
      ${filterSelect('filterProduct','Product',uniq(d.retentionOverviewSummary.map(r=>r.product)),state.filters.product)}
      ${filterSelect('filterTier','Tier',['A','B','C',''],state.filters.tier)}
      ${filterSelect('filterStatus','Status',uniq(d.retentionOverviewSummary.map(r=>r.account_status)),state.filters.status)}
    </div>`;
  }
  if(state.area==='pnl'){
    return `<div class="filters">
      ${filterSelect('filterYear','Year',uniq(d.pnlMonthly.map(r=>r.year)),state.filters.year)}
      ${filterSelect('filterMonth','Month',uniq(d.pnlMonthly.map(r=>r.month)),state.filters.month)}
      ${filterSelect('filterProduct','Product',uniq(d.pnlMonthly.map(r=>r.product)),state.filters.product)}
    </div>`;
  }
  return '';
}
function metric(label,value,sub,key,tone='mint'){
  return `<button class="metric tone-${tone}" data-modal="${esc(key)}">
    <div class="metric-value">${value}</div>
    <div class="metric-label">${esc(label)}</div>
    <div class="metric-sub">${esc(sub||'')}</div>
  </button>`;
}
function kpi(label,value,sub,key,tone='mint'){
  return `<button class="kpi tone-${tone}" data-modal="${esc(key)}">
    <div class="kpi-head"><div><div class="kpi-label">${esc(label)}</div><div class="kpi-value">${value}</div><div class="kpi-sub">${esc(sub||'')}</div></div><span class="pill">${esc(tone)}</span></div>
  </button>`;
}
function section(title,sub,icon,body,extra=''){
  return `<section class="section"><div class="section-head"><div><div class="section-title"><span class="section-icon">${icon}</span>${esc(title)}</div><div class="section-sub">${esc(sub||'')}</div></div>${extra}</div><div class="body">${body}</div></section>`;
}
function table(rows,cols,limit=80){
  rows=safeRows(rows).filter(matchSearch);
  if(!rows.length)return '<div class="empty">No rows for this selection.</div>';
  return `<div class="table-wrap"><table class="table"><thead><tr>${cols.map(c=>`<th>${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${rows.slice(0,limit).map(r=>`<tr>${cols.map(c=>`<td>${c.render?c.render(r):esc(r[c.key]??'—')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function byFiltersAcq(rows){
  return rows.filter(r=>
    (state.filters.country==='All'||String(r.country||'Unknown')===String(state.filters.country)) &&
    (state.filters.rank==='All'||String(r.acquisition_rank)===String(state.filters.rank)) &&
    matchSearch(r)
  );
}
function byFiltersRetentionOverview(rows){
  return rows.filter(r=>
    (state.filters.year==='All'||String(r.year)===String(state.filters.year)) &&
    (state.filters.month==='All'||String(r.month)===String(state.filters.month)) &&
    (state.filters.product==='All'||String(r.product)===String(state.filters.product)) &&
    (state.filters.tier==='All'||String(r.retention_tier??'')===String(state.filters.tier)) &&
    (state.filters.status==='All'||String(r.account_status||'Unknown')===String(state.filters.status)) &&
    matchSearch(r)
  );
}
function byFiltersRetentionRows(rows){
  return rows.filter(r=>
    (state.filters.year==='All'||String(r.year)===String(state.filters.year)) &&
    (state.filters.month==='All'||String(r.month)===String(state.filters.month)) &&
    (state.filters.product==='All'||String(r.product)===String(state.filters.product)) &&
    (state.filters.tier==='All'||String(r.retention_tier??'')===String(state.filters.tier)) &&
    (state.filters.status==='All'||String(r.account_status||r.status_normalized||r.status||'Unknown')===String(state.filters.status)) &&
    matchSearch(r)
  );
}
function byFiltersPnl(rows){
  return rows.filter(r=>
    (state.filters.year==='All'||String(r.year)===String(state.filters.year)) &&
    (state.filters.month==='All'||String(r.month)===String(state.filters.month)) &&
    (state.filters.product==='All'||String(r.product)===String(state.filters.product)) &&
    matchSearch(r)
  );
}
function group(rows,key,valueKey){
  const m=new Map();
  rows.forEach(r=>{const k=String(r[key]??'Unknown')||'Unknown'; if(!m.has(k))m.set(k,{name:k,count:0,value:0,rows:[]}); const o=m.get(k);o.count++;o.value+=valueKey?n(r[valueKey]):1;o.rows.push(r)});
  return [...m.values()].sort((a,b)=>b.value-a.value||b.count-a.count);
}

const acqCompanyCols=[
  {label:'Company',key:'company_name'},
  {label:'Country',key:'country'},
  {label:'Rank',key:'acquisition_rank',render:r=>badge(r.acquisition_rank,'rank')},
  {label:'Touch',key:'touch_status',render:r=>badge(r.touch_status,r.is_touched?'ok':'warn')},
  {label:'Quality Touches',key:'quality_touch_count',render:r=>num(r.quality_touch_count)},
  {label:'Connected Calls',key:'connected_calls_count',render:r=>num(r.connected_calls_count)},
  {label:'Completed Meetings',key:'completed_meetings_count',render:r=>num(r.completed_meetings_count)},
  {label:'Open Deals',key:'open_deals_count',render:r=>num(r.open_deals_count)}
];
const activityCols=[
  {label:'Type',key:'activity_type',render:r=>badge(r.activity_type,'rank')},
  {label:'Company / Account',key:'company_name',render:r=>esc(r.company_name||r.account_name||'—')},
  {label:'Owner',key:'display_name'},
  {label:'Date',key:'activity_at',render:r=>date(r.activity_at)},
  {label:'Outcome',key:'outcome'},
  {label:'Connected',key:'is_connected_call',render:r=>r.is_connected_call?'<span class="ok">Yes</span>':'—'},
  {label:'Completed',key:'is_completed_meeting',render:r=>r.is_completed_meeting?'<span class="ok">Yes</span>':'—'}
];
const acqDealCols=[
  {label:'Deal',key:'deal_name'},
  {label:'Company',key:'company_name'},
  {label:'Rank',key:'acquisition_rank',render:r=>r.acquisition_rank?badge(r.acquisition_rank,'rank'):'—'},
  {label:'Stage',key:'stage_label',render:r=>badge(r.stage_label||'Open','stage')},
  {label:'Status',key:'deal_status',render:r=>badge(r.deal_status,r.deal_status==='open'?'rank':r.deal_status==='won'?'ok':'warn')},
  {label:'Amount',key:'amount',render:r=>money(r.amount)},
  {label:'Created',key:'created_at',render:r=>date(r.created_at)},
  {label:'Close',key:'close_date',render:r=>date(r.close_date)}
];
const retAccountCols=[
  {label:'Account',key:'company_name'},
  {label:'Tier',key:'retention_tier',render:r=>badge(r.retention_tier===''?'Empty':r.retention_tier,'tier')},
  {label:'Product',key:'product'},
  {label:'Status',key:'status_normalized',render:r=>badge(r.status_normalized||r.status||r.account_status||'Unknown','stage')},
  {label:'Budget',key:'budget_value',render:r=>money(r.budget_value)},
  {label:'Booked',key:'booked_value',render:r=>money(r.booked_value)},
  {label:'Collected',key:'collected_value',render:r=>money(r.collected_value)},
  {label:'Remaining',key:'remaining_value',render:r=>money(r.remaining_value)}
];
const retDealCols=[
  {label:'Deal',key:'deal_name'},
  {label:'Account',key:'account_name'},
  {label:'Tier',key:'retention_tier',render:r=>badge(r.retention_tier===''?'Empty':r.retention_tier,'tier')},
  {label:'Stage',key:'stage_label',render:r=>badge(r.stage_label||'Open','stage')},
  {label:'Status',key:'deal_status',render:r=>badge(r.deal_status,r.deal_status==='open'?'rank':r.deal_status==='won'?'ok':'warn')},
  {label:'Amount',key:'amount',render:r=>money(r.amount)},
  {label:'Created',key:'created_at',render:r=>date(r.created_at)},
  {label:'Close',key:'close_date',render:r=>date(r.close_date)}
];
function badge(v,tone='rank'){return `<span class="badge ${tone}">${esc(v??'—')}</span>`}

function acquisitionOverview(){
  const d=state.data;
  const rows=byFiltersAcq(d.acqRankCoverage);
  const summary=group(rows,'acquisition_rank');
  const rankA=rows.filter(r=>r.acquisition_rank==='A');
  const rankB=rows.filter(r=>r.acquisition_rank==='B');
  const touched=rows.filter(r=>r.is_touched);
  const untouched=rows.filter(r=>!r.is_touched);
  const deals=d.acqPersonDeals.filter(matchSearch);
  const open=deals.filter(r=>r.deal_status==='open'), won=deals.filter(r=>r.deal_status==='won'), lost=deals.filter(r=>r.deal_status==='lost');
  return `<div class="metrics">
    ${metric('Rank A Companies',num(rankA.length),`${num(rankA.filter(r=>r.is_touched).length)} touched · ${num(rankA.filter(r=>!r.is_touched).length)} untouched`,'acqRankA','mint')}
    ${metric('Rank B Companies',num(rankB.length),`${num(rankB.filter(r=>r.is_touched).length)} touched · ${num(rankB.filter(r=>!r.is_touched).length)} untouched`,'acqRankB','mint')}
    ${metric('Touched Companies',num(touched.length),'quality touch by same owner','acqTouched','green')}
    ${metric('Untouched Companies',num(untouched.length),'no connected call or completed meeting','acqUntouched','orange')}
    ${metric('Completed Meetings',num(sum(rows,'completed_meetings_count')),'all-time completed by same owner','acqMeetings','purple')}
    ${metric('Open Deals',num(open.length),money(sum(open,'amount')),'acqOpenDeals','blue')}
  </div>
  <div class="kpi-grid">
    ${kpi('Quality Touches',num(sum(rows,'quality_touch_count')),'connected calls + completed meetings, all-time','acqQuality','green')}
    ${kpi('Connected Calls',num(sum(rows,'connected_calls_count')),'same owner only, all-time','acqConnected','mint')}
    ${kpi('Won / Lost Deals',`${num(won.length)} / ${num(lost.length)}`,`${money(sum(won,'amount'))} won · ${money(sum(lost,'amount'))} lost`,'acqWonLost','blue')}
  </div>
  <div class="layout-2">
    ${section('Country Coverage','Touched and untouched Rank A/B companies by selected country','⌁','<canvas id="acqCountryChart" class="chart-lg"></canvas>')}
    ${section('Rank A/B Details','Only Rank A and Rank B. Touched requires same-owner connected call or completed meeting.','▰',table(rows,acqCompanyCols,80),'<button class="tab" data-modal="acqCoverage">Open all</button>')}
  </div>
  <div class="layout-2 mt">
    ${section('Open Acquisition Deals','Current open acquisition opportunities','●',table(open,acqDealCols,80),'<button class="tab" data-modal="acqOpenDeals">Open all</button>')}
    ${section('Acquisition Activity Details','Connected calls and completed meetings are quality touches; regular activity remains visible separately.','✓',table(d.acqActivityDetails.filter(matchSearch),activityCols,80),'<button class="tab" data-modal="acqActivities">Open all</button>')}
  </div>`;
}
function acquisitionPerson(){
  const d=state.data;
  const p=d.acqPersonSummary.find(r=>r.person_key===state.page)||{};
  const coverage=byFiltersAcq(d.acqRankCoverage.filter(r=>r.person_key===state.page));
  const deals=d.acqPersonDeals.filter(r=>r.person_key===state.page&&matchSearch(r));
  const acts=d.acqActivityDetails.filter(r=>r.person_key===state.page&&matchSearch(r));
  const open=deals.filter(r=>r.deal_status==='open'), won=deals.filter(r=>r.deal_status==='won'), lost=deals.filter(r=>r.deal_status==='lost');
  const dealsOnly=p.page_type==='deals_only';
  return `<div class="person-head"><div><h2>${esc(p.display_name)}</h2><p>${dealsOnly?'Deals-only acquisition page':'Full acquisition activity page'} · Rank cards use Rank A/B only.</p></div><span class="badge ${dealsOnly?'warn':'ok'}">${esc(p.page_type)}</span></div>
  <div class="metrics">
    ${metric('Assigned Companies',num(p.assigned_companies),'all assigned companies','personCompanies','mint')}
    ${metric('Rank A',num(p.rank_a_companies),'Rank A only','acqRankA','mint')}
    ${metric('Rank B',num(p.rank_b_companies),'Rank B only','acqRankB','mint')}
    ${metric('Open Deals',num(p.open_deals_count),money(p.open_deals_amount),'personOpenDeals','blue')}
    ${metric('Won Deals',num(p.won_deals_count),money(p.won_deals_amount),'personWonDeals','green')}
    ${metric('Lost Deals',num(p.lost_deals_count),money(p.lost_deals_amount),'personLostDeals','orange')}
  </div>
  ${dealsOnly?'':`<div class="kpi-grid">
    ${kpi('Calls MTD / YTD',`${num(p.calls_mtd)} / ${num(p.calls_ytd)}`,`${num(p.connected_calls_mtd)} MTD connected`,'personActivities','mint')}
    ${kpi('Meetings MTD / YTD',`${num(p.meetings_mtd)} / ${num(p.meetings_ytd)}`,`${num(p.completed_meetings_mtd)} MTD completed`,'personActivities','purple')}
    ${kpi('Touched / Untouched',`${num(coverage.filter(r=>r.is_touched).length)} / ${num(coverage.filter(r=>!r.is_touched).length)}`,'quality touch by same owner','personCoverage','green')}
  </div>`}
  <div class="layout-2">
    ${section('Company Rank Coverage','Rank A/B only. Touched = same owner connected call or completed meeting.','▰',table(coverage,acqCompanyCols,80),'<button class="tab" data-modal="personCoverage">Open all</button>')}
    ${section('Open Deals','Deals owned by this person','●',table(open,acqDealCols,80),'<button class="tab" data-modal="personOpenDeals">Open all</button>')}
  </div>
  <div class="layout-2 mt">
    ${section('Won Deals','Closed/won acquisition deals','✓',table(won,acqDealCols,80),'<button class="tab" data-modal="personWonDeals">Open all</button>')}
    ${section('Lost Deals','Closed/lost acquisition deals','!',table(lost,acqDealCols,80),'<button class="tab" data-modal="personLostDeals">Open all</button>')}
  </div>
  ${dealsOnly?'':`<div class="mt">${section('Activity Details','Same-owner calls and meetings for this page','⌁',table(acts,activityCols,120),'<button class="tab" data-modal="personActivities">Open all</button>')}</div>`}`;
}
function retentionOverview(){
  const d=state.data;
  const rows=byFiltersRetentionOverview(d.retentionOverviewSummary);
  const acc=byFiltersRetentionRows(d.retentionPersonAccounts);
  const acts=d.retentionActivityDetails.filter(matchSearch);
  const accounts=sum(rows,'accounts_count'), touched=sum(d.retentionPersonSummary,'touched_accounts'), untouched=sum(d.retentionPersonSummary,'untouched_accounts');
  return `<div class="metrics">
    ${metric('Applicable Accounts',num(accounts),'deduped overview by filters','retAccounts','mint')}
    ${metric('Tier A / B / C',`${num(sum(rows.filter(r=>r.retention_tier==='A'),'accounts_count'))} / ${num(sum(rows.filter(r=>r.retention_tier==='B'),'accounts_count'))} / ${num(sum(rows.filter(r=>r.retention_tier==='C'),'accounts_count'))}`,'retention tiers only','retAccounts','mint')}
    ${metric('Empty Tier',num(sum(rows.filter(r=>String(r.retention_tier||'')===''),'accounts_count')),'blank/null tier field','retAccounts','orange')}
    ${metric('Booked',money(sum(rows,'booked_value')),'sheet financial snapshot','retAccounts','green')}
    ${metric('Collected',money(sum(rows,'collected_value')),'cash collection','retAccounts','blue')}
    ${metric('Remaining',money(sum(rows,'remaining_value')),'remaining collection','retAccounts','orange')}
  </div>
  <div class="kpi-grid">
    ${kpi('Calls / Connected MTD',`${num(sum(rows,'calls_mtd'))} / ${num(sum(rows,'connected_calls_mtd'))}`,'same-owner activity where applicable','retActivities','mint')}
    ${kpi('Meetings / Completed MTD',`${num(sum(rows,'meetings_mtd'))} / ${num(sum(rows,'completed_meetings_mtd'))}`,'completed meetings from selected scope','retActivities','purple')}
    ${kpi('Open Deals',num(sum(rows,'open_deals_count')),money(sum(rows,'open_deals_amount')),'retDeals','blue')}
  </div>
  <div class="layout-2">
    ${section('Retention Overview by Product / Tier','Financial + activity summary from deduped overview view','▰',table(rows,[
      {label:'Year',key:'year'},{label:'Month',key:'month'},{label:'Product',key:'product'},{label:'Tier',key:'retention_tier',render:r=>badge(r.retention_tier===''?'Empty':r.retention_tier,'tier')},{label:'Accounts',key:'accounts_count',render:r=>num(r.accounts_count)},{label:'Booked',key:'booked_value',render:r=>money(r.booked_value)},{label:'Collected',key:'collected_value',render:r=>money(r.collected_value)}
    ],100),'<button class="tab" data-modal="retOverview">Open all</button>')}
    ${section('RM / CSM Touch Coverage','Touched = same RM/CSM connected call or completed meeting, all-time','✓',table(d.retentionPersonSummary,[
      {label:'Person',key:'display_name'},{label:'Role',key:'role_type',render:r=>badge(r.role_type,'rank')},{label:'Accounts',key:'applicable_accounts',render:r=>num(r.applicable_accounts)},{label:'Touched',key:'touched_accounts',render:r=>num(r.touched_accounts)},{label:'Untouched',key:'untouched_accounts',render:r=>num(r.untouched_accounts)}
    ],80))}
  </div>
  <div class="layout-2 mt">
    ${section('Applicable Accounts','Filtered account financial table','●',table(acc,retAccountCols,100),'<button class="tab" data-modal="retAccounts">Open all</button>')}
    ${section('Retention Activity Details','Same-owner activity only for RM/CSM pages','⌁',table(acts,activityCols,100),'<button class="tab" data-modal="retActivities">Open all</button>')}
  </div>`;
}
function retentionPerson(){
  const d=state.data;
  const p=d.retentionPersonSummary.find(r=>r.person_key===state.page)||{};
  const accounts=byFiltersRetentionRows(d.retentionPersonAccounts.filter(r=>r.person_key===state.page));
  const deals=d.retentionPersonDeals.filter(r=>r.person_key===state.page&&matchSearch(r));
  const acts=d.retentionActivityDetails.filter(r=>r.person_key===state.page&&matchSearch(r));
  const open=deals.filter(r=>r.deal_status==='open'), won=deals.filter(r=>r.deal_status==='won'), lost=deals.filter(r=>r.deal_status==='lost');
  return `<div class="person-head"><div><h2>${esc(p.display_name)}</h2><p>${String(p.role_type||'').toUpperCase()} fixed page · Tier A/B/C/Empty · touched uses same-owner quality touch.</p></div><span class="badge tier">${esc(p.role_type)}</span></div>
  <div class="metrics">
    ${metric('Applicable Accounts',num(p.applicable_accounts),'sheet ownership scope','retPersonAccounts','mint')}
    ${metric('Tier A / B / C',`${num(p.tier_a_accounts)} / ${num(p.tier_b_accounts)} / ${num(p.tier_c_accounts)}`,'retention tiers','retPersonAccounts','mint')}
    ${metric('Empty Tier',num(p.empty_tier_accounts),'blank tier field','retPersonAccounts','orange')}
    ${metric('Touched / Untouched',`${num(p.touched_accounts)} / ${num(p.untouched_accounts)}`,'quality touch all-time','retPersonActivities','green')}
    ${metric('Booked',money(p.booked_value),'sheet booked value','retPersonAccounts','blue')}
    ${metric('Remaining',money(p.remaining_value),'sheet remaining value','retPersonAccounts','orange')}
  </div>
  <div class="kpi-grid">
    ${kpi('Calls MTD / YTD',`${num(p.calls_mtd)} / ${num(p.calls_ytd)}`,`${num(p.connected_calls_mtd)} MTD connected`,'retPersonActivities','mint')}
    ${kpi('Meetings MTD / YTD',`${num(p.meetings_mtd)} / ${num(p.meetings_ytd)}`,`${num(p.completed_meetings_mtd)} MTD completed`,'retPersonActivities','purple')}
    ${kpi('Deals Created MTD / YTD',`${num(p.deals_created_mtd)} / ${num(p.deals_created_ytd)}`,'retention pipeline','retPersonDeals','blue')}
  </div>
  <div class="layout-2">
    ${section('Applicable Accounts','Accounts assigned by RM/CSM sheet scope','▰',table(accounts,retAccountCols,100),'<button class="tab" data-modal="retPersonAccounts">Open all</button>')}
    ${section('Open Deals','Retention open deals connected to applicable accounts','●',table(open,retDealCols,100),'<button class="tab" data-modal="retPersonOpenDeals">Open all</button>')}
  </div>
  <div class="layout-2 mt">
    ${section('Won Deals','Retention won deals','✓',table(won,retDealCols,100),'<button class="tab" data-modal="retPersonWonDeals">Open all</button>')}
    ${section('Lost Deals','Retention lost deals','!',table(lost,retDealCols,100),'<button class="tab" data-modal="retPersonLostDeals">Open all</button>')}
  </div>
  <div class="mt">${section('Activity Details','Only same-owner calls/meetings for this RM/CSM','⌁',table(acts,activityCols,160),'<button class="tab" data-modal="retPersonActivities">Open all</button>')}</div>`;
}
function pnlView(){
  const d=state.data;
  const rows=byFiltersPnl(d.pnlMonthly);
  const exec=state.filters.year==='All'?d.pnlSummary:d.pnlSummary.filter(r=>String(r.year)===String(state.filters.year));
  const costs=byFiltersPnl(d.pnlCosts);
  return `<div class="metrics">
    ${metric('Booking',money(sum(rows,'booking')||sum(exec,'booking')),'revenue booking','pnlMonthly','green')}
    ${metric('Cashing',money(sum(rows,'cashing')||sum(exec,'cashing')),'cash collected','pnlMonthly','blue')}
    ${metric('Total Cost',money(sum(rows,'total_cost')||sum(exec,'total_cost')),'COGS + overheads + support allocation','pnlCosts','orange')}
    ${metric('Net Cash Position',money(sum(rows,'net_cash_position')||sum(exec,'net_cash_position')),'cash minus cost','pnlMonthly','mint')}
    ${metric('COGS',money(sum(rows,'cogs')||sum(costs,'cogs')),'cost component','pnlCosts','orange')}
    ${metric('Overheads',money(sum(rows,'overheads')||sum(costs,'overheads')),'cost component','pnlCosts','orange')}
  </div>
  <div class="layout-2">
    ${section('Monthly P&L','Booking, cashing, costs and net position','▰','<canvas id="pnlMonthlyChart" class="chart-lg"></canvas>')}
    ${section('Cost Breakdown','COGS, overheads and support allocation','⌁',table(costs,[
      {label:'Year',key:'year'},{label:'Product',key:'product'},{label:'COGS',key:'cogs',render:r=>money(r.cogs)},{label:'Overheads',key:'overheads',render:r=>money(r.overheads)},{label:'Support Allocation',key:'support_allocation',render:r=>money(r.support_allocation)},{label:'Total Cost',key:'total_cost',render:r=>money(r.total_cost)}
    ],100),'<button class="tab" data-modal="pnlCosts">Open all</button>')}
  </div>
  <div class="mt">${section('P&L Monthly Details','Filtered monthly rows','≡',table(rows,[
    {label:'Year',key:'year'},{label:'Month',key:'month'},{label:'Product',key:'product'},{label:'Booking',key:'booking',render:r=>money(r.booking)},{label:'Cashing',key:'cashing',render:r=>money(r.cashing)},{label:'Total Cost',key:'total_cost',render:r=>money(r.total_cost)},{label:'Net Cash',key:'net_cash_position',render:r=>money(r.net_cash_position)}
  ],140),'<button class="tab" data-modal="pnlMonthly">Open all</button>')}</div>`;
}
function render(){
  destroyCharts();
  let body='';
  if(state.area==='acquisition') body=state.page==='overview'?acquisitionOverview():acquisitionPerson();
  else if(state.area==='retention') body=state.page==='overview'?retentionOverview():retentionPerson();
  else body=pnlView();
  $('#app').innerHTML=topbar()+mainTabs()+pageTabs()+filtersBar()+body;
  bind();
  setRail();
  draw();
}
function bind(){
  $('#searchBox').oninput=e=>{state.search=e.target.value;render()};
  $('#refreshBtn').onclick=load;
  $('#resetBtn').onclick=()=>{resetFilters();render()};
  $$('[data-area]').forEach(b=>b.onclick=()=>{state.area=b.dataset.area;state.page='overview';render()});
  $$('[data-page]').forEach(b=>b.onclick=()=>setPage(state.area,b.dataset.page));
  $$('[data-modal]').forEach(el=>el.onclick=()=>openModal(el.dataset.modal));
  const bindFilter=(id,key)=>{const el=$('#'+id); if(el)el.onchange=e=>{state.filters[key]=e.target.value;render()}};
  bindFilter('filterCountry','country');bindFilter('filterRank','rank');bindFilter('filterYear','year');bindFilter('filterMonth','month');bindFilter('filterProduct','product');bindFilter('filterTier','tier');bindFilter('filterStatus','status');
  $('#modalClose').onclick=()=>$('#modalBackdrop').classList.remove('open');
  $('#modalBackdrop').onclick=e=>{if(e.target.id==='modalBackdrop')$('#modalBackdrop').classList.remove('open')};
}
function modal(title,rows,cols){
  rows=safeRows(rows).filter(matchSearch);
  $('#modalTitle').textContent=title;
  $('#modalSub').textContent=`${num(rows.length)} rows`;
  $('#modalBody').innerHTML=`<div class="modal-tools"><input id="modalSearch" class="modal-search" placeholder="Search rows…"><button id="csvBtn" class="csv">Export CSV</button></div><div id="modalTable">${table(rows,cols,500)}</div>`;
  $('#modalBackdrop').classList.add('open');
  $('#modalSearch').oninput=e=>{const q=e.target.value.toLowerCase();const r=rows.filter(x=>Object.values(x||{}).join(' ').toLowerCase().includes(q));$('#modalSub').textContent=`${num(r.length)} rows`;$('#modalTable').innerHTML=table(r,cols,500)};
  $('#csvBtn').onclick=()=>exportCsv(title,rows,cols);
}
function openModal(key){
  const d=state.data;
  const acqCov=byFiltersAcq(d.acqRankCoverage);
  const acqDeals=d.acqPersonDeals.filter(matchSearch);
  const retAcc=byFiltersRetentionRows(d.retentionPersonAccounts);
  const retDeals=d.retentionPersonDeals.filter(matchSearch);
  const pnlRows=byFiltersPnl(d.pnlMonthly);
  const pnlCosts=byFiltersPnl(d.pnlCosts);
  const personAcqCov=acqCov.filter(r=>r.person_key===state.page);
  const personAcqDeals=acqDeals.filter(r=>r.person_key===state.page);
  const personRetAcc=retAcc.filter(r=>r.person_key===state.page);
  const personRetDeals=retDeals.filter(r=>r.person_key===state.page);
  const personRetActs=d.retentionActivityDetails.filter(r=>r.person_key===state.page&&matchSearch(r));
  const personAcqActs=d.acqActivityDetails.filter(r=>r.person_key===state.page&&matchSearch(r));
  const map={
    acqCoverage:['Acquisition Rank A/B Coverage',acqCov,acqCompanyCols],
    acqRankA:['Rank A Companies',acqCov.filter(r=>r.acquisition_rank==='A'),acqCompanyCols],
    acqRankB:['Rank B Companies',acqCov.filter(r=>r.acquisition_rank==='B'),acqCompanyCols],
    acqTouched:['Touched Companies',acqCov.filter(r=>r.is_touched),acqCompanyCols],
    acqUntouched:['Untouched Companies',acqCov.filter(r=>!r.is_touched),acqCompanyCols],
    acqMeetings:['Acquisition Completed Meetings',d.acqActivityDetails.filter(r=>r.is_completed_meeting&&matchSearch(r)),activityCols],
    acqConnected:['Acquisition Connected Calls',d.acqActivityDetails.filter(r=>r.is_connected_call&&matchSearch(r)),activityCols],
    acqQuality:['Acquisition Quality Touch Details',d.acqActivityDetails.filter(r=>(r.is_connected_call||r.is_completed_meeting)&&matchSearch(r)),activityCols],
    acqActivities:['Acquisition Activity Details',d.acqActivityDetails.filter(matchSearch),activityCols],
    acqOpenDeals:['Acquisition Open Deals',acqDeals.filter(r=>r.deal_status==='open'),acqDealCols],
    acqWonLost:['Acquisition Won/Lost Deals',acqDeals.filter(r=>r.deal_status!=='open'),acqDealCols],
    personCoverage:['Person Rank Coverage',personAcqCov,acqCompanyCols],
    personOpenDeals:['Person Open Deals',personAcqDeals.filter(r=>r.deal_status==='open'),acqDealCols],
    personWonDeals:['Person Won Deals',personAcqDeals.filter(r=>r.deal_status==='won'),acqDealCols],
    personLostDeals:['Person Lost Deals',personAcqDeals.filter(r=>r.deal_status==='lost'),acqDealCols],
    personActivities:['Person Activity Details',personAcqActs,activityCols],
    retOverview:['Retention Overview Summary',byFiltersRetentionOverview(d.retentionOverviewSummary),[
      {label:'Year',key:'year'},{label:'Month',key:'month'},{label:'Product',key:'product'},{label:'Tier',key:'retention_tier',render:r=>badge(r.retention_tier===''?'Empty':r.retention_tier,'tier')},{label:'Accounts',key:'accounts_count',render:r=>num(r.accounts_count)},{label:'Booked',key:'booked_value',render:r=>money(r.booked_value)}
    ]],
    retAccounts:['Retention Applicable Accounts',retAcc,retAccountCols],
    retActivities:['Retention Activity Details',d.retentionActivityDetails.filter(matchSearch),activityCols],
    retDeals:['Retention Deals',retDeals,retDealCols],
    retPersonAccounts:['Person Applicable Accounts',personRetAcc,retAccountCols],
    retPersonDeals:['Person Retention Deals',personRetDeals,retDealCols],
    retPersonOpenDeals:['Person Open Deals',personRetDeals.filter(r=>r.deal_status==='open'),retDealCols],
    retPersonWonDeals:['Person Won Deals',personRetDeals.filter(r=>r.deal_status==='won'),retDealCols],
    retPersonLostDeals:['Person Lost Deals',personRetDeals.filter(r=>r.deal_status==='lost'),retDealCols],
    retPersonActivities:['Person Retention Activities',personRetActs,activityCols],
    pnlMonthly:['P&L Monthly Details',pnlRows,[
      {label:'Year',key:'year'},{label:'Month',key:'month'},{label:'Product',key:'product'},{label:'Booking',key:'booking',render:r=>money(r.booking)},{label:'Cashing',key:'cashing',render:r=>money(r.cashing)},{label:'Cost',key:'total_cost',render:r=>money(r.total_cost)},{label:'Net',key:'net_cash_position',render:r=>money(r.net_cash_position)}
    ]],
    pnlCosts:['P&L Cost Breakdown',pnlCosts,[
      {label:'Year',key:'year'},{label:'Product',key:'product'},{label:'COGS',key:'cogs',render:r=>money(r.cogs)},{label:'Overheads',key:'overheads',render:r=>money(r.overheads)},{label:'Support Allocation',key:'support_allocation',render:r=>money(r.support_allocation)},{label:'Total Cost',key:'total_cost',render:r=>money(r.total_cost)}
    ]]
  };
  const m=map[key]||map.acqCoverage;
  return modal(m[0],m[1],m[2]);
}
function exportCsv(title,rows,cols){
  const csv=[cols.map(c=>`"${c.label}"`).join(',')].concat(rows.map(r=>cols.map(c=>`"${String(r[c.key]??'').replace(/"/g,'""')}"`).join(','))).join('\n');
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download=title.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.csv';
  a.click();
}
function draw(){
  if(!window.Chart)return;
  if(state.area==='acquisition'){
    const rows=byFiltersAcq(state.data.acqRankCoverage);
    const byCountry=group(rows,'country');
    bar('acqCountryChart',byCountry.map(x=>({name:x.name,value:x.rows.filter(r=>r.is_touched).length,count:x.rows.length})), 'count', true);
  }
  if(state.area==='pnl'){
    const rows=byFiltersPnl(state.data.pnlMonthly).sort((a,b)=>n(a.year)-n(b.year)||n(a.month_index)-n(b.month_index));
    const labels=rows.map(r=>`${r.month||''} ${r.year||''}`);
    const el=$('#pnlMonthlyChart');
    if(el)charts.push(new Chart(el,{type:'line',data:{labels,datasets:[
      {label:'Booking',data:rows.map(r=>n(r.booking)),borderColor:'#10b981',backgroundColor:'rgba(16,185,129,.12)',fill:true,tension:.35,pointRadius:2},
      {label:'Cashing',data:rows.map(r=>n(r.cashing)),borderColor:'#0ea5e9',backgroundColor:'rgba(14,165,233,.10)',fill:true,tension:.35,pointRadius:2},
      {label:'Total Cost',data:rows.map(r=>n(r.total_cost)),borderColor:'#f59e0b',backgroundColor:'rgba(245,158,11,.10)',fill:true,tension:.35,pointRadius:2},
      {label:'Net Cash',data:rows.map(r=>n(r.net_cash_position)),borderColor:'#64748b',tension:.35,pointRadius:2}
    ]},options:chartOpts()}));
  }
}
function bar(id,rows,key='value',horizontal=false){
  const el=$('#'+id);if(!el)return;
  charts.push(new Chart(el,{type:'bar',data:{labels:rows.map(x=>x.name),datasets:[
    {label:'Total',data:rows.map(x=>n(x.count)),backgroundColor:'rgba(20,184,166,.28)',borderColor:'#14b8a6',borderWidth:1,borderRadius:10},
    {label:'Touched',data:rows.map(x=>n(x.value)),backgroundColor:'rgba(16,185,129,.60)',borderColor:'#10b981',borderWidth:1,borderRadius:10}
  ]},options:{...chartOpts(),indexAxis:horizontal?'y':'x'} }))
}
function chartOpts(){
  return{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,position:'bottom',labels:{boxWidth:10,font:{size:10}}}},scales:{x:{grid:{display:false},ticks:{font:{size:10},maxTicksLimit:10}},y:{grid:{color:'rgba(15,118,110,.08)'},ticks:{font:{size:10}}}}}
}
function init(){load()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();

})();