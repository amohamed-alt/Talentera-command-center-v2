(function(){
'use strict';

function installStyle(){
  if(document.getElementById('acqLegacyRepStyle')) return;
  const s=document.createElement('style');
  s.id='acqLegacyRepStyle';
  s.textContent=`
    .legacy-rep-hero{background:var(--surface);border:1px solid var(--border);border-top:4px solid var(--green);border-radius:26px;padding:18px 20px;box-shadow:var(--sh);display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:16px}
    .legacy-rep-left{display:flex;align-items:center;gap:14px}.legacy-avatar{width:52px;height:52px;border-radius:18px;background:var(--green-bg);border:1px solid var(--green-bd);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:var(--green)}
    .legacy-rep-name{font-size:24px;font-weight:950;letter-spacing:-.04em}.legacy-rep-badge{display:inline-flex;margin-left:8px;border:1px solid var(--red-bd);background:var(--red-bg);color:var(--red);border-radius:999px;padding:4px 9px;font-size:9px;font-weight:900;text-transform:uppercase}.legacy-rep-sub{font-size:11px;color:var(--muted);font-weight:800;margin-top:4px}.legacy-rep-kpis{display:flex;gap:26px;text-align:center}.legacy-rep-kpi-v{font-family:var(--mono);font-size:24px;font-weight:900}.legacy-rep-kpi-l{font-size:8px;color:var(--muted);font-weight:900;text-transform:uppercase;letter-spacing:.12em;margin-top:3px}
    .legacy-period-wrap{background:var(--surface);border:1px solid var(--border);border-radius:24px;box-shadow:var(--sh-xs);overflow:hidden;margin-bottom:16px}.legacy-period-hd{padding:14px 18px;border-bottom:1px solid var(--border);font-size:12px;font-weight:950;text-transform:uppercase;letter-spacing:.08em;color:var(--text2)}.legacy-period-grid{display:grid;grid-template-columns:120px repeat(6,1fr);gap:10px;padding:14px}.legacy-period-row-label{background:var(--surface2);border:1px solid var(--border);border-radius:14px;padding:13px 12px}.legacy-period-main{font-size:11px;font-weight:950;text-transform:uppercase}.legacy-period-sub{font-size:9px;color:var(--muted);font-weight:800;margin-top:3px}.legacy-period-card{background:#fff;border:1px solid var(--border);border-top:3px solid var(--fc,var(--blue));border-radius:18px;padding:13px 14px;text-align:center;box-shadow:var(--sh-xs)}.legacy-period-v{font-family:var(--mono);font-size:22px;font-weight:950;color:var(--fc,var(--blue))}.legacy-period-l{font-size:8px;color:var(--text2);font-weight:950;text-transform:uppercase;letter-spacing:.1em;margin-top:4px}.legacy-period-note{font-size:9px;color:var(--muted);font-weight:700;margin-top:3px}
    .legacy-sec{margin:18px 0 8px;font-size:10px;color:var(--text2);font-weight:950;text-transform:uppercase;letter-spacing:.12em;display:flex;gap:8px;align-items:center}.legacy-split{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px}.legacy-card{background:var(--surface);border:1px solid var(--border);border-radius:24px;box-shadow:var(--sh-xs);overflow:hidden}.legacy-card-hd{height:48px;padding:0 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border)}.legacy-card-title{font-size:12px;font-weight:950;color:var(--text2)}.legacy-list{max-height:360px;overflow:auto}.legacy-mini-row{display:grid;grid-template-columns:minmax(170px,1.2fr) minmax(110px,.7fr) 90px 84px 58px;gap:10px;align-items:center;padding:10px 14px;border-bottom:1px solid var(--border);font-size:11px}.legacy-mini-name{font-weight:950;color:var(--blue)}.legacy-mini-meta{font-size:9px;color:var(--muted);font-weight:700;margin-top:2px}.legacy-empty{padding:42px;text-align:center;color:var(--muted);font-size:12px;font-style:italic}.legacy-open-table .tbl td,.legacy-open-table .tbl th{font-size:11px}.legacy-rank-chips{display:flex;gap:6px;flex-wrap:wrap;margin:10px 14px}.legacy-rank-chip{border:1px solid var(--border);background:#fff;border-radius:999px;padding:6px 9px;font-size:9px;font-weight:900;color:var(--text2)}
    @media(max-width:1100px){.legacy-rep-hero{display:block}.legacy-rep-kpis{margin-top:14px;justify-content:space-between;flex-wrap:wrap}.legacy-period-grid{grid-template-columns:1fr}.legacy-split{grid-template-columns:1fr}.legacy-mini-row{grid-template-columns:1fr 1fr}.legacy-mini-row>*:nth-child(n+3){display:none}}
  `;
  document.head.appendChild(s);
}

const esc=v=>window.U.esc(v==null?'':String(v));
const n=v=>Number(v||0);
const num=v=>window.U.num?window.U.num(v):n(v).toLocaleString();
const money=v=>window.U.money?window.U.money(v):('$'+num(v));
const pct=v=>window.U.pct?window.U.pct(v):(n(v).toFixed(1)+'%');
const date=v=>window.U.date?window.U.date(v):(v||'—');
const rel=v=>window.U.relDate?window.U.relDate(v):(v||'—');
const ownerKey=v=>String(v||'Unassigned').trim()||'Unassigned';
const rowsFor=(arr,owner)=>(arr||[]).filter(r=>ownerKey(r.owner_name)===ownerKey(owner));
const sum=(arr,key)=>(arr||[]).reduce((a,b)=>a+n(b[key]),0);
const rate=(total,part)=>total?Math.round((part/total)*1000)/10:0;
const link=(txt,url)=>url?`<a class="record-link" href="${esc(url)}" target="_blank" rel="noopener">${esc(txt||'Open')}</a>`:esc(txt||'—');

async function ensurePeriods(){
  if(window._acqData && window._acqData.repPeriods) return;
  try{
    const rows=await window.DB.fetchView('vw_acquisition_rep_kpi_periods',10000);
    if(window._acqData) window._acqData.repPeriods=rows||[];
  }catch(e){console.warn('rep periods unavailable',e); if(window._acqData) window._acqData.repPeriods=[];}
}

function repTabs(active){
  const d=window._acqData||{};
  const reps=[...(d.reps||[])].filter(r=>ownerKey(r.owner_name)!=='Unassigned').sort((a,b)=>(rowsFor(d.priorityLeads,b.owner_name).length+rowsFor(d.risk,b.owner_name).length)-(rowsFor(d.priorityLeads,a.owner_name).length+rowsFor(d.risk,a.owner_name).length)||n(b.calls_logged)-n(a.calls_logged));
  const btns=reps.map(rep=>{
    const owner=ownerKey(rep.owner_name);
    const activeClass=ownerKey(active)===owner?' active':'';
    const leads=rowsFor(d.priorityLeads,owner).length;
    const risk=rowsFor(d.risk,owner).length;
    const pipe=rowsFor(d.pipe,owner);
    return `<button class="acq-rep-tab${activeClass}" type="button" data-legacy-rep="${esc(owner)}"><span class="acq-rep-tab-name"><span class="acq-rep-dot"></span> ${esc(owner)}</span><span class="acq-rep-tab-meta"><b>${num(leads)}</b> leads · <b>${num(risk)}</b> risk · <b>${money(sum(pipe,'amount'))}</b></span></button>`;
  }).join('');
  return `<div id="acqRepTabsBar" class="acq-rep-tabs-panel"><div class="acq-rep-tabs-head"><div><div class="acq-rep-tabs-title">Acquisition Rep Tabs</div><div class="acq-rep-tabs-hint">Dedicated rep page: period KPIs, online/offline leads, AI coaching, open deals and Rank A/B coverage.</div></div><span class="badge bb">${num(reps.length)} reps</span></div><div class="acq-rep-tabs-scroll"><button class="acq-rep-tab acq-team-tab" type="button" data-legacy-team="1"><span class="acq-rep-tab-name">⚡ Team Overview</span><span class="acq-rep-tab-meta"><b>${num(d.priorityLeads?.length)}</b> leads · <b>${num(d.risk?.length)}</b> risk · <b>${money(sum(d.pipe||[],'amount'))}</b></span></button>${btns}</div></div>`;
}

function miniLeadRows(rows){
  if(!rows.length)return '<div class="legacy-empty">No contacts need contact for this rep.</div>';
  return `<div class="legacy-list">${rows.slice(0,80).map(r=>`<div class="legacy-mini-row"><div><div class="legacy-mini-name">${link(r.contact_name||r.email||r.contact_id,r.hubspot_url)}</div><div class="legacy-mini-meta">${esc(r.email||r.company_name||'—')}</div></div><div>${esc(r.company_name||'—')}</div><div><span class="badge ${r.source_bucket==='online'?'bb':'ba'}">${esc(r.source_bucket||'—')}</span></div><div>${esc(r.lead_status||'—')}</div><div>${num(r.days_since_created)}d</div></div>`).join('')}</div>${rows.length>80?`<button class="show-more-btn" type="button">Showing first 80 of ${num(rows.length)}</button>`:''}`;
}

function openDealsTable(rows){
  if(!rows.length)return '<div class="legacy-empty">No open deals for this rep.</div>';
  const cols=[
    {label:'Deal',key:'dealname',render:r=>link(r.dealname,r.hubspot_url)},
    {label:'Stage',key:'dealstage',center:true,render:r=>`<span class="badge bb">${esc(r.dealstage||'—')}</span>`},
    {label:'Value',key:'amount',center:true,render:r=>money(r.amount)},
    {label:'Next Activity',key:'next_activity_date',center:true,render:r=>r.next_activity_date?rel(r.next_activity_date):'<span style="color:var(--red);font-weight:900">⚑ None</span>'},
  ];
  return `<div class="legacy-open-table">${window.Components.table(rows,cols,8,r=>r.hubspot_url)}</div>`;
}
function riskTable(rows){
  if(!rows.length)return '<div class="legacy-empty">All deals have healthy follow-up.</div>';
  const cols=[
    {label:'Deal',key:'dealname',render:r=>link(r.dealname,r.hubspot_url)},
    {label:'Risk',key:'risk_reason',center:true,render:r=>`<span class="badge br">${esc(r.risk_reason||'Risk')}</span>`},
    {label:'Days',key:'days_in_stage',center:true,render:r=>`<strong style="color:var(--red)">${num(r.days_in_stage)}d</strong>`},
    {label:'Amount',key:'amount',center:true,render:r=>money(r.amount)},
  ];
  return `<div class="legacy-open-table">${window.Components.table(rows,cols,8,r=>r.hubspot_url)}</div>`;
}
function rankTable(rows){
  if(!rows.length)return '<div class="legacy-empty">No Rank A/B companies mapped to this rep.</div>';
  const cols=[
    {label:'Rank',key:'rank_group',center:true},
    {label:'Country',key:'country'},
    {label:'Companies',key:'companies',center:true,render:r=>num(r.companies)},
    {label:'Touched',key:'touched_companies',center:true,render:r=>num(r.touched_companies)},
    {label:'Untouched',key:'no_touch_companies',center:true,render:r=>`<strong style="color:${n(r.no_touch_companies)?'var(--red)':'var(--green)'}">${num(r.no_touch_companies)}</strong>`},
    {label:'Touch Rate',key:'touch_rate_pct',center:true,render:r=>pct(r.touch_rate_pct||0)},
    {label:'Calls',key:'connected_calls',center:true,render:r=>num(r.connected_calls)},
    {label:'Meetings',key:'completed_meetings',center:true,render:r=>num(r.completed_meetings)},
  ];
  return window.Components.table(rows,cols,12);
}
function periodCard(p,label,sub){
  return `<div class="legacy-period-row-label"><div class="legacy-period-main">${label}</div><div class="legacy-period-sub">${sub}</div></div>
    <div class="legacy-period-card" style="--fc:var(--blue)"><div class="legacy-period-v">${num(p.calls_logged)}</div><div class="legacy-period-l">Calls</div><div class="legacy-period-note">${num(p.connected_calls)} connected</div></div>
    <div class="legacy-period-card" style="--fc:var(--red)"><div class="legacy-period-v">${pct(p.connection_rate||0)}</div><div class="legacy-period-l">Conn. Rate</div><div class="legacy-period-note">${num(p.connected_calls)}/${num(p.calls_logged)}</div></div>
    <div class="legacy-period-card" style="--fc:var(--purple)"><div class="legacy-period-v">${num(p.meetings_completed)}</div><div class="legacy-period-l">Meetings</div><div class="legacy-period-note">Completed only</div></div>
    <div class="legacy-period-card" style="--fc:var(--cyan)"><div class="legacy-period-v">${num(p.leads_created)}</div><div class="legacy-period-l">Leads</div><div class="legacy-period-note">+${num(p.leads_contacted)} contacted</div></div>
    <div class="legacy-period-card" style="--fc:var(--green)"><div class="legacy-period-v">${num(p.deals_won)}</div><div class="legacy-period-l">Won</div><div class="legacy-period-note">${money(p.won_amount)}</div></div>
    <div class="legacy-period-card" style="--fc:var(--red)"><div class="legacy-period-v">${num(p.deals_lost)}</div><div class="legacy-period-l">Lost</div><div class="legacy-period-note">${money(p.lost_amount)}</div></div>`;
}

async function renderLegacyRep(ownerName){
  installStyle();
  await ensurePeriods();
  const d=window._acqData||{};
  const owner=ownerKey(ownerName);
  const rep=(d.reps||[]).find(r=>ownerKey(r.owner_name)===owner)||{owner_name:owner};
  const leads=rowsFor(d.priorityLeads,owner);
  const online=leads.filter(r=>r.source_bucket==='online');
  const offline=leads.filter(r=>r.source_bucket==='offline');
  const pipe=rowsFor(d.pipe,owner);
  const risk=rowsFor(d.risk,owner);
  const rank=rowsFor(d.rank,owner);
  const rankA=rank.filter(r=>String(r.rank_group).toUpperCase()==='A');
  const rankB=rank.filter(r=>String(r.rank_group).toUpperCase()==='B');
  const coach=(d.coach||[]).filter(r=>ownerKey(r.owner_name)===owner);
  const periods=['Yesterday','MTD','YTD'].map((period,i)=>((d.repPeriods||[]).find(p=>ownerKey(p.owner_name)===owner&&p.period===period)||{period,sort_order:i+1,calls_logged:0,connected_calls:0,connection_rate:0,meetings_completed:0,leads_created:0,leads_contacted:0,deals_won:0,deals_lost:0,won_amount:0,lost_amount:0}));
  window.U.setTitle(`Acquisition · ${owner}`,'Dedicated rep detail page — old style layout with clean Supabase metrics');
  const html=`
    ${repTabs(owner)}
    <button class="badge bb" type="button" data-legacy-team="1" style="margin:0 0 12px">← Back to Acquisition Command Center</button>
    <div class="legacy-rep-hero">
      <div class="legacy-rep-left"><div class="legacy-avatar">${esc(owner[0]||'R')}</div><div><div class="legacy-rep-name">${esc(owner)}${(leads.length||risk.length)?'<span class="legacy-rep-badge">Needs Attention</span>':''}</div><div class="legacy-rep-sub">${new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'short',day:'numeric'})}</div></div></div>
      <div class="legacy-rep-kpis"><div><div class="legacy-rep-kpi-v" style="color:var(--blue)">${num(rep.calls_logged)}</div><div class="legacy-rep-kpi-l">Calls</div></div><div><div class="legacy-rep-kpi-v" style="color:var(--red)">${pct(rate(n(rep.calls_logged),n(rep.connected_calls)))}</div><div class="legacy-rep-kpi-l">Rate</div></div><div><div class="legacy-rep-kpi-v" style="color:var(--purple)">${num(rep.meetings_completed)}</div><div class="legacy-rep-kpi-l">Meetings</div></div><div><div class="legacy-rep-kpi-v" style="color:var(--cyan)">${money(sum(pipe,'amount'))}</div><div class="legacy-rep-kpi-l">Pipeline</div></div></div>
    </div>
    <div class="legacy-period-wrap"><div class="legacy-period-hd">✦ Yesterday · MTD · YTD Summary</div><div class="legacy-period-grid">${periodCard(periods[0],'Yesterday','daily execution')}${periodCard(periods[1],'MTD','month to date')}${periodCard(periods[2],'YTD','year to date')}</div></div>
    <div class="legacy-sec">♟ Needs to Contact · ${esc(owner)}</div>
    <div class="legacy-split"><div class="legacy-card"><div class="legacy-card-hd"><div class="legacy-card-title">🌐 Online / Inbound Needs Contact</div><span class="badge bb">${num(online.length)} contacts</span></div>${miniLeadRows(online)}</div><div class="legacy-card"><div class="legacy-card-hd"><div class="legacy-card-title">📞 Offline / Outbound Needs Contact</div><span class="badge ba">${num(offline.length)} contacts</span></div>${miniLeadRows(offline)}</div></div>
    <div class="legacy-sec">🚨 AI Coaching + SLA Breaches</div>
    <div class="legacy-split"><div class="legacy-card"><div class="legacy-card-hd"><div class="legacy-card-title">💡 AI Coaching</div><span class="badge bp">${num(coach.length||1)} signals</span></div>${coach.length?window.Components.table(coach,[{label:'Signal',key:'signal'},{label:'Recommendation',key:'recommendation'},{label:'Impact',key:'impact',center:true,render:r=>`<span class="badge ${r.impact==='High'?'br':r.impact==='Medium'?'ba':'bb'}">${esc(r.impact)}</span>`}],8):'<div class="legacy-empty">No critical signal. Keep lead SLA and next activities updated.</div>'}</div><div class="legacy-card"><div class="legacy-card-hd"><div class="legacy-card-title">🚨 Deals at Risk</div><span class="badge br">${num(risk.length)} deals</span></div>${riskTable(risk)}</div></div>
    <div class="legacy-sec">💼 Open Deals + Rank A/B Coverage</div>
    <div class="legacy-split"><div class="legacy-card"><div class="legacy-card-hd"><div class="legacy-card-title">💰 Open Deals</div><span class="badge bb">${num(pipe.length)} · ${money(sum(pipe,'amount'))}</span></div>${openDealsTable(pipe)}</div><div class="legacy-card"><div class="legacy-card-hd"><div class="legacy-card-title">🎯 Rank A/B Coverage</div><div><span class="rank-a">${num(sum(rankA,'companies'))}A</span> <span class="rank-b">${num(sum(rankB,'companies'))}B</span></div></div><div class="legacy-rank-chips">${rank.slice(0,12).map(r=>`<span class="legacy-rank-chip">${esc(r.country)} ${num(r.companies)}</span>`).join('')}</div>${rankTable(rank)}</div></div>
    <div class="legacy-sec">📍 Stuck Deals & Lead Source Performance</div>
    <div class="legacy-card" style="margin-bottom:16px"><div class="legacy-card-hd"><div class="legacy-card-title">📍 Stuck Deals / At Risk</div><span class="badge br">${num(risk.length)}</span></div>${riskTable(risk)}</div>
  `;
  window.U.setContent(html);
  wireLegacy();
}

function wireLegacy(){
  document.querySelectorAll('[data-legacy-rep]').forEach(btn=>btn.addEventListener('click',()=>renderLegacyRep(btn.getAttribute('data-legacy-rep'))));
  document.querySelectorAll('[data-legacy-team]').forEach(btn=>btn.addEventListener('click',()=>{ if(window._acqV2&&window._acqV2.back) window._acqV2.back(); else window.AcquisitionModule.render(); }));
}

function install(){
  if(!window.AcquisitionModule || window.AcquisitionModule.__legacyRepOverride) return;
  const original=window.AcquisitionModule.render.bind(window.AcquisitionModule);
  window.AcquisitionModule.render=async function(){
    await original();
    installStyle();
    await ensurePeriods();
    if(window._acqV2){ window._acqV2.openRep=renderLegacyRep; }
    document.querySelectorAll('[data-acq-rep-tab],[data-acq-rep]').forEach(btn=>{
      const owner=btn.getAttribute('data-acq-rep-tab')||btn.getAttribute('data-acq-rep');
      if(owner){ btn.onclick=(e)=>{e.preventDefault();renderLegacyRep(owner);}; }
    });
  };
  window.AcquisitionModule.__legacyRepOverride=true;
}

install();
})();
