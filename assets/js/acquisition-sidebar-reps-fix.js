(function(){
'use strict';

const REP_ALIASES = {
  'Mohammad Faizan': 'Mohammed Faizan',
  'Mohammed Faizan': 'Mohammed Faizan',
  'Marita Chedid': 'Marita Chedid',
  'Zein Fares': 'Zein Fares',
  'Ursula Waked': 'Ursula Waked',
  'Ahmad Khawajah': 'Ahmad Khawajah',
  'Mohammad Jehad Al-Barqawi': 'Mohammad Jehad Al-Barqawi',
  'Fadi Zanona': 'Fadi Zanona'
};

const CORE_REPS = [
  'Marita Chedid',
  'Zein Fares',
  'Ursula Waked',
  'Ahmad Khawajah',
  'Mohammed Faizan',
  'Mohammad Jehad Al-Barqawi',
  'Fadi Zanona'
];

function canonicalName(name){
  const raw = String(name || '').trim();
  return REP_ALIASES[raw] || raw;
}

function setActiveRep(name){
  const canonical = canonicalName(name);
  document.querySelectorAll('[data-acq-rep]').forEach(btn => {
    btn.classList.toggle('active', canonicalName(btn.getAttribute('data-acq-rep')) === canonical);
  });
}

function getLeadCount(owner){
  const rows = window._acqData && Array.isArray(window._acqData.priorityLeads) ? window._acqData.priorityLeads : [];
  return rows.filter(r => String(r.owner_name || '').trim() === owner).length;
}

function cleanSidebar(){
  const sideButtons = Array.from(document.querySelectorAll('.acq-side-rep[data-acq-rep]'));
  sideButtons.forEach(btn => {
    const original = btn.getAttribute('data-acq-rep');
    const canonical = canonicalName(original);
    if(!CORE_REPS.includes(canonical)){
      btn.remove();
      return;
    }
    btn.setAttribute('data-acq-rep', canonical);
    const nameEl = btn.querySelector('.acq-side-name');
    if(nameEl) nameEl.textContent = canonical;
    const badge = btn.querySelector('.acq-side-alert');
    if(badge){
      const count = getLeadCount(canonical);
      badge.textContent = count > 99 ? '99+' : String(count || '!');
      badge.title = count ? `${count} leads need contact` : 'Open rep details';
    }
  });
}

function bindSidebar(){
  cleanSidebar();
  document.querySelectorAll('.acq-side-rep[data-acq-rep]').forEach(btn => {
    btn.onclick = function(e){
      e.preventDefault();
      const owner = canonicalName(btn.getAttribute('data-acq-rep'));
      setActiveRep(owner);
      if(window._acqV2 && typeof window._acqV2.openRep === 'function'){
        window._acqV2.openRep(owner);
      }else if(window.AcquisitionLegacyRep && typeof window.AcquisitionLegacyRep.open === 'function'){
        window.AcquisitionLegacyRep.open(owner);
      }else if(window.AcquisitionModule && typeof window.AcquisitionModule.render === 'function'){
        window.AcquisitionModule.render().then(() => {
          if(window._acqV2 && typeof window._acqV2.openRep === 'function') window._acqV2.openRep(owner);
        });
      }
      window.scrollTo({top:0, behavior:'smooth'});
    };
  });
}

function install(){
  bindSidebar();
  const originalRender = window.AcquisitionModule && window.AcquisitionModule.render;
  if(typeof originalRender === 'function' && !originalRender.__sideRepFixWrapped){
    window.AcquisitionModule.render = async function(){
      const result = await originalRender.apply(this, arguments);
      setTimeout(bindSidebar, 0);
      setTimeout(bindSidebar, 250);
      return result;
    };
    window.AcquisitionModule.render.__sideRepFixWrapped = true;
  }
  setTimeout(bindSidebar, 500);
  setTimeout(bindSidebar, 1500);
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
})();
