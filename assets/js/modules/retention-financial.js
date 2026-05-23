(function(){
'use strict';
const {esc,money,num,pct,date,hsLink,setTitle,setContent,showLoading,unavailable,statusClass}=window.U;
const {card,table}=window.Components;
const {get}=window.State;

const STATUS_COLS=[
  {label:'Account',key:'company_name',render:r=>r.hubspot_search_url?`<a class="record-link" href="${esc(r.hubspot_search_url)}" target="_blank">${esc(r.company_name)}</a>`:esc(r.company_name)},
  {label:'Product',key:'product'},{label:'RM',key:'rm_owner'},{label:'CSM',key:'csm_owner'},
  {label:'Month',key:'month',center:true},
  {label:'Renewal',key:'renewal_value',center:true,render:r=>money(r.renewal_value)},
  {label:'Booked',key:'booked_value',center:true,render:r=>money(r.booked_value)},
  {label:'Collected',key:'collected_value',center:true,render:r=>money(r.collected_value)},
  {label:'Remaining',key:'remaining_collection_value',center:true,render:r=>money(r.remaining_collection_value||0)},
  {label:'Status',key:'status',center:true,render:r=>{const s=r.renewal_status||r.status||'';return `<span class="fin-status ${statusClass(s)}">${esc(s)}</span>`;}},
  {label:'Open',key:'hubspot_search_url',center:true,render:r=>hsLink(r.hubspot_search_url)},
];
const OWNER_COLS=[
  {label:'Role',key:'role'},{label:'Owner',key:'owner_name'},
  {label:'Accounts',key:'accounts',center:true,render:r=>num(r.accounts)},
  {label:'Renewal',key:'renewal_value',center:true,render:r=>money(r.renewal_value)},
  {label:'Booked',key:'booked_value',center:true,render:r=>money(r.booked_value)},
  {label:'Cash',key:'cash_collected',center:true,render:r=>money(r.cash_collected)},
  {label:'Booked Not Cash',key:'booked_not_cash',center:true,render:r=>money(r.booked_not_cash||0)},
  {label:'Remaining',key:'remaining_collection',center:true,render:r=>money(r.remaining_collection||0)},
  {label:'Delayed',key:'delayed_accounts',center:true,render:r=>`<span style="color:${r.delayed_accounts>0?'var(--red)':'var(--text2)'};font-weight:900">${num(r.delayed_accounts)}</span>`},
];
const PRODUCT_COLS=[
  {label:'Product',key:'product'},
  {label:'Accounts',key:'accounts',center:true,render:r=>num(r.accounts)},
  {label:'Renewal',key:'renewal_value',center:true,render:r=>money(r.renewal_value)},
  {label:'Booked',key:'booked_value',center:true,render:r=>money(r.booked_value)},
  {label:'Cash',key:'cash_collected',center:true,render:r=>money(r.cash_collected)},
  {label:'Booked Not Cash',key:'booked_not_cash',center:true,render:r=>money(r.booked_not_cash||0)},
  {label:'Delayed',key:'delayed_accounts',center:true,render:r=>num(r.delayed_accounts)},
  {label:'Lost',key:'lost_accounts',center:true,render:r=>num(r.lost_accounts||0)},
];
const NOT_BUDGET_COLS=[
  {label:'Source',key:'source'},{label:'Company',key:'company_name'},
  {label:'Product',key:'product'},{label:'Owner',key:'owner_name'},
  {label:'Date',key:'event_date',center:true,render:r=>date(r.event_date)},
  {label:'Value',key:'value',center:true,render:r=>money(r.value)},
  {label:'Flag',key:'flag'},
];

async function render(){
  setTitle('Retention · Financial Details','Booked, cash collected, delayed and renewal exposure');
  showLoading('Loading Retention Financial…');

  const [sumR,ownersR,productsR,logicR,monthR,notBudR]=await Promise.allSettled([
    get('vw_retention_team_summary',1),
    get('vw_retention_owner_financial_summary',50),
    get('vw_retention_product_financial_summary',20),
    get('vw_retention_renewal_logic',500),
    get('vw_retention_monthly_renewal_pipeline',20),
    get('vw_retention_not_in_budget',200),
  ]);

  const s=sumR.status==='fulfilled'?sumR.value[0]||{}:{};
  const owners=ownersR.status==='fulfilled'?ownersR.value:null;
  const products=productsR.status==='fulfilled'?productsR.value:null;
  const logic=logicR.status==='fulfilled'?logicR.value:[];
  const monthly=monthR.status==='fulfilled'?monthR.value:[];
  const notBud=notBudR.status==='fulfilled'?notBudR.value:null;

  // Status groups
  const booked=logic.filter(r=>Number(r.booked_value)>0);
  const cashed=logic.filter(r=>Number(r.collected_value)>0);
  const delayed=logic.filter(r=>r.is_delayed===true);
  const lostRows=logic.filter(r=>/lost|churn/i.test(r.renewal_status||r.status||''));
  const expected=logic.filter(r=>/expected/i.test(r.renewal_status||r.status||''));
  const late=logic.filter(r=>r.renewed_late===true||/renewed late/i.test(r.renewal_status||''));
  const remaining=logic.filter(r=>Number(r.remaining_collection_value||0)>0);

  window._fin={booked,cashed,delayed,lostRows,expected,late,remaining,logic};

  // Top financial cards
  const finCards=`<div class="ret-fin-top-grid">
    <div class="ret-fin-card" style="--fc:var(--cyan)" onclick="window.Modal.open({title:'All Renewals',rows:window._fin.logic,cols:${JSON.stringify(STATUS_COLS.map(c=>({...c,render:null})))}})">
      <div class="ret-fin-card-icon">💎</div>
      <div class="ret-fin-card-v">${money(s.renewal_value)}</div>
      <div class="ret-fin-card-l">Renewal Value</div>
      <div class="ret-fin-card-s">${num(s.accounts||logic.length)} accounts</div>
    </div>
    <div class="ret-fin-card" style="--fc:var(--purple)" onclick="window.Modal.open({title:'Booked Value',rows:window._fin.booked,cols:${JSON.stringify(STATUS_COLS.map(c=>({...c,render:null})))}})">
      <div class="ret-fin-card-icon">📝</div>
      <div class="ret-fin-card-v">${money(s.booked_value)}</div>
      <div class="ret-fin-card-l">Booked Value Total</div>
      <div class="ret-fin-card-s">${num(s.booked_accounts||booked.length)} booking rows</div>
    </div>
    <div class="ret-fin-card" style="--fc:var(--green)" onclick="window.Modal.open({title:'Cash Collected',rows:window._fin.cashed,cols:${JSON.stringify(STATUS_COLS.map(c=>({...c,render:null})))}})">
      <div class="ret-fin-card-icon">💵</div>
      <div class="ret-fin-card-v">${money(s.cash_collected)}</div>
      <div class="ret-fin-card-l">Cash Collected</div>
      <div class="ret-fin-card-s">${num(s.cashed_accounts||cashed.length)} collection rows</div>
    </div>
    <div class="ret-fin-card" style="--fc:var(--blue)" onclick="window.Modal.open({title:'Booked Not Cash',rows:window._fin.remaining,cols:${JSON.stringify(STATUS_COLS.map(c=>({...c,render:null})))}})">
      <div class="ret-fin-card-icon">⏳</div>
      <div class="ret-fin-card-v">${money(s.booked_not_cash||s.remaining_collection)}</div>
      <div class="ret-fin-card-l">Booked Not Cash</div>
      <div class="ret-fin-card-s">Collection pending</div>
    </div>
    <div class="ret-fin-card" style="--fc:var(--red)" onclick="window.Modal.open({title:'Delayed Accounts',rows:window._fin.delayed,cols:${JSON.stringify(STATUS_COLS.map(c=>({...c,render:null})))}})">
      <div class="ret-fin-card-icon">🚨</div>
      <div class="ret-fin-card-v">${num(s.delayed_accounts||delayed.length)}</div>
      <div class="ret-fin-card-l">Delayed Accounts</div>
      <div class="ret-fin-card-s">${money(s.delayed_value||delayed.reduce((a,r)=>a+Number(r.renewal_value||0),0))} value</div>
    </div>
    <div class="ret-fin-card" style="--fc:var(--amber)" onclick="window.Modal.open({title:'Renewed Late',rows:window._fin.late,cols:${JSON.stringify(STATUS_COLS.map(c=>({...c,render:null})))}})">
      <div class="ret-fin-card-icon">⚠️</div>
      <div class="ret-fin-card-v">${num(s.renewed_late_accounts||late.length)}</div>
      <div class="ret-fin-card-l">Renewed Late</div>
      <div class="ret-fin-card-s">${money(s.renewed_late_value||0)}</div>
    </div>
    <div class="ret-fin-card" style="--fc:var(--amber)" onclick="window.Modal.open({title:'Expected to be Lost',rows:window._fin.expected,cols:${JSON.stringify(STATUS_COLS.map(c=>({...c,render:null})))}})">
      <div class="ret-fin-card-icon">⚡</div>
      <div class="ret-fin-card-v">${num(s.expected_lost_accounts||expected.length)}</div>
      <div class="ret-fin-card-l">Expected Lost</div>
      <div class="ret-fin-card-s">${money(s.expected_lost_value||0)}</div>
    </div>
    <div class="ret-fin-card" style="--fc:var(--red)" onclick="window.Modal.open({title:'Lost Accounts',rows:window._fin.lostRows,cols:${JSON.stringify(STATUS_COLS.map(c=>({...c,render:null})))}})">
      <div class="ret-fin-card-icon">✗</div>
      <div class="ret-fin-card-v">${num(s.lost_accounts||lostRows.length)}</div>
      <div class="ret-fin-card-l">Lost</div>
      <div class="ret-fin-card-s">${money(s.lost_value||0)}</div>
    </div>
    <div class="ret-fin-card" style="--fc:var(--green)">
      <div class="ret-fin-card-icon">📊</div>
      <div class="ret-fin-card-v">${pct(s.cash_collection_pct||0)}</div>
      <div class="ret-fin-card-l">Cash Collection %</div>
      <div class="ret-fin-card-s">Cash / renewal</div>
    </div>
    <div class="ret-fin-card" style="--fc:var(--cyan)">
      <div class="ret-fin-card-icon">📈</div>
      <div class="ret-fin-card-v">${pct(s.booking_coverage_pct||0)}</div>
      <div class="ret-fin-card-l">Booking Coverage %</div>
      <div class="ret-fin-card-s">Booked / renewal</div>
    </div>
  </div>`;

  // Owner summary
  let ownerSection='';
  if(owners){
    const ownerHead=['Owner','Role','Accounts','Renewal','Booked Total','Cash Collected','Booked Not Cash','Remaining','Delayed'];
    ownerSection=`<div class="manager-section-label">Owner Financial Summary</div>
    ${card('<div class="card-title-icon" style="background:var(--blue-bg)">📊</div> Owner Financial Summary',
      `<span class="badge bb">${owners.length} owners</span>`,
      `<div class="tbl-wrap"><table class="tbl">
        <thead><tr>${ownerHead.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead>
        <tbody>${owners.map(o=>`<tr>
          <td><strong>${esc(o.owner_name)}</strong></td>
          <td><span class="ret-tag">${esc(o.role)}</span></td>
          <td class="c" style="font-family:var(--mono);font-weight:900">${num(o.accounts)}</td>
          <td class="c" style="font-family:var(--mono);font-weight:900;color:var(--cyan)">${money(o.renewal_value)}</td>
          <td class="c" style="font-family:var(--mono);font-weight:900;color:var(--purple)">${money(o.booked_value)}</td>
          <td class="c" style="font-family:var(--mono);font-weight:900;color:var(--green)">${money(o.cash_collected)}</td>
          <td class="c" style="font-family:var(--mono);font-weight:900;color:var(--blue)">${money(o.booked_not_cash||0)}</td>
          <td class="c" style="font-family:var(--mono);font-weight:900">${money(o.remaining_collection||0)}</td>
          <td class="c" style="font-family:var(--mono);font-weight:900;color:${o.delayed_accounts>0?'var(--red)':'var(--text2)'}">${num(o.delayed_accounts)}</td>
        </tr>`).join('')}</tbody>
      </table></div>`)}`;
  }

  // Product summary + monthly
  const splitSection=`<div class="manager-section-label">Product & Monthly</div>
  <div class="two-col">
    ${products?card('<div class="card-title-icon" style="background:var(--purple-bg)">📦</div> Product Summary',`<span class="badge bp">${products.length} products</span>`,table(products,PRODUCT_COLS,10)):''}
    ${monthly.length?card('<div class="card-title-icon" style="background:var(--amber-bg)">📅</div> Monthly Pipeline',`<span class="badge ba">${monthly.length} months</span>`,table(monthly,[
      {label:'Month',key:'month'},{label:'Due',key:'due_accounts',center:true,render:r=>num(r.due_accounts)},
      {label:'Renewal',key:'renewal_value',center:true,render:r=>money(r.renewal_value)},
      {label:'Booked',key:'booked_value',center:true,render:r=>money(r.booked_value)},
      {label:'Cash',key:'cash_collected',center:true,render:r=>money(r.cash_collected)},
      {label:'Remaining',key:'remaining_collection',center:true,render:r=>money(r.remaining_collection||0)},
    ],13)):''}
  </div>`;

  // Status split
  const statusSection=`<div class="manager-section-label">Renewal Status Split</div>
  ${card('<div class="card-title-icon" style="background:var(--cyan-bg)">📌</div> Renewal Status Split',
    `<span class="badge bc">${logic.length} accounts</span>`,
    `<div style="padding:12px 14px;display:grid;grid-template-columns:repeat(4,1fr);gap:10px;border-bottom:1px solid var(--border)">
      ${[
        {label:'📝 Booked',rows:booked,color:'var(--purple)'},
        {label:'💵 Cashed',rows:cashed,color:'var(--green)'},
        {label:'⏳ Remaining',rows:remaining,color:'var(--blue)'},
        {label:'🔴 Delayed',rows:delayed,color:'var(--red)'},
        {label:'⚠️ Late',rows:late,color:'var(--amber)'},
        {label:'⚡ Expected Lost',rows:expected,color:'var(--amber)'},
        {label:'✗ Lost',rows:lostRows,color:'var(--red)'},
      ].map(g=>`<div style="background:rgba(255,255,255,.5);border:1px solid var(--border);border-radius:var(--r);padding:10px;text-align:center;cursor:pointer;border-left:3px solid ${g.color}"
        onclick="window.Modal.open({title:'${g.label.replace(/['"]/g,'')}',rows:window._fin[Object.keys(window._fin).find(k=>window._fin[k]===window._fin['${Object.keys({booked,cashed,delayed,lostRows,expected,late,remaining}).find(k=>({booked,cashed,delayed,lostRows,expected,late,remaining}[k]===g.rows))}'])],cols:[]})">
        <div style="font-family:var(--mono);font-size:20px;font-weight:900;color:${g.color}">${num(g.rows.length)}</div>
        <div style="font-size:9px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-top:6px">${g.label}</div>
      </div>`).join('')}
    </div>
    ${table(logic,STATUS_COLS,8,r=>r.hubspot_search_url)}`)}`;

  // Fix the status split onclick with proper data refs  
  const statusSectionFixed=`<div class="manager-section-label">Renewal Status Split</div>
  ${card('<div class="card-title-icon" style="background:var(--cyan-bg)">📌</div> Renewal Status Split',
    `<button class="badge bc" onclick="window.Modal.open({title:'All Renewals',rows:window._fin.logic,cols:[]})">Open All ${logic.length}</button>`,
    `<div style="padding:12px 14px;display:grid;grid-template-columns:repeat(4,1fr);gap:10px;border-bottom:1px solid var(--border)">
      <div style="background:rgba(255,255,255,.5);border:1px solid var(--border);border-radius:var(--r);padding:10px;text-align:center;cursor:pointer;border-left:3px solid var(--purple)" onclick="window.Modal.open({title:'Booked Value',rows:window._fin.booked,cols:[]})"><div style="font-family:var(--mono);font-size:20px;font-weight:900;color:var(--purple)">${num(booked.length)}</div><div style="font-size:9px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-top:6px">📝 Booked</div></div>
      <div style="background:rgba(255,255,255,.5);border:1px solid var(--border);border-radius:var(--r);padding:10px;text-align:center;cursor:pointer;border-left:3px solid var(--green)" onclick="window.Modal.open({title:'Cash Collected',rows:window._fin.cashed,cols:[]})"><div style="font-family:var(--mono);font-size:20px;font-weight:900;color:var(--green)">${num(cashed.length)}</div><div style="font-size:9px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-top:6px">💵 Cashed</div></div>
      <div style="background:rgba(255,255,255,.5);border:1px solid var(--border);border-radius:var(--r);padding:10px;text-align:center;cursor:pointer;border-left:3px solid var(--red)" onclick="window.Modal.open({title:'Delayed',rows:window._fin.delayed,cols:[]})"><div style="font-family:var(--mono);font-size:20px;font-weight:900;color:var(--red)">${num(delayed.length)}</div><div style="font-size:9px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-top:6px">🔴 Delayed</div></div>
      <div style="background:rgba(255,255,255,.5);border:1px solid var(--border);border-radius:var(--r);padding:10px;text-align:center;cursor:pointer;border-left:3px solid var(--amber)" onclick="window.Modal.open({title:'Renewed Late',rows:window._fin.late,cols:[]})"><div style="font-family:var(--mono);font-size:20px;font-weight:900;color:var(--amber)">${num(late.length)}</div><div style="font-size:9px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-top:6px">⚠️ Renewed Late</div></div>
      <div style="background:rgba(255,255,255,.5);border:1px solid var(--border);border-radius:var(--r);padding:10px;text-align:center;cursor:pointer;border-left:3px solid var(--amber)" onclick="window.Modal.open({title:'Expected Lost',rows:window._fin.expected,cols:[]})"><div style="font-family:var(--mono);font-size:20px;font-weight:900;color:var(--amber)">${num(expected.length)}</div><div style="font-size:9px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-top:6px">⚡ Expected Lost</div></div>
      <div style="background:rgba(255,255,255,.5);border:1px solid var(--border);border-radius:var(--r);padding:10px;text-align:center;cursor:pointer;border-left:3px solid var(--red)" onclick="window.Modal.open({title:'Lost',rows:window._fin.lostRows,cols:[]})"><div style="font-family:var(--mono);font-size:20px;font-weight:900;color:var(--red)">${num(lostRows.length)}</div><div style="font-size:9px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-top:6px">✗ Lost</div></div>
      <div style="background:rgba(255,255,255,.5);border:1px solid var(--border);border-radius:var(--r);padding:10px;text-align:center;cursor:pointer;border-left:3px solid var(--blue)" onclick="window.Modal.open({title:'Remaining Collection',rows:window._fin.remaining,cols:[]})"><div style="font-family:var(--mono);font-size:20px;font-weight:900;color:var(--blue)">${num(remaining.length)}</div><div style="font-size:9px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-top:6px">⏳ Remaining</div></div>
    </div>
    ${table(logic,STATUS_COLS,8,r=>r.hubspot_search_url)}`)}`;

  // Not in Budget
  const notBudSection=notBud?
    `<div class="manager-section-label">Not in Budget</div>
     ${card('<div class="card-title-icon" style="background:var(--amber-bg)">🚩</div> Not in Budget 2026',
       `<span class="badge ba">${notBud.length} rows</span>`,
       table(notBud,NOT_BUDGET_COLS,10))}`:
    '';

  // Patch modal cols for status groups
  window._fin.STATUS_COLS=STATUS_COLS;

  setContent(finCards+ownerSection+splitSection+statusSectionFixed+notBudSection);
}

window.RetentionFinancialModule={render};
})();
