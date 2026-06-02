(function(){
'use strict';

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const fmt=new Intl.NumberFormat('en-US');
const usd=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0});
const n=v=>Number(v||0);
const num=v=>fmt.format(n(v));
const money=v=>usd.format(n(v));
const pct=v=>`${Math.round(n(v)*10)/10}%`;
const sum=(rows,key)=>(rows||[]).reduce((a,r)=>a+n(r[key]),0);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=v=>v?String(v).slice(0,10):'—';
const first=v=>String(v||'').split(/\s+/)[0]||'';
const uniq=a=>[...new Set((a||[]).filter(v=>v!==null&&v!==undefined&&String(v).trim()!==''))].sort((x,y)=>String(x).localeCompare(String(y)));
const by=(rows,key)=>Object.values((rows||[]).reduce((m,r)=>{const k=r[key]||'Unknown';(m[k]||(m[k]={key:k,rows:[]})).rows.push(r);return m;},{}));

const VIEWS={
  acqPeople:'vw_acq_person_summary_v3',
  acqDeals:'vw_acq_person_deals_v3',
  acqRank:'vw_acq_rank_coverage_v1',
  acqCountry:'vw_acq_country_coverage_v3',
  acqRankBreakdown:'vw_acq_rank_breakdown_v3',
  acqRep:'vw_acq_rep_leaderboard_v3',
  acqCompanyNext:'vw_acq_company_next_activity_v3',
  acqRisk:'vw_acq_deals_at_risk_v3',
  acqActivities:'vw_acq_activity_details_v1',
  retPeople:'vw_retention_person_summary_v3',
  retAccounts:'vw_retention_person_accounts_v3',
  retDeals:'vw_retention_person_deals_v3',
  retRole:'vw_retention_role_coverage_v3',
  retNext:'vw_retention_no_next_activity_v3',
  retActivities:'vw_retention_activity_details_v1',
  pnlMonthly:'vw_pnl_monthly_summary_v2',
  pnlCost:'vw_pnl_cost_breakdown_v2',
  pnlProduct:'vw_pnl_product_profitability_v3',
  leadSummary:'vw_acquisition_lead_summary',
  leadPriority:'vw_acquisition_priority_leads',
  leadSource:'vw_acquisition_lead_source_performance'
};

const state={area:'acquisition',page:'overview',q:'',filters:{country:'All',rank:'All',tier:'All',year:'All',month:'All',product:'All',status:'All'},data:{},loading:true,error:null};

async function fetchView(name,limit=9000){
  try{return await DB.fetchView(name,limit);}catch(e){console.warn('View failed',name,e);return [];}
}
async function load(){
  state.loading=true;renderShell();
  const entries=Object.entries(VIEWS);
  const values=await Promise.all(entries.map(([k,v])=>fetchView(v,k.includes('People')?300:9000)));
  entries.forEach(([k],i)=>state.data[k]=Array.isArray(values[i])?values[i]:[]);
  state.data.leadSummary=state.data.leadSummary[0]||{};
  state.loading=false;render();
}

function title(){
  if(state.area==='acquisition') return state.page==='overview'?'Acquisition Command Center':`Acquisition · ${personName('acq',state.page)}`;
  if(state.area==='retention') return state.page==='overview'?'Retention Command Center':`Retention · ${personName('ret',state.page)}`;
  return 'P&L Command Center';
}
function personName(type,key){const arr=type==='acq'?state.data.acqPeople:state.data.retPeople;return (arr||[]).find(x=>x.person_key===key)?.display_name||key;}
function setArea(area,page='overview'){state.area=area;state.page=page;state.q='';render();}
function setFilter(k,v){state.filters[k]=v;renderMain();}
function reset(){state.q='';state.filters={country:'All',rank:'All',tier:'All',year:'All',month:'All',product:'All',status:'All'};render();}
function match(r){const q=state.q.trim().toLowerCase();return !q||Object.values(r||{}).join(' ').toLowerCase().includes(q);}

function renderShell(){
  document.body.className='clean-dashboard';
  document.body.innerHTML=`
  <div class="app-shell">
    <aside id="sidebar" class="sidebar"></aside>
    <main class="workspace">
      <div id="topbar"></div>
      <div id="main"></div>
    </main>
  </div>
  <div id="drawer" class="drawer-backdrop"><div class="drawer"><div class="drawer-head"><div><h3 id="drawerTitle">Details</h3><p id="drawerSub">0 rows</p></div><button id="drawerClose">×</button></div><div id="drawerBody"></div></div></div>`;
  $('#drawerClose').onclick=()=>$('#drawer').classList.remove('open');
  $('#drawer').onclick=e=>{if(e.target.id==='drawer')$('#drawer').classList.remove('open');};
  renderSidebar();renderTopbar();
  $('#main').innerHTML='<div class="loading-card">Loading live Supabase command center…</div>';
}
function renderSidebar(){
  const acq=(state.data.acqPeople||[]).slice().sort((a,b)=>n(a.sort_order)-n(b.sort_order));
  const ret=(state.data.retPeople||[]).slice().sort((a,b)=>n(a.sort_order)-n(b.sort_order));
  const btn=(area,label,icon)=>`<button class="side-link ${state.area===area&&state.page==='overview'?'active':''}" data-area="${area}"><span>${icon}</span><b>${label}</b></button>`;
  const rep=(p,area)=>`<button class="rep-link ${state.area===area&&state.page===p.person_key?'active':''}" data-area="${area}" data-page="${esc(p.person_key)}"><i>${esc(first(p.display_name).slice(0,1))}</i><span>${esc(first(p.display_name))}</span>${p.page_type==='deals_only'?'<em>VIEW</em>':p.role_type?`<em>${esc(String(p.role_type).toUpperCase())}</em>`:''}</button>`;
  $('#sidebar').innerHTML=`
    <div class="brand-block"><div class="logo-mark">T</div><div><strong>Talentera</strong><small>Sales Command Center</small></div></div>
    <div class="side-scroll">
      <div class="side-label">Main</div>${btn('acquisition','Acquisition','📊')}${btn('retention','Retention','🛡️')}${btn('pnl','P&L','📈')}
      <div class="side-label">Acquisition Reps</div>${acq.map(p=>rep(p,'acquisition')).join('')}
      <div class="side-label">Retention Team</div>${ret.map(p=>rep(p,'retention')).join('')}
    </div>
    <div class="side-footer"><span class="live-dot"></span><div><b>Live Supabase</b><small>Production data</small></div></div>`;
  $$('.side-link,.rep-link',$('#sidebar')).forEach(b=>b.onclick=()=>setArea(b.dataset.area,b.dataset.page||'overview'));
}
function renderTopbar(){
  $('#topbar').innerHTML=`
  <div class="hero-bar">
    <div><div class="eyebrow">Talentera · Revenue Operations</div><h1>${esc(title())}</h1><p>${subTitle()}</p></div>
    <div class="hero-actions"><span class="live-badge"><i></i> Live Supabase</span><input id="globalSearch" placeholder="Search visible rows…" value="${esc(state.q)}"><button id="resetBtn">Reset</button><button id="refreshBtn">Refresh</button></div>
  </div>
  <div class="page-tabs">${tab('acquisition','Acquisition')}${tab('retention','Retention')}${tab('pnl','P&L')}</div>
  ${personTabs()}
  ${filterBar()}`;
  $('#globalSearch').oninput=e=>{state.q=e.target.value;renderMain();};
  $('#resetBtn').onclick=reset;$('#refreshBtn').onclick=load;
  $$('[data-top-area]').forEach(b=>b.onclick=()=>setArea(b.dataset.topArea));
  $$('[data-person]').forEach(b=>b.onclick=()=>setArea(state.area,b.dataset.person));
  bindFilters();
}
function subTitle(){
  if(state.area==='acquisition') return 'Rank A/B coverage, same-owner quality touches, pipeline risk, next activity and rep execution.';
  if(state.area==='retention') return 'RM and CSM account coverage, tier health, next activity, stale accounts and renewal pipeline.';
  return 'Executive P&L: booking, cashing, cost, margin, break-even and product profitability.';
}
function tab(area,label){return `<button class="top-tab ${state.area===area?'active':''}" data-top-area="${area}">${label}</button>`;}
function personTabs(){
  if(state.area==='pnl')return '';
  const arr=state.area==='acquisition'?state.data.acqPeople:state.data.retPeople;
  return `<div class="person-tabs"><button class="mini-tab ${state.page==='overview'?'active':''}" data-person="overview">Overview</button>${(arr||[]).map(p=>`<button class="mini-tab ${state.page===p.person_key?'active':''}" data-person="${esc(p.person_key)}">${esc(first(p.display_name))}</button>`).join('')}</div>`;
}
function select(id,label,opts,val){return `<label class="filter"><span>${label}</span><select id="${id}">${['All',...opts.filter(x=>String(x)!=='All')].map(o=>`<option value="${esc(o)}" ${String(o)===String(val)?'selected':''}>${o===''?'Empty':esc(o)}</option>`).join('')}</select></label>`;}
function filterBar(){const d=state.data;if(state.area==='acquisition')return `<div class="filters">${select('fCountry','Country',uniq((d.acqCountry||[]).map(x=>x.country)),state.filters.country)}${select('fRank','Rank',['A','B'],state.filters.rank)}</div>`;
if(state.area==='retention')return `<div class="filters">${select('fTier','Tier',['A','B','C',''],state.filters.tier)}${select('fProduct','Product',uniq((d.retAccounts||[]).map(x=>x.product)),state.filters.product)}${select('fStatus','Status',uniq((d.retAccounts||[]).map(x=>x.account_status||x.status_normalized||x.status)),state.filters.status)}</div>`;
return `<div class="filters">${select('fYear','Year',uniq((d.pnlMonthly||[]).map(x=>x.year)),state.filters.year)}${select('fProduct','Product',uniq((d.pnlMonthly||[]).map(x=>x.product)),state.filters.product)}</div>`;}
function bindFilters(){[['fCountry','country'],['fRank','rank'],['fTier','tier'],['fProduct','product'],['fStatus','status'],['fYear','year']].forEach(([id,k])=>{const el=$('#'+id);if(el)el.onchange=e=>setFilter(k,e.target.value);});}
function render(){renderSidebar();renderTopbar();renderMain();}
function renderMain(){if(state.loading)return; if(state.area==='acquisition')$('#main').innerHTML=state.page==='overview'?acqOverview():acqPerson(); else if(state.area==='retention')$('#main').innerHTML=state.page==='overview'?retOverview():retPerson(); else $('#main').innerHTML=pnlView(); bindDrilldowns();}

function applyAcqFilters(rows){return (rows||[]).filter(r=>(state.filters.country==='All'||String(r.country||'Unknown')===state.filters.country)&&(state.filters.rank==='All'||String(r.acquisition_rank)===state.filters.rank)&&match(r));}
function applyRetFilters(rows){return (rows||[]).filter(r=>(state.filters.tier==='All'||String(r.retention_tier??'')===state.filters.tier)&&(state.filters.product==='All'||String(r.product||'Unknown')===state.filters.product)&&(state.filters.status==='All'||String(r.account_status||r.status_normalized||r.status||'Unknown')===state.filters.status)&&match(r));}
function applyPnlFilters(rows){return (rows||[]).filter(r=>(state.filters.year==='All'||String(r.year)===state.filters.year)&&(state.filters.product==='All'||String(r.product||'Unknown')===state.filters.product)&&match(r));}

function kpi(label,value,sub,tone='green',key=''){return `<button class="kpi-card ${tone}" data-key="${esc(key)}"><span>${esc(label)}</span><strong>${value}</strong><small>${esc(sub||'')}</small></button>`;}
function section(title,sub,body,cls=''){return `<section class="panel ${cls}"><div class="panel-head"><div><h2>${esc(title)}</h2><p>${esc(sub||'')}</p></div></div><div class="panel-body">${body}</div></section>`;}
function table(rows,cols,limit=15){rows=(rows||[]).filter(match).slice(0,limit);if(!rows.length)return '<div class="empty">No rows for this selection.</div>';return `<div class="table-wrap"><table><thead><tr>${cols.map(c=>`<th>${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td>${c.render?c.render(r):esc(r[c.key]??'—')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
function pill(v,t='default'){return `<span class="pill ${t}">${esc(v??'—')}</span>`;}
function progress(rate){const r=Math.max(0,Math.min(100,n(rate)));return `<div class="progress"><i style="width:${r}%"></i><span>${pct(r)}</span></div>`;}
function openDrawer(title,rows,cols){rows=(rows||[]).filter(match);$('#drawerTitle').textContent=title;$('#drawerSub').textContent=`${num(rows.length)} rows`;$('#drawerBody').innerHTML=table(rows,cols,500);$('#drawer').classList.add('open');}
function bindDrilldowns(){ $$('[data-key]').forEach(b=>b.onclick=()=>drill(b.dataset.key)); }
function drill(key){const d=state.data;if(key==='acqRisk')return openDrawer('Deals at Risk',d.acqRisk.filter(x=>x.is_at_risk),dealCols());if(key==='acqNoNext')return openDrawer('Companies No Next Activity',d.acqCompanyNext.filter(x=>x.no_next_activity),companyCols());if(key==='acqStale')return openDrawer('Stale Companies',d.acqCompanyNext.filter(x=>x.is_stale_21d),companyCols());if(key==='retNoNext')return openDrawer('Retention No Next Activity',d.retNext.filter(x=>x.no_next_activity),retAccountCols());if(key==='retStale')return openDrawer('Retention Stale Accounts',d.retNext.filter(x=>x.is_stale_21d),retAccountCols());}

function acqOverview(){const d=state.data;let rank=applyAcqFilters(d.acqRank), country=(d.acqCountry||[]).filter(r=>state.filters.country==='All'||r.country===state.filters.country), risk=(d.acqRisk||[]).filter(x=>x.is_at_risk), no=(d.acqCompanyNext||[]).filter(x=>x.no_next_activity), stale=(d.acqCompanyNext||[]).filter(x=>x.is_stale_21d), touched=rank.filter(x=>x.is_touched), untouched=rank.filter(x=>!x.is_touched), A=rank.filter(x=>x.acquisition_rank==='A'), B=rank.filter(x=>x.acquisition_rank==='B'), leads=d.leadPriority||[], leadRate=n(d.leadSummary.lead_contact_rate_pct);
return `<div class="dashboard-grid">
  <div class="focus-panel span-12"><div><h2>Today’s Focus</h2><p>Critical action queue across leads, Rank A/B coverage and open pipeline risk.</p></div><div class="kpi-row">${kpi('Leads Need Contact',num(leads.length),'priority lead backlog','red')}${kpi('Rank A/B Untouched',num(untouched.length),`A ${num(A.filter(x=>!x.is_touched).length)} · B ${num(B.filter(x=>!x.is_touched).length)}`,'orange')}${kpi('Deals at Risk',num(risk.length),money(sum(risk,'amount')),'red','acqRisk')}${kpi('Lead Contact Rate',pct(leadRate),'live lead summary','green')}</div></div>
  ${section('Revenue Health','Open pipeline, won/lost and at-risk exposure.',cards([['Open Pipeline',money(sum(d.acqDeals.filter(x=>x.deal_status==='open'),'amount')),`${num(d.acqDeals.filter(x=>x.deal_status==='open').length)} deals`],['At Risk',money(sum(risk,'amount')),`${num(risk.length)} deals`],['Won Deals',num(d.acqDeals.filter(x=>x.deal_status==='won').length),money(sum(d.acqDeals.filter(x=>x.deal_status==='won'),'amount'))]]),'span-4')}
  ${section('Outreach Health','Same-owner connected calls and completed meetings.',cards([['Touched Companies',num(touched.length),`${pct(rank.length?touched.length/rank.length*100:0)} rate`],['Connected Calls',num(sum(rank,'connected_calls_count')),'all-time'],['Completed Meetings',num(sum(rank,'completed_meetings_count')),'all-time']]),'span-4')}
  ${section('Rep Execution','Team execution against Rank A/B assigned companies.',cards([['Active Reps',num((d.acqPeople||[]).filter(x=>x.page_type!=='deals_only').length),'fixed pages'],['Quality Touches',num(sum(rank,'quality_touch_count')),'connected + completed'],['Open Deals',num(sum(rank,'open_deals_count')),money(sum(rank,'open_deals_amount'))]]),'span-4')}
  ${section('Priority Actions','Actions sorted by operational urgency.',actionList([{t:'Contact untouched Rank A/B companies',s:'Same-owner quality touch required.',c:untouched.length,tone:'orange'},{t:'Schedule next activity',s:'Rank A/B companies with no planned action.',c:no.length,tone:'red',key:'acqNoNext'},{t:'Recover stale companies',s:'No recent activity in 21 days.',c:stale.length,tone:'orange',key:'acqStale'},{t:'Review deals at risk',s:'Open deals with no next activity, stale activity or 21+ days in stage.',c:risk.length,tone:'red',key:'acqRisk'}]),'span-5')}
  ${section('Country Coverage','Rank A/B coverage by country.',table(country.sort((a,b)=>n(b.untouched_companies)-n(a.untouched_companies)),countryCols(),12),'span-7')}
  ${section('Rank A/B Breakdown','Touched and untouched by rank.',table(d.acqRankBreakdown||[],rankCols(),10),'span-4')}
  ${section('Rep Leaderboard','Execution by fixed representative page.',table(d.acqRep||[],repCols(),20),'span-8')}
  ${section('Deals at Risk Details','Open deals requiring management attention.',table(risk.sort((a,b)=>n(b.amount)-n(a.amount)),dealCols(),15),'span-7')}
  ${section('No Next Activity','Rank A/B companies with no planned next activity.',table(no,companyCols(),15),'span-5')}
  ${section('Stale / Cold Coverage','Rank A/B companies with no recent activity in 21 days.',table(stale,companyCols(),15),'span-6')}
  ${section('Lead Source Performance','Grouped source coverage where available.',table(d.leadSource||[],sourceCols(),12),'span-6')}
</div>`;}
function acqPerson(){const d=state.data,p=state.page,person=(d.acqPeople||[]).find(x=>x.person_key===p)||{}, cov=(d.acqRank||[]).filter(x=>x.person_key===p), no=(d.acqCompanyNext||[]).filter(x=>x.person_key===p&&x.no_next_activity), stale=(d.acqCompanyNext||[]).filter(x=>x.person_key===p&&x.is_stale_21d), risk=(d.acqRisk||[]).filter(x=>x.person_key===p&&x.is_at_risk), open=(d.acqDeals||[]).filter(x=>x.person_key===p&&x.deal_status==='open'), won=(d.acqDeals||[]).filter(x=>x.person_key===p&&x.deal_status==='won'), lost=(d.acqDeals||[]).filter(x=>x.person_key===p&&x.deal_status==='lost');const countries=by(cov,'country').map(g=>({country:g.key,A:g.rows.filter(x=>x.acquisition_rank==='A').length,B:g.rows.filter(x=>x.acquisition_rank==='B').length,touched:g.rows.filter(x=>x.is_touched).length,untouched:g.rows.filter(x=>!x.is_touched).length,connected:sum(g.rows,'connected_calls_count'),completed:sum(g.rows,'completed_meetings_count'),open:sum(g.rows,'open_deals_count')}));
return `<div class="dashboard-grid"><div class="focus-panel span-12"><div><h2>${esc(person.display_name||'Rep')} Execution Snapshot</h2><p>Personal command center for Rank A/B coverage, quality touches, open deals and activity risk.</p></div><div class="kpi-row">${kpi('Rank A Companies',num(cov.filter(x=>x.acquisition_rank==='A').length),`${num(cov.filter(x=>x.acquisition_rank==='A'&&x.is_touched).length)} touched`,'green')}${kpi('Rank B Companies',num(cov.filter(x=>x.acquisition_rank==='B').length),`${num(cov.filter(x=>x.acquisition_rank==='B'&&x.is_touched).length)} touched`,'green')}${kpi('Touched / Untouched',`${num(cov.filter(x=>x.is_touched).length)} / ${num(cov.filter(x=>!x.is_touched).length)}`,'same-owner quality touch','blue')}${kpi('Open Deals',num(open.length),money(sum(open,'amount')),'orange')}</div></div>
${section('Activity Quality','All-time same-owner connected calls and completed meetings.',cards([['Connected Calls',num(sum(cov,'connected_calls_count')),'all-time'],['Completed Meetings',num(sum(cov,'completed_meetings_count')),'all-time'],['Quality Touches',num(sum(cov,'quality_touch_count')),'connected + completed']]),'span-4')}
${section('Person Priority Actions','Rep-specific next actions.',actionList([{t:'Contact untouched Rank A companies',s:'Focus high-rank coverage first.',c:cov.filter(x=>x.acquisition_rank==='A'&&!x.is_touched).length,tone:'red'},{t:'Contact untouched Rank B companies',s:'Build coverage consistency.',c:cov.filter(x=>x.acquisition_rank==='B'&&!x.is_touched).length,tone:'orange'},{t:'Schedule next activity',s:'Companies with no next activity.',c:no.length,tone:'red'},{t:'Recover risky deals',s:'Open deals at risk.',c:risk.length,tone:'red'}]),'span-4')}
${section('Person Country Coverage','Country split for this representative.',table(countries.sort((a,b)=>b.untouched-a.untouched),personCountryCols(),20),'span-4')}
${section('Correct Company Rank Coverage','Rank A/B company coverage from verified Supabase view.',table(cov,companyCols(),18),'span-7')}
${section('Person Deals at Risk','Open risky deals for this representative.',table(risk,dealCols(),14),'span-5')}
${section('Open Deals','Current open deals.',table(open,dealCols(),14),'span-4')}${section('Won Deals','Closed/won deals.',table(won,dealCols(),14),'span-4')}${section('Lost Deals','Closed/lost deals.',table(lost,dealCols(),14),'span-4')}
${section('Stale Companies','No recent activity in 21 days.',table(stale,companyCols(),16),'span-6')}${section('Activity Details','Same-owner calls and meetings.',table((d.acqActivities||[]).filter(x=>x.person_key===p),activityCols(),18),'span-6')}</div>`;}

function retOverview(){const d=state.data,roles=d.retRole||[],rm=roles.filter(x=>String(x.role_type).toLowerCase()==='rm'),csm=roles.filter(x=>String(x.role_type).toLowerCase()==='csm'),no=(d.retNext||[]).filter(x=>x.no_next_activity),stale=(d.retNext||[]).filter(x=>x.is_stale_21d),accounts=applyRetFilters(d.retAccounts||[]);return `<div class="dashboard-grid"><div class="focus-panel span-12"><div><h2>Retention Focus</h2><p>Financial health, RM/CSM execution, tier coverage and account follow-up risk.</p></div><div class="kpi-row">${kpi('Applicable Accounts',num(new Set(accounts.map(x=>x.company_id||x.company_name_key)).size),'filtered account scope','green')}${kpi('Empty Tier',num(accounts.filter(x=>String(x.retention_tier||'')==='').length),'blank tier field','orange')}${kpi('No Next Activity',num(no.length),'accounts with no planned action','red','retNoNext')}${kpi('Remaining Collection',money(sum(accounts,'remaining_value')),'financial snapshot','red')}</div></div>
${section('Financial Health','Booked, collected and remaining collection.',cards([['Booked',money(sum(accounts,'booked_value')),'sheet financials'],['Collected',money(sum(accounts,'collected_value')),'cash collected'],['Remaining',money(sum(accounts,'remaining_value')),'to follow']]),'span-4')}
${section('Activity Health','RM/CSM calls and meetings.',cards([['Touched Accounts',num(sum(roles,'touched_accounts')),'all roles'],['Untouched Accounts',num(sum(roles,'untouched_accounts')),'all roles'],['Completed MTD',num(sum(roles,'completed_meetings_mtd')),'meetings']]),'span-4')}
${section('Deal Health','Retention open/won/lost deal coverage.',cards([['Open Deals',num(sum(roles,'open_deals_count')),'pipeline'],['Won Deals',num(sum(roles,'won_deals_count')),'closed won'],['Lost Deals',num(sum(roles,'lost_deals_count')),'closed lost']]),'span-4')}
${section('RM Coverage','Company-owner based retention coverage.',table(rm,roleCols(),15),'span-6')}${section('CSM Coverage','CSM owner coverage from company CSM field.',table(csm,roleCols(),15),'span-6')}
${section('Retention No Next Activity','Accounts with no planned follow-up.',table(no,retAccountCols(),16),'span-6')}${section('Retention Stale Accounts','Accounts without recent activity in 21 days.',table(stale,retAccountCols(),16),'span-6')}</div>`;}
function retPerson(){const d=state.data,p=state.page,person=(d.retPeople||[]).find(x=>x.person_key===p)||{},accounts=applyRetFilters((d.retAccounts||[]).filter(x=>x.person_key===p)),no=(d.retNext||[]).filter(x=>x.person_key===p&&x.no_next_activity),stale=(d.retNext||[]).filter(x=>x.person_key===p&&x.is_stale_21d),deals=(d.retDeals||[]).filter(x=>x.person_key===p),open=deals.filter(x=>x.deal_status==='open'),won=deals.filter(x=>x.deal_status==='won'),lost=deals.filter(x=>x.deal_status==='lost');return `<div class="dashboard-grid"><div class="focus-panel span-12"><div><h2>${esc(person.display_name||'Retention Owner')} Account Command Center</h2><p>Fixed retention person page with tier, activity, deal and financial coverage.</p></div><div class="kpi-row">${kpi('Accounts',num(accounts.length),'filtered scope','green')}${kpi('Touched / Untouched',`${num(person.touched_accounts)} / ${num(person.untouched_accounts)}`,'quality touch','blue')}${kpi('Open Deals',num(open.length),money(sum(open,'amount')),'orange')}${kpi('Remaining',money(sum(accounts,'remaining_value')),'collection','red')}</div></div>${section('Tier Coverage','A/B/C/Empty account split.',cards([['Tier A',num(accounts.filter(x=>x.retention_tier==='A').length),'accounts'],['Tier B',num(accounts.filter(x=>x.retention_tier==='B').length),'accounts'],['Tier C',num(accounts.filter(x=>x.retention_tier==='C').length),'accounts'],['Empty',num(accounts.filter(x=>String(x.retention_tier||'')==='').length),'accounts']]),'span-4')}${section('Priority Actions','Retention follow-up actions.',actionList([{t:'Schedule next activity',s:'Accounts without planned follow-up.',c:no.length,tone:'red'},{t:'Recover stale accounts',s:'No recent activity in 21 days.',c:stale.length,tone:'orange'},{t:'Follow remaining collection',s:'Accounts with remaining value.',c:accounts.filter(x=>n(x.remaining_value)>0).length,tone:'red'}]),'span-4')}${section('Activity Quality','MTD/YTD calls and meetings.',cards([['Connected MTD',num(person.connected_calls_mtd),'calls'],['Completed MTD',num(person.completed_meetings_mtd),'meetings'],['Deals Created YTD',num(person.deals_created_ytd),'deals']]),'span-4')}${section('Applicable Accounts','Accounts assigned to this fixed page.',table(accounts,retAccountCols(),18),'span-7')}${section('No Next / Stale Accounts','Follow-up risk list.',table([...no,...stale],retAccountCols(),18),'span-5')}${section('Open Deals','Open retention deals.',table(open,dealCols(),16),'span-4')}${section('Won Deals','Won retention deals.',table(won,dealCols(),16),'span-4')}${section('Lost Deals','Lost retention deals.',table(lost,dealCols(),16),'span-4')}</div>`;}

function pnlView(){const d=state.data,monthly=applyPnlFilters(d.pnlMonthly||[]),prod=applyPnlFilters(d.pnlProduct||[]),y25=monthly.filter(x=>String(x.year)==='2025'),y26=monthly.filter(x=>String(x.year)==='2026'),cost=d.pnlCost||[];return `<div class="dashboard-grid"><div class="focus-panel span-12"><div><h2>P&L Executive Summary</h2><p>Booking, cashing, cost, net cash position, margin and product profitability.</p></div><div class="kpi-row">${kpi('Booking',money(sum(monthly,'booking')),'selected period','green')}${kpi('Cashing',money(sum(monthly,'cashing')),'cash collected','blue')}${kpi('Total Cost',money(sum(monthly,'total_cost')),'COGS + overheads','orange')}${kpi('Net Cash',money(sum(monthly,'net_cash_position')),'cash minus cost','green')}</div></div>${section('2025 vs 2026','Year comparison summary.',cards([['2025 Booking',money(sum(y25,'booking')),money(sum(y25,'net_cash_position'))+' net'],['2026 Booking',money(sum(y26,'booking')),money(sum(y26,'net_cash_position'))+' net'],['Net Margin',pct(sum(monthly,'booking')?sum(monthly,'net_cash_position')/sum(monthly,'booking')*100:0),'selected period'],['Break-even Gap',money(Math.max(0,sum(monthly,'total_cost')-sum(monthly,'cashing'))),'cost minus cash']]),'span-5')}${section('Product Profitability','Booking, cashing, cost, net and margin by product.',table(prod,productCols(),15),'span-7')}${section('Monthly P&L','Month-level financial movement.',table(monthly,monthlyCols(),18),'span-8')}${section('Cost Breakdown','COGS, overheads and support allocation.',table(cost,costCols(),12),'span-4')}</div>`;}

function cards(items){return `<div class="mini-cards">${items.map(i=>`<div><span>${esc(i[0])}</span><b>${i[1]}</b><small>${esc(i[2]||'')}</small></div>`).join('')}</div>`;}
function actionList(items){return `<div class="action-list">${items.filter(i=>n(i.c)>0).map((i,idx)=>`<button data-key="${esc(i.key||'')}" class="action ${i.tone||''}"><i>${idx+1}</i><div><b>${esc(i.t)}</b><span>${esc(i.s)}</span></div><strong>${num(i.c)}</strong></button>`).join('')||'<div class="empty">No priority actions for this selection.</div>'}</div>`;}

function countryCols(){return [{label:'Country',render:r=>r.country},{label:'Rank A',render:r=>num(r.rank_a_companies)},{label:'Rank B',render:r=>num(r.rank_b_companies)},{label:'Touched',render:r=>num(r.touched_companies)},{label:'Untouched',render:r=>num(r.untouched_companies)},{label:'Connected',render:r=>num(r.connected_calls)},{label:'Completed',render:r=>num(r.completed_meetings)},{label:'Open Deals',render:r=>num(r.open_deals)}];}
function rankCols(){return [{label:'Rank',render:r=>pill(r.acquisition_rank,'rank')},{label:'Companies',render:r=>num(r.companies)},{label:'Touched',render:r=>num(r.touched_companies)},{label:'Untouched',render:r=>num(r.untouched_companies)},{label:'Touch Rate',render:r=>progress(r.touched_rate_pct)},{label:'Connected',render:r=>num(r.connected_calls)},{label:'Completed',render:r=>num(r.completed_meetings)}];}
function repCols(){return [{label:'Rep',render:r=>r.display_name},{label:'Assigned',render:r=>num(r.assigned_rank_ab_companies)},{label:'Touched',render:r=>num(r.touched_companies)},{label:'Untouched',render:r=>num(r.untouched_companies)},{label:'Rate',render:r=>progress(r.touched_rate_pct)},{label:'Connected',render:r=>num(r.connected_calls)},{label:'Completed',render:r=>num(r.completed_meetings)},{label:'Open',render:r=>num(r.open_deals)}];}
function companyCols(){return [{label:'Company',render:r=>r.company_name},{label:'Owner',render:r=>r.display_name},{label:'Country',render:r=>r.country||'Unknown'},{label:'Rank',render:r=>pill(r.acquisition_rank,'rank')},{label:'Touch',render:r=>pill(r.touch_status,r.is_touched?'ok':'warn')},{label:'Connected',render:r=>num(r.connected_calls_count)},{label:'Completed',render:r=>num(r.completed_meetings_count)},{label:'Next Activity',render:r=>date(r.next_activity_date)}];}
function personCountryCols(){return [{label:'Country',render:r=>r.country},{label:'A',render:r=>num(r.A)},{label:'B',render:r=>num(r.B)},{label:'Touched',render:r=>num(r.touched)},{label:'Untouched',render:r=>num(r.untouched)},{label:'Connected',render:r=>num(r.connected)},{label:'Completed',render:r=>num(r.completed)},{label:'Open',render:r=>num(r.open)}];}
function dealCols(){return [{label:'Deal',render:r=>r.deal_name},{label:'Company',render:r=>r.company_name||r.account_name},{label:'Owner',render:r=>r.display_name},{label:'Stage',render:r=>pill(r.stage_label||r.deal_status,'stage')},{label:'Amount',render:r=>money(r.amount)},{label:'Days',render:r=>num(r.days_in_stage)},{label:'Next',render:r=>date(r.next_activity_date)},{label:'Last',render:r=>date(r.last_activity_date)}];}
function activityCols(){return [{label:'Type',render:r=>pill(r.activity_type,'stage')},{label:'Company',render:r=>r.company_name||r.account_name},{label:'Date',render:r=>date(r.activity_at)},{label:'Connected',render:r=>r.is_connected_call?'Yes':'—'},{label:'Completed',render:r=>r.is_completed_meeting?'Yes':'—'},{label:'Outcome',render:r=>r.outcome||'—'}];}
function sourceCols(){return [{label:'Source',render:r=>r.source_bucket||r.analytics_source||'Unknown'},{label:'Eligible',render:r=>num(r.eligible_leads||0)},{label:'Need Contact',render:r=>num(r.needs_contact||0)},{label:'Contacted',render:r=>num(r.contacted||0)}];}
function roleCols(){return [{label:'Person',render:r=>r.display_name},{label:'Role',render:r=>pill(r.role_type,'stage')},{label:'Accounts',render:r=>num(r.applicable_accounts)},{label:'Touched',render:r=>num(r.touched_accounts)},{label:'Untouched',render:r=>num(r.untouched_accounts)},{label:'Open',render:r=>num(r.open_deals_count)},{label:'Remaining',render:r=>money(r.remaining_value)}];}
function retAccountCols(){return [{label:'Account',render:r=>r.company_name},{label:'Person',render:r=>r.display_name},{label:'Role',render:r=>r.role_type||'—'},{label:'Tier',render:r=>pill(r.retention_tier||'Empty','rank')},{label:'Product',render:r=>r.product||'—'},{label:'Booked',render:r=>money(r.booked_value)},{label:'Remaining',render:r=>money(r.remaining_value)},{label:'Next',render:r=>date(r.next_activity_date)}];}
function productCols(){return [{label:'Product',render:r=>r.product},{label:'Booking',render:r=>money(r.booking)},{label:'Cashing',render:r=>money(r.cashing)},{label:'Cost',render:r=>money(r.total_cost)},{label:'Net',render:r=>money(r.net_cash_position)},{label:'Margin',render:r=>pct(r.net_margin_pct)},{label:'COGS',render:r=>money(r.cogs)},{label:'Overheads',render:r=>money(r.overheads)}];}
function monthlyCols(){return [{label:'Year',render:r=>r.year},{label:'Month',render:r=>r.month},{label:'Product',render:r=>r.product},{label:'Booking',render:r=>money(r.booking)},{label:'Cashing',render:r=>money(r.cashing)},{label:'Cost',render:r=>money(r.total_cost)},{label:'Net',render:r=>money(r.net_cash_position)}];}
function costCols(){return [{label:'Year',render:r=>r.year},{label:'Product',render:r=>r.product},{label:'COGS',render:r=>money(r.cogs)},{label:'Overheads',render:r=>money(r.overheads)},{label:'Support',render:r=>money(r.support_allocation)},{label:'Total',render:r=>money(r.total_cost)}];}

window.addEventListener('DOMContentLoaded',load);
})();