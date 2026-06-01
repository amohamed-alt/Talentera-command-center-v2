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

function installMintDashboardPolish(){
  if(document.getElementById('mintDashboardPolishV1')) return;
  const style = document.createElement('style');
  style.id = 'mintDashboardPolishV1';
  style.textContent = `
    :root{
      --mint-bg:#edf7f2;
      --mint-bg2:#e5f2ec;
      --glass:rgba(255,255,255,.72);
      --glass-strong:rgba(255,255,255,.88);
      --line:rgba(22,64,42,.10);
      --line2:rgba(22,163,74,.18);
      --txt:#133321;
      --txt2:#3e5b4c;
      --muted2:#779081;
      --green2:#07964a;
      --cyan2:#0891b2;
      --blue2:#2563eb;
      --purple2:#7c3aed;
      --orange2:#ea7a14;
      --red2:#e11d48;
      --shadow-soft:0 12px 36px rgba(23,67,45,.08);
      --shadow-card:0 8px 22px rgba(23,67,45,.07);
    }
    html,body{background:linear-gradient(180deg,#f7fbf8 0%,var(--mint-bg) 42%,#e8f4ee 100%)!important;color:var(--txt)!important;}
    body::before{content:""!important;position:fixed!important;inset:0!important;pointer-events:none!important;z-index:-1!important;background:radial-gradient(circle at 18% 8%,rgba(22,163,74,.13),transparent 28%),radial-gradient(circle at 84% 18%,rgba(8,145,178,.10),transparent 30%),linear-gradient(90deg,rgba(22,64,42,.028) 1px,transparent 1px),linear-gradient(180deg,rgba(22,64,42,.028) 1px,transparent 1px)!important;background-size:auto,auto,42px 42px,42px 42px!important;display:block!important;}

    .app{background:transparent!important;}
    .sidebar{width:240px!important;background:linear-gradient(180deg,rgba(255,255,255,.78),rgba(255,255,255,.48)),radial-gradient(circle at 20% 0%,rgba(22,163,74,.13),transparent 34%),radial-gradient(circle at 80% 80%,rgba(8,145,178,.08),transparent 35%)!important;border-right:1px solid rgba(22,64,42,.10)!important;box-shadow:inset -1px 0 0 rgba(255,255,255,.55),0 18px 55px rgba(17,47,31,.08)!important;backdrop-filter:blur(26px) saturate(165%)!important;-webkit-backdrop-filter:blur(26px) saturate(165%)!important;padding:14px 10px!important;}
    .sidebar-logo{padding:14px 14px 13px!important;border-bottom:1px solid rgba(22,64,42,.09)!important;margin-bottom:8px!important;}
    .logo-img{height:26px!important;filter:none!important;}
    .logo-sub{color:var(--muted2)!important;font-weight:700!important;letter-spacing:.08em!important;font-size:9px!important;}
    .sidebar-section{padding:13px 12px 6px!important;margin:0!important;font-size:9px!important;color:rgba(91,115,104,.62)!important;font-weight:900!important;text-transform:uppercase!important;letter-spacing:.14em!important;}
    .nav-item,.acq-side-rep{width:calc(100% - 10px)!important;margin:2px 5px!important;padding:8px 10px!important;min-height:34px!important;border-radius:12px!important;background:transparent!important;color:var(--txt2)!important;border:1px solid transparent!important;font-size:12px!important;font-weight:750!important;box-shadow:none!important;}
    .nav-item:hover,.acq-side-rep:hover{background:rgba(255,255,255,.62)!important;border-color:rgba(22,64,42,.08)!important;color:#0f6d38!important;}
    .nav-item.active,.acq-side-rep.active{background:linear-gradient(135deg,rgba(255,255,255,.96),rgba(255,255,255,.62))!important;border-color:rgba(22,163,74,.22)!important;color:#08713a!important;box-shadow:0 10px 24px rgba(17,47,31,.08),inset 0 1px 0 rgba(255,255,255,.84)!important;font-weight:900!important;}
    .acq-side-dot{width:7px!important;height:7px!important;box-shadow:0 0 0 3px rgba(255,255,255,.8)!important;}
    .acq-side-alert,.nav-badge{background:rgba(225,29,72,.14)!important;color:#d11145!important;border:1px solid rgba(225,29,72,.16)!important;font-weight:900!important;}
    .sidebar-bottom{padding:10px 6px!important;border-top:1px solid rgba(22,64,42,.09)!important;}
    .user-row{background:linear-gradient(180deg,rgba(255,255,255,.70),rgba(255,255,255,.42))!important;border:1px solid rgba(22,64,42,.10)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.75)!important;border-radius:14px!important;}

    .main-area{margin-left:240px!important;width:calc(100% - 240px)!important;padding:12px 18px 56px!important;background:transparent!important;}
    .topbar{min-height:62px!important;margin:0 0 10px!important;padding:0 20px!important;border-radius:22px!important;border:1px solid rgba(22,64,42,.10)!important;background:linear-gradient(180deg,rgba(255,255,255,.86),rgba(255,255,255,.58))!important;box-shadow:0 10px 30px rgba(17,47,31,.08)!important;backdrop-filter:blur(18px) saturate(160%)!important;-webkit-backdrop-filter:blur(18px) saturate(160%)!important;top:12px!important;}
    .topbar-title{font-size:17px!important;font-weight:950!important;color:var(--txt)!important;letter-spacing:-.03em!important;}
    .topbar-sub{font-size:11px!important;color:var(--muted2)!important;font-weight:700!important;}
    .live-badge{height:28px!important;background:rgba(22,163,74,.10)!important;color:#08713a!important;border:1px solid rgba(22,163,74,.18)!important;font-weight:900!important;letter-spacing:.04em!important;}
    .refresh-btn{height:30px!important;border-radius:999px!important;background:linear-gradient(135deg,#16a34a,#0f7a3b)!important;box-shadow:0 8px 18px rgba(22,163,74,.22)!important;font-size:11px!important;font-weight:900!important;padding:0 14px!important;}
    .tabs-bar{margin:0 0 16px!important;padding:8px!important;border-radius:22px!important;background:linear-gradient(180deg,rgba(255,255,255,.74),rgba(255,255,255,.48))!important;border:1px solid rgba(22,64,42,.10)!important;box-shadow:0 8px 24px rgba(17,47,31,.06)!important;backdrop-filter:blur(16px) saturate(150%)!important;-webkit-backdrop-filter:blur(16px) saturate(150%)!important;gap:4px!important;}
    .tab-btn{height:34px!important;border-radius:999px!important;padding:0 14px!important;font-size:11px!important;font-weight:850!important;color:var(--muted2)!important;}
    .tab-btn.active{background:linear-gradient(135deg,#16a34a,#0f7a3b)!important;color:#fff!important;box-shadow:0 8px 22px rgba(22,163,74,.20)!important;}
    .content{padding:0 0 70px!important;}

    .card,.legacy-card,.legacy-period-wrap,.sum-card,.command-card,.pcard,.compact-section,.ret-kpi-master-card,.ret-fin-board,.ret-fin-subcard,.financial-card{background:linear-gradient(180deg,rgba(255,255,255,.86),rgba(255,255,255,.66))!important;border:1px solid rgba(22,64,42,.10)!important;border-radius:20px!important;box-shadow:var(--shadow-card)!important;backdrop-filter:blur(16px) saturate(145%)!important;-webkit-backdrop-filter:blur(16px) saturate(145%)!important;overflow:hidden!important;}
    .card:hover,.legacy-card:hover,.sum-card:hover,.command-card:hover,.pcard:hover{box-shadow:0 14px 36px rgba(17,47,31,.10)!important;transform:translateY(-1px)!important;}
    .card-hd,.legacy-card-hd,.compact-hd,.ret-kpi-master-hd,.ret-fin-board-hd,.financial-subhd{background:rgba(248,251,249,.70)!important;border-bottom:1px solid rgba(22,64,42,.09)!important;min-height:44px!important;padding:12px 16px!important;}
    .card-title,.legacy-card-title,.compact-title,.ret-kpi-master-title,.ret-fin-board-title{font-size:11px!important;font-weight:900!important;color:var(--txt2)!important;letter-spacing:.04em!important;}

    .manager-section-label,.legacy-sec{color:rgba(72,94,83,.78)!important;font-size:9px!important;font-weight:950!important;text-transform:uppercase!important;letter-spacing:.16em!important;padding:14px 0 8px!important;margin:0!important;}
    .manager-section-label::after,.legacy-sec::after{background:rgba(22,64,42,.10)!important;}
    .summary-grid{display:grid!important;grid-template-columns:repeat(8,minmax(0,1fr))!important;gap:10px!important;margin:0 0 14px!important;}
    .sum-card{min-height:92px!important;padding:13px 12px!important;position:relative!important;}
    .sum-card-accent{height:4px!important;border-radius:20px 20px 0 0!important;}
    .sum-val{font-size:24px!important;font-weight:900!important;letter-spacing:-.04em!important;margin-top:4px!important;}
    .sum-lbl{font-size:8px!important;font-weight:950!important;letter-spacing:.11em!important;color:var(--muted2)!important;}
    .sum-sub{font-size:9px!important;color:var(--muted2)!important;font-weight:700!important;}

    .command-health-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important;margin-bottom:14px!important;}
    .command-card{padding:14px 16px!important;min-height:132px!important;}
    .command-card-title{font-size:10px!important;font-weight:950!important;color:var(--txt2)!important;letter-spacing:.10em!important;}
    .command-main-value{font-size:31px!important;font-weight:950!important;letter-spacing:-.05em!important;margin-top:10px!important;}
    .command-main-label{font-size:8px!important;color:var(--muted2)!important;font-weight:950!important;}
    .command-sub-row{padding-top:10px!important;border-top:1px solid rgba(22,64,42,.08)!important;margin-top:10px!important;}

    .acq-rep-tabs-panel{position:relative!important;top:auto!important;background:linear-gradient(180deg,rgba(255,255,255,.78),rgba(255,255,255,.50))!important;border:1px solid rgba(22,64,42,.10)!important;border-radius:20px!important;box-shadow:0 8px 24px rgba(17,47,31,.06)!important;padding:12px!important;margin-bottom:14px!important;backdrop-filter:blur(16px) saturate(150%)!important;-webkit-backdrop-filter:blur(16px) saturate(150%)!important;}
    .acq-rep-tabs-title{font-size:10px!important;color:var(--txt2)!important;font-weight:950!important;}
    .acq-rep-tabs-hint{font-size:10px!important;color:var(--muted2)!important;font-weight:700!important;}
    .acq-rep-tab{min-width:176px!important;border-radius:14px!important;background:rgba(255,255,255,.62)!important;border:1px solid rgba(22,64,42,.10)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.75)!important;padding:10px 12px!important;}
    .acq-rep-tab:hover{border-color:rgba(22,163,74,.20)!important;box-shadow:0 8px 20px rgba(17,47,31,.08)!important;}
    .acq-rep-tab.active{background:linear-gradient(135deg,#16a34a,#0f7a3b)!important;color:#fff!important;border-color:transparent!important;box-shadow:0 9px 20px rgba(22,163,74,.22)!important;}
    .acq-rep-tab-name{font-size:12px!important;font-weight:950!important;}
    .acq-rep-tab-meta{font-size:9px!important;font-weight:850!important;color:var(--muted2)!important;}
    .acq-rep-tab.active .acq-rep-tab-meta{color:rgba(255,255,255,.80)!important;}

    .legacy-rep-hero{background:linear-gradient(180deg,rgba(255,255,255,.86),rgba(255,255,255,.62))!important;border:1px solid rgba(22,64,42,.10)!important;border-radius:22px!important;box-shadow:0 12px 36px rgba(17,47,31,.08)!important;padding:18px 22px!important;margin-bottom:14px!important;}
    .legacy-rep-hero-line{height:4px!important;background:linear-gradient(90deg,#16a34a,#22c55e,#8b5cf6)!important;}
    .legacy-avatar{width:52px!important;height:52px!important;border-radius:15px!important;background:rgba(22,163,74,.12)!important;color:#08713a!important;border:1px solid rgba(22,163,74,.22)!important;font-weight:950!important;}
    .legacy-rep-name{font-size:23px!important;font-weight:950!important;letter-spacing:-.045em!important;color:var(--txt)!important;}
    .legacy-rep-kpi-v{font-size:25px!important;font-weight:950!important;letter-spacing:-.045em!important;}
    .legacy-period-grid{grid-template-columns:120px repeat(6,minmax(0,1fr))!important;gap:10px!important;padding:14px!important;}
    .legacy-period-row-label{background:rgba(248,251,249,.86)!important;border:1px solid rgba(22,64,42,.09)!important;border-radius:14px!important;}
    .legacy-period-card{background:#fff!important;border:1px solid rgba(22,64,42,.10)!important;border-top:4px solid var(--fc,var(--blue))!important;border-radius:14px!important;box-shadow:0 5px 14px rgba(17,47,31,.045)!important;}
    .legacy-period-v{font-size:22px!important;font-weight:950!important;}
    .legacy-split,.two-col{gap:14px!important;}

    .tbl{width:100%!important;border-collapse:collapse!important;}
    .tbl th{background:rgba(248,251,249,.88)!important;color:rgba(78,99,88,.78)!important;font-size:8px!important;font-weight:950!important;letter-spacing:.11em!important;text-transform:uppercase!important;padding:9px 12px!important;border-bottom:1px solid rgba(22,64,42,.10)!important;}
    .tbl td{font-size:11px!important;color:var(--txt2)!important;padding:10px 12px!important;border-bottom:1px solid rgba(22,64,42,.075)!important;}
    .tbl tr:hover td{background:rgba(22,163,74,.04)!important;}
    .record-link{color:#1d5fd7!important;font-weight:900!important;}
    .badge,.rank-a,.rank-b,.hs-link{border-radius:999px!important;font-size:9px!important;font-weight:900!important;padding:3px 8px!important;}
    .show-more-btn{height:34px!important;background:rgba(255,255,255,.62)!important;color:#08713a!important;font-size:10px!important;font-weight:950!important;border-top:1px solid rgba(22,64,42,.09)!important;}

    @media(max-width:1300px){.summary-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important}.command-health-grid{grid-template-columns:1fr 1fr!important}.legacy-period-grid{grid-template-columns:1fr repeat(3,1fr)!important}}
    @media(max-width:900px){.main-area{margin-left:0!important;width:100%!important}.sidebar{position:relative!important;width:100%!important}.summary-grid,.command-health-grid,.two-col,.legacy-split{grid-template-columns:1fr!important}.legacy-period-grid{grid-template-columns:1fr 1fr!important}}
  `;
  document.head.appendChild(style);
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
  installMintDashboardPolish();
  bindSidebar();
  const originalRender = window.AcquisitionModule && window.AcquisitionModule.render;
  if(typeof originalRender === 'function' && !originalRender.__sideRepFixWrapped){
    window.AcquisitionModule.render = async function(){
      const result = await originalRender.apply(this, arguments);
      installMintDashboardPolish();
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
