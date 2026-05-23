(function(){
'use strict';
const {esc,money,num,pct,hsLink}=window.U;

function sumCard(label,value,sub,color,onclick){
  const cls=`sum-card${onclick?' clickable':''}`;
  const attr=onclick?`data-onclick="${esc(onclick)}"`:'';
  return `<div class="${cls}" ${attr} style="--fp-c:${color||'var(--blue)'}">
    <div class="sum-card-accent" style="background:${color||'var(--blue)'}"></div>
    <div class="sum-val" style="color:${color||'var(--blue)'}">${value}</div>
    <div class="sum-lbl">${esc(label)}</div>
    ${sub?`<div class="sum-sub">${esc(sub)}</div>`:''}
  </div>`;
}

function kpiCard(label,value,sub,leftColor,onclickFn){
  return `<div class="ret-kpi" style="border-left:4px solid ${leftColor||'var(--green)'}" ${onclickFn?`data-kpi-onclick="${esc(onclickFn)}"`:''}>
    <div class="ret-kpi-v" style="color:${leftColor||'var(--green)'}">${value}</div>
    <div class="ret-kpi-l">${esc(label)}</div>
    ${sub?`<div class="ret-kpi-s">${esc(sub)}</div>`:''}
  </div>`;
}

function card(titleHtml,badgeHtml,bodyHtml){
  return `<div class="card">
    <div class="card-hd"><div class="card-title">${titleHtml}</div>${badgeHtml?`<span class="badge bb">${badgeHtml}</span>`:''}</div>
    ${bodyHtml}
  </div>`;
}

function table(rows, cols, limit=10, rowUrlFn=null){
  if(!rows||!rows.length) return `<div style="padding:20px;text-align:center;color:var(--muted);font-size:12px">No rows</div>`;
  const visible=rows.slice(0,limit), hidden=rows.slice(limit);
  const id='tbl_'+Math.random().toString(36).slice(2,8);
  const thead=`<thead><tr>${cols.map(c=>`<th class="${c.center?'c':''}">${esc(c.label)}</th>`).join('')}</tr></thead>`;
  const makeRow=(r,i)=>{
    const url=rowUrlFn?rowUrlFn(r):null;
    const attr=url?`onclick="window.open('${esc(url)}','_blank')" style="cursor:pointer"`:r._url?`onclick="window.open('${esc(r._url)}','_blank')" style="cursor:pointer"`:'';
    return `<tr ${attr}>${cols.map(c=>`<td class="${c.center?'c':''}">${c.render?c.render(r):esc(r[c.key])}</td>`).join('')}</tr>`;
  };
  let html=`<div class="tbl-wrap"><table class="tbl">${thead}<tbody id="${id}_body">${visible.map(makeRow).join('')}</tbody></table></div>`;
  if(hidden.length){
    const extraJson=JSON.stringify({rows:hidden,cols:cols.map(c=>({...c,render:null})),urlFn:null});
    html+=`<button class="show-more-btn" id="${id}_btn" onclick="Tables.showMore('${id}',${JSON.stringify(hidden.length)})">▼ Show ${hidden.length} more rows</button>`;
    window.__tableHidden=window.__tableHidden||{};
    window.__tableHidden[id]={rows:hidden,cols,rowUrlFn};
  }
  return html;
}

window.__tableHidden={};
window.Tables={
  showMore(id,_count){
    const h=window.__tableHidden[id];
    if(!h)return;
    const tbody=document.getElementById(id+'_body');
    const btn=document.getElementById(id+'_btn');
    if(!tbody||!btn)return;
    const {esc:e}=window.U;
    const {rows,cols,rowUrlFn}=h;
    const makeRow=(r)=>{
      const url=rowUrlFn?rowUrlFn(r):r._url||null;
      const attr=url?`onclick="window.open('${e(url)}','_blank')" style="cursor:pointer"`:'';
      return `<tr ${attr}>${cols.map(c=>`<td class="${c.center?'c':''}">${c.render?c.render(r):e(r[c.key])}</td>`).join('')}</tr>`;
    };
    tbody.insertAdjacentHTML('beforeend',rows.map(makeRow).join(''));
    btn.remove();
    delete window.__tableHidden[id];
  }
};

function openAllBtn(label,rows,cols,title,rowUrlFn){
  const id='oa_'+Math.random().toString(36).slice(2,8);
  window.__openAllData=window.__openAllData||{};
  window.__openAllData[id]={rows,cols,title,rowUrlFn};
  return `<button class="badge bb" style="cursor:pointer" onclick="window.Modal.openFromData('${id}')">${esc(label)}</button>`;
}

window.Components={sumCard,kpiCard,card,table,openAllBtn};
})();
