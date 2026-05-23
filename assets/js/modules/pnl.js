(function(){
'use strict';
const {esc,money,num,pct,setTitle,setContent,showLoading,unavailable}=window.U;
const {card,table}=window.Components;
const {get}=window.State;

const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
let _charts={};

function destroyCharts(){Object.values(_charts).forEach(c=>{try{c.destroy();}catch(e){}});_charts={};}

const MONTHLY_COLS=[
  {label:'Year',key:'year',center:true},{label:'Month',key:'month',center:true},{label:'Product',key:'product'},
  {label:'Booking',key:'booking',center:true,render:r=>money(r.booking)},
  {label:'Cashing',key:'cashing',center:true,render:r=>money(r.cashing)},
  {label:'COGS',key:'cogs',center:true,render:r=>money(r.cogs)},
  {label:'Overheads',key:'overheads',center:true,render:r=>money(r.overheads)},
  {label:'Support',key:'support_allocation',center:true,render:r=>money(r.support_allocation)},
  {label:'Total Cost',key:'total_cost',center:true,render:r=>money(r.total_cost)},
  {label:'Net Cash',key:'net_cash_position',center:true,render:r=>{const v=Number(r.net_cash_position||0);return `<span style="color:${v<0?'var(--red)':'var(--green)'};font-family:var(--mono);font-weight:900">${money(v)}</span>`;}},
];
const COST_COLS=[
  {label:'Year',key:'year',center:true},{label:'Product',key:'product'},
  {label:'COGS',key:'cogs',center:true,render:r=>money(r.cogs)},
  {label:'Overheads',key:'overheads',center:true,render:r=>money(r.overheads)},
  {label:'Support',key:'support_allocation',center:true,render:r=>money(r.support_allocation)},
  {label:'Total Cost',key:'total_cost',center:true,render:r=>money(r.total_cost)},
];

function sumBy(rows,year,key){
  return MONTHS.map((_,i)=>rows.filter(r=>String(r.year)===String(year)&&(Number(r.month)===i+1||String(r.month).slice(0,3).toLowerCase()===MONTHS[i].toLowerCase())).reduce((a,b)=>a+Number(b[key]||0),0));
}
function total(rows,year,key){return sumBy(rows,year,key).reduce((a,b)=>a+b,0);}

function drawCharts(rows){
  if(!window.Chart||!rows.length)return;
  destroyCharts();
  const CSS=s=>getComputedStyle(document.documentElement).getPropertyValue(s).trim();

  // YTD Bar
  const barEl=document.getElementById('pnlBar');
  if(barEl) _charts.bar=new Chart(barEl,{
    type:'bar',
    data:{
      labels:['Booking','Cashing','Total Cost'],
      datasets:[
        {label:'2025',data:[total(rows,'2025','booking'),total(rows,'2025','cashing'),total(rows,'2025','total_cost')],backgroundColor:'rgba(124,58,237,.35)',borderColor:'#7C3AED',borderWidth:1.5},
        {label:'2026',data:[total(rows,'2026','booking'),total(rows,'2026','cashing'),total(rows,'2026','total_cost')],backgroundColor:'rgba(22,163,74,.35)',borderColor:'#16A34A',borderWidth:1.5},
      ]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{font:{size:10},boxWidth:12}}},
      scales:{x:{ticks:{font:{size:9}},grid:{color:'rgba(22,64,42,.08)'}},y:{ticks:{font:{size:9},callback:v=>Math.abs(v)>=1e6?(v/1e6).toFixed(1)+'M':Math.abs(v)>=1e3?(v/1e3).toFixed(0)+'K':v},grid:{color:'rgba(22,64,42,.08)'}}}}
  });

  // Monthly trend line
  const lineEl=document.getElementById('pnlLine');
  if(lineEl) _charts.line=new Chart(lineEl,{
    type:'line',
    data:{
      labels:MONTHS,
      datasets:[
        {label:'Booking 2026',data:sumBy(rows,'2026','booking'),borderColor:'#7C3AED',backgroundColor:'rgba(124,58,237,.08)',tension:.35,fill:true,borderWidth:2},
        {label:'Cashing 2026',data:sumBy(rows,'2026','cashing'),borderColor:'#16A34A',backgroundColor:'rgba(22,163,74,.08)',tension:.35,fill:true,borderWidth:2},
        {label:'Cost 2026',data:sumBy(rows,'2026','total_cost'),borderColor:'#D97706',backgroundColor:'rgba(217,119,6,.08)',tension:.35,fill:true,borderWidth:2},
        {label:'Booking 2025',data:sumBy(rows,'2025','booking'),borderColor:'rgba(124,58,237,.4)',tension:.35,fill:false,borderWidth:1.5,borderDash:[4,3]},
      ]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{font:{size:10},boxWidth:12}}},
      scales:{x:{ticks:{font:{size:9}},grid:{color:'rgba(22,64,42,.08)'}},y:{ticks:{font:{size:9},callback:v=>Math.abs(v)>=1e6?(v/1e6).toFixed(1)+'M':Math.abs(v)>=1e3?(v/1e3).toFixed(0)+'K':v},grid:{color:'rgba(22,64,42,.08)'}}}}
  });

  // Cash vs Cost gap
  const gapEl=document.getElementById('pnlGap');
  if(gapEl){
    const cash26=sumBy(rows,'2026','cashing');
    const cost26=sumBy(rows,'2026','total_cost');
    const gap=cash26.map((v,i)=>v-cost26[i]);
    _charts.gap=new Chart(gapEl,{
      type:'bar',
      data:{labels:MONTHS,datasets:[{label:'Cash - Cost Gap',data:gap,backgroundColor:gap.map(v=>v>=0?'rgba(22,163,74,.5)':'rgba(220,38,38,.5)'),borderColor:gap.map(v=>v>=0?'#16A34A':'#DC2626'),borderWidth:1.5}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},
        scales:{x:{ticks:{font:{size:9}},grid:{color:'rgba(22,64,42,.08)'}},y:{ticks:{font:{size:9},callback:v=>Math.abs(v)>=1e6?(v/1e6).toFixed(1)+'M':v},grid:{color:'rgba(22,64,42,.08)'}}}}
    });
  }
}

async function render(){
  setTitle('P&L · Revenue Analysis','2025 full year · 2026 actuals to date · COGS + Overheads + Support');
  showLoading('Loading P&L…');

  const [execR,monthlyR,costR]=await Promise.allSettled([
    get('vw_pnl_exec_summary_v2',10),
    get('vw_pnl_monthly_summary_v2',200),
    get('vw_pnl_cost_breakdown_v2',20),
  ]);

  const exec=execR.status==='fulfilled'?execR.value:[];
  const monthly=monthlyR.status==='fulfilled'?monthlyR.value:[];
  const cost=costR.status==='fulfilled'?costR.value:[];

  const y26=exec.find(r=>String(r.year)==='2026')||exec[0]||{};
  const y25=exec.find(r=>String(r.year)==='2025')||{};

  window._pnl={monthly,exec,cost};

  // Exec cards
  const execCards=`<div class="pnl-exec-grid">
    <div class="pnl-exec-card" style="--fc:var(--purple)" onclick="window.Modal.open({title:'Monthly P&L 2026',rows:window._pnl.monthly.filter(r=>String(r.year)==='2026'),cols:[]})">
      <div class="pnl-exec-v">${money(y26.booking)}</div>
      <div class="pnl-exec-l">Booking 2026</div>
      <div class="pnl-exec-s">vs ${money(y25.booking||0)} in 2025</div>
    </div>
    <div class="pnl-exec-card" style="--fc:var(--green)" onclick="window.Modal.open({title:'Monthly Cashing 2026',rows:window._pnl.monthly.filter(r=>String(r.year)==='2026'),cols:[]})">
      <div class="pnl-exec-v">${money(y26.cashing)}</div>
      <div class="pnl-exec-l">Cashing 2026</div>
      <div class="pnl-exec-s">vs ${money(y25.cashing||0)} in 2025</div>
    </div>
    <div class="pnl-exec-card" style="--fc:var(--amber)">
      <div class="pnl-exec-v">${money(y26.total_cost)}</div>
      <div class="pnl-exec-l">Total Cost 2026</div>
      <div class="pnl-exec-s">COGS + Overheads + Support</div>
    </div>
    <div class="pnl-exec-card" style="--fc:${Number(y26.net_cash_position||0)<0?'var(--red)':'var(--green)'}">
      <div class="pnl-exec-v">${money(y26.net_cash_position)}</div>
      <div class="pnl-exec-l">Net Cash Position</div>
      <div class="pnl-exec-s">Cash minus total cost</div>
    </div>
    <div class="pnl-exec-card" style="--fc:${Number(y26.cash_coverage_pct||0)<70?'var(--red)':'var(--green)'}">
      <div class="pnl-exec-v">${pct(y26.cash_coverage_pct||0)}</div>
      <div class="pnl-exec-l">Cash Coverage</div>
      <div class="pnl-exec-s">Cash / Total Cost</div>
    </div>
    <div class="pnl-exec-card" style="--fc:var(--cyan)">
      <div class="pnl-exec-v">${pct(y26.booking_cash_pct||0)}</div>
      <div class="pnl-exec-l">Booking → Cash</div>
      <div class="pnl-exec-s">Cash / Booking ratio</div>
    </div>
  </div>`;

  // Filters
  const products=[...new Set(monthly.map(r=>r.product).filter(Boolean))].sort();
  const filterBar=`<div class="pnl-filters">
    <select class="pnl-select" id="pnlYearFilter" onchange="window._pnlFilter()">
      <option value="all">All Years</option><option value="2026" selected>2026</option><option value="2025">2025</option>
    </select>
    <select class="pnl-select" id="pnlProductFilter" onchange="window._pnlFilter()">
      <option value="All">All Products</option>${products.map(p=>`<option>${esc(p)}</option>`).join('')}
    </select>
    <button class="badge bb" onclick="window.Modal.open({title:'Full Monthly P&L',rows:window._pnl.monthly,cols:[]})">Export All Rows</button>
  </div>`;

  window._pnlFilter=function(){
    const yr=document.getElementById('pnlYearFilter')?.value||'all';
    const pr=document.getElementById('pnlProductFilter')?.value||'All';
    const filtered=monthly.filter(r=>(yr==='all'||String(r.year)===yr)&&(pr==='All'||r.product===pr));
    document.getElementById('pnlTable').innerHTML=table(filtered,MONTHLY_COLS,20);
  };

  // Charts grid
  const chartsGrid=`<div class="pnl-chart-grid">
    <div class="pnl-chart-card">
      <div class="pnl-chart-hd"><div class="pnl-chart-title">YTD Comparison — Booking / Cashing / Cost</div></div>
      <div class="pnl-chart-wrap"><canvas id="pnlBar"></canvas></div>
    </div>
    <div class="pnl-chart-card">
      <div class="pnl-chart-hd"><div class="pnl-chart-title">Monthly Trend 2026 vs 2025</div></div>
      <div class="pnl-chart-wrap"><canvas id="pnlLine"></canvas></div>
    </div>
    <div class="pnl-chart-card">
      <div class="pnl-chart-hd"><div class="pnl-chart-title">Cash vs Cost Gap — 2026</div></div>
      <div class="pnl-chart-wrap"><canvas id="pnlGap"></canvas></div>
    </div>
    ${cost.length?`<div class="pnl-chart-card">
      <div class="pnl-chart-hd"><div class="pnl-chart-title">Cost Breakdown</div></div>
      <div style="padding:0">${table(cost,COST_COLS,10)}</div>
    </div>`:''}
  </div>`;

  const monthlySection=`<div class="manager-section-label">Monthly P&L Table</div>
  ${card('<div class="card-title-icon" style="background:var(--blue-bg)">📊</div> Monthly P&L Detail',
    `<span class="badge bb">${monthly.length} rows</span>`,
    filterBar+`<div id="pnlTable">${table(monthly.filter(r=>String(r.year)==='2026'),MONTHLY_COLS,20)}</div>`)}`;

  setContent(execCards+chartsGrid+monthlySection);
  setTimeout(()=>drawCharts(monthly),100);
}

window.PnlModule={render};
})();
