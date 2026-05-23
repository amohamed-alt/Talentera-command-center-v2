(function(){
'use strict';
const {esc,money,num,date,setTitle,setContent,showLoading}=window.U;
const {card,table}=window.Components;
const {get}=window.State;

const CO_COLS=[
  {label:'Company',key:'company_name'},{label:'Product',key:'product_line'},
  {label:'Owner',key:'owner_name'},{label:'CSM',key:'csm_owner'},
  {label:'Features',key:'features',center:true,render:r=>num(r.features)},
  {label:'Proposal',key:'proposal',center:true,render:r=>num(r.proposal)},
  {label:'Interested',key:'interested',center:true,render:r=>`<span style="color:var(--green);font-weight:900">${num(r.interested)}</span>`},
  {label:'Not Interested',key:'not_interested',center:true,render:r=>`<span style="color:var(--red);font-weight:900">${num(r.not_interested)}</span>`},
  {label:'Upsell',key:'upsell',center:true,render:r=>money(r.upsell)},
  {label:'Renewal',key:'renewal',center:true,render:r=>money(r.renewal)},
];
const FEAT_COLS=[
  {label:'Company',key:'company_name'},{label:'Feature',key:'feature_name'},{label:'Status',key:'feature_status'},
  {label:'Proposal Date',key:'proposal_sent_date',center:true,render:r=>date(r.proposal_sent_date)},
  {label:'Expected Month',key:'expected_month',center:true},
  {label:'Upsell Value',key:'upsell_value',center:true,render:r=>money(r.upsell_value)},
  {label:'Owner',key:'owner_name'},{label:'CSM',key:'csm_owner'},
];

function groupByCompany(rows){
  const map={};
  rows.forEach(r=>{
    const k=(r.company_name||'Unknown').toLowerCase().trim();
    if(!map[k])map[k]={company_name:r.company_name,product_line:r.product_line,owner_name:r.owner_name,csm_owner:r.csm_owner,features:0,proposal:0,interested:0,not_interested:0,upsell:0,renewal:0,_rows:[]};
    const c=map[k];c.features++;c._rows.push(r);
    const st=String(r.feature_status||'').toLowerCase();
    if(st.includes('proposal'))c.proposal++;
    if(st.includes('interested')&&!st.includes('not'))c.interested++;
    if(st.includes('not interested'))c.not_interested++;
    c.upsell=Math.max(c.upsell,Number(r.upsell_value||0));
    c.renewal=Math.max(c.renewal,Number(r.renewal_value||0));
  });
  return Object.values(map).sort((a,b)=>b.upsell-a.upsell);
}

async function render(){
  setTitle('Features Plan · Upselling','Upsell features grouped by company');
  showLoading('Loading Features Plan…');

  const rows=await get('features_plan_rows',2000).catch(()=>[]);
  const companies=groupByCompany(rows);

  const totalUpsell=companies.reduce((s,c)=>s+c.upsell,0);
  const totalProposal=companies.reduce((s,c)=>s+c.proposal,0);
  const totalInterested=companies.reduce((s,c)=>s+c.interested,0);
  const totalNot=companies.reduce((s,c)=>s+c.not_interested,0);

  // Unique filters
  const products=[...new Set(rows.map(r=>r.product_line).filter(Boolean))].sort();
  const owners=[...new Set(rows.map(r=>r.owner_name).filter(Boolean))].sort();
  let filterProduct='All',filterOwner='All';

  window._feat={companies,rows,filtered:companies};

  function getFiltered(){
    return companies.filter(c=>{
      if(filterProduct!=='All'&&c.product_line!==filterProduct)return false;
      if(filterOwner!=='All'&&c.owner_name!==filterOwner)return false;
      return true;
    });
  }
  function rerender(){
    const fc=getFiltered();
    window._feat.filtered=fc;
    document.getElementById('featTable').innerHTML=table(fc,CO_COLS,20);
    document.getElementById('featCount').textContent=fc.length+' companies';
  }

  const filterBar=`<div style="display:flex;gap:8px;flex-wrap:wrap;padding:12px 16px;background:var(--surface2);border-bottom:1px solid var(--border)">
    <select class="pnl-select" onchange="window._featFilter('product',this.value)">
      <option value="All">All Products</option>
      ${products.map(p=>`<option>${esc(p)}</option>`).join('')}
    </select>
    <select class="pnl-select" onchange="window._featFilter('owner',this.value)">
      <option value="All">All Owners</option>
      ${owners.map(o=>`<option>${esc(o)}</option>`).join('')}
    </select>
    <button class="badge bb" onclick="window.Modal.open({title:'All Features',rows:window._feat.rows,cols:[]})">All ${rows.length} feature rows</button>
  </div>`;

  window._featFilter=function(type,val){
    if(type==='product')filterProduct=val;
    else filterOwner=val;
    rerender();
  };

  const summaryCards=`<div class="summary-grid">
    <div class="sum-card" style="cursor:pointer" onclick="window.Modal.open({title:'All Companies',rows:window._feat.filtered,cols:[]})" ><div class="sum-card-accent" style="background:var(--blue)"></div><div class="sum-val" style="color:var(--blue)">${num(companies.length)}</div><div class="sum-lbl">Companies</div></div>
    <div class="sum-card" style="cursor:pointer" onclick="window.Modal.open({title:'Proposal Sent',rows:window._feat.filtered.filter(c=>c.proposal>0),cols:[]})"><div class="sum-card-accent" style="background:var(--purple)"></div><div class="sum-val" style="color:var(--purple)">${num(totalProposal)}</div><div class="sum-lbl">Proposal Sent</div></div>
    <div class="sum-card" style="cursor:pointer" onclick="window.Modal.open({title:'Interested',rows:window._feat.filtered.filter(c=>c.interested>0),cols:[]})"><div class="sum-card-accent" style="background:var(--green)"></div><div class="sum-val" style="color:var(--green)">${num(totalInterested)}</div><div class="sum-lbl">Interested</div></div>
    <div class="sum-card" style="cursor:pointer" onclick="window.Modal.open({title:'Not Interested',rows:window._feat.filtered.filter(c=>c.not_interested>0),cols:[]})"><div class="sum-card-accent" style="background:var(--red)"></div><div class="sum-val" style="color:var(--red)">${num(totalNot)}</div><div class="sum-lbl">Not Interested</div></div>
    <div class="sum-card"><div class="sum-card-accent" style="background:var(--amber)"></div><div class="sum-val" style="color:var(--amber)">${money(totalUpsell)}</div><div class="sum-lbl">Total Upsell Value</div><div class="sum-sub">Company-unique max</div></div>
    <div class="sum-card"><div class="sum-card-accent" style="background:var(--cyan)"></div><div class="sum-val" style="color:var(--cyan)">${money(companies.reduce((s,c)=>s+c.renewal,0))}</div><div class="sum-lbl">Total Renewal Value</div><div class="sum-sub">Company-unique max</div></div>
  </div>`;

  const mainCard=`<div class="manager-section-label">Company Features Plan</div>
  ${card('<div class="card-title-icon" style="background:var(--blue-bg)">🚀</div> Company Features Plan',
    `<span class="badge bb" id="featCount">${companies.length} companies</span>`,
    filterBar+`<div id="featTable">${table(companies,CO_COLS,20)}</div>`)}`;

  setContent(summaryCards+mainCard);

  // Patch modal cols
  window.Modal._origOpen=window.Modal.open;
  CO_COLS.forEach(c=>{if(!c.render)c.render=null;});
  FEAT_COLS.forEach(c=>{if(!c.render)c.render=null;});
  window._feat.CO_COLS=CO_COLS;
  window._feat.FEAT_COLS=FEAT_COLS;
}

window.FeaturesPlanModule={render};
})();
