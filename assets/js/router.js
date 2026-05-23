(function(){
'use strict';
const ROUTES={
  'acquisition':()=>window.AcquisitionModule.render(),
  'retention-team':()=>window.RetentionTeamModule.render(),
  'retention-financial':()=>window.RetentionFinancialModule.render(),
  'features-plan':()=>window.FeaturesPlanModule.render(),
  'pnl':()=>window.PnlModule.render(),
};

const PAGE_TITLES={
  'acquisition':'Acquisition · Team Overview',
  'retention-team':'Retention · Team Overview',
  'retention-financial':'Retention · Financial Details',
  'features-plan':'Retention · Features Plan',
  'pnl':'P&L · Revenue Analysis',
};

function navigate(route){
  if(!ROUTES[route]) route='acquisition';
  window.State.setRoute(route);

  // Update active states — sidebar nav
  document.querySelectorAll('.nav-item[data-route]').forEach(el=>{
    el.classList.toggle('active',el.dataset.route===route);
  });
  // Update active states — tab bar
  document.querySelectorAll('.tab-btn[data-route]').forEach(el=>{
    el.classList.toggle('active',el.dataset.route===route);
  });

  // Show/hide tabs bar
  const tabsBar=document.getElementById('tabsBar');
  if(tabsBar) tabsBar.style.display='flex';

  window.scrollTo({top:0,behavior:'smooth'});

  ROUTES[route]().catch(err=>{
    window.U.showError('Route error: '+err.message);
    console.error(err);
  });
}

// Wire all nav buttons
document.querySelectorAll('[data-route]').forEach(btn=>{
  btn.addEventListener('click',()=>navigate(btn.dataset.route));
});

// Refresh button
document.getElementById('refreshBtn').addEventListener('click',function(){
  this.classList.add('spinning');
  window.State.flush();
  navigate(window.State.route);
  setTimeout(()=>this.classList.remove('spinning'),1500);
});

// Fix modal open for empty cols (pass STATUS_COLS from context)
const _origModalOpen=window.Modal.open.bind(window.Modal);
window.Modal.open=function(opts){
  if(!opts.cols||!opts.cols.length){
    // Try to infer cols from first row
    if(opts.rows&&opts.rows.length){
      opts.cols=Object.keys(opts.rows[0]).filter(k=>!k.startsWith('_')).map(k=>({label:k.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),key:k}));
    }
  }
  _origModalOpen(opts);
};

// Boot
navigate(window.State.route);
})();
