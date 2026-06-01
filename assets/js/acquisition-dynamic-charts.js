(function(){
'use strict';

const esc=v=>window.U?.esc?window.U.esc(v==null?'':String(v)):String(v??'');
const num=v=>window.U?.num?window.U.num(v):Number(v||0).toLocaleString();
const money=v=>window.U?.money?window.U.money(v):'$'+Number(v||0).toLocaleString();
const pct=v=>window.U?.pct?window.U.pct(v):Number(v||0).toFixed(1)+'%';
const n=v=>Number(v||0);
const sum=(arr,key)=>(arr||[]).reduce((a,b)=>a+n(b[key]),0);
let installed=false;
let chartInstances=[];

function destroyCharts(){
  chartInstances.forEach(c=>{try{c.destroy();}catch(e){}});
  chartInstances=[];
}

function css(){
  if(document.getElementById('acqDynamicChartsStyle')) return;
  const s=document.createElement('style');
  s.id='acqDynamicChartsStyle';
  s.textContent=`
    .acq-chart-dashboard{margin:0 0 18px;display:grid;gap:14px}
    .acq-chart-kpi-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
    .acq-chart-kpi{background:rgba(255,255,255,.86);border:1px solid rgba(22,64,42,.10);border-radius:16px;padding:14px 16px;box-shadow:0 8px 22px rgba(17,47,31,.06);cursor:pointer;min-height:150px;transition:.16s transform,.16s box-shadow}
    .acq-chart-kpi:hover{transform:translateY(-1px);box-shadow:0 14px 32px rgba(17,47,31,.09)}
    .acq-chart-kpi-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:8px}
    .acq-chart-kpi-label{font-size:10px;font-weight:900;color:#52675d;text-transform:uppercase;letter-spacing:.10em}
    .acq-chart-kpi-value{font-family:var(--mono);font-size:28px;font-weight:900;letter-spacing:-.04em;color:#102116;margin-top:4px}
    .acq-chart-kpi-sub{font-size:10px;font-weight:800;color:#7b9086;margin-top:2px}
    .acq-chart-canvas-sm{height:64px!important;width:100%!important;margin-top:8px}
    .acq-chart-section{background:rgba(255,255,255,.86);border:1px solid rgba(22,64,42,.10);border-radius:18px;box-shadow:0 8px 22px rgba(17,47,31,.06);overflow:hidden}
    .acq-chart-section-hd{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 16px;background:rgba(248,251,249,.82);border-bottom:1px solid rgba(22,64,42,.09)}
    .acq-chart-section-title{font-size:12px;font-weight:950;color:#33483c;text-transform:uppercase;letter-spacing:.08em}
    .acq-chart-section-sub{font-size:10px;color:#789086;font-weight:800;margin-top:2px;text-transform:none;letter-spacing:0}
    .acq-chart-section-body{padding:16px}
    .acq-chart-two{display:grid;grid-template-columns:1.25fr .75fr;gap:14px}
    .acq-chart-three{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
    .acq-chart-lg{height:285px!important;width:100%!important}
    .acq-chart-md{height:230px!important;width:100%!important}
    .acq-chart-table{display:grid;gap:10px}
    .acq-chart-row{display:grid;grid-template-columns:minmax(120px,1fr) 90px 70px;gap:10px;align-items:center;font-size:11px;color:#33483c}
    .acq-chart-bar{height:8px;border-radius:999px;background:#e8f0ec;overflow:hidden}.acq-chart-bar span{display:block;height:100%;border-radius:999px;background:#2563eb}
    .acq-chart-click-note{font-size:9px;color:#789086;font-weight:800;text-transform:uppercase;letter-spacing:.08em}
    @media(max-width:1200px){.acq-chart-kpi-grid,.acq-chart-three{grid-template-columns:1fr 1fr}.acq-chart-two{grid-template-columns:1fr}}
    @media(max-width:800px){.acq-chart-kpi-grid,.acq-chart-three{grid-template-columns:1fr}}
  `;
  document.head.appendChild(s);
}

async function fetchViews(){
  const [trend, stage, source, rank, pipe, risk] = await Promise.all([
    window.DB.fetchView('vw_acquisition_daily_trend',100),
    window.DB.fetchView('vw_acquisition_deal_stage_mix',50),
    window.DB.fetchView('vw_acquisition_lead_source_performance',100),
    window.DB.fetchView('vw_dash_acq_rank_fast',2000),
    window.DB.fetchView('vw_acquisition_pipeline_details',1000),
    window.DB.fetchView('vw_acquisition_stuck_deals',500).catch(()=>[])
  ]);
  return {trend:trend||[],stage:stage||[],source:source||[],rank:rank||[],pipe:pipe||[],risk:risk||[]};
}

function openDetails(title, rows, cols){
  if(window.Modal?.open) window.Modal.open({title,rows,cols});
}

function chart(el, type, data, options){
  if(!window.Chart || !el) return null;
  const c=new Chart(el,{type,data,options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{mode:'index',intersect:false}},interaction:{mode:'index',intersect:false},scales:{x:{grid:{display:false},ticks:{maxTicksLimit:8,font:{size:9}}},y:{grid:{color:'rgba(22,64,42,.07)'},ticks:{font:{size:9}}}},...options}});
  chartInstances.push(c);
  return c;
}

function sourceRollup(rows){
  const map=new Map();
  for(const r of rows||[]){
    const k=r.source_bucket||'other';
    if(!map.has(k)) map.set(k,{source_bucket:k,total_contacts:0,eligible_leads:0,contacted_leads:0,needs_contact:0,connected_calls:0,completed_meetings:0});
    const o=map.get(k);
    ['total_contacts','eligible_leads','contacted_leads','needs_contact','connected_calls','completed_meetings'].forEach(x=>o[x]+=n(r[x]));
  }
  return [...map.values()].map(r=>({...r,contact_rate_pct:r.eligible_leads?Math.round(r.contacted_leads/r.eligible_leads*1000)/10:0}));
}

function html(d){
  const t=d.trend||[];
  const last=t[t.length-1]||{};
  const calls=sum(t,'calls_logged');
  const connected=sum(t,'connected_calls');
  const leads=sum(t,'leads_created');
  const leadContact=sum(t,'leads_contacted');
  const pipeline=sum(d.pipe,'amount');
  const riskValue=sum(d.risk,'amount');
  const rankCountries=[...new Map((d.rank||[]).map(r=>[r.country,r])).keys()].filter(Boolean).length;
  const src=sourceRollup(d.source);
  const stageRows=(d.stage||[]).slice(0,8);
  const maxStage=Math.max(1,...stageRows.map(r=>n(r.pipeline_value)));
  return `<div class="acq-chart-dashboard" id="acqDynamicCharts">
    <div class="acq-chart-kpi-grid">
      <div class="acq-chart-kpi" data-chart-detail="calls"><div class="acq-chart-kpi-top"><div><div class="acq-chart-kpi-label">Calls Trend</div><div class="acq-chart-kpi-value">${num(calls)}</div><div class="acq-chart-kpi-sub">${num(connected)} connected · ${pct(calls?connected/calls*100:0)}</div></div><span class="badge bb">60d</span></div><canvas id="sparkCalls" class="acq-chart-canvas-sm"></canvas></div>
      <div class="acq-chart-kpi" data-chart-detail="leads"><div class="acq-chart-kpi-top"><div><div class="acq-chart-kpi-label">Lead Creation</div><div class="acq-chart-kpi-value">${num(leads)}</div><div class="acq-chart-kpi-sub">${num(leadContact)} contacted · ${pct(leads?leadContact/leads*100:0)}</div></div><span class="badge bg">Live</span></div><canvas id="sparkLeads" class="acq-chart-canvas-sm"></canvas></div>
      <div class="acq-chart-kpi" data-chart-detail="pipeline"><div class="acq-chart-kpi-top"><div><div class="acq-chart-kpi-label">Open Pipeline</div><div class="acq-chart-kpi-value">${money(pipeline)}</div><div class="acq-chart-kpi-sub">${money(riskValue)} at risk · ${num(d.pipe.length)} deals</div></div><span class="badge ba">Deals</span></div><canvas id="sparkPipeline" class="acq-chart-canvas-sm"></canvas></div>
    </div>

    <div class="acq-chart-two">
      <div class="acq-chart-section"><div class="acq-chart-section-hd"><div><div class="acq-chart-section-title">Lifecycle / Activity Funnel</div><div class="acq-chart-section-sub">Calls, meetings, leads and deals over the last 60 days</div></div><span class="acq-chart-click-note">click chart/cards for rows</span></div><div class="acq-chart-section-body"><canvas id="activityArea" class="acq-chart-lg"></canvas></div></div>
      <div class="acq-chart-section"><div class="acq-chart-section-hd"><div><div class="acq-chart-section-title">Lead Source Mix</div><div class="acq-chart-section-sub">Online/offline/import contact distribution</div></div><span class="badge bp">Dynamic</span></div><div class="acq-chart-section-body"><canvas id="sourceDonut" class="acq-chart-md"></canvas></div></div>
    </div>

    <div class="acq-chart-two">
      <div class="acq-chart-section"><div class="acq-chart-section-hd"><div><div class="acq-chart-section-title">Pipeline by Stage</div><div class="acq-chart-section-sub">Open deal value and stale-stage pressure</div></div><span class="badge ba">${num(d.stage.length)} stages</span></div><div class="acq-chart-section-body"><canvas id="stageBar" class="acq-chart-md"></canvas></div></div>
      <div class="acq-chart-section"><div class="acq-chart-section-hd"><div><div class="acq-chart-section-title">Top Stages</div><div class="acq-chart-section-sub">Value distribution</div></div><span class="badge bb">Details</span></div><div class="acq-chart-section-body"><div class="acq-chart-table">${stageRows.map(r=>`<div class="acq-chart-row"><div><strong>${esc(r.dealstage)}</strong><div class="acq-chart-bar"><span style="width:${Math.max(3,n(r.pipeline_value)/maxStage*100)}%"></span></div></div><div>${money(r.pipeline_value)}</div><div>${num(r.open_deals)}</div></div>`).join('')}</div></div></div>
    </div>

    <div class="acq-chart-three">
      <div class="acq-chart-section" data-chart-detail="rank"><div class="acq-chart-section-hd"><div><div class="acq-chart-section-title">Geographic Coverage</div><div class="acq-chart-section-sub">Rank A/B company coverage by country</div></div><span class="badge bg">${num(rankCountries)} countries</span></div><div class="acq-chart-section-body"><canvas id="countryCoverage" class="acq-chart-md"></canvas></div></div>
      <div class="acq-chart-section"><div class="acq-chart-section-hd"><div><div class="acq-chart-section-title">Contact Rate by Source</div><div class="acq-chart-section-sub">Eligible vs contacted leads</div></div><span class="badge bc">Source</span></div><div class="acq-chart-section-body"><canvas id="sourceRate" class="acq-chart-md"></canvas></div></div>
      <div class="acq-chart-section" data-chart-detail="risk"><div class="acq-chart-section-hd"><div><div class="acq-chart-section-title">Deal Risk</div><div class="acq-chart-section-sub">Stuck and stale open deals</div></div><span class="badge br">${num(d.risk.length)} risk</span></div><div class="acq-chart-section-body"><canvas id="riskBar" class="acq-chart-md"></canvas></div></div>
    </div>
  </div>`;
}

function renderCharts(d){
  destroyCharts();
  const labels=d.trend.map(r=>String(r.day).slice(5));
  const stageLabels=d.stage.slice(0,8).map(r=>r.dealstage);
  const src=sourceRollup(d.source);
  const countryRows=[...Object.values((d.rank||[]).reduce((a,r)=>{const k=r.country||'Unknown';a[k]=a[k]||{country:k,companies:0,touched:0,untouched:0};a[k].companies+=n(r.companies);a[k].touched+=n(r.touched_companies);a[k].untouched+=n(r.no_touch_companies);return a;},{}))].sort((a,b)=>b.companies-a.companies).slice(0,10);
  const riskByOwner=[...Object.values((d.risk||[]).reduce((a,r)=>{const k=r.owner_name||'Unassigned';a[k]=a[k]||{owner:k,deals:0,value:0};a[k].deals++;a[k].value+=n(r.amount);return a;},{}))].sort((a,b)=>b.value-a.value).slice(0,8);

  chart(document.getElementById('sparkCalls'),'line',{labels,datasets:[{data:d.trend.map(r=>n(r.calls_logged)),borderColor:'#2563eb',backgroundColor:'rgba(37,99,235,.08)',pointRadius:0,tension:.35,fill:true},{data:d.trend.map(r=>n(r.connected_calls)),borderColor:'#16a34a',pointRadius:0,tension:.35}]},{scales:{x:{display:false},y:{display:false}},elements:{line:{borderWidth:2}},plugins:{legend:{display:false},tooltip:{enabled:true}}});
  chart(document.getElementById('sparkLeads'),'line',{labels,datasets:[{data:d.trend.map(r=>n(r.leads_created)),borderColor:'#0891b2',backgroundColor:'rgba(8,145,178,.08)',pointRadius:0,tension:.35,fill:true},{data:d.trend.map(r=>n(r.leads_contacted)),borderColor:'#16a34a',pointRadius:0,tension:.35}]},{scales:{x:{display:false},y:{display:false}},elements:{line:{borderWidth:2}}});
  chart(document.getElementById('sparkPipeline'),'line',{labels,datasets:[{data:d.trend.map(r=>n(r.pipeline_created_amount)),borderColor:'#d97706',backgroundColor:'rgba(217,119,6,.08)',pointRadius:0,tension:.35,fill:true}]},{scales:{x:{display:false},y:{display:false}},elements:{line:{borderWidth:2}}});
  chart(document.getElementById('activityArea'),'line',{labels,datasets:[{label:'Calls',data:d.trend.map(r=>n(r.calls_logged)),borderColor:'#2563eb',backgroundColor:'rgba(37,99,235,.16)',fill:true,tension:.35,pointRadius:0},{label:'Leads',data:d.trend.map(r=>n(r.leads_created)),borderColor:'#0891b2',backgroundColor:'rgba(8,145,178,.12)',fill:true,tension:.35,pointRadius:0},{label:'Meetings',data:d.trend.map(r=>n(r.completed_meetings)),borderColor:'#7c3aed',backgroundColor:'rgba(124,58,237,.10)',fill:true,tension:.35,pointRadius:0}]},{plugins:{legend:{display:true,position:'bottom',labels:{boxWidth:10,font:{size:10}}}}});
  chart(document.getElementById('sourceDonut'),'doughnut',{labels:src.map(r=>r.source_bucket),datasets:[{data:src.map(r=>n(r.total_contacts)),backgroundColor:['#2563eb','#f59e0b','#7c3aed','#16a34a','#0891b2'],borderWidth:0}]},{cutout:'62%',plugins:{legend:{display:true,position:'bottom',labels:{boxWidth:10,font:{size:10}}}},scales:{x:{display:false},y:{display:false}}});
  chart(document.getElementById('stageBar'),'bar',{labels:stageLabels,datasets:[{label:'Pipeline',data:d.stage.slice(0,8).map(r=>n(r.pipeline_value)),backgroundColor:'#2563eb',borderRadius:7},{label:'Open Deals',data:d.stage.slice(0,8).map(r=>n(r.open_deals)),backgroundColor:'#f59e0b',borderRadius:7,yAxisID:'y1'}]},{plugins:{legend:{display:true,position:'bottom',labels:{boxWidth:10,font:{size:10}}}},scales:{y:{beginAtZero:true},y1:{beginAtZero:true,position:'right',grid:{display:false}}}});
  chart(document.getElementById('countryCoverage'),'bar',{labels:countryRows.map(r=>r.country),datasets:[{label:'Touched',data:countryRows.map(r=>r.touched),backgroundColor:'#16a34a',borderRadius:7},{label:'Untouched',data:countryRows.map(r=>r.untouched),backgroundColor:'#ef4444',borderRadius:7}]},{indexAxis:'y',plugins:{legend:{display:true,position:'bottom',labels:{boxWidth:10,font:{size:10}}}},scales:{x:{stacked:true},y:{stacked:true}}});
  chart(document.getElementById('sourceRate'),'bar',{labels:src.map(r=>r.source_bucket),datasets:[{label:'Contact Rate',data:src.map(r=>n(r.contact_rate_pct)),backgroundColor:'#0891b2',borderRadius:7},{label:'Need Contact',data:src.map(r=>n(r.needs_contact)),backgroundColor:'#e11d48',borderRadius:7,yAxisID:'y1'}]},{plugins:{legend:{display:true,position:'bottom',labels:{boxWidth:10,font:{size:10}}}},scales:{y:{beginAtZero:true,max:100},y1:{beginAtZero:true,position:'right',grid:{display:false}}}});
  chart(document.getElementById('riskBar'),'bar',{labels:riskByOwner.map(r=>r.owner),datasets:[{label:'Value at Risk',data:riskByOwner.map(r=>r.value),backgroundColor:'#e11d48',borderRadius:7},{label:'Deals',data:riskByOwner.map(r=>r.deals),backgroundColor:'#f59e0b',borderRadius:7,yAxisID:'y1'}]},{indexAxis:'y',plugins:{legend:{display:true,position:'bottom',labels:{boxWidth:10,font:{size:10}}}},scales:{y:{ticks:{font:{size:9}}},y1:{beginAtZero:true,position:'right',grid:{display:false}}}});
}

function bind(d){
  document.querySelector('[data-chart-detail="calls"]')?.addEventListener('click',()=>openDetails('Daily Calls Trend',d.trend,[{label:'Day',key:'day'},{label:'Calls',key:'calls_logged',center:true},{label:'Connected',key:'connected_calls',center:true},{label:'Rate',key:'connection_rate_pct',center:true,render:r=>pct(r.connection_rate_pct)}]));
  document.querySelector('[data-chart-detail="leads"]')?.addEventListener('click',()=>openDetails('Daily Leads Trend',d.trend,[{label:'Day',key:'day'},{label:'Created',key:'leads_created',center:true},{label:'Contacted',key:'leads_contacted',center:true},{label:'Need Contact',key:'leads_need_contact',center:true}]));
  document.querySelector('[data-chart-detail="pipeline"]')?.addEventListener('click',()=>openDetails('Open Pipeline Details',d.pipe,[{label:'Deal',key:'dealname'},{label:'Company',key:'company_name'},{label:'Owner',key:'owner_name'},{label:'Stage',key:'dealstage'},{label:'Amount',key:'amount',center:true,render:r=>money(r.amount)}]));
  document.querySelector('[data-chart-detail="rank"]')?.addEventListener('click',()=>openDetails('Rank A/B Coverage',d.rank,[{label:'Rank',key:'rank_group'},{label:'Country',key:'country'},{label:'Owner',key:'owner_name'},{label:'Companies',key:'companies',center:true},{label:'Touched',key:'touched_companies',center:true},{label:'Untouched',key:'no_touch_companies',center:true}]));
  document.querySelector('[data-chart-detail="risk"]')?.addEventListener('click',()=>openDetails('Deals at Risk',d.risk,[{label:'Deal',key:'dealname'},{label:'Owner',key:'owner_name'},{label:'Stage',key:'dealstage'},{label:'Amount',key:'amount',center:true,render:r=>money(r.amount)},{label:'Days',key:'days_in_stage',center:true}]));
}

async function inject(){
  if(!window.DB || !document.getElementById('appContent')) return;
  if(document.getElementById('acqDynamicCharts')) return;
  css();
  const d=await fetchViews();
  const target=document.getElementById('appContent');
  const afterTabs=document.getElementById('acqRepTabsBar');
  const wrap=document.createElement('div');
  wrap.innerHTML=html(d);
  if(afterTabs && afterTabs.nextSibling) target.insertBefore(wrap.firstElementChild, afterTabs.nextSibling);
  else target.prepend(wrap.firstElementChild);
  renderCharts(d);
  bind(d);
}

function install(){
  if(installed) return;
  installed=true;
  const original=window.AcquisitionModule?.render;
  if(typeof original==='function' && !original.__chartsWrapped){
    window.AcquisitionModule.render=async function(){
      const res=await original.apply(this,arguments);
      setTimeout(inject,150);
      return res;
    };
    window.AcquisitionModule.render.__chartsWrapped=true;
  }
  setTimeout(inject,800);
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install); else install();
})();
