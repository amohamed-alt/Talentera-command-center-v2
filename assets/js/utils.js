(function(){
'use strict';
const C=window.TCC;
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
function money(v){v=Number(v||0);const a=Math.abs(v);let f;if(a>=1e6)f=(v/1e6).toFixed(1)+'M';else if(a>=1e3)f=Math.round(v/1e3)+'K';else f=Math.round(v).toString();return(v<0?'-$':'$')+f.replace('-','');}
function num(v){return Number(v||0).toLocaleString();}
function pct(v){return Number(v||0).toFixed(1)+'%';}
function date(v){if(!v)return'—';try{return new Date(v).toISOString().slice(0,10);}catch{return String(v).slice(0,10);}}
function relDate(v){if(!v)return'—';const d=Math.round((Date.now()-new Date(v))/86400000);if(d===0)return'Today';if(d===1)return'Yesterday';if(d<0)return`In ${Math.abs(d)}d`;return`${d}d ago`;}
function hsCompany(id){return id?`${C.hsBase}/company/${id}`:null;}
function hsDeal(id){return id?`${C.hsBase}/deal/${id}`:null;}
function hsLink(url,label='↗ Open'){if(!url)return'—';return `<a class="hs-link" href="${esc(url)}" target="_blank" rel="noopener">${label}</a>`;}
function setTitle(t,s){const a=document.getElementById('topbarTitle'),b=document.getElementById('topbarSub');if(a)a.textContent=t;if(b)b.textContent=s||'';}
function setContent(html){const el=document.getElementById('appContent');if(el)el.innerHTML=html;}
function showLoading(msg='Loading…'){setContent(`<div class="loading-state"><div class="spinner"></div><div>${esc(msg)}</div></div>`);}
function showError(msg){setContent(`<div class="error-state">⚠ ${esc(msg)}</div>`);}
function unavailable(view,err){return `<div class="section-unavail">⚠ <strong>${esc(view)}</strong> unavailable — ${esc(err||'')}</div>`;}
function statusClass(s){
  if(!s)return'info';const v=String(s).toLowerCase();
  if(v.includes('lost')||v.includes('churn')||v.includes('delayed'))return'risk';
  if(v.includes('late')||v.includes('expected')||v.includes('upcoming'))return'warn';
  if(v.includes('cashed')||v.includes('renewed on time')||v.includes('booked'))return'ok';
  return'info';
}
window.U={esc,money,num,pct,date,relDate,hsCompany,hsDeal,hsLink,setTitle,setContent,showLoading,showError,unavailable,statusClass};
})();
