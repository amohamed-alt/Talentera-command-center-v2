(function(){
'use strict';
const {esc}=window.U;
let _rows=[],_cols=[],_filtered=[];

function open({title,subtitle,rows,cols,rowUrlFn}){
  _rows=rows||[];_cols=cols||[];_filtered=[..._rows];
  document.getElementById('modalTitle').textContent=title||'Details';
  document.getElementById('modalSub').textContent=subtitle||(rows.length+' rows');
  document.getElementById('modalSearch').value='';
  render(rowUrlFn);
  document.getElementById('detailModal').style.display='flex';
  document.body.style.overflow='hidden';
  window.__modalUrlFn=rowUrlFn||null;
  document.getElementById('modalSearch').oninput=function(){
    const q=this.value.toLowerCase();
    _filtered=q?_rows.filter(r=>Object.values(r).some(v=>String(v||'').toLowerCase().includes(q))):_rows;
    document.getElementById('modalSub').textContent=`${_filtered.length} / ${_rows.length} rows`;
    render(window.__modalUrlFn);
  };
  document.getElementById('modalExportBtn').onclick=()=>exportCsv(title);
}

function openFromData(id){
  const d=(window.__openAllData||{})[id];
  if(!d)return;
  open(d);
}

function render(rowUrlFn){
  const {esc:e}=window.U;
  if(!_filtered.length){document.getElementById('modalBody').innerHTML='<div class="modal-empty">No rows to display</div>';return;}
  const thead=`<thead><tr>${_cols.map(c=>`<th class="${c.center?'c':''}">${e(c.label)}</th>`).join('')}</tr></thead>`;
  const tbody=_filtered.map(r=>{
    const url=rowUrlFn?rowUrlFn(r):r._url||r.hubspot_url||r.hubspot_company_url||r.company_url||r.hubspot_search_url||null;
    const attr=url?`onclick="window.open('${e(url)}','_blank')" style="cursor:pointer"`:'' ;
    return `<tr ${attr}>${_cols.map(c=>`<td class="${c.center?'c':''}">${c.render?c.render(r):e(r[c.key])}</td>`).join('')}</tr>`;
  }).join('');
  document.getElementById('modalBody').innerHTML=`<div class="tbl-wrap"><table class="tbl">${thead}<tbody>${tbody}</tbody></table></div>`;
}

function exportCsv(title){
  if(!_filtered.length)return;
  const headers=_cols.map(c=>c.label);
  const csvRows=[headers,..._filtered.map(r=>_cols.map(c=>{
    const v=c.csvVal?c.csvVal(r):(r[c.key]??'');
    const s=String(v).replace(/"/g,'""');
    return s.includes(',')||s.includes('\n')?`"${s}"`:s;
  }))];
  const blob=new Blob([csvRows.map(r=>r.join(',')).join('\n')],{type:'text/csv'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=`${(title||'export').replace(/\s+/g,'_')}.csv`;
  a.click();
}

function close(){
  document.getElementById('detailModal').style.display='none';
  document.body.style.overflow='';
}

// Wire close button and backdrop
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('modalCloseBtn').onclick=close;
  document.getElementById('detailModal').onclick=function(e){if(e.target===this)close();};
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
});

// Delegated card clicks
document.addEventListener('click',function(e){
  const card=e.target.closest('[data-onclick]');
  if(card){try{eval(card.dataset.onclick);}catch(err){console.error(err);}return;}
  const kpi=e.target.closest('[data-kpi-onclick]');
  if(kpi){try{eval(kpi.dataset.kpiOnclick);}catch(err){console.error(err);}return;}
});

window.Modal={open,openFromData,close};
window.__openAllData={};
})();
