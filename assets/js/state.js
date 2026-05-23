(function(){
'use strict';
const _cache={};
window.State={
  route: sessionStorage.getItem('tcc_route')||'acquisition',
  setRoute(r){this.route=r;sessionStorage.setItem('tcc_route',r);},
  async get(name,limit,extra){
    const k=name+(limit||'')+(extra||'');
    if(!_cache[k]) _cache[k]=window.DB.fetchView(name,limit,extra);
    return _cache[k];
  },
  flush(name){
    if(name){Object.keys(_cache).filter(k=>k.startsWith(name)).forEach(k=>delete _cache[k]);}
    else{Object.keys(_cache).forEach(k=>delete _cache[k]);}
  }
};
})();
