(function(){
'use strict';

const esc = v => window.U?.esc ? window.U.esc(v == null ? '' : String(v)) : String(v ?? '');
const num = v => window.U?.num ? window.U.num(v) : Number(v || 0).toLocaleString();
const money = v => window.U?.money ? window.U.money(v || 0) : '$' + Number(v || 0).toLocaleString();
const rel = v => window.U?.relDate ? window.U.relDate(v) : (v || '—');
const n = v => Number(v || 0);
const sum = (rows, key) => (rows || []).reduce((a, b) => a + n(b[key]), 0);
let charts = [];
let state = { owner: 'All', stage: 'All', riskOnly: false, loaded: null };

function destroyCharts(){
  charts.forEach(c => { try { c.destroy(); } catch(e){} });
  charts = [];
}

function isRiskDeal(r){
  return !r.next_activity_date || n(r.days_in_stage) >= 21;
}

function rowsByState(rows){
  return (rows || []).filter(r => {
    if(state.owner !== 'All' && String(r.owner_name || 'Unassigned') !== state.owner) return false;
    if(state.stage !== 'All' && String(r.dealstage || 'Unknown') !== state.stage) return false;
    if(state.riskOnly && !isRiskDeal(r)) return false;
    return true;
  });
}

function stageRows(rows){
  const map = new Map();
  rows.forEach(r => {
    const k = r.dealstage || 'Unknown';
    if(!map.has(k)) map.set(k, { dealstage:k, open_deals:0, pipeline_value:0, risk_deals:0, risk_value:0, avg_days_in_stage:0, _days:0 });
    const o = map.get(k);
    o.open_deals++;
    o.pipeline_value += n(r.amount);
    o._days += n(r.days_in_stage);
    if(isRiskDeal(r)){ o.risk_deals++; o.risk_value += n(r.amount); }
  });
  return [...map.values()].map(r => ({ ...r, avg_days_in_stage: r.open_deals ? Math.round((r._days / r.open_deals) * 10) / 10 : 0 })).sort((a,b)=>b.pipeline_value-a.pipeline_value);
}

function ownerRows(rows){
  const map = new Map();
  rows.forEach(r => {
    const k = r.owner_name || 'Unassigned';
    if(!map.has(k)) map.set(k, { owner_name:k, open_deals:0, pipeline_value:0, risk_deals:0, risk_value:0, no_next_activity_deals:0, stuck_21d_deals:0, avg_days_in_stage:0, _days:0 });
    const o = map.get(k);
    o.open_deals++;
    o.pipeline_value += n(r.amount);
    o._days += n(r.days_in_stage);
    if(!r.next_activity_date) o.no_next_activity_deals++;
    if(n(r.days_in_stage) >= 21) o.stuck_21d_deals++;
    if(isRiskDeal(r)){ o.risk_deals++; o.risk_value += n(r.amount); }
  });
  return [...map.values()].map(r => ({ ...r, avg_days_in_stage: r.open_deals ? Math.round((r._days / r.open_deals) * 10) / 10 : 0 })).sort((a,b)=>b.pipeline_value-a.pipeline_value);
}

function pipelineSummary(rows){
  const risk = rows.filter(isRiskDeal);
  return {
    open_deals: rows.length,
    open_pipeline_value: sum(rows, 'amount'),
    risk_deals: risk.length,
    risk_pipeline_value: sum(risk, 'amount'),
    no_next_activity_deals: rows.filter(r => !r.next_activity_date).length,
    stuck_21d_deals: rows.filter(r => n(r.days_in_stage) >= 21).length,
    avg_days_in_stage: rows.length ? Math.round(rows.reduce((a,b)=>a+n(b.days_in_stage),0)/rows.length*10)/10 : 0,
    biggest_deal_value: rows.length ? Math.max(...rows.map(r=>n(r.amount))) : 0
  };
}

function openRows(title, rows){
  const cols = [
    { label:'Deal', key:'dealname', render:r => r.hubspot_url ? `<a class="record-link" href="${esc(r.hubspot_url)}" target="_blank" rel="noopener">${esc(r.dealname || 'Open deal')}</a>` : esc(r.dealname || '—') },
    { label:'Company', key:'company_name', render:r => esc(r.company_name || '—') },
    { label:'Owner', key:'owner_name', render:r => esc(r.owner_name || 'Unassigned') },
    { label:'Stage', key:'dealstage', center:true, render:r => `<span class="badge bb">${esc(r.dealstage || 'Unknown')}</span>` },
    { label:'Amount', key:'amount', center:true, render:r => money(r.amount) },
    { label:'Days Stage', key:'days_in_stage', center:true, render:r => `<strong style="color:${n(r.days_in_stage) >= 21 ? 'var(--red)' : 'var(--text2)'}">${num(r.days_in_stage)}</strong>` },
    { label:'Next Activity', key:'next_activity_date', center:true, render:r => r.next_activity_date ? rel(r.next_activity_date) : '<span class="badge br">None</span>' },
    { label:'Open', key:'hubspot_url', center:true, render:r => r.hubspot_url ? `<a class="hs-link" href="${esc(r.hubspot_url)}" target="_blank" rel="noopener">HubSpot</a>` : '—' },
  ];
  window.Modal?.open ? window.Modal.open({ title, rows, cols, rowUrlFn:r=>r.hubspot_url }) : null;
}

function installStyle(){
  if(document.getElementById('acqPipelineOnlyStyle')) return;
  const s = document.createElement('style');
  s.id = 'acqPipelineOnlyStyle';
  s.textContent = `
    .pipeline-shell{display:grid;gap:14px}
    .pipeline-header{display:flex;align-items:center;justify-content:space-between;gap:14px;background:rgba(255,255,255,.80);border:1px solid rgba(22,64,42,.10);border-radius:22px;padding:16px 18px;box-shadow:0 10px 28px rgba(17,47,31,.06);backdrop-filter:blur(16px)}
    .pipeline-title{font-size:22px;font-weight:950;letter-spacing:-.04em;color:#102116}.pipeline-sub{font-size:11px;font-weight:750;color:#71867b;margin-top:4px}.pipeline-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.pipe-filter{height:34px;border:1px solid rgba(22,64,42,.12);background:#fff;border-radius:999px;padding:0 12px;font:850 11px var(--font);color:#33483c}.pipe-toggle{height:34px;border:1px solid rgba(220,38,38,.18);background:rgba(220,38,38,.08);color:#dc2626;border-radius:999px;padding:0 12px;font:900 11px var(--font);cursor:pointer}.pipe-toggle.active{background:#dc2626;color:white}
    .pipe-kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px}.pipe-kpi{background:rgba(255,255,255,.86);border:1px solid rgba(22,64,42,.10);border-radius:18px;padding:15px 14px;box-shadow:0 8px 22px rgba(17,47,31,.06);cursor:pointer;position:relative;overflow:hidden}.pipe-kpi:hover{box-shadow:0 14px 32px rgba(17,47,31,.10);transform:translateY(-1px)}.pipe-kpi::before{content:"";position:absolute;left:0;top:0;right:0;height:4px;background:var(--accent,#16a34a)}.pipe-kpi-v{font-family:var(--mono);font-size:25px;font-weight:950;letter-spacing:-.05em;color:var(--accent,#16a34a);margin-top:4px}.pipe-kpi-l{font-size:8px;font-weight:950;text-transform:uppercase;letter-spacing:.12em;color:#71867b;margin-top:7px}.pipe-kpi-s{font-size:10px;color:#789086;font-weight:750;margin-top:3px}
    .pipe-grid-2{display:grid;grid-template-columns:1.18fr .82fr;gap:14px}.pipe-grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}.pipe-card{background:rgba(255,255,255,.86);border:1px solid rgba(22,64,42,.10);border-radius:20px;box-shadow:0 8px 22px rgba(17,47,31,.06);overflow:hidden}.pipe-card-hd{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 16px;background:rgba(248,251,249,.82);border-bottom:1px solid rgba(22,64,42,.09)}.pipe-card-t{font-size:12px;font-weight:950;letter-spacing:.08em;text-transform:uppercase;color:#33483c}.pipe-card-s{font-size:10px;font-weight:750;color:#71867b;margin-top:2px;text-transform:none;letter-spacing:0}.pipe-card-b{padding:16px}.pipe-chart-lg{height:300px!important}.pipe-chart-md{height:240px!important}.pipe-list{display:grid;gap:9px}.pipe-row{display:grid;grid-template-columns:minmax(120px,1fr) 100px 65px;gap:10px;align-items:center;font-size:11px;color:#33483c;cursor:pointer;padding:8px;border-radius:12px}.pipe-row:hover{background:rgba(22,163,74,.05)}.pipe-bar{height:9px;border-radius:999px;background:#e8f0ec;overflow:hidden;margin-top:5px}.pipe-bar span{display:block;height:100%;border-radius:999px;background:#2563eb}.pipe-table-wrap{max-height:520px;overflow:auto}.pipe-owner-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(22,64,42,.10);background:#fff;border-radius:999px;padding:5px 9px;font-size:10px;font-weight:900;color:#33483c;cursor:pointer}.pipe-owner-chip.active{background:#16a34a;color:white;border-color:#16a34a}.pipe-dot{width:7px;height:7px;border-radius:99px;background:#16a34a}
    @media(max-width:1300px){.pipe-kpis{grid-template-columns:repeat(3,1fr)}.pipe-grid-2,.pipe-grid-3{grid-template-columns:1fr}}
    @media(max-width:800px){.pipe-kpis{grid-template-columns:1fr}.pipeline-header{display:block}.pipeline-actions{margin-top:12px}}
  `;
  document.head.appendChild(s);
}

async function load(){
  const [summary, ownerMix, stageMix, details] = await Promise.all([
    window.DB.fetchView('vw_acquisition_pipeline_summary',1).catch(()=>[]),
    window.DB.fetchView('vw_acquisition_pipeline_owner_mix',100).catch(()=>[]),
    window.DB.fetchView('vw_acquisition_deal_stage_mix',100).catch(()=>[]),
    window.DB.fetchView('vw_acquisition_pipeline_details',2000).catch(()=>[])
  ]);
  state.loaded = { summary: summary?.[0] || {}, ownerMix: ownerMix || [], stageMix: stageMix || [], details: details || [] };
  return state.loaded;
}

function html(data){
  const rows = rowsByState(data.details);
  const s = pipelineSummary(rows);
  const owners = ['All', ...new Set((data.details || []).map(r => r.owner_name || 'Unassigned'))].sort((a,b)=>a==='All'?-1:b==='All'?1:a.localeCompare(b));
  const stages = ['All', ...new Set((data.details || []).map(r => r.dealstage || 'Unknown'))].sort((a,b)=>a==='All'?-1:b==='All'?1:a.localeCompare(b));
  const stage = stageRows(rows);
  const owner = ownerRows(rows);
  const risk = rows.filter(isRiskDeal).sort((a,b)=>n(b.amount)-n(a.amount));
  const maxStage = Math.max(1, ...stage.map(r => n(r.pipeline_value)));
  const topDeals = [...rows].sort((a,b)=>n(b.amount)-n(a.amount)).slice(0,12);
  return `<div class="pipeline-shell">
    <div class="pipeline-header">
      <div><div class="pipeline-title">Acquisition Pipeline</div><div class="pipeline-sub">Open deals, stage value, owner ownership, stale deals and next activity risk only.</div></div>
      <div class="pipeline-actions">
        <select class="pipe-filter" id="pipeOwnerFilter">${owners.map(o=>`<option value="${esc(o)}" ${state.owner===o?'selected':''}>${esc(o)}</option>`).join('')}</select>
        <select class="pipe-filter" id="pipeStageFilter">${stages.map(o=>`<option value="${esc(o)}" ${state.stage===o?'selected':''}>${esc(o)}</option>`).join('')}</select>
        <button class="pipe-toggle ${state.riskOnly?'active':''}" id="pipeRiskToggle">${state.riskOnly?'Risk only: ON':'Risk only: OFF'}</button>
      </div>
    </div>

    <div class="pipe-kpis">
      <div class="pipe-kpi" style="--accent:#2563eb" data-pipe-modal="open"><div class="pipe-kpi-v">${num(s.open_deals)}</div><div class="pipe-kpi-l">Open Deals</div><div class="pipe-kpi-s">Clickable deal list</div></div>
      <div class="pipe-kpi" style="--accent:#16a34a" data-pipe-modal="open"><div class="pipe-kpi-v">${money(s.open_pipeline_value)}</div><div class="pipe-kpi-l">Open Pipeline</div><div class="pipe-kpi-s">Total weighted by deal amount</div></div>
      <div class="pipe-kpi" style="--accent:#e11d48" data-pipe-modal="risk"><div class="pipe-kpi-v">${num(s.risk_deals)}</div><div class="pipe-kpi-l">Deals at Risk</div><div class="pipe-kpi-s">No next activity or 21d+ in stage</div></div>
      <div class="pipe-kpi" style="--accent:#e11d48" data-pipe-modal="risk"><div class="pipe-kpi-v">${money(s.risk_pipeline_value)}</div><div class="pipe-kpi-l">Risk Value</div><div class="pipe-kpi-s">Pipeline exposure</div></div>
      <div class="pipe-kpi" style="--accent:#f59e0b" data-pipe-modal="noNext"><div class="pipe-kpi-v">${num(s.no_next_activity_deals)}</div><div class="pipe-kpi-l">No Next Activity</div><div class="pipe-kpi-s">Needs immediate follow-up</div></div>
      <div class="pipe-kpi" style="--accent:#7c3aed" data-pipe-modal="stuck"><div class="pipe-kpi-v">${num(s.stuck_21d_deals)}</div><div class="pipe-kpi-l">Stuck 21d+</div><div class="pipe-kpi-s">Avg ${num(s.avg_days_in_stage)} days/stage</div></div>
    </div>

    <div class="pipe-grid-2">
      <div class="pipe-card"><div class="pipe-card-hd"><div><div class="pipe-card-t">Pipeline by Stage</div><div class="pipe-card-s">Open pipeline value vs deal count</div></div><span class="badge ba">${num(stage.length)} stages</span></div><div class="pipe-card-b"><canvas id="pipeStageChart" class="pipe-chart-lg"></canvas></div></div>
      <div class="pipe-card"><div class="pipe-card-hd"><div><div class="pipe-card-t">Stage Value List</div><div class="pipe-card-s">Click a row to filter stage deals</div></div><span class="badge bb">Details</span></div><div class="pipe-card-b"><div class="pipe-list">${stage.slice(0,10).map(r=>`<div class="pipe-row" data-stage-row="${esc(r.dealstage)}"><div><strong>${esc(r.dealstage)}</strong><div class="pipe-bar"><span style="width:${Math.max(3,n(r.pipeline_value)/maxStage*100)}%"></span></div></div><div>${money(r.pipeline_value)}</div><div>${num(r.open_deals)}</div></div>`).join('')}</div></div></div>
    </div>

    <div class="pipe-grid-3">
      <div class="pipe-card"><div class="pipe-card-hd"><div><div class="pipe-card-t">Pipeline by Owner</div><div class="pipe-card-s">Ownership and risk exposure</div></div><span class="badge bg">Owner</span></div><div class="pipe-card-b"><canvas id="pipeOwnerChart" class="pipe-chart-md"></canvas></div></div>
      <div class="pipe-card"><div class="pipe-card-hd"><div><div class="pipe-card-t">Risk by Owner</div><div class="pipe-card-s">Who needs follow-up cleanup</div></div><span class="badge br">Risk</span></div><div class="pipe-card-b"><canvas id="pipeRiskChart" class="pipe-chart-md"></canvas></div></div>
      <div class="pipe-card"><div class="pipe-card-hd"><div><div class="pipe-card-t">Top Open Deals</div><div class="pipe-card-s">Largest active opportunities</div></div><span class="badge bc">${num(topDeals.length)}</span></div><div class="pipe-card-b"><div class="pipe-list">${topDeals.map(r=>`<div class="pipe-row" data-deal-id="${esc(r.deal_id || r.hubspot_url || r.dealname)}"><div><strong>${esc(r.dealname || '—')}</strong><div class="pipe-bar"><span style="width:${Math.max(3,n(r.amount)/Math.max(1,s.biggest_deal_value)*100)}%;background:#16a34a"></span></div></div><div>${money(r.amount)}</div><div>${num(r.days_in_stage)}d</div></div>`).join('')}</div></div></div>
    </div>

    <div class="pipe-card"><div class="pipe-card-hd"><div><div class="pipe-card-t">Open Pipeline Details</div><div class="pipe-card-s">Filtered by owner/stage/risk. Every deal opens in HubSpot.</div></div><span class="badge bb">${num(rows.length)} deals</span></div><div class="pipe-card-b pipe-table-wrap">${table(rows)}</div></div>
  </div>`;
}

function table(rows){
  const cols = [
    { label:'Deal', key:'dealname', render:r => r.hubspot_url ? `<a class="record-link" href="${esc(r.hubspot_url)}" target="_blank" rel="noopener">${esc(r.dealname || 'Open deal')}</a>` : esc(r.dealname || '—') },
    { label:'Company', key:'company_name', render:r => esc(r.company_name || '—') },
    { label:'Owner', key:'owner_name', render:r => esc(r.owner_name || 'Unassigned') },
    { label:'Stage', key:'dealstage', center:true, render:r => `<span class="badge bb">${esc(r.dealstage || 'Unknown')}</span>` },
    { label:'Amount', key:'amount', center:true, render:r => money(r.amount) },
    { label:'Days Stage', key:'days_in_stage', center:true, render:r => `<strong style="color:${n(r.days_in_stage) >= 21 ? 'var(--red)' : 'var(--text2)'}">${num(r.days_in_stage)}</strong>` },
    { label:'Next Activity', key:'next_activity_date', center:true, render:r => r.next_activity_date ? rel(r.next_activity_date) : '<span class="badge br">None</span>' },
    { label:'Open', key:'hubspot_url', center:true, render:r => r.hubspot_url ? `<a class="hs-link" href="${esc(r.hubspot_url)}" target="_blank" rel="noopener">Open</a>` : '—' },
  ];
  return window.Components?.table ? window.Components.table(rows, cols, 100, r=>r.hubspot_url) : '';
}

function draw(data){
  destroyCharts();
  const rows = rowsByState(data.details);
  const stage = stageRows(rows).slice(0,12);
  const owner = ownerRows(rows).slice(0,10);
  const risk = ownerRows(rows.filter(isRiskDeal)).slice(0,10);
  if(!window.Chart) return;
  charts.push(new Chart(document.getElementById('pipeStageChart'),{type:'bar',data:{labels:stage.map(r=>r.dealstage),datasets:[{label:'Pipeline Value',data:stage.map(r=>r.pipeline_value),backgroundColor:'#2563eb',borderRadius:8},{label:'Open Deals',data:stage.map(r=>r.open_deals),backgroundColor:'#f59e0b',borderRadius:8,yAxisID:'y1'}]},options:chartOptions(false)}));
  charts.push(new Chart(document.getElementById('pipeOwnerChart'),{type:'bar',data:{labels:owner.map(r=>r.owner_name),datasets:[{label:'Pipeline Value',data:owner.map(r=>r.pipeline_value),backgroundColor:'#16a34a',borderRadius:8}]},options:chartOptions(true)}));
  charts.push(new Chart(document.getElementById('pipeRiskChart'),{type:'bar',data:{labels:risk.map(r=>r.owner_name),datasets:[{label:'Risk Value',data:risk.map(r=>r.risk_value || r.pipeline_value),backgroundColor:'#e11d48',borderRadius:8},{label:'Risk Deals',data:risk.map(r=>r.open_deals),backgroundColor:'#f59e0b',borderRadius:8,yAxisID:'y1'}]},options:chartOptions(true)}));
}

function chartOptions(horizontal){
  return {responsive:true,maintainAspectRatio:false,indexAxis:horizontal?'y':'x',plugins:{legend:{display:true,position:'bottom',labels:{boxWidth:10,font:{size:10}}},tooltip:{mode:'index',intersect:false}},scales:{x:{grid:{display:false},ticks:{font:{size:9}}},y:{grid:{color:'rgba(22,64,42,.07)'},ticks:{font:{size:9}}},y1:{position:'right',grid:{display:false},ticks:{font:{size:9}}}},interaction:{mode:'index',intersect:false}};
}

function bind(data){
  document.getElementById('pipeOwnerFilter')?.addEventListener('change', e => { state.owner = e.target.value; render(data); });
  document.getElementById('pipeStageFilter')?.addEventListener('change', e => { state.stage = e.target.value; render(data); });
  document.getElementById('pipeRiskToggle')?.addEventListener('click', () => { state.riskOnly = !state.riskOnly; render(data); });
  document.querySelectorAll('[data-pipe-modal]').forEach(el => el.addEventListener('click', () => {
    const rows = rowsByState(data.details);
    const key = el.getAttribute('data-pipe-modal');
    if(key === 'risk') return openRows('Deals at Risk', rows.filter(isRiskDeal));
    if(key === 'noNext') return openRows('Deals with No Next Activity', rows.filter(r=>!r.next_activity_date));
    if(key === 'stuck') return openRows('Stuck Deals 21+ Days', rows.filter(r=>n(r.days_in_stage)>=21));
    return openRows('Open Pipeline', rows);
  }));
  document.querySelectorAll('[data-stage-row]').forEach(el => el.addEventListener('click', () => { state.stage = el.getAttribute('data-stage-row'); render(data); }));
}

function render(data){
  window.U?.setTitle?.('Acquisition · Pipeline', 'Pipeline-only dashboard: open deals, stages, owners, risks, and next activities');
  window.U?.setContent?.(html(data));
  draw(data);
  bind(data);
  bindSidebarPipeline(data);
}

function bindSidebarPipeline(data){
  document.querySelectorAll('[data-acq-rep]').forEach(btn => {
    btn.onclick = e => {
      e.preventDefault();
      state.owner = btn.getAttribute('data-acq-rep') || 'All';
      state.stage = 'All';
      state.riskOnly = false;
      render(data);
      window.scrollTo({top:0,behavior:'smooth'});
    };
  });
}

async function pipelineRender(){
  installStyle();
  window.U?.showLoading?.('Loading Acquisition Pipeline…');
  const data = await load();
  render(data);
}

function install(){
  if(!window.AcquisitionModule) window.AcquisitionModule = {};
  window.AcquisitionModule.render = pipelineRender;
  window.AcquisitionPipelineOnly = { render:pipelineRender };
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
})();
