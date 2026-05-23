(function(){
'use strict';
const C = window.TCC;
async function fetchView(name, limit=2000, extra=''){
  const url = `${C.supabaseUrl}/rest/v1/${encodeURIComponent(name)}?select=*&limit=${limit}${extra}`;
  const r = await fetch(url,{cache:'no-store',headers:{apikey:C.supabaseKey,Authorization:`Bearer ${C.supabaseKey}`}});
  if(!r.ok){const t=await r.text().catch(()=>'');throw new Error(`${name} HTTP ${r.status} ${t}`.trim());}
  return r.json();
}
window.DB = {fetchView};
})();
