let D=null;
let R=null;
const $=id=>document.getElementById(id);
const fmt=n=>{const v=parseFloat(n);if(!v||isNaN(v))return"$0";if(v>=1e6)return`$${(v/1e6).toFixed(1)}M`;if(v>=1e3)return`$${Math.round(v/1e3)}K`;return`$${Math.round(v)}`;};
const rcColor=r=>r>=50?"var(--green)":r>=30?"var(--amber)":"var(--red)";
const esc = v => String(v ?? "")
  .replace(/&/g,"&amp;")
  .replace(/</g,"&lt;")
  .replace(/>/g,"&gt;")
  .replace(/"/g,"&quot;")
  .replace(/'/g,"&#039;");
function recordLink(label,url,className="record-link"){
  const safeLabel=esc(label||"Open record");
  if(!url)return safeLabel;
  return `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" class="${className}">${safeLabel}</a>`;
}

const SC=["#4F46E5","#7C3AED","#2563EB","#0891B2","#059669","#D97706","#DC2626","#be185d","#16A34A","#6B7280"];
let RET_SELECTED_OWNER_ID = null;
let RETENTION_SUBVIEW = "overview";
let RET_TIER_MATRIX_FILTER = "all";

// Keeps the user on the same page after auto-refresh.
// Without this, render() rebuilds Acquisition side links after every 5-minute refresh.
let APP_MAIN_PANEL = "acquisition";          // acquisition | retention
let APP_ACQ_TAB_ID = "team";                 // team | financial | rep slug
let APP_RETENTION_VIEW = "overview";         // overview | financial | owner
let APP_RETENTION_OWNER_ID = null;

function ensureRetentionOwnerMount(){
  const panel = $("panel-retention");
  if(!panel) return null;
  let mount = $("retOwnerPageMount");
  if(!mount){
    mount = document.createElement("div");
    mount.id = "retOwnerPageMount";
    panel.insertBefore(mount, panel.firstChild);
  }
  return mount;
}

function setRetentionOwnerMode(isOwner){
  const panel = $("panel-retention");
  const mount = ensureRetentionOwnerMount();
  if(!panel || !mount) return;
  [...panel.children].forEach(child => {
    if(child.id === "retOwnerPageMount") child.style.display = isOwner ? "block" : "none";
    else child.style.display = isOwner ? "none" : "";
  });
}


function renderRetentionSidebar(activeMode="overview"){
  if(!$('sideRepLinks')) return;
  const data = R || {};
  const repData = data.repData || data.ownerMatrix || [];
  const dealsSplit = data.dealsSplit || {};
  const bookedCount = (dealsSplit.booked || []).length;
  const cashedCount = (dealsSplit.cashed || []).length;
  $('sideRepLinks').style.display = 'block';
  if($('repsSectionTitle')) { $('repsSectionTitle').style.display = 'block'; $('repsSectionTitle').textContent = 'Retention'; }
  const overviewActive = activeMode === 'overview' ? ' active' : '';
  const financialActive = activeMode === 'financial' ? ' active' : '';
  const financialBadge = `${bookedCount}/${cashedCount}`;
  const links = [
    `<button class="nav-item${overviewActive}" id="side-ret-overview" onclick="switchMainPanel('retention')"><span class="nav-icon" style="color:var(--cyan)">🛡️</span>Team Overview<span class="view-tag">VIEW</span></button>`,
    `<button class="nav-item${financialActive}" id="side-ret-financial" onclick="switchRetentionFinancial()"><span class="nav-icon" style="color:var(--green)">💰</span>Financial Details<span class="nav-badge">${financialBadge}</span></button>`,
    `<div class="sidebar-section" style="padding:12px 10px 5px;margin:0;font-size:8px">Retention Team</div>`
  ];
  for(const r of repData){
    const color = r.color || 'var(--cyan)';
    const short = String(r.name || '').split(' ')[0] || 'Owner';
    const active = activeMode === 'owner' && String(RET_SELECTED_OWNER_ID || '') === String(r.id) ? ' active' : '';
    const badge = r.accounts || r.activeAccounts || 0;
    links.push(`<button class="nav-item${active}" id="side-ret-${esc(r.id)}" onclick="selectRetentionOwner('${esc(r.id)}')"><span class="nav-icon" style="color:${color}">${r.role === 'RM' ? '◆' : '●'}</span>${esc(short)} <span class="ret">${esc(r.role || '')}</span><span class="nav-badge">${badge}</span></button>`);
  }
  $('sideRepLinks').innerHTML = links.join('');
}

function switchRetentionFinancial(){
  APP_MAIN_PANEL = "retention";
  APP_RETENTION_VIEW = "financial";
  APP_RETENTION_OWNER_ID = null;
  RET_SELECTED_OWNER_ID = null;
  RETENTION_SUBVIEW = 'financial';
  setRetentionOwnerMode(false);
  document.querySelectorAll('.tab-btn').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  if($('tabsBar')) $('tabsBar').style.display = 'none';
  $('side-retention')?.classList.add('active');
  $('panel-retention-financial')?.classList.add('active');
  renderRetentionSidebar('financial');
  if($('topbarTitle')) $('topbarTitle').textContent = 'Retention · Financial Details';
  if($('topbarSub')) $('topbarSub').textContent = 'Deal stage Booked/Cashed · date entered current stage CY · renewed value · delayed exposure';
  renderRetentionFinancialDetails();
  window.scrollTo({top:0, behavior:'smooth'});
}


function switchMainPanel(panel){
  document.querySelectorAll(".nav-item").forEach(n=>n.classList.remove("active"));
  if(panel === "retention"){
    APP_MAIN_PANEL = "retention";
    APP_RETENTION_VIEW = "overview";
    APP_RETENTION_OWNER_ID = null;
    RET_SELECTED_OWNER_ID = null;
    RETENTION_SUBVIEW = "overview";
    setRetentionOwnerMode(false);
    document.querySelectorAll(".tab-btn").forEach(t=>t.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));
    if($("tabsBar")) $("tabsBar").style.display = "none";
    $("side-retention")?.classList.add("active");
    $("panel-retention")?.classList.add("active");
    renderRetentionSidebar("overview");
    if($("topbarTitle")) $("topbarTitle").textContent = "Retention · Team Overview";
    if($("topbarSub")) $("topbarSub").textContent = R?.generatedAt ? `Updated ${R.generatedAt} · Customer Success` : "Renewals · Booked · Cashed · Churn · Delayed";
    renderRetention();
    window.scrollTo({top:0,behavior:"smooth"});
    return;
  }
  APP_MAIN_PANEL = "acquisition";
  APP_ACQ_TAB_ID = "team";
  APP_RETENTION_VIEW = "overview";
  APP_RETENTION_OWNER_ID = null;
  RET_SELECTED_OWNER_ID = null;
  setRetentionOwnerMode(false);
  if($("tabsBar")) $("tabsBar").style.display = "flex";
  if($("repsSectionTitle")) { $("repsSectionTitle").style.display = "block"; $("repsSectionTitle").textContent = "Acquisition Reps"; }
  $("side-acquisition")?.classList.add("active");
  render();
  switchTab("team");
  window.scrollTo({top:0,behavior:"smooth"});
}

function switchTab(id){
  APP_MAIN_PANEL = "acquisition";
  APP_ACQ_TAB_ID = id;
  APP_RETENTION_VIEW = "overview";
  APP_RETENTION_OWNER_ID = null;
  RET_SELECTED_OWNER_ID = null;
  RETENTION_SUBVIEW = "acquisition";
  setRetentionOwnerMode(false);
  if($("tabsBar")) $("tabsBar").style.display = "flex";
  if($("repsSectionTitle")) { $("repsSectionTitle").style.display = "block"; $("repsSectionTitle").textContent = "Acquisition Reps"; }
  if($("sideRepLinks")) $("sideRepLinks").style.display = "block";
  document.querySelectorAll(".tab-btn").forEach(t=>t.classList.remove("active"));
  document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n=>n.classList.remove("active"));
  $("side-acquisition")?.classList.add("active");
  $("tab-"+id)?.classList.add("active");
  $("panel-"+id)?.classList.add("active");
  if($("side-"+id) && id !== "financial") $("side-"+id).classList.add("active");
  const repName = D ? (D.repData||[]).find(r=>r.name.toLowerCase().replace(/\s/g,"-")===id)?.name : null;
  const title = id === "team" ? "Acquisition · Team Overview" : id === "financial" ? "Acquisition · Financial Details" : `Acquisition · ${repName || id}`;
  if($("topbarTitle")) $("topbarTitle").textContent = title;
  if($("topbarSub")){
    $("topbarSub").textContent = id === "financial" ? "Cashing revenue · Signed contracts · Pending to cash" : D ? `Updated ${D.meta?.generatedAt||""} · Manual refresh` : "Loading...";
  }
}

function toggleMore(id,btn,show,hide){
  const el=document.getElementById(id);if(!el)return;
  const hidden=el.style.display==="none"||!el.style.display;
  el.style.display=hidden?"block":"none";
  btn.textContent=hidden?hide:show;
}

function toggleCollapse(id){
  const el=$(id);
  if(el) el.classList.toggle('open');
}

function toggleUntouched(rank){
  const mId="untouched"+rank+"More",bId="untouched"+rank+"Toggle",key="_u"+rank;
  const open=window[key];
  document.getElementById(mId).style.display=open?"none":"block";
  document.getElementById(bId).textContent=open?"\u25bc Show more":"\u25b2 Show less";
  window[key]=!open;
}

/* ── Outreach show-more toggle ── */
function toggleOutreach(key){
  const mId = "outreach" + key + "More";
  const bId = "outreach" + key + "Toggle";
  const wKey = "_oc" + key;

  const more = document.getElementById(mId);
  const btn = document.getElementById(bId);

  if(!more || !btn) return;

  const open = !!window[wKey];

  more.style.display = open ? "none" : "block";
  btn.textContent = open ? "▼ Show more" : "▲ Show less";

  window[wKey] = !open;
}

function sc(v,l,s,c,i){
  return`<div class="sum-card" style="animation-delay:${i*.04}s"><div class="sum-card-accent" style="background:${c}"></div><div class="sum-val" style="color:${c}">${v}</div><div class="sum-lbl">${l}</div>${s?`<div class="sum-sub">${s}</div>`:""}</div>`;
}

function dealRow(d,color,showReason){
  return`<div class="deal-item"><div class="deal-dot" style="background:${color}"></div><div style="flex:1"><div class="deal-name">${recordLink(d.name,d.hubspotUrl)}</div><div class="deal-meta"><span style="font-size:10px;color:var(--muted)">${esc(d.closedate||"")}</span><span class="badge" style="background:${d.repColor||"#ccc"}20;color:${d.repColor||"#999"}">${esc(d.rep||"")}</span>${showReason&&d.reason?`<span class="deal-reason-badge">&#9888; ${esc(d.reason)}</span>`:""}</div></div><div class="deal-amt" style="color:${color}">$${(d.amount||0).toLocaleString()}</div></div>`;
}

function dealList(arr,color,prefix,showReason){
  if(!arr.length)return`<div style="padding:24px;color:var(--muted);text-align:center;font-size:12px;font-style:italic">No deals MTD</div>`;
  const s=arr.slice(0,5),r=arr.slice(5);
  return`${s.map(d=>dealRow(d,color,showReason)).join("")}<div id="${prefix}-more" style="display:none">${r.map(d=>dealRow(d,color,showReason)).join("")}</div>${r.length?`<button class="see-more" onclick="toggleMore('${prefix}-more',this,'\u25bc ${r.length} more','\u25b2 Less')">\u25bc ${r.length} more</button>`:""}`;
}

function openDealsTable(show,rest,did){
  const row=dl=>`<tr><td style="font-weight:600;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${recordLink(dl.name,dl.hubspotUrl)}</td><td><span class="badge bb">${esc(dl.stage||"")}</span></td><td class="c"><span style="font-family:var(--mono);font-weight:500">$${(dl.amount||0).toLocaleString()}</span></td><td class="c">${dl.nextActivity?`<span style="color:var(--green);font-size:11px;font-weight:600">${dl.nextActivity}</span>`:"<span style='color:var(--red);font-size:11px;font-weight:600'>&#128681; None</span>"}</td></tr>`;
  return`<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Deal</th><th>Stage</th><th class="c">Value</th><th class="c">Next Activity</th></tr></thead><tbody>${show.map(row).join("")}</tbody><tbody id="${did}-more" style="display:none">${rest.map(row).join("")}</tbody></table></div>${rest.length?`<button class="see-more" onclick="toggleMore('${did}-more',this,'\u25bc ${rest.length} more deals','\u25b2 Show less')">\u25bc ${rest.length} more deals</button>`:""}`;
}


function acqUiSlug(v){
  return String(v || "item").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") || "item";
}

function renderRepAiCoachingCard(rep, rows){
  const list = Array.isArray(rows) ? rows : [];
  const id = `ai-coaching-${acqUiSlug(rep.id || rep.name)}`;
  const visible = 5;

  const body = list.length
    ? list.map((item,i) => {
        const hidden = i >= visible ? "display:none" : "";
        return `<div class="mini-row" data-ai-coaching-row="${id}" style="${hidden}">
          <div class="mini-main">
            <div class="mini-name">${recordLink(item.name || "Unnamed deal", item.hubspotUrl)}</div>
            <div class="mini-meta">${(item.reasons || []).map(rs => esc(rs)).join(" · ") || "No next activity"}</div>
          </div>
          <div class="mini-score" style="color:var(--purple)">${fmt(item.amount || 0)}</div>
        </div>`;
      }).join("")
    : `<div class="acq-empty">All deals have next activity scheduled.</div>`;

  const more = list.length > visible
    ? `<button class="acq-show-btn" onclick="toggleRepAiCoachingRows('${id}', this)">▼ Show ${list.length - visible} more</button>`
    : "";

  return `<div class="card" style="margin-bottom:14px">
    <div class="card-hd">
      <div class="card-title"><div class="card-title-icon" style="background:var(--purple-bg)">⚡</div>AI Coaching</div>
      <span class="badge bp">${list.length} deals</span>
    </div>
    <div class="mini-list">${body}</div>
    ${more}
  </div>`;
}

function toggleRepAiCoachingRows(id, btn){
  const rows = Array.from(document.querySelectorAll(`[data-ai-coaching-row="${id}"]`));
  const open = btn.dataset.open === "1";

  rows.forEach((row,i) => {
    row.style.display = open && i >= 5 ? "none" : "";
  });

  btn.dataset.open = open ? "0" : "1";
  btn.textContent = open ? `▼ Show ${Math.max(rows.length - 5, 0)} more` : "▲ Show less";
}
 function acqRankCountry(row){
  return acqFirstValue(row, ["country","countryName","companyCountry","hs_country","ip_country_code","country_code"]) || "Unknown";
}

function acqRankCompanyName(row){
  return acqFirstValue(row, ["name","company","companyName","accountName"]) || "Unnamed account";
}

function acqRankCompanyUrl(row){
  const id = acqFirstValue(row, ["id","hs_object_id","companyId","recordId","objectId"]);
  return row.hubspotUrl || row.url || (id && typeof hubspotRecordUrl === "function" ? hubspotRecordUrl("company", id) : null);
}

function acqNormKey(v){
  return String(v || "").trim().toLowerCase();
}

function buildAcqCompletedMeetingCompanyIndex(){
  if(window.__acqCompletedMeetingCompanyIndex) return window.__acqCompletedMeetingCompanyIndex;
  const idx = { byOwnerCountry:{}, byCompanyId:{} };
  const oc = (typeof D !== "undefined" && D && D.outreachCoverage) ? D.outreachCoverage : {};
  const companies = [
    ...((oc.companies && Array.isArray(oc.companies.contactedList)) ? oc.companies.contactedList : []),
    ...((oc.companies && Array.isArray(oc.companies.notContactedList)) ? oc.companies.notContactedList : [])
  ];
  companies.forEach(co => {
    const id = String(co.id || co.hs_object_id || co.companyId || "");
    if(id) idx.byCompanyId[id] = co;
  });

  const touchedCompanyIds = new Set();
  const contacts = [
    ...((oc.contacts && Array.isArray(oc.contacts.contactedList)) ? oc.contacts.contactedList : []),
    ...((oc.contacts && Array.isArray(oc.contacts.notContactedList)) ? oc.contacts.notContactedList : [])
  ];

  contacts.forEach(ct => {
    if(!ct || !ct.hasCompletedMeeting) return;
    (Array.isArray(ct.companyIds) ? ct.companyIds : []).forEach(companyId => {
      const co = idx.byCompanyId[String(companyId)];
      if(!co) return;
      const rank = String(co.rank || "").trim().toUpperCase();
      if(rank !== "A" && rank !== "B") return;
      const owner = acqNormKey(co.ownerName || ct.ownerName || co.ownerId || ct.ownerId);
      const country = co.country || "Unknown";
      const key = `${owner}||${acqUiSlug(country)}||${rank}`;
      idx.byOwnerCountry[key] = idx.byOwnerCountry[key] || new Set();
      idx.byOwnerCountry[key].add(String(companyId));
      touchedCompanyIds.add(String(companyId));
    });
  });

  const finalIdx = { byOwnerCountry:{}, byCompanyId:idx.byCompanyId, touchedCompanyIds };
  Object.keys(idx.byOwnerCountry).forEach(key => finalIdx.byOwnerCountry[key] = idx.byOwnerCountry[key].size);
  window.__acqCompletedMeetingCompanyIndex = finalIdx;
  return finalIdx;
}

function acqCompletedMeetingCountFor(rep, country, rank){
  const index = buildAcqCompletedMeetingCompanyIndex();
  const owner = acqNormKey(rep.ownerName || rep.name || rep.ownerId || rep.id);
  const rankKey = String(rank || "").trim().toUpperCase();
  if(country === "all"){
    return Object.keys(index.byOwnerCountry).reduce((sum,key) => {
      const parts = key.split("||");
      return parts[0] === owner && parts[2] === rankKey ? sum + Number(index.byOwnerCountry[key] || 0) : sum;
    },0);
  }
  return Number(index.byOwnerCountry[`${owner}||${acqUiSlug(country)}||${rankKey}`] || 0);
}

function acqEmptyRankStats(label){
  return { label: label || "All countries", rankA:0, rankAContacted:0, rankANotContacted:0, rankAMeetingsCompleted:0, rankB:0, rankBContacted:0, rankBNotContacted:0, rankBMeetingsCompleted:0 };
}

function acqMergeRankStats(target, source){
  if(!source) return target;
  ["rankA","rankAContacted","rankANotContacted","rankAMeetingsCompleted","rankB","rankBContacted","rankBNotContacted","rankBMeetingsCompleted"].forEach(k => target[k] += Number(source[k] || 0));
  return target;
}

function acqRankCoverageRate(stats){
  const total = Number(stats.rankA || 0) + Number(stats.rankB || 0);
  const contacted = Number(stats.rankAContacted || 0) + Number(stats.rankBContacted || 0);
  return total ? Math.round((contacted / total) * 100) : 0;
}

function acqRankStatsForRepCountry(rep, country){
  const label = country === "all" ? "All countries" : country;
  const stats = acqEmptyRankStats(label);
  if(country === "all"){
    stats.rankA = Number(rep.rankA || 0);
    stats.rankAContacted = Number(rep.rankAContacted || 0);
    stats.rankANotContacted = Number(rep.rankANotContacted || 0);
    stats.rankB = Number(rep.rankB || 0);
    stats.rankBContacted = Number(rep.rankBContacted || 0);
    stats.rankBNotContacted = Number(rep.rankBNotContacted || 0);
    stats.rankAMeetingsCompleted = acqCompletedMeetingCountFor(rep, "all", "A");
    stats.rankBMeetingsCompleted = acqCompletedMeetingCountFor(rep, "all", "B");
    return stats;
  }
  acqMergeRankStats(stats, rep.rankAByCountry?.[country]);
  acqMergeRankStats(stats, rep.rankBByCountry?.[country]);
  stats.rankAMeetingsCompleted = acqCompletedMeetingCountFor(rep, country, "A");
  stats.rankBMeetingsCompleted = acqCompletedMeetingCountFor(rep, country, "B");
  return stats;
}

function acqRankCountryMetricBox(label, value, color, onclick){
  const clickAttr = onclick ? ` onclick="${onclick}" title="Open meeting completed details"` : "";
  const clickClass = onclick ? " metric-clickable" : "";
  return `<div class="acq-rank-country-box${clickClass}" style="--rc:${color}"${clickAttr}><div class="acq-rank-country-v">${Number(value || 0).toLocaleString()}</div><div class="acq-rank-country-l">${esc(label)}</div></div>`;
}

function acqRankSummaryBox(label, value, color){
  return `<div class="acq-rank-summary-box" style="--rc:${color}"><div class="acq-rank-summary-v">${Number(value || 0).toLocaleString()}</div><div class="acq-rank-summary-l">${esc(label)}</div></div>`;
}

function acqOwnerKeyFromRep(rep){
  return acqNormKey(rep?.ownerName || rep?.name || rep?.ownerId || rep?.id || "");
}

function acqCompletedMeetingCompanyRows(repKey, countryKey, rankKey){
  const index = buildAcqCompletedMeetingCompanyIndex();
  const oc = (typeof D !== "undefined" && D && D.outreachCoverage) ? D.outreachCoverage : {};
  const contacts = [
    ...((oc.contacts && Array.isArray(oc.contacts.contactedList)) ? oc.contacts.contactedList : []),
    ...((oc.contacts && Array.isArray(oc.contacts.notContactedList)) ? oc.contacts.notContactedList : [])
  ];
  const wantedRep = acqNormKey(repKey || "all");
  const wantedCountry = String(countryKey || "all");
  const wantedRank = String(rankKey || "all").trim().toUpperCase();
  const groups = {};

  contacts.forEach(ct => {
    if(!ct || !ct.hasCompletedMeeting) return;
    (Array.isArray(ct.companyIds) ? ct.companyIds : []).forEach(companyId => {
      const co = index.byCompanyId[String(companyId)];
      if(!co) return;
      const rank = String(co.rank || "").trim().toUpperCase();
      if(rank !== "A" && rank !== "B") return;
      const country = co.country || "Unknown";
      const ownerKey = acqNormKey(co.ownerName || ct.ownerName || co.ownerId || ct.ownerId);
      if(wantedRep !== "all" && ownerKey !== wantedRep) return;
      if(wantedCountry !== "all" && acqUiSlug(country) !== wantedCountry) return;
      if(wantedRank !== "ALL" && rank !== wantedRank) return;

      const key = String(companyId);
      if(!groups[key]){
        groups[key] = {
          id:key,
          name:acqRankCompanyName(co),
          url:acqRankCompanyUrl(co),
          country,
          rank,
          ownerName:co.ownerName || ct.ownerName || "—",
          contacts:[],
          latestDate:null
        };
      }
      groups[key].contacts.push({
        name:ct.name || ct.email || ct.id || "Contact",
        email:ct.email || "",
        url:ct.hubspotUrl || null,
        date:ct.lastActivityDate || ct.createdAt || "—",
        ownerName:ct.ownerName || "—"
      });
      const d = ct.lastActivityDate || ct.createdAt || null;
      if(d && (!groups[key].latestDate || String(d) > String(groups[key].latestDate))) groups[key].latestDate = d;
    });
  });

  return Object.values(groups).sort((a,b) => String(b.latestDate || "").localeCompare(String(a.latestDate || "")) || String(a.name || "").localeCompare(String(b.name || "")));
}

function openAcqCompletedMeetingDetails(repKey, countryKey, rankKey, label){
  const rows = acqCompletedMeetingCompanyRows(repKey, countryKey, rankKey);
  const title = label || "Completed meeting details";
  const rowHtml = rows.length ? rows.slice(0,120).map(row => {
    const contacts = row.contacts || [];
    const contactText = contacts.slice(0,3).map(c => recordLink(c.name || c.email || "Contact", c.url)).join(" · ") || "Completed meeting touch";
    const more = contacts.length > 3 ? ` +${contacts.length - 3} more` : "";
    const latest = row.latestDate || contacts[0]?.date || "—";
    return `<div class="acq-detail-row">
      <div class="acq-detail-name">${recordLink(row.name, row.url)}<div class="acq-detail-meta">${esc(row.country)} · Rank ${esc(row.rank)} · latest completed meeting touch: ${esc(latest)}</div></div>
      <div>${esc(row.ownerName || "—")}</div>
      <div><span class="acq-detail-pill">${contacts.length.toLocaleString()} meeting contact${contacts.length === 1 ? "" : "s"}</span></div>
      <div style="font-size:11px;font-weight:800;color:var(--text2);text-align:right">${contactText}${esc(more)}</div>
    </div>`;
  }).join("") : `<div class="acq-detail-empty">No completed meeting rows found for this filter in the current Supabase view.</div>`;
  const more = rows.length > 120 ? `<div class="acq-detail-empty" style="padding:12px">Showing first 120 of ${rows.length.toLocaleString()} companies.</div>` : "";
  document.getElementById("acqCompletedMeetingsBackdrop")?.remove();
  const node = document.createElement("div");
  node.id = "acqCompletedMeetingsBackdrop";
  node.className = "acq-detail-backdrop";
  node.onclick = e => { if(e.target === node) node.remove(); };
  node.innerHTML = `<div class="acq-detail-card"><div class="acq-detail-hd"><div><div class="acq-detail-title">${esc(title)} <span class="badge bp" style="margin-left:8px">${rows.length.toLocaleString()} companies</span></div><div class="acq-detail-sub">Companies with at least one completed meeting touch under the selected owner / country / rank. Names open in HubSpot when links are available.</div></div><button class="acq-detail-close" onclick="document.getElementById('acqCompletedMeetingsBackdrop')?.remove()">×</button></div><div class="acq-detail-body">${rowHtml}${more}</div></div>`;
  document.body.appendChild(node);
}

function acqMeetingClick(repKey, countryKey, rankKey, label){
  return `openAcqCompletedMeetingDetails('${esc(String(repKey || "all"))}','${esc(String(countryKey || "all"))}','${esc(String(rankKey || "all"))}','${esc(String(label || "Completed meetings"))}')`;
}

function renderAcqRankCountrySummary(stats, repKey="all"){
  const rate = acqRankCoverageRate(stats);
  const meetingsCompleted = Number(stats.rankAMeetingsCompleted || 0) + Number(stats.rankBMeetingsCompleted || 0);
  const countryKey = stats.label === "All countries" ? "all" : acqUiSlug(stats.label);
  return `
    ${acqRankSummaryBox("A Touched", stats.rankAContacted, "var(--green)")}
    ${acqRankSummaryBox("A Untouched", stats.rankANotContacted, "var(--red)")}
    ${acqRankCountryMetricBox("A Meetings", stats.rankAMeetingsCompleted, "var(--purple)", acqMeetingClick(repKey, countryKey, "A", `${stats.label} · Rank A completed meetings`))}
    ${acqRankSummaryBox("B Touched", stats.rankBContacted, "var(--green)")}
    ${acqRankSummaryBox("B Untouched", stats.rankBNotContacted, "var(--amber)")}
    ${acqRankCountryMetricBox("B Meetings", stats.rankBMeetingsCompleted, "var(--purple)", acqMeetingClick(repKey, countryKey, "B", `${stats.label} · Rank B completed meetings`))}
    <div class="metric-clickable" onclick="${acqMeetingClick(repKey, countryKey, "all", `${stats.label} · all completed meetings`)}" title="Open meeting completed details" style="grid-column:1/-1;font-size:10px;color:var(--muted);font-weight:800;text-align:center">${esc(stats.label)} coverage: <span style="color:${rate < 50 ? "var(--red)" : rate < 75 ? "var(--amber)" : "var(--green)"};font-family:var(--mono);font-weight:900">${rate}%</span> · Total A/B: ${(Number(stats.rankA || 0) + Number(stats.rankB || 0)).toLocaleString()} · Meetings completed on touched accounts: <span style="color:var(--purple);font-family:var(--mono);font-weight:900">${meetingsCompleted.toLocaleString()}</span></div>`;
}

function renderRepRankRows(rows, id, rank, color){
  if(!rows.length){
    return `<div class="acq-empty">All Rank ${rank} accounts contacted.</div>`;
  }

  return rows.map((row,i) => {
    const hidden = i >= 5 ? "display:none" : "";
    return `<div class="mini-row" data-rank-row="${id}" data-country="${acqUiSlug(row._country)}" data-visible-by-filter="1" style="${hidden}">
      <div class="mini-main">
        <div class="mini-name">${recordLink(acqRankCompanyName(row), acqRankCompanyUrl(row))}</div>
        <div class="mini-meta">Rank ${rank} · ${esc(row._country)}</div>
      </div>
      <div class="mini-score" style="color:${color}">Rank ${rank}</div>
    </div>`;
  }).join("");
}

function renderRepRankCoverageCard(rep, rankA, rankB){
  const id = `rank-coverage-${acqUiSlug(rep.id || rep.name)}`;
  const repKey = acqOwnerKeyFromRep(rep);

  const aRows = (Array.isArray(rankA) ? rankA : []).map(x => ({ ...x, _rank:"A", _country:acqRankCountry(x) }));
  const bRows = (Array.isArray(rankB) ? rankB : []).map(x => ({ ...x, _rank:"B", _country:acqRankCountry(x) }));
  const allRows = [...aRows, ...bRows];
  const countries = new Set();
  allRows.forEach(row => countries.add(row._country));
  Object.keys(rep.rankAByCountry || {}).forEach(c => countries.add(c));
  Object.keys(rep.rankBByCountry || {}).forEach(c => countries.add(c));

  const countryStats = { all: acqRankStatsForRepCountry(rep, "all") };
  Array.from(countries).forEach(country => countryStats[acqUiSlug(country)] = acqRankStatsForRepCountry(rep, country));
  window.__repRankCountryStats = window.__repRankCountryStats || {};
  window.__repRankCountryRepKey = window.__repRankCountryRepKey || {};
  window.__repRankCountryStats[id] = countryStats;
  window.__repRankCountryRepKey[id] = repKey;

  const chips = [
    `<button class="acq-country-chip active" onclick="filterRepRankCoverage('${id}','all',this)">All ${allRows.length}</button>`,
    ...Array.from(countries)
      .map(country => ({ country, total:(countryStats[acqUiSlug(country)]?.rankA || 0) + (countryStats[acqUiSlug(country)]?.rankB || 0) }))
      .sort((a,b) => b.total - a.total)
      .map(({country,total}) => `<button class="acq-country-chip" onclick="filterRepRankCoverage('${id}','${acqUiSlug(country)}',this)">${esc(country)} ${total}</button>`)
  ].join("");

  return `<div class="card" style="margin-bottom:0">
    <div class="card-hd">
      <div class="card-title"><div class="card-title-icon" style="background:var(--red-bg)">🎯</div>Rank A/B Coverage</div>
      <div style="display:flex;gap:5px">
        <span class="rank-a">${rep.rankA || 0}A</span>
        <span class="rank-b">${rep.rankB || 0}B</span>
      </div>
    </div>

    <div class="acq-country-tools">
      <div class="acq-country-row" data-rank-chip-row="${id}">${chips}</div>
      <div class="acq-rank-summary-grid" id="${id}-summary">${renderAcqRankCountrySummary(countryStats.all, repKey)}</div>
    </div>

    <div style="padding:12px 18px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <span style="font-size:10px;font-weight:700;color:var(--red);text-transform:uppercase;letter-spacing:.08em">Rank A — ${rep.rankA || 0}</span>
        <div style="display:flex;gap:8px;font-size:10px;font-weight:600">
          <span style="color:var(--green)">✓ ${rep.rankAContacted || 0} touched</span>
          <span class="metric-clickable" onclick="${acqMeetingClick(repKey, 'all', 'A', `${rep.name || 'Rep'} · Rank A completed meetings`)}" style="color:var(--purple)">☑ ${countryStats.all.rankAMeetingsCompleted || 0} meetings</span>
          <span style="color:var(--red)">✗ ${rep.rankANotContacted || 0} untouched</span>
        </div>
      </div>

      <div class="mini-list" id="${id}-a">${renderRepRankRows(aRows, `${id}-a`, "A", "var(--red)")}</div>
      <button class="acq-show-btn" id="${id}-a-btn" style="${aRows.length > 5 ? "" : "display:none"}" onclick="toggleRepRankCoverageRows('${id}-a', this)">▼ Show ${Math.max(aRows.length - 5, 0)} more</button>

      <div style="display:flex;align-items:center;justify-content:space-between;margin:14px 0 8px">
        <span style="font-size:10px;font-weight:700;color:var(--amber);text-transform:uppercase;letter-spacing:.08em">Rank B — ${rep.rankB || 0}</span>
        <div style="display:flex;gap:8px;font-size:10px;font-weight:600">
          <span style="color:var(--green)">✓ ${rep.rankBContacted || 0} touched</span>
          <span class="metric-clickable" onclick="${acqMeetingClick(repKey, 'all', 'B', `${rep.name || 'Rep'} · Rank B completed meetings`)}" style="color:var(--purple)">☑ ${countryStats.all.rankBMeetingsCompleted || 0} meetings</span>
          <span style="color:var(--amber)">✗ ${rep.rankBNotContacted || 0} untouched</span>
        </div>
      </div>

      <div class="mini-list" id="${id}-b">${renderRepRankRows(bRows, `${id}-b`, "B", "var(--amber)")}</div>
      <button class="acq-show-btn" id="${id}-b-btn" style="${bRows.length > 5 ? "" : "display:none"}" onclick="toggleRepRankCoverageRows('${id}-b', this)">▼ Show ${Math.max(bRows.length - 5, 0)} more</button>
    </div>
  </div>`;
}

function filterRepRankCoverage(id, countryKey, btn){
  const chipRow = document.querySelector(`[data-rank-chip-row="${id}"]`);
  if(chipRow){
    chipRow.querySelectorAll(".acq-country-chip").forEach(x => x.classList.remove("active"));
  }
  if(btn) btn.classList.add("active");

  const stats = window.__repRankCountryStats?.[id]?.[countryKey] || window.__repRankCountryStats?.[id]?.all || acqEmptyRankStats();
  const summary = document.getElementById(`${id}-summary`);
  if(summary) summary.innerHTML = renderAcqRankCountrySummary(stats, window.__repRankCountryRepKey?.[id] || "all");

  [`${id}-a`, `${id}-b`].forEach(sectionId => {
    const rows = Array.from(document.querySelectorAll(`[data-rank-row="${sectionId}"]`));
    const matched = rows.filter(row => countryKey === "all" || row.dataset.country === countryKey);

    rows.forEach(row => {
      const isMatch = countryKey === "all" || row.dataset.country === countryKey;
      row.dataset.visibleByFilter = isMatch ? "1" : "0";
      row.style.display = "none";
    });
    matched.forEach((row,i) => row.style.display = i < 5 ? "" : "none");

    const btnEl = document.getElementById(`${sectionId}-btn`);
    if(btnEl){
      const extra = Math.max(matched.length - 5, 0);
      btnEl.dataset.open = "0";
      btnEl.style.display = extra ? "block" : "none";
      btnEl.textContent = `▼ Show ${extra} more`;
    }
  });
}

function toggleRepRankCoverageRows(sectionId, btn){
  const rows = Array.from(document.querySelectorAll(`[data-rank-row="${sectionId}"]`)).filter(row => row.dataset.visibleByFilter !== "0");
  const open = btn.dataset.open === "1";

  if(open){
    rows.forEach((row,i) => row.style.display = i < 5 ? "" : "none");
    btn.dataset.open = "0";
    btn.textContent = `▼ Show ${Math.max(rows.length - 5, 0)} more`;
  }else{
    rows.forEach(row => row.style.display = "");
    btn.dataset.open = "1";
    btn.textContent = "▲ Show less";
  }
}

function buildRankCountryCoverageState(reps){
  const safeReps = Array.isArray(reps) ? reps.filter(r => r && r.type !== "ret") : [];
  const countries = new Set();
  safeReps.forEach(rep => {
    Object.keys(rep.rankAByCountry || {}).forEach(c => countries.add(c));
    Object.keys(rep.rankBByCountry || {}).forEach(c => countries.add(c));
    Object.keys(rep.countryBreakdown || {}).forEach(c => countries.add(c));
  });
  const state = { reps: safeReps, countries:Array.from(countries), statsByKey:{} };
  state.statsByKey.all = safeReps.reduce((acc,rep) => acqMergeRankStats(acc, acqRankStatsForRepCountry(rep,"all")), acqEmptyRankStats("All countries"));
  state.countries.forEach(country => {
    state.statsByKey[acqUiSlug(country)] = safeReps.reduce((acc,rep) => acqMergeRankStats(acc, acqRankStatsForRepCountry(rep,country)), acqEmptyRankStats(country));
  });
  return state;
}

function renderRankCountryCoverage(reps){
  const panel = $("rankCountryCoveragePanel");
  if(!panel) return;
  const state = buildRankCountryCoverageState(reps);
  window.__rankCountryCoverageState = state;
  const chips = [
    `<button class="acq-country-chip active" onclick="filterRankCountryCoverage('all',this)">All ${(state.statsByKey.all.rankA + state.statsByKey.all.rankB).toLocaleString()}</button>`,
    ...state.countries.map(country => ({ country, key:acqUiSlug(country), total:(state.statsByKey[acqUiSlug(country)]?.rankA || 0) + (state.statsByKey[acqUiSlug(country)]?.rankB || 0) }))
      .filter(x => x.total > 0)
      .sort((a,b) => b.total - a.total)
      .map(({country,key,total}) => `<button class="acq-country-chip" onclick="filterRankCountryCoverage('${key}',this)">${esc(country)} ${total.toLocaleString()}</button>`)
  ].join("");
  $("rankCountryCoverageChips").innerHTML = chips;
  filterRankCountryCoverage("all", null, true);
}

function filterRankCountryCoverage(countryKey, btn, silent){
  const state = window.__rankCountryCoverageState;
  if(!state) return;
  const chipWrap = $("rankCountryCoverageChips");
  if(chipWrap && !silent){
    chipWrap.querySelectorAll(".acq-country-chip").forEach(x => x.classList.remove("active"));
    if(btn) btn.classList.add("active");
  }
  const stats = state.statsByKey[countryKey] || state.statsByKey.all || acqEmptyRankStats();
  const rate = acqRankCoverageRate(stats);
  const total = Number(stats.rankA || 0) + Number(stats.rankB || 0);
  const contacted = Number(stats.rankAContacted || 0) + Number(stats.rankBContacted || 0);
  const notContacted = Number(stats.rankANotContacted || 0) + Number(stats.rankBNotContacted || 0);
  const meetingsCompleted = Number(stats.rankAMeetingsCompleted || 0) + Number(stats.rankBMeetingsCompleted || 0);
  $("rankCountryCoverageSub").textContent = `${stats.label}: ${contacted.toLocaleString()} touched/contacted · ${notContacted.toLocaleString()} untouched · ${meetingsCompleted.toLocaleString()} meetings completed on touched accounts · ${rate}% coverage`;
  $("rankCountryCoverageMetrics").innerHTML = [
    acqRankCountryMetricBox("Rank A Total", stats.rankA, "var(--red)"),
    acqRankCountryMetricBox("A Touched", stats.rankAContacted, "var(--green)"),
    acqRankCountryMetricBox("A Untouched", stats.rankANotContacted, "var(--red)"),
    acqRankCountryMetricBox("A Meetings Completed", stats.rankAMeetingsCompleted, "var(--purple)", acqMeetingClick("all", countryKey, "A", `${stats.label} · Rank A completed meetings`)),
    acqRankCountryMetricBox("Rank B Total", stats.rankB, "var(--amber)"),
    acqRankCountryMetricBox("B Touched", stats.rankBContacted, "var(--green)"),
    acqRankCountryMetricBox("B Untouched", stats.rankBNotContacted, "var(--amber)"),
    acqRankCountryMetricBox("B Meetings Completed", stats.rankBMeetingsCompleted, "var(--purple)", acqMeetingClick("all", countryKey, "B", `${stats.label} · Rank B completed meetings`))
  ].join("");
  const rows = state.reps.map(rep => {
    const repStats = countryKey === "all" ? acqRankStatsForRepCountry(rep,"all") : acqRankStatsForRepCountry(rep, stats.label);
    const repTotal = Number(repStats.rankA || 0) + Number(repStats.rankB || 0);
    if(countryKey !== "all" && !repTotal) return "";
    const repRate = acqRankCoverageRate(repStats);
    return `<tr>
      <td><div style="display:flex;align-items:center;gap:8px"><div class="av" style="background:${rep.color}20;color:${rep.color}">${esc((rep.name||"?")[0])}</div><span style="font-weight:700">${esc(rep.name || "Unknown")}</span></div></td>
      <td class="c"><span style="font-family:var(--mono);font-weight:900;color:var(--green)">${Number(repStats.rankAContacted || 0).toLocaleString()}</span></td>
      <td class="c"><span style="font-family:var(--mono);font-weight:900;color:var(--red)">${Number(repStats.rankANotContacted || 0).toLocaleString()}</span></td>
      <td class="c"><span class="metric-clickable" onclick="${acqMeetingClick(acqOwnerKeyFromRep(rep), countryKey, 'A', `${rep.name || 'Rep'} · ${stats.label} · Rank A completed meetings`)}" style="font-family:var(--mono);font-weight:900;color:var(--purple)">${Number(repStats.rankAMeetingsCompleted || 0).toLocaleString()}</span></td>
      <td class="c"><span style="font-family:var(--mono);font-weight:900;color:var(--green)">${Number(repStats.rankBContacted || 0).toLocaleString()}</span></td>
      <td class="c"><span style="font-family:var(--mono);font-weight:900;color:var(--amber)">${Number(repStats.rankBNotContacted || 0).toLocaleString()}</span></td>
      <td class="c"><span class="metric-clickable" onclick="${acqMeetingClick(acqOwnerKeyFromRep(rep), countryKey, 'B', `${rep.name || 'Rep'} · ${stats.label} · Rank B completed meetings`)}" style="font-family:var(--mono);font-weight:900;color:var(--purple)">${Number(repStats.rankBMeetingsCompleted || 0).toLocaleString()}</span></td>
      <td class="c"><span style="font-family:var(--mono);font-weight:900;color:${repRate < 50 ? "var(--red)" : repRate < 75 ? "var(--amber)" : "var(--green)"}">${repRate}%</span></td>
    </tr>`;
  }).filter(Boolean).join("");
  $("rankCountryCoverageRows").innerHTML = rows || `<tr><td colspan="8" style="text-align:center;color:var(--muted);font-style:italic;padding:14px">No Rank A/B accounts found for this country.</td></tr>`;
}

function renderFinancialDetails(){
  const card = $("financialDetailsCard");
  if(!card) return;

  const fd = D?.financialDetails || {};
  const cashing = Array.isArray(fd.cashing) ? fd.cashing : [];
  const signed = Array.isArray(fd.signed) ? fd.signed : [];
  const currentYear = new Date().getFullYear();
  const periodLabel = `YTD ${currentYear}`;
  const money = n => fmt(Number(n || 0));
  const setHTML = (id,v) => { const el=$(id); if(el) el.innerHTML=v; };
  const setText = (id,v) => { const el=$(id); if(el) el.textContent=v; };
  const qstr = v => JSON.stringify(String(v || ""));

  const cashingAmount = cashing.reduce((s,d)=>s+Number(d.amount||0),0);
  const signedAmount = signed.reduce((s,d)=>s+Number(d.amount||0),0);
  const pendingAmount = signedAmount;
  const delayedSigned = signed.filter(d => Number(d.daysFromSigned || 0) > 7 || d.isDelayed);

  window.__acqFinancialMetricRows = {
    cashing,
    signed,
    pending: signed,
    delayed: delayedSigned,
    all: [...cashing, ...signed]
  };

  window.openAcqFinancialRows = function(title, desc, rows){
    const existing = document.getElementById('acqFinancialBackdrop');
    if(existing) existing.remove();
    const safeRows = Array.isArray(rows) ? rows : [];
    const rowHtml = safeRows.length ? safeRows.slice(0,100).map(row => {
      const url = row.hubspotUrl || (row.id && typeof hubspotRecordUrl === 'function' ? hubspotRecordUrl('deal', row.id) : null);
      const name = row.name || 'Unnamed deal';
      const stageDate = row.stageDate || row.signedDate || row.cashingDate || '—';
      const meta = `${row.stage || ''} · Date entered current stage: ${stageDate}`;
      const status = row.riskLabel || row.status || row.stage || 'Deal';
      return `<div class="acq-detail-row"><div class="acq-detail-name">${recordLink(name,url)}<div class="acq-detail-meta">${esc(meta)}</div></div><div>${esc(row.rep || '—')}</div><div><span class="acq-detail-pill">${esc(status)}</span></div><div style="font-family:var(--mono);font-weight:900;text-align:right">${esc(money(row.amount || 0))}</div></div>`;
    }).join('') : `<div class="acq-detail-empty">No ${esc(periodLabel)} deals available for this number in the current Supabase view.</div>`;
    const more = safeRows.length > 100 ? `<div class="acq-detail-empty" style="padding:12px">Showing first 100 of ${safeRows.length.toLocaleString()} rows.</div>` : '';
    const node = document.createElement('div');
    node.id = 'acqFinancialBackdrop';
    node.className = 'acq-detail-backdrop';
    node.onclick = function(e){ if(e.target === node) node.remove(); };
    node.innerHTML = `<div class="acq-detail-card"><div class="acq-detail-hd"><div><div class="acq-detail-title">${esc(title)} <span class="badge bb" style="margin-left:8px">${safeRows.length.toLocaleString()} rows</span></div><div class="acq-detail-sub">${esc(desc)} · Period: ${esc(periodLabel)} · Logic: dealstage only + hs_v2_date_entered_current_stage.</div></div><button class="acq-detail-close" onclick="document.getElementById('acqFinancialBackdrop')?.remove()">×</button></div><div class="acq-detail-body">${rowHtml}${more}</div></div>`;
    document.body.appendChild(node);
  };

  window.openAcqFinancialMetric = function(kind){
    const rowsMap = window.__acqFinancialMetricRows || {};
    const labels = {
      cashing: ['Cashing Revenue', 'dealstage = closedwon + hs_v2_date_entered_current_stage in current year'],
      signed: ['Signed Contract', 'dealstage = contractsent + hs_v2_date_entered_current_stage in current year'],
      pending: ['Pending to Cash', 'same signed contract rows that are not cashing yet'],
      delayed: ['Delayed Signed Deals', 'signed rows where current-stage age is more than 7 days'],
      all: ['Financial Details', 'all acquisition financial rows from clean logic']
    };
    const item = labels[kind] || labels.all;
    window.openAcqFinancialRows(item[0], item[1], rowsMap[kind] || []);
  };

  window.openAcqFinancialDeal = function(id, bucket){
    const rows = (window.__acqFinancialMetricRows?.[bucket] || []).filter(r => String(r.id) === String(id));
    const row = rows[0];
    window.openAcqFinancialRows(row ? row.name : 'Deal details', 'single deal behind the clicked number', rows);
  };

  function bindFinancialClick(id, kind){
    const el = $(id);
    if(!el) return;
    el.classList.add('financial-click-num');
    el.style.cursor = 'pointer';
    el.title = `Click to see ${periodLabel} records`;
    el.onclick = function(ev){ ev.stopPropagation(); window.openAcqFinancialMetric(kind); };
  }

  setText("finCashingBadge", `${cashing.length} Cashing · ${money(cashingAmount)}`);
  setText("finSignedBadge", `${signed.length} Signed · ${money(signedAmount)}`);
  setText("finCashingMini", `${cashing.length} YTD deals`);
  setText("finSignedMini", `${signed.length} YTD deals`);

  bindFinancialClick("finCashingBadge", "cashing");
  bindFinancialClick("finSignedBadge", "signed");
  bindFinancialClick("finCashingMini", "cashing");
  bindFinancialClick("finSignedMini", "signed");

  setHTML("financialSummaryGrid", [
    { k:'cashing', v: money(cashingAmount), l: "Cashing Revenue", s: `${periodLabel} · ${cashing.length} closedwon deals`, c: "var(--green)" },
    { k:'signed', v: money(signedAmount), l: "Signed Contract", s: `${periodLabel} · ${signed.length} contractsent deals`, c: "var(--amber)" },
    { k:'pending', v: money(pendingAmount), l: "Pending to Cash", s: `${periodLabel} · same value as Signed Contract`, c: "var(--blue)" }
  ].map(x => `
    <div class="financial-box financial-click-box" onclick="openAcqFinancialMetric('${x.k}')" title="Click to see ${periodLabel} records">
      <div class="financial-v" style="color:${x.c}">${x.v}</div>
      <div class="financial-l">${x.l}</div>
      <div class="financial-s">${x.s}</div>
    </div>
  `).join(""));

  const repBadge = d => `
    <span class="badge" style="background:${d.repColor || "#64748b"}20;color:${d.repColor || "#64748b"}">
      ${esc(d.rep || "Unknown")}
    </span>
  `;

  const cashingRow = d => `
    <tr>
      <td>
        <div style="font-weight:700">${recordLink(d.name || "Unnamed deal", d.hubspotUrl)}</div>
        <div style="font-size:9px;color:var(--muted)">dealstage = closedwon</div>
      </td>
      <td>${repBadge(d)}</td>
      <td class="c"><span class="financial-click-num" onclick='event.stopPropagation(); openAcqFinancialDeal(${qstr(d.id)},"cashing")' style="font-family:var(--mono);font-weight:800;color:var(--green)">${money(d.amount)}</span></td>
      <td class="c" style="font-family:var(--mono);font-size:10px">—</td>
      <td class="c" style="font-family:var(--mono);font-size:10px">${esc(d.stageDate || d.cashingDate || "—")}</td>
      <td class="c"><span class="fin-status ok financial-click-num" onclick='event.stopPropagation(); openAcqFinancialDeal(${qstr(d.id)},"cashing")'>${d.daysFromSigned !== null && d.daysFromSigned !== undefined ? d.daysFromSigned + "d" : "—"}</span></td>
    </tr>
  `;

  const signedRow = d => {
    const days = d.daysFromSigned;
    const st = d.riskLabel || (Number(days || 0) > 7 ? "Delayed Cashing" : "On Track");
    const cls = /delayed/i.test(st) ? "risk" : "ok";
    return `
      <tr>
        <td>
          <div style="font-weight:700">${recordLink(d.name || "Unnamed deal", d.hubspotUrl)}</div>
          <div style="font-size:9px;color:var(--muted)">dealstage = contractsent</div>
        </td>
        <td>${repBadge(d)}</td>
        <td class="c"><span class="financial-click-num" onclick='event.stopPropagation(); openAcqFinancialDeal(${qstr(d.id)},"signed")' style="font-family:var(--mono);font-weight:800;color:var(--amber)">${money(d.amount)}</span></td>
        <td class="c" style="font-family:var(--mono);font-size:10px">${esc(d.stageDate || d.signedDate || "—")}</td>
        <td class="c"><span class="financial-click-num" onclick='event.stopPropagation(); openAcqFinancialDeal(${qstr(d.id)},"signed")' style="font-family:var(--mono);font-size:10px">${days !== null && days !== undefined ? days + "d" : "—"}</span></td>
        <td class="c"><span class="fin-status ${cls} financial-click-num" onclick='event.stopPropagation(); openAcqFinancialDeal(${qstr(d.id)},"signed")'>${esc(st)}</span></td>
      </tr>
    `;
  };

  setHTML(
    "financialCashingBody",
    cashing.length
      ? cashing.slice(0,10).map(cashingRow).join("")
      : `<tr><td colspan="6"><div class="fin-empty">No YTD closedwon deals found using hs_v2_date_entered_current_stage.</div></td></tr>`
  );

  setHTML(
    "financialSignedBody",
    signed.length
      ? signed.slice(0,10).map(signedRow).join("")
      : `<tr><td colspan="6"><div class="fin-empty">No YTD contractsent deals found using hs_v2_date_entered_current_stage.</div></td></tr>`
  );
}
function renderManagerAddons(){
  if(!D) return;
  const oc=D.outreachCoverage||{}, ct=oc.contacts||{}, co=oc.companies||{}, ss=oc.sourceSplit||oc.bySource||{};
  const rt=D.rankTotals||{}, reps=D.repData||[], team=D.team||{}, kM=D.kpi?.mtd||{};
  const notLeads=Number(ct.notContacted||0), contacted=Number(ct.contacted||0), total=Number(ct.total||0), rate=Number(ct.contactedRate||0);
  const untouched=Number(rt.ANotContacted||0)+Number(rt.BNotContacted||0);
  const cold=reps.reduce((s,r)=>s+(r.cold||[]).length,0), stuck=reps.reduce((s,r)=>s+(r.stuck||[]).length,0), noNext=reps.reduce((s,r)=>s+(r.needsAttention||[]).length,0);
  const risk=cold+stuck+noNext;
  const setHTML=(id,v)=>{const el=$(id); if(el) el.innerHTML=v;};
  const summaryMain=$('managerSummaryMain'), summarySub=$('managerSummarySub'), summaryActions=$('managerSummaryActions');
  if(summaryMain){
    const topGap = notLeads>0 ? `Contact ${notLeads.toLocaleString()} eligible leads today` : 'Lead outreach is currently healthy';
    const rankGap = untouched>0 ? `review ${untouched.toLocaleString()} Rank A/B accounts` : 'Rank A/B coverage is healthy';
    const riskGap = risk>0 ? `check ${risk.toLocaleString()} pipeline risk signals` : 'pipeline risk is low';
    summaryMain.innerHTML = `${topGap} · ${rankGap} · ${riskGap}`;
  }
  if(summarySub){
    summarySub.textContent = `Current contact rate ${rate}% · ${contacted.toLocaleString()}/${total.toLocaleString()} eligible leads contacted`;
  }
  if(summaryActions){
    summaryActions.innerHTML = [
      `<span class="manager-chip ${notLeads?'red':'green'}">${notLeads.toLocaleString()} leads to contact</span>`,
      `<span class="manager-chip ${untouched?'amber':'green'}">${untouched.toLocaleString()} Rank A/B untouched</span>`,
      `<span class="manager-chip ${risk?'blue':'green'}">${risk.toLocaleString()} deal risks</span>`,
      `<span class="manager-chip ${rate>=70?'green':rate>=40?'amber':'red'}">${rate}% contact rate</span>`
    ].join('');
  }
  setHTML('managerActionStrip',[
    {v:notLeads,l:'To Call Today',s:'Eligible leads with no connected call or completed meeting',c:'var(--red)'},
    {v:untouched,l:'Rank A/B Untouched',s:'High-priority accounts not contacted by new logic',c:'var(--amber)'},
    {v:risk,l:'Pipeline Risk Signals',s:`${cold} cold · ${stuck} stuck · ${noNext} no next`,c:'var(--blue)'},
    {v:rate+'%',l:'Contact Rate Target',s:'Daily target should move toward 70%+',c:rate>=70?'var(--green)':rate>=40?'var(--amber)':'var(--red)'}
  ].map(x=>`<div class="action-card" style="--ac:${x.c}"><div class="action-card-v">${x.v}</div><div class="action-card-l">${x.l}</div><div class="action-card-s">${x.s}</div></div>`).join(''));
  const online=ss.online||ss.inbound||{}, offline=ss.offline||ss.outbound||{};
  setHTML('managerMiniCards',[
    {t:'Hot Uncontacted Online',v:Number(online.notContacted||0),d:`${online.contacted||0}/${online.total||0} contacted`,c:'var(--red)'},
    {t:'Offline Follow-up Pool',v:Number(offline.notContacted||0),d:`${offline.contacted||0}/${offline.total||0} contacted`,c:'var(--amber)'},
    {t:'Rep Gap',v:Math.max(...reps.map(r=>((r.cold||[]).length+(r.stuck||[]).length+(r.needsAttention||[]).length)),0),d:'Highest risk signals for one rep',c:'var(--blue)'}
  ].map(x=>`<div class="action-card" style="--ac:${x.c}"><div class="action-card-v">${x.v.toLocaleString()}</div><div class="action-card-l">${x.t}</div><div class="action-card-s">${x.d}</div></div>`).join(''));
  const priority=(ct.notContactedList||[]).slice().sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0)).slice(0,8);
  setHTML('priorityLeadList', priority.length?priority.map((l,i)=>{const d=acqLeadDaysWithoutContact(l);return `<div class="mini-row"><div class="mini-main"><div class="mini-name">${recordLink(acqContactName(l),l.hubspotUrl)}</div><div class="mini-meta">${esc(l.ownerName||'No owner')} · ${esc(l.source||l.sourceBucket||'No source')} · ${esc(acqCreatedDate(l)||'No date')}</div></div><div class="mini-score" title="Days without connected call">${d!==null?d+'d':'—'}</div></div>`;}).join(''):`<div class="mini-row"><div class="mini-main"><div class="mini-name">No priority leads available</div><div class="mini-meta">Waiting for outreachCoverage.notContactedList</div></div></div>`);
  const openDeals=Number(kM.openDealsSnap||team.openDeals||0), won=Number(kM.wonDeals||team.won||0);
  setHTML('leadFunnelGrid',[
    ['Eligible Leads',total,'var(--blue)'],['Contacted',contacted,'var(--green)'],['Not Contacted',notLeads,'var(--red)'],['Open Deals',openDeals,'var(--amber)'],['Won MTD',won,'var(--green)']
  ].map(x=>`<div class="funnel-step"><div class="funnel-v" style="color:${x[2]}">${Number(x[1]||0).toLocaleString()}</div><div class="funnel-l">${x[0]}</div></div>`).join(''));
  const dq=[];
  if(!total) dq.push(['Missing outreachCoverage.contacts','Lead outreach data is empty or not generated.']);
  if((ct.notContactedList||[]).some(x=>!x.ownerName&&!x.ownerId)) dq.push(['Leads without owner','Some not-contacted leads do not have a clear owner.']);
  if((co.notContactedList||[]).some(x=>!x.rank)) dq.push(['Companies without rank','Some company rows do not include Rank A/B info.']);
  if(!ss.online&&!ss.offline&&!ss.inbound&&!ss.outbound) dq.push(['Missing source split','Online/offline split is not available in Supabase view.']);
  setHTML('dataQualityBadge', `${dq.length} warnings`);
  setHTML('dataQualityList', dq.length?dq.map((x,i)=>`<div class="mini-row"><div class="mini-main"><div class="mini-name">${x[0]}</div><div class="mini-meta">${x[1]}</div></div><div class="mini-score" style="color:var(--amber)">!</div></div>`).join(''):`<div class="mini-row"><div class="mini-main"><div class="mini-name">Data quality looks good</div><div class="mini-meta">No major warnings detected from current Supabase view.</div></div><div class="mini-score" style="color:var(--green)">✓</div></div>`);
}

function renderCommandPreview(){
  if(!D || !$("commandPreview")) return;
  const team=D.team||{}, kM=D.kpi?.mtd||{}, oc=D.outreachCoverage||{}, contacts=oc.contacts||{}, rt=D.rankTotals||{}, reps=D.repData||[], meta=D.meta||{};
  const notLeads=Number(contacts.notContacted||0), contactRate=Number(contacts.contactedRate||0), contactedLeads=Number(contacts.contacted||0), totalLeads=Number(contacts.total||0);
  const untouched=Number(rt.ANotContacted||0)+Number(rt.BNotContacted||0);
  const pipeline=Number(kM.pipeline||team.pipeline||0), wonMTD=Number(kM.wonAmt||team.wonAmt||0), lostMTD=Number(kM.lostAmt||team.lostAmt||0);
  const callsMTD=Number(team.callsMTD||kM.calls||0), connMTD=Number(team.callsMTDConn||kM.connected||0), mtgsMTD=Number(team.meetingsMTD||kM.meetings||0);
  const coldCt=reps.reduce((s,r)=>s+((r.cold||[]).length),0), stuckCt=reps.reduce((s,r)=>s+((r.stuck||[]).length),0), nextCt=reps.reduce((s,r)=>s+((r.needsAttention||[]).length),0);
  const dealsAtRisk=coldCt+stuckCt+nextCt;
  const set=(id,val)=>{const el=$(id); if(el) el.textContent=val;};
  const money=n=>fmt(n);
  const rateColor=r=>r>=70?"var(--green)":r>=40?"var(--amber)":"var(--red)";
  set("cpGenAt",meta.generatedAt||"—");
  set("cpNotLeads",notLeads.toLocaleString());
  set("cpNotLeadsSub",totalLeads>0?`of ${totalLeads.toLocaleString()} total leads`:"");
  set("cpUntouched",untouched.toLocaleString());
  set("cpUntouchedSub",`A: ${rt.ANotContacted||0} · B: ${rt.BNotContacted||0}`);
  set("cpAtRisk",dealsAtRisk.toLocaleString());
  set("cpAtRiskSub",`${coldCt} cold · ${stuckCt} stuck · ${nextCt} no next`);
  set("cpContactRate",contactRate+"%");
  set("cpContactRateSub",`${contactedLeads.toLocaleString()} of ${totalLeads.toLocaleString()} reached`);
  if($("cpRatePill")) $("cpRatePill").style.setProperty("--fp-c",rateColor(contactRate));
  const badge=$("cpRateBadge");
  if(badge){
    if(contactRate>=70){badge.textContent="✓ Good"; badge.className="focus-badge focus-badge-good";}
    else if(contactRate>=40){badge.textContent="⚠ Watch"; badge.className="focus-badge focus-badge-warn";}
    else{badge.textContent="✗ Risk"; badge.className="focus-badge focus-badge-risk";}
  }
  const focus=$("cpFocusText");
  if(focus){
    if(notLeads>50) focus.innerHTML=`<strong>Lead Outreach</strong> — ${notLeads.toLocaleString()} leads still need a connected call or completed meeting.`;
    else if(untouched>20) focus.innerHTML=`<strong>Account Coverage</strong> — ${untouched.toLocaleString()} Rank A/B accounts remain untouched.`;
    else if(dealsAtRisk>10) focus.innerHTML=`<strong>Pipeline Hygiene</strong> — ${dealsAtRisk.toLocaleString()} risk signals detected across open deals.`;
    else focus.innerHTML=`<strong>On Track</strong> — no critical gaps detected. Keep monitoring daily pace.`;
  }
  set("cpPipeline",money(pipeline)); set("cpWonMTD",money(wonMTD)); set("cpLostMTD",money(lostMTD));
  set("cpOutreachRate",contactRate+"%"); if($("cpOutreachRate")) $("cpOutreachRate").style.color=rateColor(contactRate); if($("cpOutreachBar")) $("cpOutreachBar").style.width=Math.max(0,Math.min(100,contactRate))+"%";
  set("cpContactedLeads",contactedLeads.toLocaleString()); set("cpNotContactedLeads",notLeads.toLocaleString());
  set("cpCallsMTD",callsMTD.toLocaleString()); set("cpConnMTD",connMTD.toLocaleString()); set("cpMtgsMTD",mtgsMTD.toLocaleString());
  const target=Math.max(60,Math.ceil((contactRate+1)/10)*10);
  const actions=[
    {bg:"var(--red-bg)",color:"var(--red)",title:`Contact ${notLeads.toLocaleString()} eligible leads`,desc:"Prioritize online/inbound first, then older offline leads with no connected call or completed meeting.",value:notLeads.toLocaleString(),label:"leads"},
    {bg:"var(--amber-bg)",color:"var(--amber)",title:`Review ${untouched.toLocaleString()} untouched Rank A/B accounts`,desc:"These accounts are not counted as contacted under the new association-based logic.",value:untouched.toLocaleString(),label:"accounts"},
    {bg:"var(--blue-bg)",color:"var(--blue)",title:`Check ${dealsAtRisk.toLocaleString()} pipeline risk signals`,desc:"Includes cold deals, stuck deals, and deals with missing next activity.",value:dealsAtRisk.toLocaleString(),label:"signals"},
    {bg:"var(--green-bg)",color:"var(--green)",title:`Push contact rate above ${target}%`,desc:"Use this as the daily execution target for connected calls or completed meetings.",value:`${contactRate}%`,label:"current"}
  ];
  if($("cpPriorityList")){
    $("cpPriorityList").innerHTML=actions.map((a,i)=>`<div class="priority-item"><div class="priority-num" style="background:${a.bg};color:${a.color}">${i+1}</div><div class="priority-text"><div class="priority-action">${a.title}</div><div class="priority-desc">${a.desc}</div></div><div class="priority-metric"><div class="priority-metric-v" style="color:${a.color}">${a.value}</div><div class="priority-metric-l">${a.label}</div></div></div>`).join("");
  }
}


/* ACQUISITION ZERO-CONNECTED-CALL LEAD HELPERS */
function hubspotRecordUrl(objectType, id){
  if(!id) return null;
  const portalId = D?.meta?.portalId || D?.portalId || D?.hubspotPortalId || D?.meta?.hubspotPortalId || "";
  if(!portalId) return null;
  const typeMap = { contact:"contact", contacts:"contact", company:"company", companies:"company", deal:"deal", deals:"deal" };
  const obj = typeMap[String(objectType||"").toLowerCase()] || objectType;
  return `https://app.hubspot.com/contacts/${portalId}/${obj}/${id}`;
}
function acqFirstValue(row, keys){
  const sources = [row, row?.properties, row?.propertyValues, row?.fields];
  for(const key of keys){
    for(const src of sources){
      if(!src) continue;
      const val = src[key];
      if(val !== undefined && val !== null && String(val).trim() !== "") return val;
    }
  }
  return null;
}
function acqContactId(row){
  return acqFirstValue(row, ["id","hs_object_id","contactId","vid","recordId","objectId"]);
}
function acqContactEmail(row){
  return acqFirstValue(row, ["email","hs_email","contactEmail"]);
}
function acqContactPhone(row){
  return acqFirstValue(row, ["phone","mobilephone","mobilePhone","hs_whatsapp_phone_number"]);
}
function acqHubSpotUrl(row, objectType="contact"){
  if(row?.hubspotUrl || row?.url) return row.hubspotUrl || row.url;
  const id = objectType === "deal" ? acqFirstValue(row,["id","hs_object_id","dealId","recordId"]) : acqContactId(row);
  return id && typeof hubspotRecordUrl === "function" ? hubspotRecordUrl(objectType, id) : null;
}
function acqParseDateValue(value){
  if(!value) return null;
  const d = new Date(value);
  return isNaN(d) ? null : d;
}
function acqDateOnly(d){
  if(!d) return null;
  const x = new Date(d);
  if(isNaN(x)) return null;
  x.setHours(0,0,0,0);
  return x;
}
function acqDaysSinceDateValue(value){
  const d = acqDateOnly(acqParseDateValue(value));
  if(!d) return null;
  const today = new Date();
  today.setHours(0,0,0,0);
  return Math.max(0, Math.floor((today - d) / 86400000));
}
function acqCreatedDate(row){
  return acqFirstValue(row, ["createdAt","createdate","hs_createdate","hs_createdate_iso","createdDate","created"]);
}
function acqLastConnectedCallDate(row){
  return acqFirstValue(row, ["lastConnectedCallDate","last_connected_call_date","lastConnectedAt","connectedCallDate","connected_call_date"]);
}
function acqLastContactDate(row){
  return acqFirstValue(row, ["lastContactedAt","last_contacted_at","notes_last_contacted","last_activity_date","lastActivityDate","lastActivityAt","lastTouchDate","lastTouchAt","hs_lastmodifieddate"]);
}
function acqConnectedCallsCount(row){
  const keys = ["connectedCallsCount","connectedCallCount","connected_calls_count","connectedCalls","callsConnected","connected","connected_calls","connectedCallsTotal","connectedCallTotal"];
  for(const key of keys){
    const val = row?.[key];
    if(Array.isArray(val)) return val.length;
    if(val !== undefined && val !== null && val !== ""){
      const n = Number(val);
      if(Number.isFinite(n)) return n;
    }
  }
  if(row?.hasConnectedCall === true || row?.hasConnectedCalls === true) return 1;
  if(row?.hasConnectedCall === false || row?.hasConnectedCalls === false) return 0;
  return null;
}
function acqLeadHasConnectedCall(row, noConnectedDefault=false){
  const count = acqConnectedCallsCount(row);
  if(count !== null) return count > 0;
  if(noConnectedDefault) return false;
  return false;
}
function acqLeadDaysWithoutContact(row){
  const explicit = acqFirstValue(row, ["daysWithoutContact","days_without_contact","daysSinceContact","daysSinceLastContact","daysSinceCreated","ageDays"]);
  if(explicit !== null){
    const n = Number(explicit);
    if(Number.isFinite(n)) return Math.max(0, Math.round(n));
  }
  // Since there is no connected call, the clean aging reference is the last recorded contact/activity if present, otherwise lead creation date.
  const ref = acqLastConnectedCallDate(row) || acqLastContactDate(row) || acqCreatedDate(row);
  return acqDaysSinceDateValue(ref);
}
function acqLeadSourceBucket(row){
  const raw = String(acqFirstValue(row, ["sourceBucket","sourceType","source","hs_analytics_source","originalSource","original_source","leadSource"]) || "").trim();
  const s = raw.toUpperCase();
  if(!s) return "offline";
  if(s.includes("OFFLINE") || s.includes("OUTBOUND") || s.includes("IMPORT") || s.includes("SALES")) return "offline";
  return "online";
}
function acqLeadSourceLabel(row){
  const raw = acqFirstValue(row, ["source","sourceBucket","hs_analytics_source","originalSource","original_source","leadSource"]);
  return raw || (acqLeadSourceBucket(row) === "online" ? "Online" : "Offline");
}
function acqNoConnectedLeadRows(ct, ownerId){
  const contacts = ct || D?.outreachCoverage?.contacts || {};

  // STRICT MODE:
  // Do NOT reuse notContactedList here. notContactedList can mean "not reached yet"
  // and may include contacts that have call activity but no valid connected call.
  // This section must show only contacts exported by n8n as truly having ZERO connected calls.
  const explicit = contacts.noConnectedCallsList || contacts.noConnectedCallList || contacts.zeroConnectedCallsList || contacts.contactsWithNoConnectedCalls;
  if(!Array.isArray(explicit)) return [];

  return [...explicit]
    .filter(row => {
      const count = acqConnectedCallsCount(row);
      // If n8n already exported the strict list, include rows with 0 or missing count.
      // Exclude only rows that clearly say connected calls > 0.
      return count === null || count === 0;
    })
    .filter(row => !ownerId || String(row.ownerId||row.hubspot_owner_id||"") === String(ownerId) || String(row.ownerName||row.rep||"") === String(acqRepById(ownerId)?.name||""))
    .map(row => ({
      ...row,
      _sourceBucket: acqLeadSourceBucket(row),
      _sourceLabel: acqLeadSourceLabel(row),
      _daysWithoutContact: acqLeadDaysWithoutContact(row),
      _connectedCallsCount: acqConnectedCallsCount(row) ?? 0
    }))
    .sort((a,b)=>(Number(b._daysWithoutContact ?? -1)-Number(a._daysWithoutContact ?? -1)) || String(acqCreatedDate(a)||"").localeCompare(String(acqCreatedDate(b)||"")));
}
function acqSplitNoConnectedLeadRows(rows){
  const clean = Array.isArray(rows) ? rows : [];
  return {
    online: clean.filter(row => acqLeadSourceBucket(row) === "online"),
    offline: clean.filter(row => acqLeadSourceBucket(row) === "offline")
  };
}
function acqMaxDays(rows){
  const nums = (rows || []).map(r => Number(r._daysWithoutContact ?? acqLeadDaysWithoutContact(r))).filter(n => Number.isFinite(n));
  return nums.length ? Math.max(...nums) : null;
}
function acqContactName(row){
  const fn = String(acqFirstValue(row, ["firstname","firstName","first_name"]) || "").trim();
  const ln = String(acqFirstValue(row, ["lastname","lastName","last_name"]) || "").trim();
  const full = acqFirstValue(row, ["name","fullName","fullname","contactName"]);
  return full || [fn, ln].filter(Boolean).join(" ") || acqContactEmail(row) || (acqContactId(row) ? `Contact #${acqContactId(row)}` : "Unknown contact");
}
function acqNoConnectedLeadTableRow(c){
  const created = acqCreatedDate(c);
  const days = Number(c._daysWithoutContact ?? acqLeadDaysWithoutContact(c));
  const daysText = Number.isFinite(days) ? `${days}d` : "—";
  const daysColor = Number.isFinite(days) && days >= 14 ? "var(--red)" : Number.isFinite(days) && days >= 7 ? "var(--amber)" : "var(--green)";
  const bucket = acqLeadSourceBucket(c);
  const pillClass = bucket === "online" ? "acq-source-online" : "acq-source-offline";
  const emailOrPhone = acqContactEmail(c) || acqContactPhone(c) || "No email in exported data";
  const owner = acqFirstValue(c, ["ownerName","rep","hubspot_owner_name","owner"]) || acqFirstValue(c, ["ownerId","hubspot_owner_id"]) || "—";
  return `<tr><td><div style="font-weight:700">${recordLink(acqContactName(c), acqHubSpotUrl(c,"contact"))}</div><div style="font-family:var(--mono);font-size:9px;color:var(--muted)">${esc(emailOrPhone)}</div></td><td style="font-size:11px;font-weight:700;color:${c.ownerColor || 'var(--text2)'}">${esc(owner)}</td><td><span class="acq-source-pill ${pillClass}">${esc(c._sourceLabel || acqLeadSourceLabel(c))}</span></td><td class="c" style="font-family:var(--mono);font-size:10px">${created ? String(created).split("T")[0] : "—"}</td><td class="c"><span class="badge br" style="font-size:8px">0</span></td><td class="c"><span style="font-family:var(--mono);font-size:12px;font-weight:900;color:${daysColor}">${daysText}</span></td></tr>`;
}
function acqNoConnectedMiniRows(rows, emptyText){
  const shown = (rows || []).slice(0, 5);
  if(!shown.length) return `<div class="acq-empty">${esc(emptyText || "No strict zero-connected-call contacts exported yet.")}</div>`;
  return `<div class="mini-list">${shown.map(row => {
    const days = Number(row._daysWithoutContact ?? acqLeadDaysWithoutContact(row));
    const daysText = Number.isFinite(days) ? `${days}d` : "—";
    const emailOrPhone = acqContactEmail(row) || acqContactPhone(row) || "No email in exported data";
    return `<div class="mini-row"><div class="mini-main"><div class="mini-name">${recordLink(acqContactName(row), acqHubSpotUrl(row,"contact"))}</div><div class="mini-meta">${esc(emailOrPhone)} · ${esc(row._sourceLabel || acqLeadSourceLabel(row))}</div></div><div class="mini-score" title="Days without connected call">${daysText}</div></div>`;
  }).join("")}</div>`;
}
function renderRepNoConnectedLeadsBlock(rep){
  if(!rep || rep.type === "view") return "";
  const rows = acqNoConnectedLeadRows(D?.outreachCoverage?.contacts || {}, rep.id);
  const split = acqSplitNoConnectedLeadRows(rows);
  window.__acqNoConnectedRowsCache = window.__acqNoConnectedRowsCache || {};
  window.__acqNoConnectedRowsCache[String(rep.id)] = { all: rows, online: split.online, offline: split.offline };
  const id = String(rep.id || rep.name || "").replace(/'/g,"&#039;");
  const onlineMax = acqMaxDays(split.online);
  const offlineMax = acqMaxDays(split.offline);
  return `<div class="acq-follow-card" data-acq-zero-connected-calls style="--fc:var(--red);margin-bottom:14px">
    <div class="acq-follow-hd"><div class="acq-follow-title">☎ Contacts never connected</div><span class="badge br metric-clickable" onclick="openAcqNoConnectedMetric('all','${id}')">${rows.length} contacts</span></div>
    <div class="acq-follow-sub">Assigned to ${esc(rep.name)}. Strict list only: contacts with zero connected calls exported from n8n.</div>
    <div class="acq-lead-split">
      <div class="acq-mini-table"><div class="acq-mini-hd"><div class="acq-mini-title" style="color:var(--blue)">Online / Inbound</div><span class="acq-source-pill acq-source-online metric-clickable" onclick="openAcqNoConnectedMetric('online','${id}')">${split.online.length} · ${onlineMax !== null ? onlineMax + 'd max' : '—'}</span></div>${acqNoConnectedMiniRows(split.online, 'No online contacts with 0 connected calls.')}</div>
      <div class="acq-mini-table"><div class="acq-mini-hd"><div class="acq-mini-title" style="color:var(--amber)">Offline / Outbound</div><span class="acq-source-pill acq-source-offline metric-clickable" onclick="openAcqNoConnectedMetric('offline','${id}')">${split.offline.length} · ${offlineMax !== null ? offlineMax + 'd max' : '—'}</span></div>${acqNoConnectedMiniRows(split.offline, 'No offline contacts with 0 connected calls.')}</div>
    </div>
  </div>`;
}

/* ════════════════════════════════════════
   OUTREACH COVERAGE RENDERER
   reads D.outreachCoverage from Supabase
   ════════════════════════════════════════ */
function renderOutreach(){
  const card = $("outreachCard");
  if(!card) return;

  const oc = D && D.outreachCoverage;
  card.style.display = "block";

  if(!oc){
    card.innerHTML = `<div class="card-hd"><div class="card-title"><div class="card-title-icon" style="background:var(--red-bg)">⚠️</div>Lead Outreach Coverage</div></div><div style="padding:16px 18px;color:var(--red);font-size:12px;font-weight:700">outreachCoverage is missing from loaded Supabase</div>`;
    return;
  }

  const rateColor = r => r >= 70 ? "var(--green)" : r >= 40 ? "var(--amber)" : "var(--red)";
  const ct = oc.contacts || {};
  const co = oc.companies || {};
  const ac = oc.activities || {};

  const setText = (id, val) => { const el=$(id); if(el) el.textContent = val; };
  const setHTML = (id, val) => { const el=$(id); if(el) el.innerHTML = val; };
  const setStyle = (id, prop, val) => { const el=$(id); if(el) el.style[prop] = val; };

  window._ocLeadNot = false;
  window._ocCoNot = false;
  setStyle("outreachLeadNotMore", "display", "none");
  setStyle("outreachCoNotMore", "display", "none");

  const needContactLeads = Array.isArray(ct.notContactedList)
    ? [...ct.notContactedList]
    : acqNoConnectedLeadRows(ct);

  const split = acqSplitNoConnectedLeadRows(needContactLeads);
  const totalLeads = Number(ct.total || 0);
  const contactedLeads = Number(ct.contacted || 0);
  const needContactCount = Number(ct.notContacted || needContactLeads.length || Math.max(totalLeads - contactedLeads, 0));

  setText("outreachLeadBadge", `${needContactCount.toLocaleString()} need contact`);
  setText("outreachCoBadge", `${co.contacted || 0}/${co.total || 0} companies`);

  const kpis = [
    { v: totalLeads, l: "Total Leads", c: "var(--cyan)" },
    { v: contactedLeads, l: "Contacted Leads", c: "var(--green)" },
    { v: needContactCount, l: "Need Contact", c: "var(--red)" },
    { v: co.total || 0, l: "Total Companies", c: "var(--cyan)" },
    { v: co.contacted || 0, l: "Contacted Companies", c: "var(--green)" },
    { v: co.notContacted || 0, l: "Not Contacted Companies", c: "var(--amber)" }
  ];

  setHTML("outreachKpiGrid", kpis.map(k => `<div class="outreach-kpi-box"><div class="outreach-kpi-val" style="color:${k.c}">${Number(k.v || 0).toLocaleString()}</div><div class="outreach-kpi-lbl">${k.l}</div></div>`).join(""));

  const lr = Number(ct.contactedRate || 0);
  const cr = Number(co.contactedRate || 0);

  setText("outreachLeadRateVal", `${lr}%`);
  setStyle("outreachLeadRateVal", "color", rateColor(lr));
  setStyle("outreachLeadRateBar", "width", `${Math.max(0, Math.min(100, lr))}%`);
  setStyle("outreachLeadRateBar", "background", rateColor(lr));

  setText("outreachCoRateVal", `${cr}%`);
  setStyle("outreachCoRateVal", "color", rateColor(cr));
  setStyle("outreachCoRateBar", "width", `${Math.max(0, Math.min(100, cr))}%`);
  setStyle("outreachCoRateBar", "background", rateColor(cr));

  setText("outreachActCalls", `📞 ${ac.callsLinkedToContacts || 0} / ${ac.totalCalls || 0} connected calls`);
  setText("outreachActMeetings", `📅 ${ac.meetingsLinkedToContacts || 0} / ${ac.totalMeetings || 0} completed meetings`);

  const onlineMax = acqMaxDays(split.online);
  const offlineMax = acqMaxDays(split.offline);

  setText("outreachOnlineSplit", `${split.online.length.toLocaleString()} need contact · longest ${onlineMax !== null ? onlineMax + 'd' : '—'}`);
  setText("outreachOfflineSplit", `${split.offline.length.toLocaleString()} need contact · longest ${offlineMax !== null ? offlineMax + 'd' : '—'}`);

  const ncLeads = needContactLeads.sort((a,b)=>Number(acqLeadDaysWithoutContact(b) || 0)-Number(acqLeadDaysWithoutContact(a) || 0));
  const ncCos = [...(co.notContactedList || [])].sort((a,b)=>new Date(b.createdAt || 0)-new Date(a.createdAt || 0));

  setText("outreachLeadNotBadge", `${ncLeads.length.toLocaleString()} leads`);
  setText("outreachCoNotBadge", `${ncCos.length} companies`);

  const slL = ncLeads.slice(0, 10), rlL = ncLeads.slice(10);
  setHTML("outreachLeadNotBody", slL.length ? slL.map(acqNoConnectedLeadTableRow).join("") : `<tr><td colspan="6" style="text-align:center;color:var(--green);padding:14px;font-style:italic">✓ No leads need contact</td></tr>`);
  setHTML("outreachLeadNotBodyMore", rlL.map(acqNoConnectedLeadTableRow).join(""));
  if($("outreachLeadNotToggle")){
    $("outreachLeadNotToggle").style.display = rlL.length ? "block" : "none";
    $("outreachLeadNotToggle").textContent = `▼ Show ${rlL.length} more`;
  }

  const coRow = c => `<tr><td><div style="font-weight:600">${recordLink(c.name || c.id || "Unknown", c.hubspotUrl)}</div><div style="font-size:9px;color:var(--muted)">${c.country || "Unknown"}${c.rank ? ` · Rank ${c.rank}` : ""}</div></td><td style="font-size:11px;font-weight:600;color:${c.ownerColor || 'var(--text2)'}">${c.ownerName || c.ownerId || "—"}</td><td class="c" style="font-size:10px;color:var(--muted);font-family:var(--mono)">${c.domain || "—"}</td><td class="c" style="font-family:var(--mono);font-size:10px">${c.createdAt ? (c.createdAt+"").split("T")[0] : "—"}</td></tr>`;

  const slC = ncCos.slice(0, 10), rlC = ncCos.slice(10);
  setHTML("outreachCoNotBody", slC.length ? slC.map(coRow).join("") : `<tr><td colspan="4" style="text-align:center;color:var(--green);padding:14px;font-style:italic">✓ All companies have been contacted</td></tr>`);
  setHTML("outreachCoNotBodyMore", rlC.map(coRow).join(""));
  if($("outreachCoNotToggle")){
    $("outreachCoNotToggle").style.display = rlC.length ? "block" : "none";
    $("outreachCoNotToggle").textContent = `▼ Show ${rlC.length} more`;
  }

  enhanceAcqOverviewClickables();
}

/* ACQUISITION CLICKABLE METRICS — SAFE PATCH */
function acqLabel(kind){
  return ({
    leads_not_contacted:['Leads need contact','Eligible leads that still need a connected call or completed meeting.'],
    leads_contacted:['Contacted leads','Eligible leads already reached.'],
    online_not_contacted:['Online / inbound leads not contacted','Online leads that still need follow-up.'],
    offline_not_contacted:['Offline / outbound leads not contacted','Offline leads that still need follow-up.'],
    companies_not_contacted:['Companies not contacted','Companies with no valid outreach signal.'],
    rank_a_untouched:['Rank A untouched accounts','High-priority Rank A companies not contacted.'],
    rank_b_untouched:['Rank B untouched accounts','Rank B companies not contacted.'],
    rank_ab_untouched:['Rank A/B untouched accounts','Rank A and B companies still not contacted.'],
    deals_at_risk:['Deals at risk','Cold, stuck, or missing-next-activity deals.'],
    open_deals:['Open deals','Open pipeline rows available in the current data.']
  }[kind] || ['Details','Rows available for this metric.']);
}
function acqRepById(repId){
  const x=String(repId||'');
  return (D?.repData||[]).find(r=>String(r.id)===x || String(r.name)===x || String(r.name||'').toLowerCase()===x.toLowerCase());
}
function acqSourceNorm(v){ return String(v||'').trim().toUpperCase(); }
function acqFilterOwner(rows,rep){
  if(!rep) return rows;
  return rows.filter(row => {
    const ownerId = acqFirstValue(row, ["ownerId","hubspot_owner_id","hs_owner_id"]);
    const ownerName = acqFirstValue(row, ["ownerName","rep","hubspot_owner_name","owner"]);
    return String(ownerId||"") === String(rep.id) || String(ownerName||"") === String(rep.name);
  });
}
function acqRowsForMetric(kind,opts={}){
  if(!D) return [];
  const oc=D.outreachCoverage||{};
  const rep=opts.repId ? acqRepById(opts.repId) : null;
  let rows=[];
  if(kind==='leads_not_contacted') rows=getAcqNoConnectedMetricRows('all', opts.repId || null);
  else if(kind==='leads_contacted') rows=[...(oc.contacts?.contactedList||[])];
  else if(kind==='online_not_contacted') rows=getAcqNoConnectedMetricRows('online', opts.repId || null);
  else if(kind==='offline_not_contacted') rows=getAcqNoConnectedMetricRows('offline', opts.repId || null);
  else if(kind==='companies_not_contacted') rows=[...(oc.companies?.notContactedList||[])];
  else if(kind==='rank_a_untouched') rows=(rep ? (rep.rankAUntouched||[]) : (D.repData||[]).flatMap(r=>(r.rankAUntouched||[]).map(x=>({...x,ownerName:r.name,ownerId:r.id,rank:'A'}))));
  else if(kind==='rank_b_untouched') rows=(rep ? (rep.rankBUntouched||[]) : (D.repData||[]).flatMap(r=>(r.rankBUntouched||[]).map(x=>({...x,ownerName:r.name,ownerId:r.id,rank:'B'}))));
  else if(kind==='rank_ab_untouched') rows=(rep ? [...(rep.rankAUntouched||[]).map(x=>({...x,rank:'A'})),...(rep.rankBUntouched||[]).map(x=>({...x,rank:'B'}))] : (D.repData||[]).flatMap(r=>[...(r.rankAUntouched||[]).map(x=>({...x,ownerName:r.name,ownerId:r.id,rank:'A'})),...(r.rankBUntouched||[]).map(x=>({...x,ownerName:r.name,ownerId:r.id,rank:'B'}))]));
  else if(kind==='deals_at_risk') rows=(rep ? [...(rep.needsAttention||[]),...(rep.cold||[]),...(rep.stuck||[])] : (D.repData||[]).flatMap(r=>[...(r.needsAttention||[]).map(x=>({...x,ownerName:r.name,ownerId:r.id})),...(r.cold||[]).map(x=>({...x,ownerName:r.name,ownerId:r.id})),...(r.stuck||[]).map(x=>({...x,ownerName:r.name,ownerId:r.id}))]));
  else if(kind==='open_deals') rows=(rep ? (rep.topDeals||[]) : (D.repData||[]).flatMap(r=>(r.topDeals||[]).map(x=>({...x,ownerName:r.name,ownerId:r.id}))));
  if(['leads_not_contacted','online_not_contacted','offline_not_contacted'].includes(kind)) return rows;
  return acqFilterOwner(rows,rep);
}
function acqRowType(row){
  if(acqContactEmail(row) || acqFirstValue(row,["leadStatus","hs_lead_status","firstname","lastname","contactId","vid"]) || row?._sourceBucket) return 'lead';
  if(acqFirstValue(row,["amount","stage","dealstage","dealname"]) !== null || row?.reasons) return 'deal';
  return 'company';
}
function acqRowName(row){
  const type = acqRowType(row);
  if(type === 'lead') return acqContactName(row);
  return acqFirstValue(row,["name","companyName","dealname","title","domain","id","hs_object_id"]) || 'Unknown';
}
function acqRowUrl(row,type){
  if(row?.hubspotUrl || row?.url) return row.hubspotUrl || row.url;
  if(type==='lead') return acqHubSpotUrl(row,'contact');
  if(type==='deal'){ const id=acqFirstValue(row,["id","hs_object_id","dealId","recordId"]); return id && typeof hubspotRecordUrl === 'function' ? hubspotRecordUrl('deal',id) : null; }
  const id=acqFirstValue(row,["id","hs_object_id","companyId","recordId"]);
  return id && typeof hubspotRecordUrl === 'function' ? hubspotRecordUrl('company',id) : null;
}
function getAcqNoConnectedMetricRows(kind="all", repId=null){
  const repKey = repId ? String(repId) : null;
  const cached = repKey ? window.__acqNoConnectedRowsCache?.[repKey] : null;
  if(cached){
    if(kind === "online") return cached.online || [];
    if(kind === "offline") return cached.offline || [];
    return cached.all || [];
  }
  const allRows = acqNoConnectedLeadRows(D?.outreachCoverage?.contacts || {}, repId || undefined);
  const split = acqSplitNoConnectedLeadRows(allRows);
  if(kind === "online") return split.online;
  if(kind === "offline") return split.offline;
  return allRows;
}
function openAcqNoConnectedMetric(kind="all", repId=null){
  const map = {
    all: "leads_not_contacted",
    online: "online_not_contacted",
    offline: "offline_not_contacted"
  };
  return openAcqMetricCard(map[kind] || "leads_not_contacted", { repId, _zeroKind: kind });
}
function openAcqMetricCard(kind,opts={}){
  const rows=acqRowsForMetric(kind,opts);
  const [title,desc]=acqLabel(kind);
  const rep=opts.repId ? acqRepById(opts.repId) : null;
  const existing=document.getElementById('acqMetricBackdrop');
  if(existing) existing.remove();
  const rowHtml=rows.length ? rows.slice(0,80).map(row=>{
    const type=acqRowType(row), name=acqRowName(row), url=acqRowUrl(row,type);
    const owner=acqFirstValue(row,["ownerName","rep","hubspot_owner_name","owner"]) || rep?.name || acqFirstValue(row,["ownerId","hubspot_owner_id"]) || '—';
    const leadDays = type==='lead' ? acqLeadDaysWithoutContact(row) : null;
    const leadContact = acqContactEmail(row) || acqContactPhone(row) || 'No email in exported data';
    const meta= type==='lead' ? `${leadContact} · ${row._sourceLabel || acqLeadSourceLabel(row)}${acqCreatedDate(row) ? ' · Created '+String(acqCreatedDate(row)).slice(0,10) : ''}` : type==='deal' ? `${acqFirstValue(row,["stage","stageLabel","dealstage"])||''}${row.days? ' · '+row.days+'d' : ''}` : `${acqFirstValue(row,["country"])||''}${row.rank ? ' · Rank '+row.rank : ''}`;
    const value = type==='lead' ? (leadDays !== null ? leadDays + 'd' : '—') : acqFirstValue(row,["amount"]) !== null ? fmt(acqFirstValue(row,["amount"])||0) : (row.score!==undefined ? row.score : (row.ageDays!==undefined ? row.ageDays+'d' : ''));
    const status = type==='lead' ? `${acqConnectedCallsCount(row) ?? 0} connected calls` : (acqFirstValue(row,["leadStatus","status","reason","priority"]) || (type==='deal'?'Deal':'Company'));
    return `<div class="acq-detail-row"><div class="acq-detail-name">${recordLink(name,url)}<div class="acq-detail-meta">${esc(meta||'')}</div></div><div>${esc(owner)}</div><div><span class="acq-detail-pill">${esc(status||'—')}</span></div><div style="font-family:var(--mono);font-weight:900;text-align:right">${esc(value||'—')}</div></div>`;
  }).join('') : `<div class="acq-detail-empty">No strict zero-connected-call rows found in current Supabase view. Export outreachCoverage.contacts.noConnectedCallsList from n8n first.</div>`;
  const more=rows.length>80?`<div class="acq-detail-empty" style="padding:12px">Showing first 80 of ${rows.length.toLocaleString()} rows.</div>`:'';
  const node=document.createElement('div');
  node.id='acqMetricBackdrop';
  node.className='acq-detail-backdrop';
  node.onclick=(e)=>{ if(e.target===node) node.remove(); };
  node.innerHTML=`<div class="acq-detail-card"><div class="acq-detail-hd"><div><div class="acq-detail-title">${esc(title)}${rep?` · ${esc(rep.name)}`:''} <span class="badge bb" style="margin-left:8px">${rows.length.toLocaleString()} ${rows.length === 1 ? 'row' : 'rows'}</span></div><div class="acq-detail-sub">${esc(desc)} · Names open directly in HubSpot when a link is available.</div></div><button class="acq-detail-close" onclick="document.getElementById('acqMetricBackdrop')?.remove()">×</button></div><div class="acq-detail-body">${rowHtml}${more}</div></div>`;
  document.body.appendChild(node);
}
function acqMakeClickable(id,kind,opts={}){
  const el=$(id); if(!el) return;
  el.classList.add('metric-clickable');
  el.onclick=(ev)=>{ ev.stopPropagation(); openAcqMetricCard(kind,opts); };
  el.title='Click to see names';
}
function enhanceAcqOverviewClickables(){
  acqMakeClickable('cpNotLeads','leads_not_contacted');
  acqMakeClickable('cpUntouched','rank_ab_untouched');
  acqMakeClickable('cpAtRisk','deals_at_risk');
  acqMakeClickable('outreachLeadNotBadge','leads_not_contacted');
  acqMakeClickable('outreachCoNotBadge','companies_not_contacted');
  const online=$('outreachOnlineSplit'); if(online){ online.classList.add('metric-clickable'); online.onclick=()=>openAcqNoConnectedMetric('online'); online.title='Click to see online/inbound contacts with 0 connected calls'; }
  const offline=$('outreachOfflineSplit'); if(offline){ offline.classList.add('metric-clickable'); offline.onclick=()=>openAcqNoConnectedMetric('offline'); offline.title='Click to see offline/outbound contacts with 0 connected calls'; }
}
function acqSmallRows(rows,type){
  const shown=(rows||[]).slice(0,5);
  if(!shown.length) return `<div class="acq-detail-empty" style="padding:16px">No pending rows.</div>`;
  return `<div class="mini-list">${shown.map(row=>{ const t=type||acqRowType(row), name=acqRowName(row), url=acqRowUrl(row,t); const meta=t==='lead'?`${row.email||''}${row.source||row.sourceBucket?' · '+(row.source||row.sourceBucket):''}${row.createdAt?' · '+String(row.createdAt).slice(0,10):''}`:`${row.country||''}${row.rank?' · Rank '+row.rank:''}`; return `<div class="mini-row"><div class="mini-main"><div class="mini-name">${recordLink(esc(name),url)}</div><div class="mini-meta">${esc(meta||'')}</div></div><div class="mini-score" style="color:var(--amber)">${esc(row.ageDays!==undefined?row.ageDays+'d':(row.rank||''))}</div></div>`; }).join('')}</div>`;
}
function injectAcqRepFollowupPanels(){
  if(!D?.repData) return;
  for(const r of D.repData){
    const slug=String(r.name||'').toLowerCase().replace(/\s/g,'-');
    const panel=$('panel-'+slug);
    if(!panel || panel.querySelector('.acq-rep-followup')) continue;
    const leads=acqRowsForMetric('leads_not_contacted',{repId:r.id});
    const companies=acqRowsForMetric('rank_ab_untouched',{repId:r.id});
    const html=`<div class="acq-follow-grid acq-rep-followup"><div class="card" style="border-top:3px solid var(--red)"><div class="card-hd"><div class="card-title"><div class="card-title-icon" style="background:var(--red-bg)">☎</div>Leads need contact</div><span class="badge br metric-clickable" onclick="openAcqMetricCard('leads_not_contacted',{repId:'${esc(r.id)}'})">${leads.length} leads</span></div><div class="acq-mini-note" style="padding:10px 14px;border-bottom:1px solid var(--border)">Assigned to ${esc(r.name)} with no connected call or completed meeting.</div>${acqSmallRows(leads,'lead')}</div><div class="card" style="border-top:3px solid var(--amber)"><div class="card-hd"><div class="card-title"><div class="card-title-icon" style="background:var(--amber-bg)">🎯</div>Rank A/B not contacted</div><span class="badge ba metric-clickable" onclick="openAcqMetricCard('rank_ab_untouched',{repId:'${esc(r.id)}'})">${companies.length} accounts</span></div><div class="acq-mini-note" style="padding:10px 14px;border-bottom:1px solid var(--border)">Rank A/B companies owned by ${esc(r.name)} that still need outreach.</div>${acqSmallRows(companies,'company')}</div></div>`;
    const anchor=panel.querySelector('.stat-chips');
    if(anchor) anchor.insertAdjacentHTML('afterend',html); else panel.insertAdjacentHTML('beforeend',html);
  }
}
function enhanceAcquisitionInteractiveViews(){
  enhanceAcqOverviewClickables();
  // injectAcqRepFollowupPanels disabled: keep Acquisition tables stable;
}

function restoreCurrentView(options={}){
  const keepScroll = options.keepScroll !== false;
  const scrollY = keepScroll ? window.scrollY : null;

  if(APP_MAIN_PANEL === "retention"){
    document.querySelectorAll(".tab-btn").forEach(t=>t.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach(n=>n.classList.remove("active"));
    if($("tabsBar")) $("tabsBar").style.display = "none";
    $("side-retention")?.classList.add("active");

    if(APP_RETENTION_VIEW === "financial"){
      RET_SELECTED_OWNER_ID = null;
      RETENTION_SUBVIEW = "financial";
      setRetentionOwnerMode(false);
      $("panel-retention-financial")?.classList.add("active");
      renderRetentionSidebar("financial");
      if($("topbarTitle")) $("topbarTitle").textContent = "Retention · Financial Details";
      if($("topbarSub")) $("topbarSub").textContent = "Deal stage Booked/Cashed · date entered current stage CY · renewed value · delayed exposure";
      renderRetentionFinancialDetails();
    } else if(APP_RETENTION_VIEW === "owner" && APP_RETENTION_OWNER_ID){
      RET_SELECTED_OWNER_ID = String(APP_RETENTION_OWNER_ID);
      RETENTION_SUBVIEW = "owner";
      $("panel-retention")?.classList.add("active");
      const rep = (R?.repData || R?.ownerMatrix || []).find(r=>String(r.id) === String(APP_RETENTION_OWNER_ID));
      renderRetentionSidebar("owner");
      setRetentionOwnerMode(true);
      if($("topbarTitle")) $("topbarTitle").textContent = "Retention · " + (rep?.name || "Owner");
      if($("topbarSub")) $("topbarSub").textContent = rep ? (rep.role || "Owner") + " · owner page · priority actions, financial movement, activity quality" : "Owner page";
      renderRetention();
      renderRetentionOwnerDetails(APP_RETENTION_OWNER_ID);
    } else {
      RET_SELECTED_OWNER_ID = null;
      RETENTION_SUBVIEW = "overview";
      setRetentionOwnerMode(false);
      $("panel-retention")?.classList.add("active");
      renderRetentionSidebar("overview");
      if($("topbarTitle")) $("topbarTitle").textContent = "Retention · Team Overview";
      if($("topbarSub")) $("topbarSub").textContent = R?.generatedAt ? "Updated " + R.generatedAt + " · Customer Success" : "Renewals · Booked · Cashed · Churn · Delayed";
      renderRetention();
    }
  } else {
    RET_SELECTED_OWNER_ID = null;
    RETENTION_SUBVIEW = "acquisition";
    setRetentionOwnerMode(false);
    if($("tabsBar")) $("tabsBar").style.display = "flex";
    if($("repsSectionTitle")){
      $("repsSectionTitle").style.display = "block";
      $("repsSectionTitle").textContent = "Acquisition Reps";
    }
    if($("sideRepLinks")) $("sideRepLinks").style.display = "block";
    document.querySelectorAll(".tab-btn").forEach(t=>t.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach(n=>n.classList.remove("active"));
    $("side-acquisition")?.classList.add("active");

    const id = APP_ACQ_TAB_ID || "team";
    $("tab-"+id)?.classList.add("active");
    $("panel-"+id)?.classList.add("active");
    if($("side-"+id) && id !== "financial") $("side-"+id).classList.add("active");

    const repName = D ? (D.repData||[]).find(r=>r.name.toLowerCase().replace(/\s/g,"-")===id)?.name : null;
    if($("topbarTitle")) $("topbarTitle").textContent = id === "team" ? "Acquisition · Team Overview" : id === "financial" ? "Acquisition · Financial Details" : "Acquisition · " + (repName || id);
    if($("topbarSub")){
      $("topbarSub").textContent = id === "financial" ? "Cashing revenue · Signed contracts · Pending to cash" : D ? "Updated " + (D.meta?.generatedAt||"") + " · Manual refresh" : "Loading...";
    }
  }

  if(keepScroll && scrollY !== null){
    requestAnimationFrame(()=>window.scrollTo(0, scrollY));
  }
}

async function fetchJsonFromSources(){
  throw new Error('Legacy JSON loader is disabled. Supabase is the only source.');
}



const SUPABASE_URL='https://czaxtwbmborxwzaboqxl.supabase.co';
const SUPABASE_KEY='sb_publishable_uVUdpVWggu1WvkSKCAi51w_9qsb-AjX';
const SUPABASE_VIEWS={
  acqReps:'vw_acquisition_sidebar_reps',
  acqRep:'vw_acquisition_rep_kpi_periods',
  acqTeam:'vw_acquisition_team_snapshot',
  rank:'vw_acquisition_rank_details',
  rankTouch:'vw_acquisition_rank_ab_touch_summary',
  rankNoTouch:'vw_acquisition_rank_ab_no_touch_details',
  need:'vw_acquisition_leads_need_contact_v2',
  pipe:'vw_acquisition_pipeline_by_owner',
  pipeSnapshot:'vw_acquisition_pipeline_snapshot',
  deals:'vw_acquisition_pipeline_details',
  stage:'vw_acquisition_pipeline_by_stage',
  stuck:'vw_acquisition_stuck_deals',
  cold:'vw_acquisition_cold_deals'
};
const ACQ_ACTIVITY_NAMES=['Marita Chedid','Zein Fares','Ursula Waked','Ahmad Khawajah','Mohammad Khalid','Mohammad Jehad Al-Barqawi','Jehad Al-Barqawi'];
const ACQ_VIEW_NAMES=['Fadi Zanona','Mohammed Faizan','Mohammad Faizan'];
const HS_PORTAL_ID='145742477';
const HS_BASE='https://app-eu1.hubspot.com';

function acqNum(v){
  const x=Number(String(v ?? '').replace(/[^0-9.-]/g,''));
  return Number.isFinite(x)?x:0;
}
function acqDateVal(v){
  if(!v) return null;
  const d=new Date(v);
  return Number.isNaN(d.getTime())?null:d;
}
function acqIsoDate(v){
  const d=acqDateVal(v);
  return d?d.toISOString().slice(0,10):'';
}
function acqDaysSince(v){
  const d=acqDateVal(v);
  if(!d) return 9999;
  const today=new Date();
  today.setHours(0,0,0,0);
  d.setHours(0,0,0,0);
  return Math.max(0,Math.floor((today-d)/86400000));
}
function acqThisMonth(v){
  const d=acqDateVal(v), now=new Date();
  return !!d && d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth();
}
function acqThisYear(v){
  const d=acqDateVal(v), now=new Date();
  return !!d && d.getFullYear()===now.getFullYear();
}
function acqNormText(v){return String(v ?? '').trim().toLowerCase();}
function acqOwnerSlug(name){return String(name||'').toLowerCase().replace(/\s+/g,'-');}
function acqCleanRank(v){
  const s=String(v||'').trim().toUpperCase().replace(/^RANK\s+/,'');
  return s==='A'||s==='B'?s:'';
}
function acqColorForName(name,idx=0){
  const map={
    'Marita Chedid':'#7C3AED','Zein Fares':'#2563EB','Ursula Waked':'#DB2777','Ahmad Khawajah':'#B45309','Mohammad Khalid':'#0F766E','Mohammad Jehad Al-Barqawi':'#0E7490','Jehad Al-Barqawi':'#0E7490','Fadi Zanona':'#475569','Mohammed Faizan':'#64748B','Mohammad Faizan':'#64748B'
  };
  return map[name] || SC[idx%SC.length] || '#16A34A';
}
function acqHubspotDealUrl(id){return id?`${HS_BASE}/contacts/${HS_PORTAL_ID}/deal/${id}`:'';}
function acqHubspotCompanyUrl(id){return id?`${HS_BASE}/contacts/${HS_PORTAL_ID}/company/${id}`:'';}
function acqHubspotContactUrl(id){return id?`${HS_BASE}/contacts/${HS_PORTAL_ID}/contact/${id}`:'';}
function acqDealName(r){return r.dealname || r.name || 'Unnamed deal';}
function acqDealUrl(r){return r.hubspot_url || r.hubspotUrl || acqHubspotDealUrl(r.hubspot_deal_id || r.id);}
function acqCompanyUrl(r){return r.hubspot_url || r.hubspotUrl || acqHubspotCompanyUrl(r.hubspot_company_id || r.company_id || r.id);}
function acqContactUrl(r){return r.hubspot_url || r.hubspotUrl || acqHubspotContactUrl(r.hubspot_contact_id || r.contact_id || r.id);}
function acqCountry(v){
  const raw=String(v||'Unknown').trim();
  if(!raw) return 'Unknown';
  const s=raw.toLowerCase();
  if(['ksa','saudi','saudi arabia','kingdom of saudi arabia'].includes(s)) return 'Saudi Arabia';
  if(['uae','united arab emirates'].includes(s)) return 'United Arab Emirates';
  return raw.replace(/\s+/g,' ');
}
async function supabaseView(name,limit=10000){
  const url=`${SUPABASE_URL}/rest/v1/${name}?select=*&limit=${limit}`;
  const res=await fetch(url,{cache:'no-store',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`}});
  if(!res.ok) throw new Error(`${name} HTTP ${res.status}`);
  return await res.json();
}
async function fetchSupabaseAcquisition(){
  const entries=Object.entries(SUPABASE_VIEWS);
  const out={};
  await Promise.all(entries.map(async([key,view])=>{
    try{ out[key]=await supabaseView(view); }
    catch(e){ console.warn('Supabase view failed',view,e); out[key]=[]; }
  }));
  return out;
}
function groupBy(rows,fn){
  const m={};
  (rows||[]).forEach(r=>{const k=fn(r); if(!m[k])m[k]=[]; m[k].push(r);});
  return m;
}
function sumBy(rows,fn){return (rows||[]).reduce((s,r)=>s+acqNum(fn(r)),0);}
function countBy(rows,fn){return (rows||[]).filter(fn).length;}
function acqDealRow(r,ownerMeta={}){
  const amount=acqNum(r.amount || r.amount_in_home_currency);
  const url=acqDealUrl(r);
  return {
    id:String(r.hubspot_deal_id||r.id||''),
    name:acqDealName(r),
    stage:r.dealstage||r.stage||'',
    dealstage:r.dealstage||r.stage||'',
    amount,
    rep:r.owner_name||ownerMeta.name||'',
    repColor:ownerMeta.color||acqColorForName(r.owner_name),
    reason:r.lost_reason||r.closed_lost_reason||'Other',
    closedate:acqIsoDate(r.closedate),
    stageDate:acqIsoDate(r.hs_v2_date_entered_current_stage),
    nextActivity:acqIsoDate(r.next_activity_date),
    hubspotUrl:url,
    product:r.product||''
  };
}
function acqRankCompanyRow(r,ownerMeta={}){
  const id=String(r.hubspot_company_id||r.company_id||r.id||'');
  const rank=acqCleanRank(r.rank_group||r.rank||r.company_rank);
  return {
    id,
    hs_object_id:id,
    companyId:id,
    name:r.company_name||r.name||'Unnamed account',
    companyName:r.company_name||r.name||'Unnamed account',
    accountName:r.company_name||r.name||'Unnamed account',
    domain:r.domain||'',
    country:acqCountry(r.country),
    rank,
    ownerId:String(r.hubspot_owner_id||ownerMeta.id||''),
    ownerName:r.owner_name||ownerMeta.name||'',
    ownerColor:ownerMeta.color||acqColorForName(r.owner_name),
    connectedCalls:acqNum(r.connected_calls),
    completedMeetings:acqNum(r.completed_meetings),
    lastActivityDate:r.last_touch_at||r.last_activity_at||'',
    daysSinceActivity:acqDaysSince(r.last_touch_at||r.last_activity_at),
    hubspotUrl:acqCompanyUrl(r)
  };
}
function buildAcquisitionFromSupabase(SUPA){
  const now=new Date();
  const riyadh=new Date(now.toLocaleString('en-US',{timeZone:'Asia/Riyadh'}));
  const generatedAt=riyadh.toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'});
  const yest=new Date(riyadh); yest.setDate(yest.getDate()-1);
  const yesterdayLabel=yest.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});

  const repKpis=SUPA.acqRep||[];
  const repKpiByName=Object.fromEntries(repKpis.map(r=>[r.owner_name,r]));
  const dealRows=SUPA.deals||[];
  const rankRows=SUPA.rank||[];
  const rankTouch=SUPA.rankTouch||[];
  const rankNoTouch=SUPA.rankNoTouch||[];
  const needRows=SUPA.need||[];
  const stuckRows=SUPA.stuck||[];
  const coldRows=SUPA.cold||[];
  const pipeRows=SUPA.pipe||[];

  const ownerNames=[...ACQ_ACTIVITY_NAMES];
  repKpis.forEach(r=>{if(r.owner_name&&!ownerNames.some(x=>acqNormText(x)===acqNormText(r.owner_name)))ownerNames.push(r.owner_name);});
  pipeRows.forEach(r=>{if(r.owner_name&&!ownerNames.some(x=>acqNormText(x)===acqNormText(r.owner_name)))ownerNames.push(r.owner_name);});
  ACQ_VIEW_NAMES.forEach(n=>{if(!ownerNames.some(x=>acqNormText(x)===acqNormText(n)))ownerNames.push(n);});

  const dealByOwner=groupBy(dealRows,r=>r.owner_name||'Unknown');
  const stuckByOwner=groupBy(stuckRows,r=>r.owner_name||'Unknown');
  const coldByOwner=groupBy(coldRows,r=>r.owner_name||'Unknown');
  const rankByOwner=groupBy(rankRows,r=>r.owner_name||'Unknown');
  const rankNoTouchByOwner=groupBy(rankNoTouch,r=>r.owner_name||'Unknown');
  const needByOwner=groupBy(needRows,r=>r.owner_name||'Unknown');
  const pipeByOwner=Object.fromEntries(pipeRows.map(r=>[r.owner_name,r]));

  const repData=ownerNames.map((name,idx)=>{
    const k=repKpiByName[name]||{};
    const color=acqColorForName(name,idx);
    const ownerDeals=dealByOwner[name]||[];
    const open=ownerDeals.filter(d=>String(d.deal_status||'').toLowerCase()==='open');
    const won=ownerDeals.filter(d=>String(d.deal_status||'').toLowerCase()==='won'&&acqThisMonth(d.closedate));
    const lost=ownerDeals.filter(d=>String(d.deal_status||'').toLowerCase()==='lost'&&acqThisMonth(d.closedate));
    const openDealObjs=open.map(d=>acqDealRow(d,{name,color})).sort((a,b)=>b.amount-a.amount);
    const p=pipeByOwner[name]||{};
    const ownerRankSummary=(rankTouch||[]).filter(r=>acqNormText(r.owner_name)===acqNormText(name));
    const rankAStats=ownerRankSummary.filter(r=>acqCleanRank(r.rank_group)==='A');
    const rankBStats=ownerRankSummary.filter(r=>acqCleanRank(r.rank_group)==='B');
    const rankA=sumBy(rankAStats,r=>r.companies), rankB=sumBy(rankBStats,r=>r.companies);
    const rankAContacted=sumBy(rankAStats,r=>r.touched_companies), rankBContacted=sumBy(rankBStats,r=>r.touched_companies);
    const rankANotContacted=sumBy(rankAStats,r=>r.no_touch_companies), rankBNotContacted=sumBy(rankBStats,r=>r.no_touch_companies);
    const byCountry={A:{},B:{}};
    ownerRankSummary.forEach(r=>{
      const g=acqCleanRank(r.rank_group), c=acqCountry(r.country);
      if(!g)return;
      byCountry[g][c]={
        rankA:g==='A'?acqNum(r.companies):0,
        rankAContacted:g==='A'?acqNum(r.touched_companies):0,
        rankANotContacted:g==='A'?acqNum(r.no_touch_companies):0,
        rankAMeetingsCompleted:g==='A'?acqNum(r.completed_meetings):0,
        rankB:g==='B'?acqNum(r.companies):0,
        rankBContacted:g==='B'?acqNum(r.touched_companies):0,
        rankBNotContacted:g==='B'?acqNum(r.no_touch_companies):0,
        rankBMeetingsCompleted:g==='B'?acqNum(r.completed_meetings):0
      };
    });
    const ownerNoTouch=rankNoTouchByOwner[name]||[];
    const ownerRankRows=rankByOwner[name]||[];
    const rankAUntouched=ownerNoTouch.filter(r=>acqCleanRank(r.rank_group||r.rank)==='A').map(r=>acqRankCompanyRow(r,{name,color}));
    const rankBUntouched=ownerNoTouch.filter(r=>acqCleanRank(r.rank_group||r.rank)==='B').map(r=>acqRankCompanyRow(r,{name,color}));
    const ownerStuck=(stuckByOwner[name]||[]).map(d=>({
      name:acqDealName(d),
      amount:acqNum(d.amount),
      days:acqNum(d.days_in_stage||d.days_since_modified),
      hubspotUrl:acqDealUrl(d),
      reasons:[d.lost_reason||d.dealstage||'Stuck deal']
    })).sort((a,b)=>b.days-a.days||b.amount-a.amount);
    const ownerCold=(coldByOwner[name]||[]).map(d=>({name:acqDealName(d),amount:acqNum(d.amount),days:acqNum(d.days_since_modified),hubspotUrl:acqDealUrl(d)}));
    const noNext=openDealObjs.filter(d=>!d.nextActivity).slice(0,30).map(d=>({...d,reasons:['No next activity scheduled']}));
    const need=needByOwner[name]||[];
    const onlineNeed=need.filter(x=>/online|inbound/i.test(String(x.source_type||x.source||''))).length;
    const offlineNeed=Math.max(0,need.length-onlineNeed);
    const isView=ACQ_VIEW_NAMES.some(x=>acqNormText(x)===acqNormText(name)) || String(p.owner_role||p.role||'').toLowerCase()==='deals_only';
    return {
      id:String(k.hubspot_owner_id||p.hubspot_owner_id||name),
      ownerId:String(k.hubspot_owner_id||p.hubspot_owner_id||name),
      name,
      ownerName:name,
      color,
      type:isView?'view':'activity',
      calls:{
        yest:acqNum(k.calls_yesterday),yestConn:acqNum(k.connected_yesterday),
        mtd:acqNum(k.calls_mtd),mtdConn:acqNum(k.connected_mtd),
        ytd:acqNum(k.calls_ytd),ytdConn:acqNum(k.connected_ytd)
      },
      connRateYest:Math.round(acqNum(k.conn_rate_yesterday)),
      connRateMTD:Math.round(acqNum(k.conn_rate_mtd)),
      connRateYTD:Math.round(acqNum(k.conn_rate_ytd)),
      meetings:{yest:acqNum(k.completed_yesterday),mtd:acqNum(k.completed_mtd),ytd:acqNum(k.completed_ytd)},
      leadsYest:acqNum(k.leads_yesterday),leadsYestInbound:0,leadsYestOutbound:0,
      leadsMTD:acqNum(k.leads_mtd),leadsMTDInbound:onlineNeed,leadsMTDOutbound:offlineNeed,
      leadsYTD:acqNum(k.leads_ytd),leadsYTDInbound:onlineNeed,leadsYTDOutbound:offlineNeed,
      won:won.length,lost:lost.length,
      openDeals:acqNum(p.open_deals)||open.length,
      pipeAmt:acqNum(p.open_pipeline)||sumBy(open,d=>d.amount),
      topDeals:openDealObjs,
      stuck:ownerStuck,
      cold:ownerCold,
      needsAttention:noNext.length?noNext:ownerStuck.slice(0,12),
      rankA,rankAContacted,rankANotContacted,
      rankB,rankBContacted,rankBNotContacted,
      rankAByCountry:byCountry.A,
      rankBByCountry:byCountry.B,
      rankAUntouched,
      rankBUntouched,
      rankRows:ownerRankRows.map(r=>acqRankCompanyRow(r,{name,color}))
    };
  });

  const ownerMetaByName=Object.fromEntries(repData.map(r=>[r.name,r]));
  const openDeals=dealRows.filter(d=>String(d.deal_status||'').toLowerCase()==='open');
  const wonMTD=dealRows.filter(d=>String(d.deal_status||'').toLowerCase()==='won'&&acqThisMonth(d.closedate));
  const lostMTD=dealRows.filter(d=>String(d.deal_status||'').toLowerCase()==='lost'&&acqThisMonth(d.closedate));
  const wonYTD=dealRows.filter(d=>String(d.deal_status||'').toLowerCase()==='won'&&acqThisYear(d.closedate));
  const lostYTD=dealRows.filter(d=>String(d.deal_status||'').toLowerCase()==='lost'&&acqThisYear(d.closedate));
  const closedWon=wonMTD.map(d=>acqDealRow(d,ownerMetaByName[d.owner_name])).sort((a,b)=>b.amount-a.amount);
  const closedLost=lostMTD.map(d=>acqDealRow(d,ownerMetaByName[d.owner_name])).sort((a,b)=>b.amount-a.amount);
  const lostByReason={};
  closedLost.forEach(d=>{const r=d.reason||'Other'; if(!lostByReason[r]) lostByReason[r]={count:0,amount:0}; lostByReason[r].count++; lostByReason[r].amount+=d.amount||0;});

  const totalCallsY=repData.reduce((s,r)=>s+acqNum(r.calls.yest),0), totalConnY=repData.reduce((s,r)=>s+acqNum(r.calls.yestConn),0);
  const totalCallsM=repData.reduce((s,r)=>s+acqNum(r.calls.mtd),0), totalConnM=repData.reduce((s,r)=>s+acqNum(r.calls.mtdConn),0);
  const totalCallsT=repData.reduce((s,r)=>s+acqNum(r.calls.ytd),0), totalConnT=repData.reduce((s,r)=>s+acqNum(r.calls.ytdConn),0);
  const totalMeetY=repData.reduce((s,r)=>s+acqNum(r.meetings.yest),0), totalMeetM=repData.reduce((s,r)=>s+acqNum(r.meetings.mtd),0), totalMeetT=repData.reduce((s,r)=>s+acqNum(r.meetings.ytd),0);
  const totalLeadsY=repData.reduce((s,r)=>s+acqNum(r.leadsYest),0), totalLeadsM=repData.reduce((s,r)=>s+acqNum(r.leadsMTD),0), totalLeadsT=repData.reduce((s,r)=>s+acqNum(r.leadsYTD),0);
  const pipeline=sumBy(openDeals,d=>d.amount);
  const team={
    callsMTD:totalCallsM,callsMTDConn:totalConnM,meetingsMTD:totalMeetM,meetingsYTD:totalMeetT,
    openDeals:openDeals.length,pipeline,won:closedWon.length,wonAmt:sumBy(closedWon,d=>d.amount),lost:closedLost.length,lostAmt:sumBy(closedLost,d=>d.amount)
  };
  const kpi={
    yesterday:{calls:totalCallsY,connected:totalConnY,connRate:totalCallsY?Math.round(totalConnY/totalCallsY*100):0,meetings:totalMeetY,leads:totalLeadsY,openDeals:countBy(dealRows,d=>acqThisMonth(d.hs_createdate)),pipeline,openDealsSnap:openDeals.length,wonAmt:sumBy(wonMTD,d=>d.amount),wonDeals:wonMTD.length,lost:lostMTD.length,lostAmt:sumBy(lostMTD,d=>d.amount)},
    mtd:{calls:totalCallsM,connected:totalConnM,connRate:totalCallsM?Math.round(totalConnM/totalCallsM*100):0,meetings:totalMeetM,leads:totalLeadsM,openDeals:countBy(dealRows,d=>acqThisMonth(d.hs_createdate)),pipeline,openDealsSnap:openDeals.length,wonAmt:sumBy(wonMTD,d=>d.amount),wonDeals:wonMTD.length,lost:lostMTD.length,lostAmt:sumBy(lostMTD,d=>d.amount)},
    ytd:{calls:totalCallsT,connected:totalConnT,connRate:totalCallsT?Math.round(totalConnT/totalCallsT*100):0,meetings:totalMeetT,leads:totalLeadsT,openDeals:countBy(dealRows,d=>acqThisYear(d.hs_createdate)),pipeline,openDealsSnap:openDeals.length,wonAmt:sumBy(wonYTD,d=>d.amount),wonDeals:wonYTD.length,lost:lostYTD.length,lostAmt:sumBy(lostYTD,d=>d.amount)}
  };

  const stageMap={};
  (SUPA.stage&&SUPA.stage.length?SUPA.stage:openDeals).forEach(r=>{
    const stage=r.dealstage||r.stage||r.stage_label||'Open';
    if(!stageMap[stage])stageMap[stage]={stage,count:0,amount:0};
    stageMap[stage].count+=acqNum(r.count)||1;
    stageMap[stage].amount+=acqNum(r.amount||r.open_pipeline||r.pipeline);
  });
  const stageData=Object.values(stageMap).sort((a,b)=>b.amount-a.amount);

  const rankTotals={A:0,B:0,AContacted:0,BContacted:0,ANotContacted:0,BNotContacted:0,total:0};
  (rankTouch||[]).forEach(r=>{
    const g=acqCleanRank(r.rank_group||r.rank);
    if(g==='A'){
      rankTotals.A+=acqNum(r.companies);rankTotals.AContacted+=acqNum(r.touched_companies);rankTotals.ANotContacted+=acqNum(r.no_touch_companies);
    }else if(g==='B'){
      rankTotals.B+=acqNum(r.companies);rankTotals.BContacted+=acqNum(r.touched_companies);rankTotals.BNotContacted+=acqNum(r.no_touch_companies);
    }
  });
  rankTotals.total=rankTotals.A+rankTotals.B;

  const companyRows=(rankRows||[]).map(r=>acqRankCompanyRow(r,ownerMetaByName[r.owner_name]));
  const companyContacted=companyRows.filter(c=>acqNum(c.connectedCalls)>0||acqNum(c.completedMeetings)>0);
  const companyNotContacted=companyRows.filter(c=>!(acqNum(c.connectedCalls)>0||acqNum(c.completedMeetings)>0));
  const syntheticMeetingContacts=[];
  companyContacted.filter(c=>acqNum(c.completedMeetings)>0).forEach(c=>{
    syntheticMeetingContacts.push({
      id:`meeting-touch-${c.id}`,
      name:`Completed meeting touch - ${c.name}`,
      email:'',
      ownerId:c.ownerId,
      ownerName:c.ownerName,
      source:'HubSpot Meeting',
      sourceBucket:'Offline / Outbound',
      companyIds:[c.id],
      hasCompletedMeeting:true,
      createdAt:c.lastActivityDate,
      lastActivityDate:c.lastActivityDate,
      hubspotUrl:c.hubspotUrl
    });
  });
  const leadNotContacted=needRows.map(r=>{
    const cid=String(r.hubspot_contact_id||r.contact_id||r.id||'');
    return {
      id:cid,
      contactId:cid,
      name:r.contact_name||r.email||r.company_name||cid||'Lead',
      email:r.email||'',phone:r.phone||'',
      ownerId:String(r.hubspot_owner_id||''),ownerName:r.owner_name||'',
      source:r.source||r.analytics_source||'Unknown',
      sourceBucket:r.source_type||'Offline / Outbound',
      leadStatus:r.lead_status||'',
      lifecycleStage:r.lifecycle_stage||'',
      createdAt:r.created_at||r.createdate||'',
      ageDays:acqNum(r.days_since_created),
      connectedCalls:acqNum(r.connected_calls),
      completedMeetings:acqNum(r.completed_meetings),
      companyIds:r.hubspot_company_id?[String(r.hubspot_company_id)]:[],
      companyName:r.company_name||'',
      hubspotUrl:acqContactUrl(r)
    };
  });
  const totalEligibleLeads=Math.max(totalLeadsT,leadNotContacted.length);
  const contactedLeads=Math.max(0,totalEligibleLeads-leadNotContacted.length);
  const sourceSplit={
    online:{total:leadNotContacted.filter(x=>/online|inbound/i.test(x.sourceBucket)).length,contacted:0,notContacted:leadNotContacted.filter(x=>/online|inbound/i.test(x.sourceBucket)).length},
    offline:{total:leadNotContacted.filter(x=>!/online|inbound/i.test(x.sourceBucket)).length,contacted:0,notContacted:leadNotContacted.filter(x=>!/online|inbound/i.test(x.sourceBucket)).length}
  };
  const outreachCoverage={
    contacts:{
      total:totalEligibleLeads,contacted:contactedLeads,notContacted:leadNotContacted.length,
      contactedRate:totalEligibleLeads?Math.round(contactedLeads/totalEligibleLeads*100):0,
      contactedList:syntheticMeetingContacts,
      notContactedList:leadNotContacted,
      noConnectedCallsList:leadNotContacted
    },
    companies:{
      total:companyRows.length,contacted:companyContacted.length,notContacted:companyNotContacted.length,
      contactedRate:companyRows.length?Math.round(companyContacted.length/companyRows.length*100):0,
      contactedList:companyContacted,
      notContactedList:companyNotContacted
    },
    activities:{totalCalls:totalCallsT,callsLinkedToContacts:totalConnT,totalMeetings:totalMeetT,meetingsLinkedToContacts:totalMeetT},
    sourceSplit
  };
  const topInactiveRankAccounts=(rankNoTouch||[]).map(r=>{
    const row=acqRankCompanyRow(r,ownerMetaByName[r.owner_name]);
    return {rank:row.rank,name:row.name,rep:row.ownerName,repColor:row.ownerColor,daysSinceActivity:row.daysSinceActivity,hubspotUrl:row.hubspotUrl};
  }).sort((a,b)=>b.daysSinceActivity-a.daysSinceActivity).slice(0,20);
  const autoRecs=[
    {type:'red',title:'Leads need contact',text:`${leadNotContacted.length.toLocaleString()} contacts still have zero connected calls / completed meetings.`},
    {type:'amber',title:'Rank A/B untouched',text:`${(rankTotals.ANotContacted+rankTotals.BNotContacted).toLocaleString()} Rank A/B companies still need owner-scoped touch.`},
    {type:'blue',title:'Pipeline hygiene',text:`${stuckRows.length.toLocaleString()} stuck deals need next action review.`}
  ];
  const financialDetails={
    cashing:wonYTD.map(d=>({...acqDealRow(d,ownerMetaByName[d.owner_name]),cashingDate:acqIsoDate(d.hs_v2_date_entered_current_stage),daysFromSigned:0,status:'Cashing'})),
    signed:openDeals.filter(d=>/contract|sent|signed|booking/i.test(String(d.dealstage||''))).map(d=>({...acqDealRow(d,ownerMetaByName[d.owner_name]),signedDate:acqIsoDate(d.hs_v2_date_entered_current_stage),daysFromSigned:acqDaysSince(d.hs_v2_date_entered_current_stage),riskLabel:acqDaysSince(d.hs_v2_date_entered_current_stage)>7?'Delayed Cashing':'On Track'}))
  };
  return {
    meta:{generatedAt,yesterdayLabel,portalId:HS_PORTAL_ID,source:'Supabase'},
    kpi,team,repData,stageData,
    topInactiveRankAccounts,rankTotals,outreachCoverage,
    autoRecs,closedWon,closedLost,lostByReason,
    marketNews:[],aiInsights:{summary:'Live Supabase data loaded successfully.',patterns:[],quick_wins:[],risks:[]},
    financialDetails
  };
}
function emptyAcquisitionState(){
  return {meta:{yesterdayLabel:'No data',generatedAt:'--',portalId:HS_PORTAL_ID,source:'Supabase'},kpi:{yesterday:{},mtd:{},ytd:{}},team:{},repData:[],stageData:[],topInactiveRankAccounts:[],rankTotals:{},outreachCoverage:{},autoRecs:[],closedWon:[],closedLost:[],lostByReason:{},marketNews:[]};
}


/* ACQUISITION SUPABASE REFLECTION REPAIR — fills old dashboard sections safely */
function acqDeepValue(obj,path,def){
  try{return path.split('.').reduce((o,k)=>o&&o[k],obj) ?? def;}catch(e){return def;}
}
function acqHasRows(v){return Array.isArray(v)&&v.length>0;}
function acqHasNumber(v){return Number(v||0)>0;}
function acqCloneJSON(v){try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
function acqFindLegacyRep(legacy,name){
  const reps=legacy&&Array.isArray(legacy.repData)?legacy.repData:[];
  return reps.find(r=>acqNormText(r.name||r.ownerName)===acqNormText(name))||null;
}
function acqRepairRankFromSupabaseViews(d,SUPA){
  if(!d)return d;
  const rankRows=(SUPA&&SUPA.rank)||[];
  const noTouchRows=(SUPA&&SUPA.rankNoTouch)||[];
  const byOwnerRank={};
  const totals={A:{total:0,no:0},B:{total:0,no:0}};
  const ensure=(owner,rank)=>{
    const k=acqNormText(owner||'Unknown')+'||'+rank;
    if(!byOwnerRank[k])byOwnerRank[k]={owner,rank,total:0,no:0,rows:[]};
    return byOwnerRank[k];
  };
  rankRows.forEach(r=>{
    const rank=acqCleanRank(r.rank_group||r.rank);
    if(rank!=='A'&&rank!=='B')return;
    ensure(r.owner_name,rank).total++;
    totals[rank].total++;
  });
  noTouchRows.forEach(r=>{
    const rank=acqCleanRank(r.rank_group||r.rank);
    if(rank!=='A'&&rank!=='B')return;
    const x=ensure(r.owner_name,rank);
    x.no++;
    x.rows.push(r);
    totals[rank].no++;
  });
  (d.repData||[]).forEach(rep=>{
    const a=byOwnerRank[acqNormText(rep.name)+'||A'];
    const b=byOwnerRank[acqNormText(rep.name)+'||B'];
    if(a){
      if(!acqHasNumber(rep.rankA))rep.rankA=a.total||rep.rankA||0;
      if(!acqHasNumber(rep.rankANotContacted))rep.rankANotContacted=a.no||rep.rankANotContacted||0;
      if(!acqHasRows(rep.rankAUntouched)&&a.rows.length)rep.rankAUntouched=a.rows.map(r=>acqRankCompanyRow(r,rep));
      if(!acqHasNumber(rep.rankAContacted))rep.rankAContacted=Math.max(0,(rep.rankA||0)-(rep.rankANotContacted||0));
    }
    if(b){
      if(!acqHasNumber(rep.rankB))rep.rankB=b.total||rep.rankB||0;
      if(!acqHasNumber(rep.rankBNotContacted))rep.rankBNotContacted=b.no||rep.rankBNotContacted||0;
      if(!acqHasRows(rep.rankBUntouched)&&b.rows.length)rep.rankBUntouched=b.rows.map(r=>acqRankCompanyRow(r,rep));
      if(!acqHasNumber(rep.rankBContacted))rep.rankBContacted=Math.max(0,(rep.rankB||0)-(rep.rankBNotContacted||0));
    }
  });
  const rt=d.rankTotals||{};
  if(!acqHasNumber(rt.total)&&((totals.A.total+totals.B.total)>0||(totals.A.no+totals.B.no)>0)){
    rt.A=totals.A.total||0;
    rt.B=totals.B.total||0;
    rt.ANotContacted=totals.A.no||0;
    rt.BNotContacted=totals.B.no||0;
    rt.AContacted=Math.max(0,rt.A-rt.ANotContacted);
    rt.BContacted=Math.max(0,rt.B-rt.BNotContacted);
    rt.total=rt.A+rt.B;
    d.rankTotals=rt;
  }
  if(!acqHasRows(d.topInactiveRankAccounts)&&noTouchRows.length){
    d.topInactiveRankAccounts=noTouchRows.map(r=>{
      const row=acqRankCompanyRow(r,{});
      return {rank:row.rank,name:row.name,rep:row.ownerName,repColor:row.ownerColor,daysSinceActivity:row.daysSinceActivity,hubspotUrl:row.hubspotUrl};
    }).sort((a,b)=>(b.daysSinceActivity||0)-(a.daysSinceActivity||0)).slice(0,20);
  }
  return d;
}
function acqRepairTeamLeadSplits(d){
  if(!d||!Array.isArray(d.repData))return d;
  const team=d.team=d.team||{};
  team.leadsYest=d.repData.reduce((s,r)=>s+acqNum(r.leadsYest),0);
  team.leadsYestInbound=d.repData.reduce((s,r)=>s+acqNum(r.leadsYestInbound),0);
  team.leadsYestOutbound=d.repData.reduce((s,r)=>s+acqNum(r.leadsYestOutbound),0);
  team.leadsMTD=d.repData.reduce((s,r)=>s+acqNum(r.leadsMTD),0);
  team.leadsMTDInbound=d.repData.reduce((s,r)=>s+acqNum(r.leadsMTDInbound),0);
  team.leadsMTDOutbound=d.repData.reduce((s,r)=>s+acqNum(r.leadsMTDOutbound),0);
  team.leadsYTD=d.repData.reduce((s,r)=>s+acqNum(r.leadsYTD),0);
  team.leadsYTDInbound=d.repData.reduce((s,r)=>s+acqNum(r.leadsYTDInbound),0);
  team.leadsYTDOutbound=d.repData.reduce((s,r)=>s+acqNum(r.leadsYTDOutbound),0);
  return d;
}
function acqMergeLegacyDisabled(d,legacy){
  if(!d||!legacy)return d;
  const mark=[];
  const copyIfEmpty=(key,checker)=>{
    if(checker(d[key])&&legacy[key]!==undefined){d[key]=acqCloneJSON(legacy[key]);mark.push(key);}
  };
  copyIfEmpty('marketNews',v=>!acqHasRows(v));
  if((!d.aiInsights||(!d.aiInsights.summary&&!acqHasRows(d.aiInsights.patterns)))&&legacy.aiInsights){d.aiInsights=acqCloneJSON(legacy.aiInsights);mark.push('aiInsights');}
  if((!d.outreachCoverage||!acqHasNumber(acqDeepValue(d,'outreachCoverage.contacts.total',0)))&&legacy.outreachCoverage){d.outreachCoverage=acqCloneJSON(legacy.outreachCoverage);mark.push('outreachCoverage');}
  const supaRankTotal=acqDeepValue(d,'rankTotals.total',0);
  const legacyRankTotal=acqDeepValue(legacy,'rankTotals.total',0);
  if(!acqHasNumber(supaRankTotal)&&acqHasNumber(legacyRankTotal)){
    d.rankTotals=acqCloneJSON(legacy.rankTotals||{});
    if(acqHasRows(legacy.topInactiveRankAccounts))d.topInactiveRankAccounts=acqCloneJSON(legacy.topInactiveRankAccounts);
    mark.push('rankTotals');
  }
  if(!acqHasRows(d.stageData)&&acqHasRows(legacy.stageData)){d.stageData=acqCloneJSON(legacy.stageData);mark.push('stageData');}
  if(!acqHasRows(d.closedWon)&&acqHasRows(legacy.closedWon)){d.closedWon=acqCloneJSON(legacy.closedWon);mark.push('closedWon');}
  if(!acqHasRows(d.closedLost)&&acqHasRows(legacy.closedLost)){d.closedLost=acqCloneJSON(legacy.closedLost);d.lostByReason=acqCloneJSON(legacy.lostByReason||d.lostByReason||{});mark.push('closedLost');}
  if(Array.isArray(d.repData)&&Array.isArray(legacy.repData)){
    d.repData.forEach(rep=>{
      const old=acqFindLegacyRep(legacy,rep.name);
      if(!old)return;
      ['topDeals','stuck','cold','needsAttention','rankAUntouched','rankBUntouched'].forEach(k=>{
        if(!acqHasRows(rep[k])&&acqHasRows(old[k]))rep[k]=acqCloneJSON(old[k]);
      });
      if(!(acqNum(rep.rankA)+acqNum(rep.rankB))&&(acqNum(old.rankA)+acqNum(old.rankB))){
        ['rankA','rankAContacted','rankANotContacted','rankB','rankBContacted','rankBNotContacted','rankAByCountry','rankBByCountry','rankRows'].forEach(k=>{if(old[k]!==undefined)rep[k]=acqCloneJSON(old[k]);});
      }
      if(!(acqNum(rep.leadsYTD)||acqNum(rep.leadsMTD))&&(acqNum(old.leadsYTD)||acqNum(old.leadsMTD))){
        ['leadsYest','leadsYestInbound','leadsYestOutbound','leadsMTD','leadsMTDInbound','leadsMTDOutbound','leadsYTD','leadsYTDInbound','leadsYTDOutbound'].forEach(k=>{if(old[k]!==undefined)rep[k]=old[k];});
      }
    });
  }
  d.meta=d.meta||{};
  if(mark.length)d.meta.legacyMerged=mark.join(', ');
  acqRepairTeamLeadSplits(d);
  return d;
}
function acqEnhanceSupabaseData(d,SUPA){
  d=acqRepairRankFromSupabaseViews(d,SUPA||{});
  d=acqRepairTeamLeadSplits(d);
  return d;
}
async function loadData(options={}){
  if(window.loadData && window.loadData !== loadData){
    return window.loadData(options || {});
  }
  throw new Error('Supabase-only loader is not initialized yet.');
}

function render(){
  $("loadingState").style.display="none";
  $("dashMain").style.display="block";

  // Do not pre-render Retention while Acquisition is active.
  // Retention financial patches can fail independently and should never break Acquisition rendering/sidebar.
  if(APP_MAIN_PANEL === "retention"){
    try{
      renderRetention();
      if(APP_RETENTION_VIEW === "financial") renderRetentionFinancialDetails();
    }catch(e){
      console.error("Retention pre-render failed", e);
    }
  }

  const meta=D.meta||{},repData=D.repData||[],team=D.team||{},stageData=D.stageData||[];
  const kY=D.kpi?.yesterday||{},kM=D.kpi?.mtd||{},kT=D.kpi?.ytd||{};
  const won=D.closedWon||[],lost=D.closedLost||[];
  const activeReps=repData.filter(r=>r.type!=="view");

  renderCommandPreview();
renderFinancialDetails();
renderManagerAddons();

  $("topbarSub").textContent=`Updated ${meta.generatedAt||""} · Manual refresh`;
  $("perfDate").textContent=meta.yesterdayLabel||"";

  $("kpiSection").innerHTML=`
    <div class="period-label">&#128197; Yesterday &mdash; ${meta.yesterdayLabel||""}</div>
    <div class="summary-grid" style="margin-bottom:14px">
      ${sc(kY.calls||0,"Calls",null,"var(--blue)",0)}
      ${sc(kY.connected||0,"Connected",`${kY.connRate||0}% rate`,"var(--green)",1)}
      ${sc(kY.meetings||0,"Meetings",null,"var(--purple)",2)}
      ${sc(kY.leads||0,"New Leads",null,"#0E7490",3)}
      ${sc(kY.openDeals||0,"New Deals",null,"var(--amber)",4)}
      ${sc(fmt(kY.pipeline||0),"Pipeline",`${kY.openDealsSnap||0} open`,"var(--cyan)",5)}
      ${sc(fmt(kY.wonAmt||0),"Won",`${kY.wonDeals||0} deals`,"var(--green)",6)}
      ${sc(kY.lost||0,"Lost",kY.lostAmt?fmt(kY.lostAmt):null,"var(--red)",7)}
    </div>
    <div class="period-label">&#128202; Month to Date</div>
    <div class="summary-grid" style="margin-bottom:14px">
      ${sc(kM.calls||0,"Calls MTD",null,"var(--blue)",0)}
      ${sc(kM.connected||0,"Connected",`${kM.connRate||0}% rate`,"var(--green)",1)}
      ${sc(kM.meetings||0,"Meetings MTD",null,"var(--purple)",2)}
      ${sc(kM.leads||0,"Leads MTD",null,"#0E7490",3)}
      ${sc(kM.openDeals||0,"New Deals MTD",null,"var(--amber)",4)}
      ${sc(fmt(kM.pipeline||0),"Pipeline",`${kM.openDealsSnap||0} open`,"var(--cyan)",5)}
      ${sc(fmt(kM.wonAmt||0),"Won MTD",`${kM.wonDeals||0} deals`,"var(--green)",6)}
      ${sc(kM.lost||0,"Lost MTD",kM.lostAmt?fmt(kM.lostAmt):null,"var(--red)",7)}
    </div>
    <div class="period-label">&#128200; Year to Date</div>
    <div class="summary-grid" style="margin-bottom:18px">
      ${sc(kT.calls||0,"Calls YTD",null,"var(--blue)",0)}
      ${sc(kT.connected||0,"Connected",`${kT.connRate||0}% rate`,"var(--green)",1)}
      ${sc(kT.meetings||team.meetingsYTD||0,"Meetings YTD",null,"var(--purple)",2)}
      ${sc(kT.leads||0,"Leads YTD",null,"#0E7490",3)}
      ${sc(kT.openDeals||0,"New Deals YTD",null,"var(--amber)",4)}
      ${sc(fmt(kT.pipeline||0),"Pipeline",`${kT.openDealsSnap||0} open`,"var(--cyan)",5)}
      ${sc(fmt(kT.wonAmt||0),"Won YTD",`${kT.wonDeals||0} deals`,"var(--green)",6)}
      ${sc(kT.lost||0,"Lost YTD",kT.lostAmt?fmt(kT.lostAmt):null,"var(--red)",7)}
    </div>`;

  $("perfBody").innerHTML=activeReps.map(r=>{
    const calls=r.calls?.yest||0,conn=r.calls?.yestConn||0,rate=r.connRateYest||0,mtgs=r.meetings?.yest||0;
    const rc=rcColor(rate),c=r.color,isRet=r.type==="ret";
    const hb=rate>=50?`<span class="badge bg">&#10003; Healthy</span>`:rate>=30?`<span class="badge ba">&#9679; Watch</span>`:`<span class="badge br">&#9679; At Risk</span>`;
    return`<tr><td><div style="display:flex;align-items:center;gap:10px"><div class="av" style="background:${c}20;color:${c};border:1px solid ${c}40">${r.name[0]}</div><span style="font-weight:600;font-size:12px">${r.name}${isRet?`<span class="ret" style="margin-left:5px">RET</span>`:""}</span></div></td>
    <td class="c"><span style="font-family:var(--mono);font-size:14px;font-weight:500;color:${calls<5?"var(--red)":"var(--text)"}">${calls}</span></td>
    <td class="c"><span style="font-family:var(--mono);font-size:14px;font-weight:500;color:var(--green)">${conn}</span></td>
    <td class="c"><span style="font-family:var(--mono);font-size:14px;font-weight:500;color:var(--red)">${calls-conn}</span></td>
    <td class="c"><div style="font-size:13px;font-weight:700;color:${rc}">${rate}%</div><div class="rate-bar"><div class="rate-fill" style="width:${rate}%;background:${rc}"></div></div></td>
    <td class="c"><span style="font-family:var(--mono);font-size:14px;font-weight:500;color:var(--purple)">${mtgs}</span></td>
    <td class="c"><span style="font-family:var(--mono);font-size:14px;font-weight:500;color:var(--amber)">${r.openDeals||0}</span></td>
    <td class="c"><span style="font-size:12px;font-weight:600">${fmt(r.pipeAmt||0)}</span></td>
    <td class="c">${hb}</td></tr>`;
  }).join("");

  const recs=D.autoRecs||[];
  $("recBadge").textContent=`${recs.filter(r=>r.type==="red").length} urgent`;
  $("recContainer").innerHTML=recs.slice(0,8).map(r=>{
    const icon=r.type==="red"?"&#128308;":r.type==="warn"?"&#9888;&#65039;":"&#9989;";
    const cls=r.type==="red"?"br":r.type==="warn"?"ba":"bg";
    const lbl=r.type==="red"?"Action Required":r.type==="warn"?"Needs Attention":"Positive";
    const bg=r.type==="red"?"rgba(220,38,38,0.03)":r.type==="green"?"rgba(22,163,74,0.03)":"rgba(217,119,6,0.03)";
    return`<div class="news-item" style="background:${bg}"><span style="font-size:14px;flex-shrink:0">${icon}</span><span class="news-text">${r.text}</span><span class="badge ${cls}" style="flex-shrink:0">${lbl}</span></div>`;
  }).join("");

  if(stageData.length>0){
    const mx=Math.max(...stageData.map(s=>s.count||0),1);
    const tot=stageData.reduce((s,x)=>s+(x.count||0),0),totA=stageData.reduce((s,x)=>s+(x.amount||0),0);
    $("pipeTotal").textContent=`${tot} deals · ${fmt(totA)}`;
    $("pipeHorizContainer").innerHTML=`<div class="pipe-stages">${stageData.map((s,i)=>`<div class="pipe-stage" style="flex:${Math.max(4,Math.round((s.count||0)/mx*100))};background:${SC[i%SC.length]}"><div class="ps-name">${s.label}</div><div class="ps-count">${s.count||0}</div><div class="ps-amt">${fmt(s.amount||0)}</div></div>`).join("")}</div><div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);font-weight:600;margin-top:6px"><span>${tot} total deals</span><span>${fmt(totA)}</span></div>`;
  }

  let tp=0;
  $("pipeCards").innerHTML=activeReps.map(r=>{
    const c=r.color,isRet=r.type==="ret",deals=r.topDeals||[];
    const cold=(r.cold||[]).length,stuck=(r.stuck||[]).length,pa=r.pipeAmt||0;
    tp+=pa;
    const s3=deals.slice(0,3),rest=deals.slice(3),cid="pipe-"+r.name.replace(/\s/g,"-");
    return`<div class="pcard" style="border-top:3px solid ${c}"><div class="pcard-top"><div style="display:flex;align-items:center;gap:6px"><div class="av" style="width:22px;height:22px;border-radius:6px;background:${c}20;color:${c};font-size:9px">${r.name[0]}</div><span style="font-weight:700;color:${c};font-size:11px">${r.name.split(" ")[0]}${isRet?`<span class="ret" style="margin-left:3px">RET</span>`:""}</span></div><div style="text-align:right"><div style="font-family:var(--mono);font-size:11px;font-weight:600">${fmt(pa)}</div><div style="font-size:8px;color:var(--muted)">${r.openDeals||0} deals</div></div></div><div class="pcard-body">${s3.map(d=>`<div class="pdeal"><div><div class="pdeal-name">${recordLink(d.name,d.hubspotUrl)}</div><div class="pdeal-stage">${d.stage||""}</div></div><div class="pdeal-amt">$${(d.amount||0).toLocaleString()}</div></div>`).join("")}<div id="${cid}-more" style="display:none">${rest.map(d=>`<div class="pdeal"><div><div class="pdeal-name">${recordLink(d.name,d.hubspotUrl)}</div><div class="pdeal-stage">${d.stage||""}</div></div><div class="pdeal-amt">$${(d.amount||0).toLocaleString()}</div></div>`).join("")}</div>${rest.length?`<button class="see-more" onclick="toggleMore('${cid}-more',this,'\u25bc ${rest.length} more','\u25b2 Less')">\u25bc ${rest.length} more</button>`:""}<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px">${stuck?`<span class="badge br">&#128308; ${stuck} stuck</span>`:""}${cold?`<span class="badge ba">&#128993; ${cold} cold</span>`:""}${!stuck&&!cold?`<span class="badge bg">&#10003; healthy</span>`:""}</div></div></div>`;
  }).join("");
  $("pipeTotalAmt").textContent=fmt(tp);

  $("aiGrid").innerHTML=activeReps.map(r=>{
    const c=r.color,isRet=r.type==="ret",items=r.needsAttention||[];
    const show=items.slice(0,3),rest=items.slice(3),cid="coach-"+r.name.replace(/\s/g,"-");
    return`<div class="ccard" style="--cc:${c}"><div class="ccard-rep"><div class="av" style="width:20px;height:20px;border-radius:5px;background:${c}20;color:${c};font-size:9px">${r.name[0]}</div>${r.name.split(" ")[0]}${isRet?`<span class="ret" style="margin-left:2px">RET</span>`:""}<span style="margin-left:auto;font-size:9px;color:var(--muted)">${items.length}</span></div>${items.length===0?`<div style="font-size:11px;color:var(--green);font-weight:600">&#9989; All deals have next activity</div>`:`${show.map(item=>`<div class="citem"><div class="citem-name">${recordLink(item.name,item.hubspotUrl)}<span class="citem-amt">${fmt(item.amount||0)}</span></div>${(item.reasons||[]).map(rs=>`<div class="citem-warn">&#9888;&#65039; ${rs}</div>`).join("")}</div>`).join("")}<div id="${cid}-more" style="display:none">${rest.map(item=>`<div class="citem"><div class="citem-name">${recordLink(item.name,item.hubspotUrl)}<span class="citem-amt">${fmt(item.amount||0)}</span></div>${(item.reasons||[]).map(rs=>`<div class="citem-warn">&#9888;&#65039; ${rs}</div>`).join("")}</div>`).join("")}</div>${rest.length?`<button class="see-more" onclick="toggleMore('${cid}-more',this,'\u25bc ${rest.length} more','\u25b2 Less')">\u25bc ${rest.length} more</button>`:""}`}</div>`;
  }).join("");

  $("leadsBadgeRow").innerHTML=`<span class="badge bb">Yest: ${team.leadsYest||0}</span><span class="badge bg">MTD: ${team.leadsMTD||0}</span><span class="badge bp">YTD: ${team.leadsYTD||0}</span>`;
  $("leadsPeriods").innerHTML=[{p:"Yesterday",t:team.leadsYest||0,i:team.leadsYestInbound||0,o:team.leadsYestOutbound||0,c:"var(--blue)"},{p:"Month to Date",t:team.leadsMTD||0,i:team.leadsMTDInbound||0,o:team.leadsMTDOutbound||0,c:"var(--green)"},{p:"Year to Date",t:team.leadsYTD||0,i:team.leadsYTDInbound||0,o:team.leadsYTDOutbound||0,c:"var(--purple)"}].map(x=>`<div class="lperiod"><div class="lperiod-label">${x.p}</div><div class="lperiod-val" style="color:${x.c}">${x.t}</div><div class="lperiod-row"><span class="lperiod-in" style="color:var(--blue)">&darr; ${x.i} Inbound</span><span class="lperiod-out" style="color:var(--amber)">&uarr; ${x.o} Outbound</span></div></div>`).join("");
  $("leadsRepBody").innerHTML=activeReps.map(r=>`<tr><td><div style="display:flex;align-items:center;gap:8px"><div class="av" style="background:${r.color}20;color:${r.color};border:1px solid ${r.color}30">${r.name[0]}</div><span style="font-weight:600">${r.name}</span></div></td><td class="c"><div style="font-family:var(--mono);font-weight:600">${r.leadsYest||0}</div><div style="font-size:9px;color:var(--muted)">&darr;${r.leadsYestInbound||0} &uarr;${r.leadsYestOutbound||0}</div></td><td class="c"><div style="font-family:var(--mono);font-weight:600;color:var(--green)">${r.leadsMTD||0}</div><div style="font-size:9px;color:var(--muted)">&darr;${r.leadsMTDInbound||0} &uarr;${r.leadsMTDOutbound||0}</div></td><td class="c"><div style="font-family:var(--mono);font-weight:600;color:var(--purple)">${r.leadsYTD||0}</div><div style="font-size:9px;color:var(--muted)">&darr;${r.leadsYTDInbound||0} &uarr;${r.leadsYTDOutbound||0}</div></td></tr>`).join("");

  const rd=D.topInactiveRankAccounts||[],rt=D.rankTotals||{};
  /* ── Render Outreach Coverage under Leads Overview ── */
  renderOutreach();

  renderRankCountryCoverage(activeReps);

  $("rankBadgeRow").innerHTML=`<span class="rank-a">${rt.A||0} A</span><span class="rank-b">${rt.B||0} B</span><span class="badge bg">&#10003; ${rt.AContacted||0}A / ${rt.BContacted||0}B</span><span class="badge br">&#10007; ${rt.ANotContacted||0}A / ${rt.BNotContacted||0}B</span>`;
  $("rankRepBody").innerHTML=activeReps.map(r=>{
    const idle=rd.filter(c=>c.rep===r.name&&c.daysSinceActivity>21);
    const iN=idle.slice(0,2).map(c=>`<span style="font-size:10px;color:var(--red);font-weight:500">&#8226; ${recordLink(c.name,c.hubspotUrl)}</span>`).join("<br>");
    const aOk=r.rankAContacted||0,aM=r.rankANotContacted||0,bOk=r.rankBContacted||0,bM=r.rankBNotContacted||0;
    return`<tr><td><div style="display:flex;align-items:center;gap:8px"><div class="av" style="background:${r.color}20;color:${r.color}">${r.name[0]}</div><span style="font-weight:600">${r.name}</span></div></td><td class="c"><span class="rank-a">${r.rankA||0}</span></td><td class="c"><span style="font-family:var(--mono);font-weight:600;color:var(--green)">${aOk}</span></td><td class="c"><span style="font-family:var(--mono);font-weight:700;color:${aM>0?"var(--red)":"var(--green)"}">${aM>0?aM:"&#10003;"}</span></td><td class="c"><span class="rank-b">${r.rankB||0}</span></td><td class="c"><span style="font-family:var(--mono);font-weight:600;color:var(--green)">${bOk}</span></td><td class="c"><span style="font-family:var(--mono);font-weight:700;color:${bM>0?"var(--amber)":"var(--green)"}">${bM>0?bM:"&#10003;"}</span></td><td class="c"><span style="font-weight:700;color:${idle.length>0?"var(--red)":"var(--green)"}">${idle.length}</span></td><td style="font-size:10px;line-height:1.8">${iN||"<span style='color:var(--green);font-size:10px'>&#10003; All active</span>"}</td></tr>`;
  }).join("");

  const uA=activeReps.flatMap(r=>(r.rankAUntouched||[]).map(c=>({rep:r.name,repColor:r.color,name:c.name})));
  const uB=activeReps.flatMap(r=>(r.rankBUntouched||[]).map(c=>({rep:r.name,repColor:r.color,name:c.name})));
  $("untouchedABadge").textContent=`${uA.length} accounts`;
  $("untouchedBBadge").textContent=`${uB.length} accounts`;

  function bUR(arr){
    if(!arr.length)return`<tr><td colspan="2" style="text-align:center;color:var(--green);font-style:italic;padding:12px">&#10003; All accounts contacted</td></tr>`;
    return arr.map(c=>`<tr><td><span class="badge" style="background:${c.repColor}20;color:${c.repColor}">${c.rep.split(" ")[0]}</span></td><td style="font-weight:600">${recordLink(c.name,c.hubspotUrl)}</td></tr>`).join("");
  }
  const sA=uA.slice(0,5),rA=uA.slice(5),sB=uB.slice(0,5),rB=uB.slice(5);
  $("untouchedABody").innerHTML=bUR(sA);$("untouchedABodyMore").innerHTML=bUR(rA);
  if(rA.length){$("untouchedAToggle").style.display="block";$("untouchedAToggle").textContent=`\u25bc Show ${rA.length} more`;}
  $("untouchedBBody").innerHTML=bUR(sB);$("untouchedBBodyMore").innerHTML=bUR(rB);
  if(rB.length){$("untouchedBToggle").style.display="block";$("untouchedBToggle").textContent=`\u25bc Show ${rB.length} more`;}

  $("rankBody").innerHTML=rd.map(c=>{
    const dc=c.daysSinceActivity>14?"var(--red)":c.daysSinceActivity>7?"var(--amber)":"var(--green)";
    return`<tr><td>${c.rank==="A"?`<span class="rank-a">A</span>`:`<span class="rank-b">B</span>`}</td><td style="font-weight:600">${recordLink(c.name,c.hubspotUrl)}</td><td class="c"><span class="badge" style="background:${c.repColor}20;color:${c.repColor}">${c.rep}</span></td><td class="c"><span style="font-weight:700;color:${dc};font-family:var(--mono);font-size:11px">${c.daysSinceActivity>900?"Never":c.daysSinceActivity+"d ago"}</span></td></tr>`;
  }).join("");
  $("rankFooter").textContent=`Top 10 by days since last activity · ${rt.total||0} total Rank A/B accounts`;

  $("wonBadge").textContent=`${won.length} deals · ${fmt(team.wonAmt||0)}`;
  $("lostBadge").textContent=`${lost.length} deals · ${fmt(lost.reduce((s,d)=>s+(d.amount||0),0))}`;
  $("wonContainer").innerHTML=dealList(won,"var(--green)","won-deals",false);

  const lbr=D.lostByReason||{};
  const lrl=Object.entries(lbr).map(([reason,data])=>({reason,...data})).sort((a,b)=>b.amount-a.amount);
  let lH=dealList(lost,"var(--red)","lost-deals",true);
  if(lrl.length&&lost.length){
    const tA=lrl.reduce((s,r)=>s+r.amount,0),top=lrl[0],tP=tA>0?Math.round((top.amount/tA)*100):0;
    lH+=`<div class="loss-reasons-section"><div class="loss-reasons-title">&#128202; Loss Reasons Breakdown<span style="font-size:9px;font-weight:500;color:var(--muted);letter-spacing:0;text-transform:none">${lrl.length} reasons &middot; ${fmt(tA)}</span></div><div style="background:var(--red-bg);border:1px solid var(--red-bd);border-radius:var(--r-sm);padding:10px 12px;margin-bottom:12px;border-left:3px solid var(--red)"><div style="font-size:9px;font-weight:700;color:var(--red);text-transform:uppercase;letter-spacing:.08em;margin-bottom:3px">&#127919; Top Loss Driver</div><div style="font-size:12px;font-weight:700;color:var(--text)">${top.reason} &mdash; ${tP}% of lost value (${fmt(top.amount)})</div></div><div class="loss-reason-grid">${lrl.map(r=>{const p=tA>0?(r.amount/tA)*100:0;return`<div class="loss-reason-card"><div class="loss-reason-name">${r.reason}</div><div class="loss-reason-stats"><span class="loss-reason-count"><span style="width:6px;height:6px;border-radius:50%;background:var(--red);display:inline-block"></span>${r.count} ${r.count===1?"deal":"deals"}</span><span class="loss-reason-amt">${fmt(r.amount)}</span></div><div class="loss-reason-bar"><div class="loss-reason-bar-fill" style="width:${p}%"></div></div><div style="font-size:9px;color:var(--muted);margin-top:4px;font-weight:600">${p.toFixed(0)}% of total</div></div>`;}).join("")}</div></div>`;
  }
  $("lostContainer").innerHTML=lH;

  const ai=D.aiInsights||{};
  $("aiInsightsContainer").innerHTML=ai.summary?`<div style="padding:14px 18px;background:var(--purple-bg);border-bottom:1px solid var(--border)"><div style="font-size:9px;font-weight:700;color:var(--purple);text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px">Executive Summary</div><div style="font-size:12px;font-weight:600;color:var(--text)">${ai.summary}</div></div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:14px">${[["&#128202; Patterns","patterns","var(--blue)"],["&#9889; Quick Wins","quick_wins","var(--green)"],["&#9888;&#65039; Risks","risks","var(--red)"]].map(([lbl,key,c])=>`<div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--r-sm);padding:12px"><div style="font-size:9px;font-weight:700;color:${c};text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px">${lbl}</div>${(ai[key]||[]).map(p=>`<div style="padding:4px 0;border-bottom:1px solid var(--border);font-size:11px">&#8226; ${p}</div>`).join("")}</div>`).join("")}</div>`:`<div style="padding:18px;text-align:center;color:var(--muted);font-size:12px">No AI insights available</div>`;

  const news=D.marketNews||[];
  $("newsContainer").innerHTML=news.length?news.map(n=>`<div class="news-item"><span class="news-icon">${n.icon||"&#128240;"}</span><div style="flex:1"><div class="news-meta"><span class="badge" style="background:${n.color||"#ccc"}20;color:${n.color||"#999"}">${n.tag||""}</span><span style="font-size:9px;color:var(--muted);font-weight:600">${n.source||""}</span></div><div class="news-text">${n.text||""}</div></div></div>`).join(""):`<div style="padding:18px;text-align:center;color:var(--muted);font-size:12px">No news available</div>`;

  // Keep Acquisition rep pages outside the Retention panel.
  // A previous layout placed #repPanels inside #panel-retention, so rep pages were rendered but hidden by the inactive retention panel.
  const repMount = $("repPanels");
  if(repMount && $("dashMain") && repMount.parentElement?.id !== "dashMain"){
    $("dashMain").appendChild(repMount);
  }
  const tabs=$("tabsBar"),rpnl=$("repPanels"),sl=$("sideRepLinks");
  if(!tabs || !rpnl || !sl) return;
  rpnl.innerHTML="";sl.innerHTML="";
  tabs.querySelectorAll(".tab-btn[data-rep]").forEach(b=>b.remove());

  repData.forEach(r=>{
    const c=r.color,isRet=r.type==="ret",isView=r.type==="view";
    const slug=r.name.toLowerCase().replace(/\s/g,"-");
    const calls=r.calls?.yest||0,rate=r.connRateYest||0,mtgs=r.meetings?.yest||0;
    const rc=rcColor(rate),stuck=(r.stuck||[]).slice(0,5),needsAtt=r.needsAttention||[];
    const bad=!isView&&(rate<30||stuck.length>0||(r.cold||[]).length>3);
    const topDeals=r.topDeals||[];

    const btn=document.createElement("button");
    btn.className="tab-btn";btn.id="tab-"+slug;btn.dataset.rep="1";btn.onclick=()=>switchTab(slug);
    btn.innerHTML=`<span style="width:7px;height:7px;border-radius:50%;background:${c};flex-shrink:0"></span>${r.name.split(" ")[0]}${isRet?`<span class="ret" style="margin-left:2px">RET</span>`:""}${isView?`<span class="view-tag" style="margin-left:2px">VIEW</span>`:""}${bad?`<span class="tab-chip">!</span>`:""}`;
    tabs.appendChild(btn);

    const sBtn=document.createElement("button");
    sBtn.className="nav-item";sBtn.id="side-"+slug;sBtn.onclick=()=>switchTab(slug);
    sBtn.innerHTML=`<span class="nav-icon" style="color:${c}">&#9679;</span>${r.name}${isRet?`<span class="ret" style="margin-left:4px">RET</span>`:""}${isView?`<span class="view-tag" style="margin-left:4px">VIEW</span>`:""}${bad?`<span class="nav-badge">!</span>`:""}`;
    sl.appendChild(sBtn);

    const show=topDeals.slice(0,6),rest=topDeals.slice(6),did="rd-"+r.name.replace(/\s/g,"-");
    const panel=document.createElement("div");
    panel.className="panel";panel.id="panel-"+slug;

    const repWon=(D.closedWon||[]).filter(d=>d.rep===r.name);
    const repLost=(D.closedLost||[]).filter(d=>d.rep===r.name);
    const repLBR={};
    repLost.forEach(d=>{const rn=d.reason||"Not specified";if(!repLBR[rn])repLBR[rn]={count:0,amount:0};repLBR[rn].count++;repLBR[rn].amount+=(d.amount||0);});
    const repLRL=Object.entries(repLBR).map(([reason,d])=>({reason,...d})).sort((a,b)=>b.amount-a.amount);

    if(isView){
      panel.innerHTML=`
        <div class="rep-hero" style="--hc:${c}"><div class="rep-hero-line"></div>
          <div class="av av-lg" style="background:${c}20;color:${c};border:1.5px solid ${c}40">${r.name[0]}</div>
          <div><div style="font-size:20px;font-weight:800;letter-spacing:-.02em;color:var(--text)">${r.name}<span class="view-tag" style="font-size:10px;margin-left:8px">VIEW ONLY</span></div>
          <div style="font-size:11px;color:var(--muted);margin-top:4px">${meta.yesterdayLabel||""} &middot; Deals visibility only</div></div>
          <div class="rep-hero-stats">
            ${[{v:r.openDeals||0,l:"Open Deals",c:"var(--amber)"},{v:fmt(r.pipeAmt||0),l:"Pipeline",c:"var(--cyan)"},{v:r.won||0,l:"Won MTD",c:"var(--green)"},{v:r.lost||0,l:"Lost MTD",c:"var(--red)"}].map(s=>`<div style="text-align:center"><div class="hstat-v" style="color:${s.c}">${s.v}</div><div class="hstat-l">${s.l}</div></div>`).join("")}
          </div>
        </div>
        ${repWon.length?`<div class="card" style="margin-bottom:14px"><div class="card-hd" style="border-left:3px solid var(--green)"><div class="card-title" style="color:var(--green)">&#127942; Closed Won MTD</div><span class="badge bg">${repWon.length} &middot; ${fmt(repWon.reduce((s,d)=>s+(d.amount||0),0))}</span></div><div>${repWon.map(d=>dealRow(d,"var(--green)",false)).join("")}</div></div>`:""}
        ${repLost.length?`<div class="card" style="margin-bottom:14px"><div class="card-hd" style="border-left:3px solid var(--red)"><div class="card-title" style="color:var(--red)">&#10060; Closed Lost MTD</div><span class="badge br">${repLost.length} &middot; ${fmt(repLost.reduce((s,d)=>s+(d.amount||0),0))}</span></div><div>${repLost.map(d=>dealRow(d,"var(--red)",true)).join("")}</div></div>`:""}
        <div class="card"><div class="card-hd"><div class="card-title"><div class="card-title-icon" style="background:var(--blue-bg)">&#128188;</div>Open Deals</div><span class="badge bb">${r.openDeals||0} &middot; ${fmt(r.pipeAmt||0)}</span></div>
          ${openDealsTable(show,rest,did)}
        </div>`;
      rpnl.appendChild(panel);
      return;
    }

    const repUntA=r.rankAUntouched||[],repUntB=r.rankBUntouched||[];
    panel.innerHTML=`
      <div class="rep-hero" style="--hc:${c}"><div class="rep-hero-line"></div>
        <div class="av av-lg" style="background:${c}20;color:${c};border:1.5px solid ${c}40">${r.name[0]}</div>
        <div><div style="font-size:20px;font-weight:800;letter-spacing:-.02em;color:var(--text)">${r.name}${isRet?`<span class="ret" style="font-size:10px;margin-left:8px">RETENTION</span>`:""}${bad?`<span class="badge br" style="margin-left:8px;font-size:10px">&#9888; Needs Attention</span>`:`<span class="badge bg" style="margin-left:8px;font-size:10px">&#10003; On Track</span>`}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:4px">${meta.yesterdayLabel||""}</div></div>
        <div class="rep-hero-stats">
          ${[{v:calls,l:"Calls",c:calls<5?"var(--red)":"var(--blue)"},{v:rate+"%",l:"Rate",c:rc},{v:mtgs,l:"Meetings",c:"var(--purple)"},{v:fmt(r.pipeAmt||0),l:"Pipeline",c:"var(--cyan)"}].map(s=>`<div style="text-align:center"><div class="hstat-v" style="color:${s.c}">${s.v}</div><div class="hstat-l">${s.l}</div></div>`).join("")}
        </div>
      </div>
      
      ${renderRepAiCoachingCard(r, needsAtt)}
      ${repLost.length?`<div class="card" style="margin-bottom:14px"><div class="card-hd" style="border-left:3px solid var(--red)"><div class="card-title" style="color:var(--red)"><div class="card-title-icon" style="background:var(--red-bg)">&#10060;</div>Lost Deals &mdash; ${r.name.split(" ")[0]}</div><span class="badge br">${repLost.length} &middot; ${fmt(repLost.reduce((s,d)=>s+(d.amount||0),0))}</span></div><div>${repLost.slice(0,5).map(d=>dealRow(d,"var(--red)",true)).join("")}</div>${repLRL.length?`<div class="loss-reasons-section" style="border-top:1px solid var(--border)"><div class="loss-reasons-title">&#128202; Why ${r.name.split(" ")[0]} Lost These Deals</div><div class="loss-reason-grid">${repLRL.map(lr=>{const tR=repLRL.reduce((s,x)=>s+x.amount,0);const p=tR>0?(lr.amount/tR)*100:0;return`<div class="loss-reason-card"><div class="loss-reason-name">${lr.reason}</div><div class="loss-reason-stats"><span class="loss-reason-count"><span style="width:6px;height:6px;border-radius:50%;background:var(--red);display:inline-block"></span>${lr.count} ${lr.count===1?"deal":"deals"}</span><span class="loss-reason-amt">${fmt(lr.amount)}</span></div><div class="loss-reason-bar"><div class="loss-reason-bar-fill" style="width:${p}%"></div></div></div>`;}).join("")}</div></div>`:""}</div>`:""}
      <div class="g2">
        <div class="card" style="margin-bottom:0">
          <div class="card-hd"><div class="card-title"><div class="card-title-icon" style="background:var(--blue-bg)">&#128188;</div>Open Deals</div><span class="badge bb">${r.openDeals||0} &middot; ${fmt(r.pipeAmt||0)}</span></div>
          ${openDealsTable(show,rest,did)}
        </div>
       ${renderRepRankCoverageCard(r, repUntA, repUntB)}
      </div>
      ${stuck.length?`<div class="card" style="margin-top:14px"><div class="card-hd" style="border-left:3px solid var(--red)"><div class="card-title" style="color:var(--red)">&#128308; Stuck Deals (&gt;21 days)</div><span class="badge br">${stuck.length}</span></div><table class="tbl"><thead><tr><th>Deal</th><th class="c">Days Stuck</th><th class="c">Amount</th></tr></thead><tbody>${stuck.map(s=>`<tr><td style="font-weight:600">${s.name}</td><td class="c"><span style="font-weight:700;color:var(--red);font-family:var(--mono)">${s.days}d</span></td><td class="c"><span style="font-family:var(--mono)">${fmt(s.amount||0)}</span></td></tr>`).join("")}</tbody></table></div>`:""}
      <div class="card" style="margin-top:14px">
        <div class="card-hd"><div class="card-title"><div class="card-title-icon" style="background:var(--green-bg)">&#127919;</div>Leads &middot; ${r.name}</div></div>
        <div class="leads-period-grid">
          ${[{v:r.leadsYest||0,i:r.leadsYestInbound||0,o:r.leadsYestOutbound||0,l:"Yesterday",c:"var(--blue)"},{v:r.leadsMTD||0,i:r.leadsMTDInbound||0,o:r.leadsMTDOutbound||0,l:"MTD",c:"var(--green)"},{v:r.leadsYTD||0,i:r.leadsYTDInbound||0,o:r.leadsYTDOutbound||0,l:"YTD",c:"var(--purple)"}].map(s=>`<div class="lperiod"><div class="lperiod-label">${s.l}</div><div class="lperiod-val" style="color:${s.c}">${s.v}</div><div class="lperiod-row"><span class="lperiod-in" style="color:var(--blue)">&darr;${s.i} in</span><span class="lperiod-out" style="color:var(--amber)">&uarr;${s.o} out</span></div></div>`).join("")}
        </div>
      </div>`;
    rpnl.appendChild(panel);
  });
  enhanceAcquisitionInteractiveViews();
  enhanceAcquisitionRepFollowupSections();
}





/* Removed duplicate Acquisition follow-up/table injection patch. */

/* RETENTION TIER FOLLOW-UP LOGIC — scoped to Retention only */
const RET_TIER_RULES = {
  A: { csm: 7, rm: 14, label: "Tier A" },
  B: { csm: 14, rm: 30, label: "Tier B" },
  C: { csm: 30, rm: 90, label: "Tier C" }
};

function retNormTier(v){
  const s = String(v || '').trim().toUpperCase().replace(/^TIER\s+/,'');
  return ['A','B','C'].includes(s) ? s : '';
}

function retTierBadge(tier){
  const t = retNormTier(tier);
  return `<span class="ret-tier-chip ${t==='A'?'ret-tier-a':t==='B'?'ret-tier-b':t==='C'?'ret-tier-c':'ret-tier-missing'}">${t ? 'Tier ' + t : 'No tier'}</span>`;
}

function retMonthLabel(v){
  const raw = String(v || '').trim();
  const mNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  let m = null;
  const iso = raw.match(/^(\d{4})-(\d{2})/);
  if(iso) m = Number(iso[2]);
  else {
    const d = new Date(raw);
    if(!isNaN(d)) m = d.getMonth() + 1;
  }
  return m && m >= 1 && m <= 12 ? mNames[m - 1] : (raw || 'No date');
}

function retDateValue(v){
  if(!v) return null;
  const d = new Date(v);
  return isNaN(d) ? null : d;
}

function retDaysSinceDate(v){
  const d = retDateValue(v);
  if(!d) return null;
  const today = new Date();
  today.setHours(0,0,0,0);
  d.setHours(0,0,0,0);
  return Math.max(0, Math.floor((today - d) / 86400000));
}

function retLatestDate(values){
  return values.map(retDateValue).filter(Boolean).sort((a,b)=>b-a)[0] || null;
}

function retDateText(d){
  if(!d) return '—';
  return d.toISOString().slice(0,10);
}

function retCompanyKey(row){
  return String(row.companyId || row.associatedCompanyId || row.hs_company_id || row.companyName || row.accountName || row.name || '').trim().toLowerCase();
}

function retBuildRelatedDealMap(rows){
  const map = new Map();
  (rows || []).forEach(r => {
    const k = retCompanyKey(r);
    if(!k) return;
    if(!map.has(k)) map.set(k, []);
    map.get(k).push(r);
  });
  return map;
}

function retRoleActivity(account, related, role){
  const r = String(role || '').toLowerCase();
  const isRm = r === 'rm';
  const prefix = isRm ? 'rm' : 'csm';
  const rawDirectDays = Number(account?.[prefix + 'DaysSinceTouch']);
  const directDays = Number.isFinite(rawDirectDays) && rawDirectDays >= 0 && rawDirectDays < 9000 ? rawDirectDays : null;
  const candidates = [
    account?.[prefix + 'LastTouch'],
    account?.[prefix + 'LastActivity'],
    account?.[prefix + 'LastCall'],
    account?.[prefix + 'LastMeeting'],
    account?.[prefix + 'LastCallDate'],
    account?.[prefix + 'LastMeetingDate']
  ];

  (related || []).forEach(d => {
    candidates.push(
      d?.[prefix + 'LastTouch'],
      d?.[prefix + 'LastActivity'],
      d?.[prefix + 'LastCall'],
      d?.[prefix + 'LastMeeting'],
      d?.[prefix + 'LastCallDate'],
      d?.[prefix + 'LastMeetingDate']
    );
  });

  const latest = retLatestDate(candidates);
  const days = latest ? retDaysSinceDate(latest) : directDays;
  return { latest, days };
}

function retBuildTierFollowupRows(accounts, relatedRows){
  const relatedMap = retBuildRelatedDealMap(relatedRows || []);
  return (accounts || []).map(a => {
    const tier = retNormTier(a.company_tier || a.companyTier || a.tier || a.customerTier || a.accountTier);
    const rules = RET_TIER_RULES[tier] || null;
    const related = relatedMap.get(retCompanyKey(a)) || [];
    const rmAct = retRoleActivity(a, related, 'rm');
    const csmAct = retRoleActivity(a, related, 'csm');
    const rmHasOwner = !!(a.rmOwnerName || a.rmOwner || a.rmOwnerId);
    const csmHasOwner = !!(a.csmOwnerName || a.csmOwner || a.csmOwnerId);
    const rmThreshold = rules?.rm || null;
    const csmThreshold = rules?.csm || null;
    const rmOverdue = !!(rules && rmHasOwner && (rmAct.days === null || rmAct.days > rmThreshold));
    const csmOverdue = !!(rules && csmHasOwner && (csmAct.days === null || csmAct.days > csmThreshold));
    let alert = 'Healthy';
    if(!tier) alert = 'Missing tier';
    else if(rmOverdue && csmOverdue) alert = 'RM + CSM follow-up due';
    else if(rmOverdue) alert = 'RM follow-up due';
    else if(csmOverdue) alert = 'CSM follow-up due';
    return {
      account: a,
      tier,
      rmDays: rmAct.days,
      csmDays: csmAct.days,
      rmLatest: rmAct.latest,
      csmLatest: csmAct.latest,
      rmThreshold,
      csmThreshold,
      rmOverdue,
      csmOverdue,
      alert
    };
  });
}


function retHumanLastActivity(latest, days){
  if(latest) return retDateText(latest) + ' · ' + (days ?? 0) + 'd';
  if(days === null || days === undefined || Number(days) >= 9000) return 'No activity';
  return String(days) + 'd';
}
function retOpenUrl(row){ return row && (row.companyUrl || row.hubspotUrl || row.dealUrl || row.renewedDealUrl || row.renewalSourceDealUrl) || null; }
function retRowName(row){ return row && (row.companyName || row.accountName || row.dealName || row.name || row.title || row.reason) || 'Record'; }
function retMetricMeta(row){
  const pieces = [];
  const tier = retNormTier(row && (row.company_tier || row.companyTier || row.tier || row.accountTier));
  if(tier) pieces.push('Tier ' + tier);
  if(row && (row.contractRenewalDate || row.renewalDate)) pieces.push('Renewal ' + (row.contractRenewalDate || row.renewalDate));
  if(row && row.date) pieces.push(row.date);
  if(row && row.createdAt) pieces.push('Created ' + row.createdAt);
  if(row && row.actionDate) pieces.push('Action ' + row.actionDate);
  if(row && row.message) pieces.push(row.message);
  return pieces.filter(Boolean).join(' · ');
}
function retOwnerText(row){ if(!row) return '—'; return [row.rmOwnerName || row.rmOwner, row.csmOwnerName || row.csmOwner, row.ownerName].filter(Boolean).join(' / ') || '—'; }
function retMetricValue(row){
  if(!row) return '—';
  const v = row.renewalValue ?? row.amount ?? row.value ?? row.revenue;
  if(v !== undefined && v !== null && v !== '') return fmt(v);
  if(row.daysOverdue) return row.daysOverdue + 'd overdue';
  if(row.daysLeft !== undefined && row.daysLeft !== null) return row.daysLeft + 'd left';
  return row.status || row.alert || row.stageType || row.outcome || '—';
}
function retInPeriod(dateLike, period){
  if(!dateLike) return false;
  const d = new Date(dateLike); if(isNaN(d)) return false;
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startYesterday = new Date(startToday.getTime() - 86400000);
  const endYesterday = new Date(startToday.getTime() - 1);
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startYear = new Date(now.getFullYear(), 0, 1);
  if(period === 'yest' || period === 'yesterday') return d >= startYesterday && d <= endYesterday;
  if(period === 'mtd') return d >= startMonth && d <= now;
  if(period === 'ytd') return d >= startYear && d <= now;
  return true;
}
function retMetricRows(kind, opts={}){
  const store = window.__retentionMetricStore || {};
  if(kind === 'focus-delayed') return store.delayedRenewals || [];
  if(kind === 'focus-tier-a') return (store.tierRows || []).filter(r => r.tier === 'A' && (r.rmOverdue || r.csmOverdue)).map(r => Object.assign({}, r.account||{}, {tier:r.tier, alert:r.alert, daysOverdue: Math.max(r.rmDays||0,r.csmDays||0)}));
  if(kind === 'focus-csm') return (store.tierRows || []).filter(r => r.csmOverdue).map(r => Object.assign({}, r.account||{}, {tier:r.tier, alert:r.alert, csmDays:r.csmDays, daysOverdue:r.csmDays}));
  if(kind === 'focus-rm') return (store.tierRows || []).filter(r => r.rmOverdue).map(r => Object.assign({}, r.account||{}, {tier:r.tier, alert:r.alert, rmDays:r.rmDays, daysOverdue:r.rmDays}));
  if(kind === 'monthly'){
    const row = (store.monthRows || [])[Number(opts.monthIndex || 0)] || null;
    const rows = row && row.rows || [];
    const bucket = String(opts.bucket || 'due').toLowerCase();
    if(bucket === 'due') return rows;
    if(bucket === 'renewed') return rows.filter(r => String(r.status||'').toLowerCase()==='renewed');
    if(bucket === 'booked') return rows.filter(r => String(r.status||'').toLowerCase()==='renewed' && (r.renewalType === 'Booked' || (r.bookedDateEntered && !r.cashedDateEntered)));
    if(bucket === 'cashed') return rows.filter(r => String(r.status||'').toLowerCase()==='renewed' && (r.renewalType === 'Cashed' || r.cashedDateEntered));
    if(bucket === 'delayed') return rows.filter(r => String(r.status||'').toLowerCase()==='delayed');
    return rows;
  }
  if(kind === 'period'){
    const p = String(opts.period || 'ytd').toLowerCase();
    const metric = String(opts.metric || '').toLowerCase();
    let rows = [];
    if(metric === 'calls') rows = store.calls || [];
    if(metric === 'meetings') rows = store.meetings || [];
    if(metric === 'renewed') rows = store.renewedDeals || [];
    if(metric === 'booked') rows = store.bookedDeals || [];
    if(metric === 'cashed') rows = store.cashedDeals || [];
    if(metric === 'churn') rows = store.churnDeals || [];
    if(metric === 'delayed') rows = store.delayedRenewals || [];
    const dateKey = metric === 'delayed' ? 'contractRenewalDate' : (metric === 'calls' || metric === 'meetings' ? 'date' : 'actionDate');
    return rows.filter(r => retInPeriod((r && (r[dateKey] || r.createdAt || r.contractRenewalDate)), p));
  }
  if(kind === 'tier-matrix'){
    const f = String(opts.tier || 'all').toUpperCase();
    return (store.tierRows || []).filter(r => f === 'ALL' ? true : f === 'NO' ? !r.tier : r.tier === f).map(r => Object.assign({}, r.account||{}, {tier:r.tier, alert:r.alert, rmDays:r.rmDays, csmDays:r.csmDays}));
  }
  return [];
}
function openRetentionMetricDetails(kind, opts={}){
  const rows = retMetricRows(kind, opts);
  const titles = {'focus-delayed':'Delayed renewals','focus-tier-a':'Tier A overdue','focus-csm':'CSM follow-up due','focus-rm':'RM follow-up due','monthly':'Monthly renewal pipeline','period':'Retention KPI details','tier-matrix':'RM / CSM tier follow-up details'};
  const sub = opts.label || opts.metric || opts.bucket || 'Retention records';
  document.getElementById('retMetricBackdrop')?.remove();
  let body = '<div class="acq-detail-empty">No rows available for this number in the current retention data.</div>';
  if(rows.length){
    body = '<table class="ret-detail-table"><thead><tr><th>Name</th><th>Owner</th><th>Status</th><th class="c">Value / Date</th></tr></thead><tbody>' + rows.slice(0,100).map(function(row){
      const name = retRowName(row), url = retOpenUrl(row), status = row.status || row.alert || row.stageType || row.outcome || row.bucket || '—';
      return '<tr><td><div style="font-weight:900">' + recordLink(name,url) + '</div><div class="ret-detail-mini">' + esc(retMetricMeta(row)) + '</div></td><td>' + esc(retOwnerText(row)) + '</td><td><span class="acq-detail-pill">' + esc(status) + '</span></td><td class="c" style="font-family:var(--mono);font-weight:900">' + esc(retMetricValue(row)) + '</td></tr>';
    }).join('') + '</tbody></table>' + (rows.length>100 ? '<div class="acq-detail-empty" style="padding:12px">Showing first 100 of ' + rows.length.toLocaleString() + ' rows.</div>' : '');
  }
  const node=document.createElement('div');
  node.id='retMetricBackdrop'; node.className='acq-detail-backdrop'; node.onclick=function(e){ if(e.target===node) node.remove(); };
  node.innerHTML='<div class="acq-detail-card"><div class="acq-detail-hd"><div><div class="acq-detail-title">' + esc(titles[kind]||'Retention details') + ' <span class="badge bb" style="margin-left:8px">' + rows.length.toLocaleString() + ' rows</span></div><div class="acq-detail-sub">' + esc(sub) + ' · Names open directly in HubSpot when a link is available.</div></div><button class="acq-detail-close" onclick="document.getElementById(&quot;retMetricBackdrop&quot;)?.remove()">×</button></div><div class="acq-detail-body">' + body + '</div></div>';
  document.body.appendChild(node);
}
function retMakeClickable(id, kind, opts={}, title='Click to open details'){
  const el = $(id); if(!el) return;
  el.classList.add('ret-click-num'); el.title = title; el.onclick = function(){ openRetentionMetricDetails(kind, opts); };
}
function retSetTierMatrixFilter(tier){ RET_TIER_MATRIX_FILTER = String(tier || 'all').toLowerCase(); renderRetention(); }

function renderRetentionTodayFocus(ctx){
  const setText=(id,val)=>{ if($(id)) $(id).textContent=val; };
  const data = ctx?.data || {};
  const tierRows = ctx?.tierRows || [];
  const delayed = ctx?.delayedRenewals || [];
  const renewalPipeline = ctx?.renewalPipeline || [];
  const now = new Date();
  const thisMonth = String(now.getFullYear()) + '-' + String(now.getMonth()+1).padStart(2,'0');
  const dueThisMonth = renewalPipeline.filter(r => String(r.contractRenewalDate || r.renewalDate || '').slice(0,7) === thisMonth).length;
  const rmDue = tierRows.filter(r=>r.rmOverdue);
  const csmDue = tierRows.filter(r=>r.csmOverdue);
  const tierADue = tierRows.filter(r=>r.tier === 'A' && (r.rmOverdue || r.csmOverdue));
  const allDue = tierRows.filter(r=>r.rmOverdue || r.csmOverdue);
  setText('retFocusGenAt', data.generatedAt || data.meta?.generatedAt || 'Live');
  setText('retFocusDelayed', delayed.length.toLocaleString());
  setText('retFocusDelayedSub', dueThisMonth ? `${dueThisMonth} due this month` : 'No current-month due count');
  setText('retFocusTierA', tierADue.length.toLocaleString());
  setText('retFocusCsm', csmDue.length.toLocaleString());
  setText('retFocusCsmSub', 'By company tier cadence');
  setText('retFocusRm', rmDue.length.toLocaleString());
  setText('retFocusRmSub', 'By company tier cadence');

  const focus = $('retFocusText');
  if(focus){
    if(delayed.length) focus.innerHTML = `<strong>Start with delayed renewals</strong> — ${delayed.length.toLocaleString()} account(s) already past renewal date.`;
    else if(tierADue.length) focus.innerHTML = `<strong>Tier A first</strong> — ${tierADue.length.toLocaleString()} high-priority account(s) need RM/CSM follow-up.`;
    else if(allDue.length) focus.innerHTML = `<strong>Follow-up cadence</strong> — ${allDue.length.toLocaleString()} account(s) are outside their tier cadence.`;
    else focus.innerHTML = `<strong>Healthy</strong> — no tier follow-up breach detected in the current retention data.`;
  }

  const actions = [];
  if(delayed.length) actions.push({c:'var(--red)',bg:'var(--red-bg)',title:`Work ${delayed.length.toLocaleString()} delayed renewals`,desc:'Renewal date already passed and no same-company current-year booked/cashed movement is detected.',value:delayed.length,label:'delayed'});
  if(tierADue.length) actions.push({c:'var(--amber)',bg:'var(--amber-bg)',title:`Clear ${tierADue.length.toLocaleString()} Tier A follow-ups`,desc:'Tier A requires CSM every 7 days and RM every 14 days based on company or associated deal activity.',value:tierADue.length,label:'Tier A'});
  if(csmDue.length) actions.push({c:'var(--purple)',bg:'var(--purple-bg)',title:`CSM follow-up due on ${csmDue.length.toLocaleString()} account(s)`,desc:'Completed meetings or connected calls are missing within the required company-tier cadence.',value:csmDue.length,label:'CSM'});
  if(rmDue.length) actions.push({c:'var(--blue)',bg:'var(--blue-bg)',title:`RM follow-up due on ${rmDue.length.toLocaleString()} account(s)`,desc:'Completed meetings or connected calls are missing within the required company-tier cadence.',value:rmDue.length,label:'RM'});
  if(!actions.length) actions.push({c:'var(--green)',bg:'var(--green-bg)',title:'Retention cadence is healthy',desc:'No delayed renewal or tier-based follow-up breach in the current data.',value:'✓',label:'healthy'});

  if($('retSmartActionList')){
    $('retSmartActionList').innerHTML = actions.slice(0,4).map((a,i)=>`<div class="priority-item"><div class="priority-num" style="background:${a.bg};color:${a.c}">${i+1}</div><div class="priority-text"><div class="priority-action">${a.title}</div><div class="priority-desc">${a.desc}</div></div><div class="priority-metric"><div class="priority-metric-v" style="color:${a.c}">${a.value}</div><div class="priority-metric-l">${a.label}</div></div></div>`).join('');
  }
}

function renderRetention(){
  if(!$('panel-retention')) return;
  const data = R || {};
  const summary = data.summary || {};
  const kpi = data.kpi || data.kpis || {};
  const team = data.team || {};
  const accountsAll = Array.isArray(data.accounts) ? data.accounts : [ ...(data.accounts?.active||[]), ...(data.accounts?.churned||[]) ];
  const dealsSplit = data.dealsSplit || {};
  const renewedAll = dealsSplit.renewed || [];
  const bookedAll = dealsSplit.booked || [];
  const cashedAll = dealsSplit.cashed || [];
  const churnAll = dealsSplit.churn || [];
  const renewalPipelineAll = data.renewalPipeline || data.renewalDeals || [];
  const renewalAttentionAll = data.renewalAttention || renewalPipelineAll;
  const monthlyAll = data.monthlyRenewalPipeline || [];
  const delayedAll = data.delayedRenewals || data.accountsToRenew || [];
  const alertsObj = data.alerts || {};
  const coverage = data.coverageDetails || {};
  const ownerDetails = data.ownerDetails || {};
  const repData = data.repData || data.ownerMatrix || [];
  const churnReasonsAll = data.churnAnalysis?.reasons || [];
  const retentionRelatedRowsAll = [...renewalPipelineAll, ...renewalAttentionAll, ...delayedAll, ...renewedAll, ...bookedAll, ...cashedAll, ...churnAll];

  const num = v => Number(v || 0);
  const money = v => fmt(v || 0);
  const textSafe = v => esc(v ?? '—');
  const setText=(id,val)=>{ if($(id)) $(id).textContent=val; };
  const val=(obj,...keys)=>{ for(const k of keys){ if(obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k]; } return 0; };
  const p=(name)=> kpi[name] || kpi[name==='yesterday'?'yest':name] || {};
  const y=p('yesterday'), m=p('mtd'), t=p('ytd');
  const valueOf=(rows,key='amount')=>rows.reduce((s,r)=>s+num(r[key] ?? r.amount ?? r.renewalValue),0);
  const empty=(cols,msg)=>`<tr><td colspan="${cols}" style="text-align:center;color:var(--muted);padding:18px;font-style:italic">${msg}</td></tr>`;
  const selectedRep = RET_SELECTED_OWNER_ID ? repData.find(r => String(r.id) === String(RET_SELECTED_OWNER_ID)) : null;
  const selectedOwnerName = selectedRep?.name || '';
  const selectedOwnerId = selectedRep ? String(selectedRep.id) : '';
  const selectedOwnerRole = selectedRep?.role || '';

  const match = row => {
    if(!selectedRep) return true;
    if(selectedOwnerRole === 'RM') return String(row.rmOwnerId || row.ownerId || '') === selectedOwnerId || row.rmOwnerName === selectedOwnerName || row.ownerName === selectedOwnerName;
    if(selectedOwnerRole === 'CSM') return String(row.csmOwnerId || '') === selectedOwnerId || row.csmOwnerName === selectedOwnerName;
    return true;
  };
  const accounts = accountsAll.filter(match);
  const renewedDeals = renewedAll.filter(match);
  const bookedDeals = bookedAll.filter(match);
  const cashedDeals = cashedAll.filter(match);
  const churnDeals = churnAll.filter(match);
  const renewalPipeline = renewalPipelineAll.filter(match);
  const renewalAttention = renewalAttentionAll.filter(match);
  const delayedRenewals = delayedAll.filter(match);
  const churnReasons = churnReasonsAll;
  const allAlerts = (Array.isArray(alertsObj) ? alertsObj : (alertsObj.all || [])).filter(match);
  const noActivityAlerts = (alertsObj.noActivity || []).filter(match);
  const noMeetingAlerts = (alertsObj.noMeeting || []).filter(match);
  const retentionRelatedRows = retentionRelatedRowsAll.filter(match);
  const tierFollowupRows = retBuildTierFollowupRows(accounts, retentionRelatedRows);
  const ownerDetailRows = selectedRep ? ownerDetails[selectedRep.id] : null;
  const activityCalls = (ownerDetailRows?.calls || data.activityDetails?.calls || []).filter(match);
  const activityMeetings = (ownerDetailRows?.meetings || data.activityDetails?.meetings || []).filter(match);

  if($('retFilterNote')) $('retFilterNote').textContent = selectedRep
    ? `${selectedRep.role} page · ${selectedRep.name} · showing this owner accounts and activities only`
    : 'Team Overview · choose any RM/CSM from the sidebar for a personal page';

  // Sidebar Retention navigation
  if($('panel-retention')?.classList.contains('active')) renderRetentionSidebar(selectedRep ? 'owner' : 'overview');

  // Top KPI bar
  setText('kpiAccounts', accounts.length);
  setText('kpiRenewed', renewedDeals.length);
  setText('kpiBooked', bookedDeals.length);
  setText('kpiCashed', cashedDeals.length);
  setText('kpiChurn', churnDeals.length);
  setText('kpiDelayed', delayedRenewals.length);
  const ownerDetailForSelected = selectedRep ? ownerDetails[selectedRep.id] : null;
  setText('kpiCalls', ownerDetailForSelected ? ownerDetailForSelected.calls.length : (team.callsYTD || val(t,'calls')));
  setText('kpiMeetings', ownerDetailForSelected ? ownerDetailForSelected.meetings.length : (team.meetingsYTD || val(t,'meetings')));
  setTimeout(function(){
    retMakeClickable('kpiAccounts','tier-matrix',{tier:'all',label:'All retention accounts'},'Open account details');
    retMakeClickable('kpiRenewed','period',{period:'ytd',metric:'renewed',label:'Renewed YTD'},'Open renewed details');
    retMakeClickable('kpiBooked','period',{period:'ytd',metric:'booked',label:'Booked YTD'},'Open booked details');
    retMakeClickable('kpiCashed','period',{period:'ytd',metric:'cashed',label:'Cashed YTD'},'Open cashed details');
    retMakeClickable('kpiChurn','period',{period:'ytd',metric:'churn',label:'Churn YTD'},'Open churn details');
    retMakeClickable('kpiDelayed','focus-delayed',{},'Open delayed renewals');
    retMakeClickable('kpiCalls','period',{period:'ytd',metric:'calls',label:'Calls YTD'},'Open calls');
    retMakeClickable('kpiMeetings','period',{period:'ytd',metric:'meetings',label:'Meetings YTD'},'Open meetings');
  },0);

  // Period KPI cards
  setText('retYCalls', val(y,'calls')); setText('retYMeetings', val(y,'meetings'));
  setText('retYRenewed', val(y,'renewed')); setText('retYBooked', val(y,'booked')); setText('retYCashed', val(y,'cashed')); setText('retYChurn', val(y,'churn')); setText('retYDelayed', val(y,'delayed'));
  setText('retMCalls', val(m,'calls')); setText('retMMeetings', val(m,'meetings'));
  setText('retMRenewed', val(m,'renewed')); setText('retMBooked', val(m,'booked')); setText('retMCashed', val(m,'cashed')); setText('retMChurn', val(m,'churn')); setText('retMDelayed', val(m,'delayed'));
  setText('retMBookedValue', money(val(m,'bookedAmt'))); setText('retMCashedValue', money(val(m,'cashedAmt')));
  setText('retYtdCalls', val(t,'calls')); setText('retYtdMeetings', val(t,'meetings'));
  setText('retYtdRenewed', val(t,'renewed')); setText('retYtdBooked', val(t,'booked')); setText('retYtdCashed', val(t,'cashed')); setText('retYtdChurn', val(t,'churn')); setText('retYtdDelayed', val(t,'delayed'));

  const currentYear = new Date().getFullYear();
  const upcomingRenewals = renewalPipeline.filter(r=>String(r.status||'').toLowerCase()==='upcoming');
  const renewalsThisYear = renewalPipeline.filter(r=>String(r.contractRenewalDate||'').slice(0,4)===String(currentYear)).length;
  const renewals90 = upcomingRenewals.filter(r=>num(r.daysLeft)<=90 || !r.daysLeft).length;
  const noAct30 = noActivityAlerts.length || accounts.filter(a=>num(a.daysSinceActivity)>30).length;
  const noMeetingQuarter = noMeetingAlerts.length || accounts.filter(a=>num(a.daysSinceMeeting)>90).length;
  renderRetentionTodayFocus({ data, accounts, tierRows: tierFollowupRows, delayedRenewals, renewalPipeline });
  setText('retRenewalsThisYear', renewalsThisYear);
  setText('retRenewalsNext90', renewals90);
  setText('retNoActivity30', noAct30);
  setText('retNoMeetingQuarter', noMeetingQuarter);
  setText('retRenewedWon', renewedDeals.length);
  setText('retCashing', cashedDeals.length);
  setText('retChurnRisk', churnDeals.length + accounts.filter(a=>String(a.accountStatus||'').toLowerCase()==='churned').length);
  setText('retUpsell', renewalAttention.length);
  setText('retRenewalsNext90Value', money(valueOf(upcomingRenewals,'renewalValue')));
  setText('retRenewedWonValue', money(valueOf(renewedDeals,'renewalValue')));
  setText('retCashingValue', money(valueOf(cashedDeals,'amount')));

  // Monthly renewal pipeline — clear operational meaning
  const monthRows = (monthlyAll.length ? monthlyAll : []).filter(row=>{
    if(!selectedOwnerName) return true;
    return (row.rows||[]).some(match);
  }).map(row=>{
    const rows=(row.rows||[]).filter(match);
    if(!selectedOwnerName) return row;
    return { month: row.month, due: rows.length, renewed: rows.filter(r=>r.status==='Renewed').length, booked: rows.filter(r=>r.status==='Renewed' && r.bookedDateEntered && !r.cashedDateEntered).length, cashed: rows.filter(r=>r.status==='Renewed' && r.cashedDateEntered).length, delayed: rows.filter(r=>r.status==='Delayed').length, upcoming: rows.filter(r=>r.status==='Upcoming').length, value: valueOf(rows,'renewalValue'), rows };
  }).filter(r=>r.due>0).sort((a,b)=>String(a.month).localeCompare(String(b.month)));
  if($('retRenewalMonthBody')) $('retRenewalMonthBody').innerHTML = monthRows.length ? monthRows.map((r,i)=>{
    const action = r.delayed>0 ? `${r.delayed} delayed renewal(s) need action` : r.upcoming>0 ? `${r.upcoming} upcoming renewal(s)` : `${r.renewed} renewed`;
    const mLabel = retMonthLabel(r.month);
    const clickCell = (bucket, value, cls='') => '<span class="ret-click-num ' + cls + '" onclick="openRetentionMetricDetails(\'monthly\',{monthIndex:' + i + ',bucket:\'' + bucket + '\',label:\'' + esc(mLabel) + ' · ' + bucket + '\'})">' + value + '</span>';
    return '<tr class="' + (r.delayed>0?'ret-redline':r.upcoming>0?'ret-amberline':'ret-greenline') + ' ' + (i>=5?'ret-hidden':'') + '"><td><div style="font-weight:900">' + textSafe(mLabel) + '</div><div style="font-size:10px;color:var(--muted)">contract_renewal_date month</div></td><td class="c" style="font-family:var(--mono);font-weight:800">' + clickCell('due',num(r.due)) + '</td><td class="c ret-status-green">' + clickCell('renewed',num(r.renewed),'ret-status-green') + '</td><td class="c">' + clickCell('booked',num(r.booked)) + '</td><td class="c">' + clickCell('cashed',num(r.cashed)) + '</td><td class="c ' + (num(r.delayed)>0?'ret-status-red':'') + '">' + clickCell('delayed',num(r.delayed),num(r.delayed)>0?'ret-status-red':'') + '</td><td class="c" style="font-family:var(--mono);font-weight:800">' + money(r.value) + '</td><td><span class="badge ' + (r.delayed>0?'br':r.upcoming>0?'ba':'bg') + '">' + textSafe(action) + '</span></td></tr>';
  }).join('') : empty(8,'No monthly renewal pipeline rows found.');
  if($('retRenewalMonthToggle')) $('retRenewalMonthToggle').style.display = monthRows.length>5?'block':'none';

  // Coverage Quality — restored after Renewal Action Center merge
  // Uses JSON coverageDetails when available, otherwise calculates from active retention accounts.
  (function renderRetentionCoverageQuality(){
    const pct = (hit,total) => total ? Math.round((hit / total) * 100) : 0;
    const totalAccounts = accounts.length || num(coverage.totalAccounts) || num(summary.activeAccounts) || accountsAll.length || 0;
    const hasAny = v => v !== undefined && v !== null && String(v).trim() !== '' && String(v).trim() !== '—';
    const getRate = (keys, hitFn) => {
      for(const k of keys){
        if(coverage && coverage[k] !== undefined && coverage[k] !== null && coverage[k] !== '') return num(coverage[k]);
      }
      return pct(accounts.filter(hitFn).length, totalAccounts);
    };
    const callCoverage = getRate(['callCoverage','callsCoverage','callCoverageRate'], a => hasAny(a.lastCallDate) || hasAny(a.rmLastCall) || hasAny(a.csmLastCall) || hasAny(a.lastConnectedCall));
    const meetingCoverage = getRate(['meetingCoverage','meetingsCoverage','meetingCoverageRate'], a => hasAny(a.lastMeetingDate) || hasAny(a.rmLastMeeting) || hasAny(a.csmLastMeeting) || hasAny(a.lastCompletedMeeting));
    const rmAssigned = accounts.filter(a => hasAny(a.rmOwnerId) || hasAny(a.rmOwnerName) || hasAny(a.rmOwner)).length;
    const csmAssigned = accounts.filter(a => hasAny(a.csmOwnerId) || hasAny(a.csmOwnerName) || hasAny(a.csmOwner)).length;
    let rmTouchCoverage = coverage.rmTouchCoverage !== undefined ? num(coverage.rmTouchCoverage) : (rmAssigned ? pct(accounts.filter(a => (hasAny(a.rmOwnerId)||hasAny(a.rmOwnerName)||hasAny(a.rmOwner)) && (hasAny(a.rmLastTouch)||hasAny(a.rmLastCall)||hasAny(a.rmLastMeeting)||hasAny(a.lastActivityDate)||hasAny(a.lastActivity))).length, rmAssigned) : 0);
    let csmTouchCoverage = coverage.csmTouchCoverage !== undefined ? num(coverage.csmTouchCoverage) : (csmAssigned ? pct(accounts.filter(a => (hasAny(a.csmOwnerId)||hasAny(a.csmOwnerName)||hasAny(a.csmOwner)) && (hasAny(a.csmLastTouch)||hasAny(a.csmLastCall)||hasAny(a.csmLastMeeting)||hasAny(a.lastActivityDate)||hasAny(a.lastActivity))).length, csmAssigned) : 0);
    const lines = [
      ['Call Coverage', callCoverage, 'var(--blue)'],
      ['Meeting Coverage', meetingCoverage, 'var(--purple)'],
      ['RM Touch Coverage', rmTouchCoverage, 'var(--cyan)'],
      ['CSM Touch Coverage', csmTouchCoverage, 'var(--green)']
    ];
    if($('retCoverageBody')) $('retCoverageBody').innerHTML = `<div class="ret-explain"><b>Coverage definitions:</b><br>Call Coverage = accounts with connected call ÷ active retention accounts. Meeting Coverage = accounts with completed meeting ÷ active retention accounts. RM/CSM Touch = assigned accounts where that owner has connected call or completed meeting on the company or an associated renewal deal.</div>` + lines.map(([label,rate,color])=>`<div class="ret-coverage-line"><div class="ret-coverage-label">${label}</div><div class="ret-bar"><div class="ret-fill" style="--rc:${color};width:${Math.max(0,Math.min(100,num(rate)))}%"></div></div><div style="font-family:var(--mono);font-weight:800">${num(rate)}%</div></div>`).join('');
  })();

  window.__retentionMetricStore = {
    accounts, renewedDeals, bookedDeals, cashedDeals, churnDeals, delayedRenewals, renewalPipeline, renewalAttention, monthRows, tierRows: tierFollowupRows, calls: activityCalls, meetings: activityMeetings
  };
  retMakeClickable('retFocusDelayed','focus-delayed',{},'Open delayed renewals');
  retMakeClickable('retFocusTierA','focus-tier-a',{},'Open Tier A overdue accounts');
  retMakeClickable('retFocusCsm','focus-csm',{},'Open CSM follow-up due accounts');
  retMakeClickable('retFocusRm','focus-rm',{},'Open RM follow-up due accounts');
  [['retYCalls','yesterday','calls'],['retYMeetings','yesterday','meetings'],['retYRenewed','yesterday','renewed'],['retYBooked','yesterday','booked'],['retYCashed','yesterday','cashed'],['retYChurn','yesterday','churn'],['retYDelayed','yesterday','delayed'],['retMCalls','mtd','calls'],['retMMeetings','mtd','meetings'],['retMRenewed','mtd','renewed'],['retMBooked','mtd','booked'],['retMCashed','mtd','cashed'],['retMChurn','mtd','churn'],['retMDelayed','mtd','delayed'],['retYtdCalls','ytd','calls'],['retYtdMeetings','ytd','meetings'],['retYtdRenewed','ytd','renewed'],['retYtdBooked','ytd','booked'],['retYtdCashed','ytd','cashed'],['retYtdChurn','ytd','churn'],['retYtdDelayed','ytd','delayed']].forEach(function(x){ retMakeClickable(x[0],'period',{period:x[1],metric:x[2],label:x[1].toUpperCase() + ' · ' + x[2]},'Open KPI details'); });

  // Unified Renewal Table — one row per company, no duplicate renewal sections
  const accountByKey = new Map();
  const makeCompanyKey = r => String(r.companyId || r.accountId || r.hs_object_id || r.companyName || r.accountName || r.name || r.dealName || '').trim().toLowerCase();
  accounts.forEach(a => {
    const key = makeCompanyKey(a);
    if(key) accountByKey.set(key, a);
  });

  function pickFilled(...values){
    return values.find(v => v !== undefined && v !== null && String(v).trim() !== '') || '';
  }
  function mergeValue(oldVal,newVal){
    return oldVal !== undefined && oldVal !== null && String(oldVal).trim() !== '' && String(oldVal).trim() !== '—' ? oldVal : newVal;
  }
  function normalizeUnifiedRenewalRow(r, sourceLabel){
    const key = makeCompanyKey(r);
    const acc = accountByKey.get(key) || {};
    const renewalDate = pickFilled(r.contractRenewalDate, r.renewalDate, r.renewal_date, acc.contractRenewalDate, acc.renewalDate);
    const daysOverdue = num(pickFilled(r.daysOverdue, acc.daysOverdue, 0));
    const daysLeftRaw = pickFilled(r.daysLeft, acc.daysLeft, '');
    const status = pickFilled(r.status, r.alert, daysOverdue > 0 ? 'Delayed Renewal' : sourceLabel === 'attention' ? 'Needs Attention' : 'Upcoming');
    return {
      key,
      companyName: pickFilled(r.companyName, r.accountName, r.name, r.dealName, acc.companyName, acc.name, '—'),
      companyUrl: pickFilled(r.companyUrl, r.hubspotUrl, r.dealUrl, acc.companyUrl, acc.hubspotUrl),
      dealName: pickFilled(r.dealName, r.name, r.renewalDealName),
      dealUrl: pickFilled(r.dealUrl, r.hubspotUrl),
      tier: pickFilled(r.company_tier, r.companyTier, r.tier, acc.company_tier, acc.companyTier, acc.tier),
      renewalValue: num(pickFilled(r.renewalValue, r.amount, r.value, r.revenue, acc.renewalValue, acc.amount, acc.value, 0)),
      month: retMonthLabel(pickFilled(r.renewalMonth, renewalDate)),
      renewalDate,
      daysOverdue,
      daysLeft: daysLeftRaw,
      rmOwnerName: pickFilled(r.rmOwnerName, r.rmOwner, r.ownerName, acc.rmOwnerName, acc.rmOwner, acc.ownerName),
      csmOwnerName: pickFilled(r.csmOwnerName, r.csmOwner, acc.csmOwnerName, acc.csmOwner),
      rmTouch: pickFilled(r.rmLastTouch, r.rmLastCall, r.rmLastMeeting, r.lastRmActivity, acc.rmLastTouch, acc.rmLastCall, acc.rmLastMeeting),
      csmTouch: pickFilled(r.csmLastTouch, r.csmLastCall, r.csmLastMeeting, r.lastCsmActivity, acc.csmLastTouch, acc.csmLastCall, acc.csmLastMeeting),
      status,
      sourceLabel
    };
  }

  const unifiedMap = new Map();
  [...delayedRenewals.map(r=>({...r,_src:'delayed'})), ...upcomingRenewals.map(r=>({...r,_src:'upcoming'})), ...renewalAttention.map(r=>({...r,_src:'attention'}))].forEach(raw => {
    const row = normalizeUnifiedRenewalRow(raw, raw._src);
    if(!row.key) return;
    if(!unifiedMap.has(row.key)){
      unifiedMap.set(row.key, row);
      return;
    }
    const old = unifiedMap.get(row.key);
    unifiedMap.set(row.key, {
      ...old,
      companyName: mergeValue(old.companyName, row.companyName),
      companyUrl: mergeValue(old.companyUrl, row.companyUrl),
      dealName: mergeValue(old.dealName, row.dealName),
      dealUrl: mergeValue(old.dealUrl, row.dealUrl),
      tier: mergeValue(old.tier, row.tier),
      renewalValue: old.renewalValue || row.renewalValue,
      month: mergeValue(old.month, row.month),
      renewalDate: mergeValue(old.renewalDate, row.renewalDate),
      daysOverdue: Math.max(num(old.daysOverdue), num(row.daysOverdue)),
      daysLeft: mergeValue(old.daysLeft, row.daysLeft),
      rmOwnerName: mergeValue(old.rmOwnerName, row.rmOwnerName),
      csmOwnerName: mergeValue(old.csmOwnerName, row.csmOwnerName),
      rmTouch: mergeValue(old.rmTouch, row.rmTouch),
      csmTouch: mergeValue(old.csmTouch, row.csmTouch),
      status: /delayed|overdue/i.test(String(old.status)) ? old.status : (/delayed|overdue/i.test(String(row.status)) ? row.status : mergeValue(old.status, row.status)),
      sourceLabel: old.sourceLabel === 'delayed' || row.sourceLabel === 'delayed' ? 'delayed' : old.sourceLabel
    });
  });

  const unifiedRenewalRows = Array.from(unifiedMap.values()).sort((a,b)=>{
    const overdueDiff = num(b.daysOverdue) - num(a.daysOverdue);
    if(overdueDiff) return overdueDiff;
    return String(a.renewalDate || a.month || '').localeCompare(String(b.renewalDate || b.month || ''));
  });

  if($('retRenewalUnifiedBody')) $('retRenewalUnifiedBody').innerHTML = unifiedRenewalRows.length ? unifiedRenewalRows.map((r,i)=>{
    const isDelayed = num(r.daysOverdue) > 0 || /delayed|overdue/i.test(String(r.status));
    const isRenewed = /renewed/i.test(String(r.status));
    const overdueText = num(r.daysOverdue) > 0 ? `${num(r.daysOverdue)} overdue` : textSafe(r.daysLeft !== '' ? r.daysLeft : '—');
    const statusClass = isRenewed ? 'bg' : isDelayed ? 'br' : /attention|needed|action/i.test(String(r.status)) ? 'ba' : 'bb';
    return `<tr class="${isDelayed?'ret-redline':isRenewed?'ret-greenline':'ret-amberline'} ${i>=5?'ret-hidden':''}"><td><div style="font-weight:900">${recordLink(r.companyName,r.companyUrl)}</div>${r.dealName ? `<div style="font-size:10px;color:var(--muted)">${recordLink(r.dealName,r.dealUrl)}</div>` : `<div style="font-size:10px;color:var(--muted)">Renewal account</div>`}</td><td class="c">${retTierBadge(r.tier)}</td><td class="c" style="font-family:var(--mono);font-weight:800">${money(r.renewalValue)}</td><td class="c">${textSafe(r.month)}</td><td class="c ${isDelayed?'ret-status-red':''}">${textSafe(r.renewalDate)}</td><td class="c ${isDelayed?'ret-status-red':''}">${overdueText}</td><td>${textSafe(r.rmOwnerName || '—')}</td><td>${textSafe(r.csmOwnerName || '—')}</td><td class="c">${textSafe(r.rmTouch || '—')}</td><td class="c">${textSafe(r.csmTouch || '—')}</td><td class="c"><span class="badge ${statusClass}">${textSafe(r.status || 'Upcoming')}</span></td></tr>`;
  }).join('') : empty(11,'No renewal rows found.');
  if($('retRenewalUnifiedToggle')) $('retRenewalUnifiedToggle').style.display = unifiedRenewalRows.length>5?'block':'none';

  // Churn reasons
  if($('retUpsellCoverageBody')) $('retUpsellCoverageBody').innerHTML = churnReasons.length ? churnReasons.map((r,i)=>`<tr class="${i>=5?'ret-hidden':''}"><td><div style="font-weight:800">${textSafe(r.reason||'Not specified')}</div></td><td class="c">${num(r.count)}</td><td class="c" style="font-family:var(--mono);font-weight:700">${money(r.amount)}</td><td class="c">${recordLink(r.deals?.[0]?.companyName||r.deals?.[0]?.name||'—',r.deals?.[0]?.companyUrl||r.deals?.[0]?.hubspotUrl)}</td><td class="c"><span class="badge br">Churn</span></td></tr>`).join('') : empty(5,'No churn reason data in the current Supabase retention model.');
  if($('retChurnReasonsToggle')) $('retChurnReasonsToggle').style.display = churnReasons.length>5?'block':'none';

  // RM/CSM follow-up metrics — company_tier cadence, based on company + associated renewal deals
  const tierCounts = {all:tierFollowupRows.length, a:tierFollowupRows.filter(r=>r.tier==='A').length, b:tierFollowupRows.filter(r=>r.tier==='B').length, c:tierFollowupRows.filter(r=>r.tier==='C').length, no:tierFollowupRows.filter(r=>!r.tier).length};
  if($('retTierFilterBar')) $('retTierFilterBar').innerHTML = [['all','All tiers',tierCounts.all],['a','Tier A',tierCounts.a],['b','Tier B',tierCounts.b],['c','Tier C',tierCounts.c],['no','No tier',tierCounts.no]].map(function(x){ return '<button class="ret-filter-chip ' + (RET_TIER_MATRIX_FILTER===x[0]?'active':'') + '" onclick="retSetTierMatrixFilter(\'' + x[0] + '\')">' + x[1] + ' ' + x[2] + '</button>'; }).join('');
  const tierRowsVisible = tierFollowupRows.filter(r => RET_TIER_MATRIX_FILTER === 'all' ? true : RET_TIER_MATRIX_FILTER === 'no' ? !r.tier : String(r.tier || '').toLowerCase() === RET_TIER_MATRIX_FILTER);
  if($('retOwnerMatrixBody')) $('retOwnerMatrixBody').innerHTML = tierRowsVisible.length ? tierRowsVisible.map((tr,i)=>{
    const a = tr.account || {};
    const healthy = tr.alert === 'Healthy';
    const warn = tr.alert === 'Missing tier';
    const rmLast = retHumanLastActivity(tr.rmLatest, tr.rmDays);
    const csmLast = retHumanLastActivity(tr.csmLatest, tr.csmDays);
    const rmCadence = tr.rmThreshold ? `${tr.rmThreshold}d` : '—';
    const csmCadence = tr.csmThreshold ? `${tr.csmThreshold}d` : '—';
    return `<tr class="${healthy?'ret-greenline':warn?'ret-amberline':'ret-redline'} ${i>=5?'ret-hidden':''}"><td><div style="font-weight:800">${recordLink(a.companyName||a.accountName||a.name,a.companyUrl||a.hubspotUrl)}</div><div style="font-size:10px;color:var(--muted)">Company + associated renewal deals</div></td><td class="c">${retTierBadge(tr.tier)}</td><td>${textSafe(a.rmOwnerName||a.rmOwner)}</td><td class="c ${tr.rmOverdue?'ret-status-red':''}">${textSafe(rmLast)}</td><td class="c">${textSafe(rmCadence)}</td><td>${textSafe(a.csmOwnerName||a.csmOwner)}</td><td class="c ${tr.csmOverdue?'ret-status-red':''}">${textSafe(csmLast)}</td><td class="c">${textSafe(csmCadence)}</td><td><span class="badge ${healthy?'bg':warn?'ba':'br'}">${textSafe(tr.alert)}</span></td></tr>`;
  }).join('') : empty(9,'No RM / CSM matrix rows found for this tier filter.');
  if($('retOwnerMatrixToggle')) $('retOwnerMatrixToggle').style.display = tierRowsVisible.length>5?'block':'none';

  const rmStats = {accounts: (data.rmMatrix||[]).reduce((s,r)=>s+num(r.accounts),0), noContact: (data.rmMatrix||[]).reduce((s,r)=>s+num(r.noContact),0), delayed: (data.rmMatrix||[]).reduce((s,r)=>s+num(r.delayed),0), calls: (data.rmMatrix||[]).reduce((s,r)=>s+num(r.calls),0)};
  const csmStats = {accounts: (data.csmMatrix||[]).reduce((s,r)=>s+num(r.accounts),0), noMeeting: (data.csmMatrix||[]).reduce((s,r)=>s+num(r.noMeeting),0), delayed: (data.csmMatrix||[]).reduce((s,r)=>s+num(r.delayed),0), meetings: (data.csmMatrix||[]).reduce((s,r)=>s+num(r.meetings),0)};
  if($('retRmStats')) $('retRmStats').innerHTML = [[rmStats.accounts,'Accounts'],[rmStats.noContact,'No Touch'],[rmStats.delayed,'Delayed'],[rmStats.calls,'Calls']].map(x=>`<div class="ret-mini"><div class="ret-mini-v">${textSafe(x[0])}</div><div class="ret-mini-l">${x[1]}</div></div>`).join('');
  if($('retCsmStats')) $('retCsmStats').innerHTML = [[csmStats.accounts,'Accounts'],[csmStats.noMeeting,'No Meeting'],[csmStats.delayed,'Delayed'],[csmStats.meetings,'Meetings']].map(x=>`<div class="ret-mini"><div class="ret-mini-v">${textSafe(x[0])}</div><div class="ret-mini-l">${x[1]}</div></div>`).join('');

  renderRetentionOwnerDetails(selectedRep?.id || null);
}

function selectRetentionOwner(repId){
  APP_MAIN_PANEL = "retention";
  APP_RETENTION_VIEW = "owner";
  APP_RETENTION_OWNER_ID = String(repId);
  RETENTION_SUBVIEW = "owner";
  const data = R || {};
  const rep = (data.repData||[]).find(r=>String(r.id)===String(repId));
  if(!rep) return;
  RET_SELECTED_OWNER_ID = String(repId);
  document.querySelectorAll(".tab-btn").forEach(t=>t.classList.remove("active"));
  document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n=>n.classList.remove("active"));
  if($("tabsBar")) $("tabsBar").style.display = "none";
  $("side-retention")?.classList.add("active");
  $("panel-retention")?.classList.add("active");
  renderRetentionSidebar("owner");
  if($("topbarTitle")) $("topbarTitle").textContent = "Retention · " + rep.name;
  if($("topbarSub")) $("topbarSub").textContent = rep.role + " · owner page · priority actions, financial movement, activity quality";
  setRetentionOwnerMode(true);
  renderRetention();
  window.scrollTo({top:0, behavior:"smooth"});
}


function retOwnerMonthKey(v){
  const s = String(v || '').trim();
  return s && s.length >= 7 ? s.slice(0,7) : 'No date';
}

function retOwnerRenewalRows(details){
  const rows = [
    ...(details?.delayedRenewals || []),
    ...(details?.renewalAttention || []),
    ...(details?.renewedDeals || [])
  ];
  const seen = new Set();
  return rows.filter(row => {
    const key = [row.companyId || row.companyName || row.name, row.id || row.renewalSourceDealId || row.contractRenewalDate || row.originalContractRenewalDate, row.status || row.stageType || row.renewalType].join('|');
    if(seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function retOwnerFinancialRows(details){
  return [
    ...(details?.cashedDeals || []).map(d => ({...d, bucket:'Cashed'})),
    ...(details?.bookedDeals || []).map(d => ({...d, bucket:'Booked'})),
    ...(details?.renewedDeals || []).map(d => ({...d, bucket:'Renewed'})),
    ...(details?.churnDeals || []).map(d => ({...d, bucket:'Churn'})),
  ];
}

function closeRetOwnerSlice(){
  const panel = $('retOwnerClickPanel');
  if(panel){ panel.style.display = 'none'; panel.innerHTML = ''; }
}

function openRetOwnerSlice(repId, slice, month, status){
  const data = R || {};
  const details = data.ownerDetails?.[String(repId || APP_RETENTION_OWNER_ID || RET_SELECTED_OWNER_ID || '')];
  const panel = $('retOwnerClickPanel');
  if(!details || !panel) return;

  const safe = v => esc(v ?? '—');
  const money = v => fmt(v || 0);
  const rowLimit = 12;
  let title = 'Details';
  let sub = `${details.name || 'Owner'} · click another number to switch this view`;
  let rows = [];
  let headers = [];
  let rowFn = null;
  let empty = 'No rows found for this selection.';

  const renewalRows = retOwnerRenewalRows(details);
  const financialRows = retOwnerFinancialRows(details);

  if(slice === 'month'){
    title = `${month || 'Month'} Renewal Details`;
    sub = `${status === 'due' ? 'All due renewals' : status === 'renewed' ? 'Renewed rows' : status === 'delayed' ? 'Delayed rows' : status === 'upcoming' ? 'Upcoming rows' : 'Renewal rows'} for ${details.name || 'this owner'}`;
    rows = renewalRows.filter(r => retOwnerMonthKey(r.contractRenewalDate || r.originalContractRenewalDate || r.renewalDate) === String(month));
    if(status && status !== 'due'){
      rows = rows.filter(r => {
        const st = String(r.status || r.stageType || r.renewalType || '').toLowerCase();
        if(status === 'delayed') return st.includes('delayed');
        if(status === 'upcoming') return st.includes('upcoming');
        if(status === 'renewed') return st.includes('renewed') || st.includes('cashed') || st.includes('booked');
        return true;
      });
    }
    headers = [{t:'Account / Deal'},{t:'Renewal',c:1},{t:'Value',c:1},{t:'Type',c:1},{t:'Status',c:1}];
    rowFn = (d,i) => { const st = d.status || d.stageType || d.renewalType || '—'; return `<tr class="${/delayed/i.test(st)?'ret-row-critical':/upcoming/i.test(st)?'ret-row-warning':'ret-row-ok'} ${i>=rowLimit?'ret-hidden':''}"><td>${recordLink(d.companyName||d.name||'Account',d.companyUrl||d.hubspotUrl)}<div style="font-size:10px;color:var(--muted)">${recordLink(d.name||d.renewalSourceDealName||'Deal',d.hubspotUrl||d.renewalSourceDealUrl)}</div></td><td class="c">${safe(d.contractRenewalDate||d.originalContractRenewalDate)}</td><td class="c" style="font-family:var(--mono);font-weight:900">${money(d.renewalValue||d.amount)}</td><td class="c">${safe(d.renewalType||d.stageType||'—')}</td><td class="c"><span class="badge ${/delayed/i.test(st)?'br':/upcoming/i.test(st)?'ba':'bg'}">${safe(st)}</span></td></tr>`; };
  }

  if(slice === 'delayed'){
    title = 'Delayed Renewals';
    sub = 'Renewal date passed with no current-year Booked/Cashed renewal for the same company';
    rows = details.delayedRenewals || [];
    headers = [{t:'Account / Deal'},{t:'Renewal',c:1},{t:'Days',c:1},{t:'Value',c:1},{t:'Action',c:1}];
    rowFn = (d,i) => `<tr class="ret-row-critical ${i>=rowLimit?'ret-hidden':''}"><td>${recordLink(d.companyName||d.name||'Account',d.companyUrl||d.hubspotUrl)}<div style="font-size:10px;color:var(--muted)">${safe(d.reason||'No Booked/Cashed renewal found')}</div></td><td class="c">${safe(d.contractRenewalDate||d.originalContractRenewalDate)}</td><td class="c"><span class="badge br">${safe(d.daysOverdue||'—')}d</span></td><td class="c" style="font-family:var(--mono);font-weight:900">${money(d.renewalValue||d.amount)}</td><td class="c"><span class="badge br">Chase now</span></td></tr>`;
  }

  if(slice === 'notouch'){
    title = 'No Touch 30D';
    sub = 'Accounts with no connected call or completed meeting from assigned RM/CSM';
    rows = details.noContactAccounts || [];
    headers = [{t:'Account'},{t:'Last Touch',c:1},{t:'Days',c:1},{t:'RM / CSM'},{t:'Action',c:1}];
    rowFn = (a,i) => `<tr class="ret-row-critical ${i>=rowLimit?'ret-hidden':''}"><td>${recordLink(a.companyName,a.companyUrl)}</td><td class="c">${safe(a.lastActivityDate||'—')}</td><td class="c"><span class="badge br">${safe(a.daysSinceActivity||'—')}d</span></td><td>${safe(a.rmOwnerName||'—')} / ${safe(a.csmOwnerName||'—')}</td><td class="c"><span class="badge br">Call now</span></td></tr>`;
  }

  if(slice === 'booked' || slice === 'cashed' || slice === 'renewed' || slice === 'financial'){
    title = slice === 'financial' ? 'Booked / Cashed / Renewed Movement' : `${slice.charAt(0).toUpperCase()+slice.slice(1)} Deals`;
    sub = 'Current-year financial movement for this owner';
    rows = slice === 'financial' ? financialRows : (slice === 'booked' ? details.bookedDeals||[] : slice === 'cashed' ? details.cashedDeals||[] : details.renewedDeals||[]).map(d => ({...d, bucket:slice.charAt(0).toUpperCase()+slice.slice(1)}));
    headers = [{t:'Deal / Company'},{t:'Bucket',c:1},{t:'Created',c:1},{t:'Value',c:1},{t:'Reason / Product'}];
    rowFn = (d,i) => `<tr class="${d.bucket==='Churn'?'ret-row-critical':d.bucket==='Renewed'||d.bucket==='Cashed'?'ret-row-ok':d.bucket==='Booked'?'ret-row-warning':''} ${i>=rowLimit?'ret-hidden':''}"><td>${recordLink(d.name||d.companyName,d.hubspotUrl||d.companyUrl)}<div style="font-size:10px;color:var(--muted)">${recordLink(d.companyName,d.companyUrl)}</div></td><td class="c"><span class="badge ${d.bucket==='Churn'?'br':d.bucket==='Booked'?'bp':'bg'}">${safe(d.bucket)}</span></td><td class="c">${safe(d.createdAt||d.renewedDealCreatedAt||d.actionDate)}</td><td class="c" style="font-family:var(--mono);font-weight:900">${money(d.amount||d.renewalValue)}</td><td>${safe(d.churnReason||d.product||d.statusReason||'—')}</td></tr>`;
  }

  if(slice === 'accounts'){
    title = 'Accounts Owned';
    sub = 'Owned accounts with touch status and next action';
    rows = details.accounts || [];
    headers = [{t:'Account'},{t:'Status',c:1},{t:'RM Touch',c:1},{t:'CSM Touch',c:1},{t:'Next Action',c:1}];
    rowFn = (a,i) => { const bad = Number(a.daysSinceActivity||0)>30 || Number(a.daysSinceMeeting||0)>90; const act = Number(a.daysSinceActivity||0)>30 ? 'Call now' : Number(a.daysSinceMeeting||0)>90 ? 'Book meeting' : 'Healthy'; return `<tr class="${bad?'ret-row-warning':'ret-row-ok'} ${i>=rowLimit?'ret-hidden':''}"><td>${recordLink(a.companyName,a.companyUrl)}<div style="font-size:10px;color:var(--muted)">RM ${safe(a.rmOwnerName)} · CSM ${safe(a.csmOwnerName)}</div></td><td class="c">${safe(a.accountStatus)}</td><td class="c">${safe(a.rmLastTouch||a.rmLastCall||a.rmLastMeeting)}</td><td class="c">${safe(a.csmLastTouch||a.csmLastCall||a.csmLastMeeting)}</td><td class="c"><span class="badge ${bad?'ba':'bg'}">${act}</span></td></tr>`; };
  }

  const table = rows.length ? `<div class="ret-compact-table" style="overflow-x:auto"><table class="tbl"><thead><tr>${headers.map(h=>`<th${h.c?' class="c"':''}>${h.t}</th>`).join('')}</tr></thead><tbody>${rows.map((r,i)=>rowFn(r,i)).join('')}</tbody></table></div>${rows.length>rowLimit?'<button class="ret-show-btn" onclick="toggleInlineHidden(this)">▼ Show more</button>':''}` : `<div class="ret-drill-empty">${safe(empty)}</div>`;
  panel.innerHTML = `<div class="ret-drill-head"><div><div class="ret-drill-title">🔎 ${safe(title)} <span class="badge bb">${rows.length} rows</span></div><div class="ret-drill-sub">${safe(sub)}</div></div><button class="ret-drill-close" onclick="closeRetOwnerSlice()">Close</button></div>${table}`;
  panel.style.display = 'block';
  panel.scrollIntoView({behavior:'smooth', block:'start'});
}

function renderRetentionOwnerDetails(repId){
  const data = R || {};
  const ownerDetails = data.ownerDetails || {};
  const details = repId ? ownerDetails[repId] : null;
  const mount = ensureRetentionOwnerMount();
  const oldBody = $('retOwnerDetailBody');

  if(!details){
    if(oldBody){
      $('retOwnerDetailTitle').textContent = 'Choose RM / CSM from the sidebar';
      $('retOwnerDetailBadge').textContent = 'Owner details';
      oldBody.innerHTML = `<div class="ret-explain">Team overview is shown above. Click any Retention Team owner in the sidebar to open a clean owner page.</div>`;
    }
    if(mount) mount.innerHTML = '';
    return;
  }

  const m = details.metrics || {};
 
  const color = details.color || 'var(--cyan)';
  const safe = v => esc(v ?? '—');
  const riskCount = Number(m.delayed||0) + Number(m.noContact||0) + Number(m.noMeeting||0);
  const revenueValue = Number(m.renewedAmt||0) + Number(m.cashedAmt||0) + Number(m.bookedAmt||0);
  const limit = 5;

  function ownerActivityDate(row){
    return row?.dateRaw || row?.date || row?.hs_timestamp || row?.timestamp || row?.createdAt || row?.activityDate || row?.callDate || row?.meetingDate || null;
  }

  function ownerDateInRange(value, from, to){
    if(!value) return false;
    const ms = new Date(value).getTime();
    return Number.isFinite(ms) && ms >= from && ms <= to;
  }

  function ownerDateBoundaries(){
    const now = new Date();
    const y = new Date(now);
    y.setDate(now.getDate() - 1);
    const yesterdayStart = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0).getTime();
    const yesterdayEnd = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999).getTime();
    const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime();
    const ytdStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0).getTime();
    return { yesterdayStart, yesterdayEnd, mtdStart, ytdStart, nowMs: now.getTime() };
  }

  function countOwnerPeriod(rows, from, to){
    return (Array.isArray(rows) ? rows : []).filter(row => ownerDateInRange(ownerActivityDate(row), from, to)).length;
  }

  function buildOwnerActivityEstimate(){
    const bounds = ownerDateBoundaries();
    const loggedCalls = Array.isArray(details.loggedCalls) ? details.loggedCalls : (Array.isArray(details.calls) ? details.calls : []);
    const connectedCalls = Array.isArray(details.connectedCalls) ? details.connectedCalls : (Array.isArray(details.calls) ? details.calls : []);
    const loggedMeetings = Array.isArray(details.loggedMeetings) ? details.loggedMeetings : (Array.isArray(details.meetings) ? details.meetings : []);
    const completedMeetings = Array.isArray(details.completedMeetings) ? details.completedMeetings : (Array.isArray(details.meetings) ? details.meetings : []);

    return {
      yesterday: {
        callLogged: countOwnerPeriod(loggedCalls, bounds.yesterdayStart, bounds.yesterdayEnd),
        connectedCalls: countOwnerPeriod(connectedCalls, bounds.yesterdayStart, bounds.yesterdayEnd),
        meetingLogged: countOwnerPeriod(loggedMeetings, bounds.yesterdayStart, bounds.yesterdayEnd),
        completedMeetings: countOwnerPeriod(completedMeetings, bounds.yesterdayStart, bounds.yesterdayEnd),
      },
      mtd: {
        callLogged: countOwnerPeriod(loggedCalls, bounds.mtdStart, bounds.nowMs),
        connectedCalls: countOwnerPeriod(connectedCalls, bounds.mtdStart, bounds.nowMs),
        meetingLogged: countOwnerPeriod(loggedMeetings, bounds.mtdStart, bounds.nowMs),
        completedMeetings: countOwnerPeriod(completedMeetings, bounds.mtdStart, bounds.nowMs),
      },
      ytd: {
        callLogged: Number(m.callLogged || loggedCalls.length || 0),
        connectedCalls: Number(m.connectedCalls || m.calls || connectedCalls.length || 0),
        meetingLogged: Number(m.meetingLogged || loggedMeetings.length || 0),
        completedMeetings: Number(m.completedMeetings || m.meetings || completedMeetings.length || 0),
      }
    };
  }

  const activityEstimate = buildOwnerActivityEstimate();
  const activityKpis = details.activityKpis || {};
  const akY = activityKpis.yesterday || activityEstimate.yesterday;
  const akM = activityKpis.mtd || activityEstimate.mtd;
  const akT = activityKpis.ytd || activityEstimate.ytd;

  function ownerActivityCard(value, label, subtitle, colorVar){
    return `
      <div class="ret-kpi-compact" style="--rk:${colorVar}">
        <div class="ret-kpi-v">${Number(value || 0).toLocaleString()}<span>•</span></div>
        <div class="ret-kpi-l">${safe(label)}</div>
        <div class="ret-kpi-s">${safe(subtitle)}</div>
      </div>`;
  }

  function ownerActivityRow(name, sub, colorVar, stats){
    const row = stats || {};
    return `
      <div class="ret-kpi-period-row" style="--pc:${colorVar};grid-template-columns:125px repeat(4,1fr)">
        <div class="ret-kpi-period-label">
          <div class="ret-kpi-period-name">${safe(name)}</div>
          <div class="ret-kpi-period-sub">${safe(sub)}</div>
        </div>
        ${ownerActivityCard(row.callLogged, 'CALL LOGGED', 'HubSpot logged', 'var(--blue)')}
        ${ownerActivityCard(row.connectedCalls, 'CONNECTED CALLS', 'Connected only', 'var(--green)')}
        ${ownerActivityCard(row.meetingLogged, 'MEETING LOGGED', 'HubSpot logged', 'var(--purple)')}
        ${ownerActivityCard(row.completedMeetings, 'COMPLETED MEETINGS', 'Completed only', 'var(--green)')}
      </div>`;
  }

  const ownerKpiHtml = `
    <div class="card ret-kpi-master-card" style="margin-bottom:14px;border-top-color:${safe(color)}">
      <div class="ret-kpi-master-hd">
        <div class="ret-kpi-master-title">📞 Activity KPIs · HubSpot</div>
        <span class="badge bb">${safe(details.name)} · ${safe(details.role)}</span>
      </div>
      ${ownerActivityRow('YESTERDAY', 'daily execution', 'var(--blue)', akY)}
      ${ownerActivityRow('MTD', 'current month', 'var(--amber)', akM)}
      ${ownerActivityRow('YTD', 'current year', 'var(--green)', akT)}
    </div>`;

  const byAmountDesc = arr => [...(arr||[])].sort((a,b)=>Number(b.amount||b.renewalValue||0)-Number(a.amount||a.renewalValue||0));
  const byDateAsc = arr => [...(arr||[])].sort((a,b)=>String(a.contractRenewalDate||a.originalContractRenewalDate||a.month||'').localeCompare(String(b.contractRenewalDate||b.originalContractRenewalDate||b.month||'')));

  const focus = (value,label,sub,colorVar,slice) => `
    <div class="ret-focus-card ret-click-card" style="--fc:${colorVar}" onclick="openRetOwnerSlice('${safe(repId)}','${slice}')" title="Open ${label} details">
      <div class="ret-focus-v">${safe(value)}</div>
      <div class="ret-focus-l">${label}</div>
      <div class="ret-focus-s">${sub}</div>
    </div>`;

  const hidden = i => i >= limit ? 'ret-hidden' : '';
  const showMore = rows => rows.length > limit ? '<button class="ret-show-btn" onclick="toggleInlineHidden(this)">▼ Show more</button>' : '';
  const emptyBlock = msg => `<div class="ret-owner-empty">${safe(msg)}</div>`;

  const actionRows = [
    ...(details.delayedRenewals||[]).map(x=>({kind:'Delayed Renewal', tone:'red', icon:'!', name:x.companyName||x.name, url:x.companyUrl||x.hubspotUrl, desc:`Renewal date ${x.contractRenewalDate||x.originalContractRenewalDate||'—'} passed · ${fmt(x.renewalValue||x.amount||0)} · ${x.reason||'No current-year Booked/Cashed renewal found'}`, badge:x.daysOverdue?`${x.daysOverdue}d overdue`:'Delayed'})),
    ...(details.noContactAccounts||[]).map(x=>({kind:'No Touch 30D', tone:'red', icon:'☎', name:x.companyName, url:x.companyUrl, desc:`No connected call or completed meeting for ${x.daysSinceActivity||'—'} days · RM ${x.rmOwnerName||'—'} · CSM ${x.csmOwnerName||'—'}`, badge:'Call now'})),
    ...(details.noMeetingAccounts||[]).map(x=>({kind:'No Meeting 90D', tone:'amber', icon:'📅', name:x.companyName, url:x.companyUrl, desc:`No completed meeting for ${x.daysSinceMeeting||'—'} days · latest touch ${x.lastActivityDate||'—'}`, badge:'Book meeting'})),
  ];

  const actionList = rows => rows.length ? rows.map((r,i)=>`
    <div class="ret-action-item ${hidden(i)}" style="--dot:${r.tone==='amber'?'var(--amber)':'var(--red)'};--dot-bg:${r.tone==='amber'?'var(--amber-bg)':'var(--red-bg)'}">
      <div class="ret-action-dot">${r.icon}</div>
      <div class="ret-action-main"><div class="ret-action-name">${recordLink(r.name||r.kind,r.url)}</div><div class="ret-action-desc">${safe(r.desc)}</div></div>
      <span class="badge ${r.tone==='amber'?'ba':'br'}">${safe(r.badge)}</span>
    </div>`).join('') + showMore(rows) : emptyBlock('No priority actions for this owner.');

  const card = (title,badge,content,colorVar='var(--green)') => `
    <div class="ret-clean-card" style="--cc:${colorVar}">
      <div class="ret-clean-hd"><div class="ret-clean-title">${title}</div><span class="badge bb">${badge}</span></div>
      ${content}
    </div>`;

  const simpleTable = (headers, rows, rowFn, emptyMsg='No rows found') => rows.length ? `
    <div class="ret-compact-table" style="overflow-x:auto"><table class="tbl"><thead><tr>${headers.map(h=>`<th${h.c?' class="c"':''}>${h.t}</th>`).join('')}</tr></thead><tbody>${rows.map((r,i)=>rowFn(r,i)).join('')}</tbody></table></div>${showMore(rows)}` : emptyBlock(emptyMsg);

  const moneyCell = v => `<span style="font-family:var(--mono);font-weight:900">${fmt(v||0)}</span>`;
  const monthKey = v => { const s = String(v || '').trim(); return s && s.length >= 7 ? s.slice(0,7) : 'No date'; };

  const renewalRows = [...(details.delayedRenewals||[]), ...(details.renewalAttention||[]), ...(details.renewedDeals||[])].filter((v,i,a)=>a.findIndex(x=>(x.companyId||x.id||x.name)===(v.companyId||v.id||v.name) && (x.status||x.stageType)===(v.status||v.stageType))===i);

  const monthMap = {};
  for(const row of renewalRows){
    const month = monthKey(row.contractRenewalDate || row.originalContractRenewalDate || row.renewalDate);
    const status = String(row.status || row.stageType || row.renewalType || '').toLowerCase();
    if(!monthMap[month]) monthMap[month] = {month, due:0, delayed:0, renewed:0, upcoming:0, value:0};
    monthMap[month].due += 1;
    monthMap[month].value += Number(row.renewalValue || row.amount || 0);
    if(status.includes('delayed')) monthMap[month].delayed += 1;
    else if(status.includes('renewed') || status.includes('cashed') || status.includes('booked')) monthMap[month].renewed += 1;
    else monthMap[month].upcoming += 1;
  }
  const renewalMonthRows = Object.values(monthMap).sort((a,b)=>String(a.month).localeCompare(String(b.month)));

  const renewalMonthTable = simpleTable(
    [{t:'Renewal Month'},{t:'Due',c:1},{t:'Renewed',c:1},{t:'Delayed',c:1},{t:'Upcoming',c:1},{t:'Value',c:1}],
    renewalMonthRows,
    (r,i)=>`<tr class="${r.delayed?'ret-row-critical':r.upcoming?'ret-row-warning':'ret-row-ok'} ${hidden(i)}"><td><b>${safe(r.month)}</b></td><td class="c"><button class="ret-num-link" onclick="openRetOwnerSlice('${safe(repId)}','month','${safe(r.month)}','due')">${r.due}</button></td><td class="c"><span class="badge bg"><button class="ret-num-link" onclick="openRetOwnerSlice('${safe(repId)}','month','${safe(r.month)}','renewed')">${r.renewed}</button></span></td><td class="c"><span class="badge ${r.delayed?'br':'bg'}"><button class="ret-num-link" onclick="openRetOwnerSlice('${safe(repId)}','month','${safe(r.month)}','delayed')">${r.delayed}</button></span></td><td class="c"><span class="badge ba"><button class="ret-num-link" onclick="openRetOwnerSlice('${safe(repId)}','month','${safe(r.month)}','upcoming')">${r.upcoming}</button></span></td><td class="c">${moneyCell(r.value)}</td></tr>`,
    'No renewal months found for this owner.'
  );

  const renewalTable = simpleTable(
    [{t:'Account / Deal'},{t:'Renewal',c:1},{t:'Value',c:1},{t:'Type',c:1},{t:'Status',c:1}],
    byDateAsc(renewalRows),
    (d,i)=>{ const st=d.status||d.stageType||'—'; return `<tr class="${/delayed/i.test(st)?'ret-row-critical':/upcoming/i.test(st)?'ret-row-warning':'ret-row-ok'} ${hidden(i)}"><td>${recordLink(d.companyName||d.name||'Account',d.companyUrl||d.hubspotUrl)}<div style="font-size:10px;color:var(--muted)">${recordLink(d.name||d.renewalSourceDealName||'Deal',d.hubspotUrl||d.renewalSourceDealUrl)}</div></td><td class="c">${safe(d.contractRenewalDate||d.originalContractRenewalDate)}</td><td class="c">${moneyCell(d.renewalValue||d.amount)}</td><td class="c">${safe(d.renewalType||d.stageType||'—')}</td><td class="c"><span class="badge ${/delayed/i.test(st)?'br':/upcoming/i.test(st)?'ba':'bg'}">${safe(st)}</span></td></tr>`; },
    'No renewal movement for this owner.'
  );

  const financialRows = [
    ...(details.cashedDeals||[]).map(d=>({...d, bucket:'Cashed'})),
    ...(details.bookedDeals||[]).map(d=>({...d, bucket:'Booked'})),
    ...(details.renewedDeals||[]).map(d=>({...d, bucket:'Renewed'})),
    ...(details.churnDeals||[]).map(d=>({...d, bucket:'Churn'})),
  ];
  const financialTable = simpleTable(
    [{t:'Deal / Company'},{t:'Bucket',c:1},{t:'Created',c:1},{t:'Value',c:1},{t:'Reason / Product'}],
    byAmountDesc(financialRows),
    (d,i)=>`<tr class="${d.bucket==='Churn'?'ret-row-critical':d.bucket==='Renewed'||d.bucket==='Cashed'?'ret-row-ok':d.bucket==='Booked'?'ret-row-warning':''} ${hidden(i)}"><td>${recordLink(d.name||d.companyName,d.hubspotUrl||d.companyUrl)}<div style="font-size:10px;color:var(--muted)">${recordLink(d.companyName,d.companyUrl)}</div></td><td class="c"><span class="badge ${d.bucket==='Churn'?'br':d.bucket==='Booked'?'bp':'bg'}">${safe(d.bucket)}</span></td><td class="c">${safe(d.createdAt||d.renewedDealCreatedAt||d.actionDate)}</td><td class="c">${moneyCell(d.amount||d.renewalValue)}</td><td>${safe(d.churnReason||d.product||d.statusReason||'—')}</td></tr>`,
    'No Booked / Cashed / Renewed movement for this owner.'
  );

  const noTouchTable = simpleTable(
    [{t:'Account'},{t:'Last Touch',c:1},{t:'Days',c:1},{t:'RM / CSM'},{t:'Action',c:1}],
    details.noContactAccounts||[],
    (a,i)=>`<tr class="ret-row-critical ${hidden(i)}"><td>${recordLink(a.companyName,a.companyUrl)}</td><td class="c">${safe(a.lastActivityDate||'—')}</td><td class="c"><span class="badge br">${safe(a.daysSinceActivity||'—')}d</span></td><td>${safe(a.rmOwnerName||'—')} / ${safe(a.csmOwnerName||'—')}</td><td class="c"><span class="badge br">Call now</span></td></tr>`,
    'No no-touch accounts over 30 days.'
  );

  const accountsTable = simpleTable(
    [{t:'Account'},{t:'Status',c:1},{t:'RM Touch',c:1},{t:'CSM Touch',c:1},{t:'Next Action',c:1}],
    details.accounts||[],
    (a,i)=>{ const bad=Number(a.daysSinceActivity||0)>30||Number(a.daysSinceMeeting||0)>90; const act=Number(a.daysSinceActivity||0)>30?'Call now':Number(a.daysSinceMeeting||0)>90?'Book meeting':'Healthy'; return `<tr class="${bad?'ret-row-warning':'ret-row-ok'} ${hidden(i)}"><td>${recordLink(a.companyName,a.companyUrl)}<div style="font-size:10px;color:var(--muted)">RM ${safe(a.rmOwnerName)} · CSM ${safe(a.csmOwnerName)}</div></td><td class="c">${safe(a.accountStatus)}</td><td class="c">${safe(a.rmLastTouch||a.rmLastCall||a.rmLastMeeting)}</td><td class="c">${safe(a.csmLastTouch||a.csmLastCall||a.csmLastMeeting)}</td><td class="c"><span class="badge ${bad?'ba':'bg'}">${act}</span></td></tr>`; },
    'No owned accounts found.'
  );

  const html = `
    <div class="ret-owner-page">
      <div class="ret-owner-clean-hero" style="--oc:${color}">
        <div class="ret-owner-clean-avatar">${safe(details.name||'?').charAt(0)}</div>
        <div style="flex:1;position:relative;z-index:1"><div class="ret-owner-clean-name">${safe(details.name)} <span class="ret">${safe(details.role)}</span></div><div class="ret-owner-clean-sub">Focused owner page: renewals by month, no-touch accounts, Booked / Cashed / Renewed movement, and owned accounts only. Lists show first ${limit} rows.</div></div>
        <div class="ret-owner-clean-actions"><div class="ret-owner-clean-stat"><div class="ret-owner-clean-stat-v" style="color:${riskCount?'var(--red)':'var(--green)'}">${riskCount}</div><div class="ret-owner-clean-stat-l">Actions</div></div><div class="ret-owner-clean-stat"><div class="ret-owner-clean-stat-v" style="color:var(--cyan)">${m.accounts||0}</div><div class="ret-owner-clean-stat-l">Accounts</div></div><div class="ret-owner-clean-stat"><div class="ret-owner-clean-stat-v" style="color:var(--green)">${fmt(revenueValue)}</div><div class="ret-owner-clean-stat-l">Revenue</div></div></div>
      </div>
      ${ownerKpiHtml}
      <div class="ret-focus-strip">${focus(m.delayed||0,'Delayed Renewals','Renewal passed with no current-year Booked/Cashed','var(--red)','delayed')}${focus(m.noContact||0,'No Touch 30D','Needs connected call or completed meeting','var(--amber)','notouch')}${focus(`${m.booked||0} / ${m.cashed||0}`,'Booked / Cashed','Current-year created deals','var(--purple)','financial')}${focus(m.renewed||0,'Renewed','Same-company renewal movement','var(--green)','renewed')}</div>
      <div id="retOwnerClickPanel" class="ret-drill-panel" style="display:none"></div>
      ${card('⚡ Manager Focus', `${actionRows.length} actions`, `<div class="ret-action-list">${actionList(actionRows)}</div>`, actionRows.length?'var(--red)':'var(--green)')}
      <div class="ret-clean-grid">${card('📅 Renewals by Month', `${renewalMonthRows.length} months`, renewalMonthTable, 'var(--amber)')}${card('💰 Booked / Cashed / Renewed', `${financialRows.length} rows`, financialTable, 'var(--green)')}</div>
      <div class="ret-clean-grid">${card('☎️ No Touch 30D', `${(details.noContactAccounts||[]).length} accounts`, noTouchTable, 'var(--red)')}${card('🏢 Accounts Owned', `${(details.accounts||[]).length} accounts`, accountsTable, 'var(--cyan)')}</div>
      ${card('🔁 Renewal Details', `${renewalRows.length} rows`, renewalTable, 'var(--blue)')}
    </div>`;

  if(mount) mount.innerHTML = html;
  if(oldBody){
    $('retOwnerDetailTitle').textContent = `${details.name} · ${details.role} manager page`;
    $('retOwnerDetailBadge').textContent = `${m.accounts||0} accounts · ${riskCount} actions`;
    oldBody.innerHTML = html;
  }
}


function toggleInlineHidden(btn){
  const parent = btn.closest('.ret-clean-card, .ret-action-list, .card, .ret-compact-table, .ret-clean-grid, #retAlertList') || btn.parentElement;
  if(!parent) return;
  const hiddenItems = [...parent.querySelectorAll('.ret-hidden')];
  const willShow = hiddenItems.some(el => getComputedStyle(el).display === 'none');
  hiddenItems.forEach(el => {
    if(willShow){
      el.classList.add('ret-showing');
      if(el.tagName === 'TR') el.style.display = 'table-row';
      else if(el.classList.contains('ret-action-item') || el.classList.contains('ret-alert-row')) el.style.display = 'flex';
      else el.style.display = '';
    } else {
      el.classList.remove('ret-showing');
      el.style.display = 'none';
    }
  });
  btn.textContent = willShow ? '▲ Show less' : '▼ Show more';
}

function toggleRetMore(bodyId, btn){
  const body = $(bodyId);
  if(!body) return;
  const rows = [...body.querySelectorAll('.ret-hidden')];
  const willShow = rows.some(row => getComputedStyle(row).display === 'none');
  rows.forEach(row => {
    if(willShow){
      row.classList.add('ret-showing');
      row.style.display = row.tagName === 'TR' ? 'table-row' : 'flex';
    } else {
      row.classList.remove('ret-showing');
      row.style.display = 'none';
    }
  });
  if(btn) btn.textContent = willShow ? '▲ Show less' : '▼ Show more';
}




/* Removed duplicate Acquisition follow-up/table injection patch. */


/* Removed duplicate Acquisition follow-up/table injection patch. */


/* Removed duplicate Acquisition follow-up/table injection patch. */


/* Removed duplicate Acquisition follow-up/table injection patch. */

/* ═══════════════════════════════════════════
   RETENTION OWNER + FINANCIAL DATA-SAFE PATCH
   Scope: Retention only. Acquisition remains untouched.
   Fixes:
   1) Rebuilds Retention RM/CSM sidebar if repData/ownerMatrix is missing.
   2) Retention Financial Booked/Cashed uses:
      - retention pipeline when available
      - Booked/Cashed stage
      - Booked: dealstage = Booked and date entered current stage = current year
      - Cashed: dealstage = Cashed and date entered current stage = current year
   ═══════════════════════════════════════════ */
(function(){
  var RET_FIN_RETENTION_PIPELINE_ID = '1026934003';
  var RET_FIN_BOOKED_STAGE_ID = '1435517125';
  var RET_FIN_CASHED_STAGE_ID = '1479506164';

  function byId(id){ return document.getElementById(id); }
  function asArray(v){ return Array.isArray(v) ? v : []; }
  function safe(v){ return (typeof esc === 'function') ? esc(v == null ? '—' : v) : String(v == null ? '—' : v); }
  function money(v){ return (typeof fmt === 'function') ? fmt(v || 0) : ('$' + Math.round(Number(v || 0)).toLocaleString()); }
  function num(v){ var n = Number(v || 0); return isFinite(n) ? n : 0; }
  function link(label,url){ return (typeof recordLink === 'function') ? recordLink(label, url) : safe(label || 'Open record'); }
  function set(id, html){ var el = byId(id); if(el) el.innerHTML = html; }
  function setText(id, txt){ var el = byId(id); if(el) el.textContent = txt; }
  function currentYear(){ return new Date().getFullYear(); }

  function prop(row, key){
    if(!row) return undefined;
    if(row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
    if(row.properties && row.properties[key] !== undefined && row.properties[key] !== null && row.properties[key] !== '') return row.properties[key];
    if(row.json && row.json[key] !== undefined && row.json[key] !== null && row.json[key] !== '') return row.json[key];
    if(row.json && row.json.properties && row.json.properties[key] !== undefined && row.json.properties[key] !== null && row.json.properties[key] !== '') return row.json.properties[key];
    return undefined;
  }
  function first(row, keys){
    for(var i=0;i<keys.length;i++){
      var v = prop(row, keys[i]);
      if(v !== undefined && v !== null && String(v).trim() !== '') return v;
    }
    return null;
  }
  function parseYear(value){
    if(value === undefined || value === null || String(value).trim() === '') return null;
    var s = String(value).trim();
    var m = s.match(/^(\d{4})-\d{2}-\d{2}/);
    if(m) return Number(m[1]);
    if(/^\d+$/.test(s)){
      var n = Number(s);
      var ms = n > 1e12 ? n : n > 1e9 ? n * 1000 : n;
      var d = new Date(ms);
      return isNaN(d.getTime()) ? null : d.getFullYear();
    }
    var parsed = new Date(s);
    return isNaN(parsed.getTime()) ? null : parsed.getFullYear();
  }
  function isCY(value){ return parseYear(value) === currentYear(); }
  function yearMonthNumber(value){
    if(value === undefined || value === null || String(value).trim() === '') return null;
    var s = String(value).trim();
    var m = s.match(/^(\d{4})-(\d{2})-\d{2}/);
    if(m) return Number(m[1]) * 100 + Number(m[2]);
    if(/^\d+$/.test(s)){
      var n = Number(s);
      var ms = n > 1e12 ? n : n > 1e9 ? n * 1000 : n;
      var d = new Date(ms);
      return isNaN(d.getTime()) ? null : d.getFullYear() * 100 + (d.getMonth() + 1);
    }
    var parsed = new Date(s);
    return isNaN(parsed.getTime()) ? null : parsed.getFullYear() * 100 + (parsed.getMonth() + 1);
  }
  function isDateInYearMonthRange(value, startYear, startMonth, endYear, endMonth){
    var ym = yearMonthNumber(value);
    if(!ym) return false;
    return ym >= (startYear * 100 + startMonth) && ym <= (endYear * 100 + endMonth);
  }
  function dateText(value){
    if(value === undefined || value === null || String(value).trim() === '') return '—';
    var s = String(value).trim();
    var m = s.match(/^(\d{4}-\d{2}-\d{2})/);
    if(m) return m[1];
    if(/^\d+$/.test(s)){
      var n = Number(s);
      var ms = n > 1e12 ? n : n > 1e9 ? n * 1000 : n;
      var d = new Date(ms);
      return isNaN(d.getTime()) ? '—' : d.toISOString().slice(0,10);
    }
    var parsed = new Date(s);
    return isNaN(parsed.getTime()) ? s : parsed.toISOString().slice(0,10);
  }
  function stageEnteredDate(row, bucket){
    // FINAL rule: Retention financial is filtered by deal stage + date entered current stage only.
    // For current Booked deals, current-stage date = date entered Booked.
    // For current Cashed deals, current-stage date = date entered Cashed.
    return first(row, [
      'currentStageDateEntered',
      'hs_v2_date_entered_current_stage',
      'hs_date_entered_current_stage',
      'dateEnteredCurrentStage',
      'date_entered_current_stage',
      'stageDate',
      'actionDate'
    ]);
  }
  function contractStartDate(row){
    return first(row, [
      'contract_start_date',
      'contractStartDate',
      'contractStart',
      'startDate'
    ]);
  }
  function isContractStartAllowed(row){
    // Informational only now. Retention Booked/Cashed financial matching no longer depends on contract_start_date.
    return true;
  }
  function pipeline(row){ return String(first(row, ['pipeline','pipelineId']) || '').trim(); }
  function stage(row){ return String(first(row, ['dealstage','stageId','stage','stageType','renewalType']) || '').trim(); }
  function amount(row){
    var raw = first(row, ['amount_in_home_currency','amountInHomeCurrency','amount','renewalValue','value','revenue']);
    var n = Number(String(raw == null ? 0 : raw).replace(/[^0-9.-]/g,''));
    return isFinite(n) ? n : 0;
  }
  function ownerLabel(row){ return [row && row.ownerName, row && row.rmOwnerName, row && row.csmOwnerName].filter(Boolean).slice(0,2).join(' / ') || '—'; }
  function rowClass(i, kind){ return (i >= 5 ? 'ret-hidden ' : '') + (kind === 'risk' ? 'ret-row-critical' : kind === 'ok' ? 'ret-row-ok' : 'ret-row-warning'); }
  function empty(cols,msg){ return '<tr><td colspan="' + cols + '" class="ret-fin-empty">' + safe(msg) + '</td></tr>'; }

  function stageOk(row, bucket){
    var stRaw = stage(row);
    if(!stRaw) return true; // dealsSplit.booked/cashed is already bucketed by the workflow.
    var st = stRaw.toLowerCase();
    if(bucket === 'booked') return st === RET_FIN_BOOKED_STAGE_ID || /booked|booking/.test(st);
    if(bucket === 'cashed') return st === RET_FIN_CASHED_STAGE_ID || /cashed|cash|closed won|closedwon/.test(st);
    return false;
  }
  function pipelineOk(row){
    var p = pipeline(row);
    return !p || p === RET_FIN_RETENTION_PIPELINE_ID;
  }
  function matchesRetentionFinancial(row, bucket){
    return pipelineOk(row) && stageOk(row, bucket) && isCY(stageEnteredDate(row, bucket));
  }
  function filtered(rows, bucket){ return asArray(rows).filter(function(row){ return matchesRetentionFinancial(row, bucket); }); }
  function total(rows){ return asArray(rows).reduce(function(s,row){ return s + amount(row); }, 0); }
  function uniqueFinancialRows(rows){
    var seen = {};
    return asArray(rows).filter(function(row, i){
      var key = String(first(row, ['id','hs_object_id','dealId']) || row.hubspotUrl || row.dealUrl || row.name || row.dealName || i) + '|' + String(stage(row)) + '|' + String(amount(row));
      if(seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }
  function gatherFinancialRows(data, bucket){
    data = data || window.R || {};
    var split = data.dealsSplit || {};
    var rows = [];
    if(bucket === 'booked'){
      rows = rows.concat(asArray(split.booked), asArray(data.bookedDeals), asArray(data.booked), asArray(data.financialBookedDeals));
    }
    if(bucket === 'cashed'){
      rows = rows.concat(asArray(split.cashed), asArray(data.cashedDeals), asArray(data.cashed), asArray(data.financialCashedDeals));
    }
    // Some outputs put all deals in one array, so we also scan generic deal arrays and filter by stage.
    rows = rows.concat(asArray(data.deals).filter(function(row){ return stageOk(row, bucket); }));
    rows = rows.concat(asArray(data.renewedDeals).filter(function(row){ return stageOk(row, bucket); }));
    rows = rows.concat(asArray(split.renewed).filter(function(row){ return stageOk(row, bucket); }));

    var ownerDetails = data.ownerDetails || {};
    Object.keys(ownerDetails).forEach(function(id){
      var od = ownerDetails[id] || {};
      if(bucket === 'booked') rows = rows.concat(asArray(od.bookedDeals), asArray(od.booked));
      if(bucket === 'cashed') rows = rows.concat(asArray(od.cashedDeals), asArray(od.cashed));
      rows = rows.concat(asArray(od.deals).filter(function(row){ return stageOk(row, bucket); }));
      rows = rows.concat(asArray(od.renewedDeals).filter(function(row){ return stageOk(row, bucket); }));
    });
    return uniqueFinancialRows(rows);
  }
  function filteredSplit(data){
    data = data || window.R || {};
    var bookedSource = gatherFinancialRows(data, 'booked');
    var cashedSource = gatherFinancialRows(data, 'cashed');
    return {
      bookedSource: bookedSource,
      cashedSource: cashedSource,
      booked: filtered(bookedSource, 'booked'),
      cashed: filtered(cashedSource, 'cashed')
    };
  }

  function normalizeRole(role){
    role = String(role || '').toUpperCase();
    if(role.indexOf('CSM') >= 0) return 'CSM';
    if(role.indexOf('RM') >= 0) return 'RM';
    return role || 'Owner';
  }
  function buildRetentionOwners(data){
    data = data || {};

    // IMPORTANT: do not invent owners from ownerDetails/accounts/deals.
    // The Supabase retention model already has the correct official owner list in repData
    // with the real role (RM or CSM). Building owners from account rows caused
    // CSMs to appear again as RM and created duplicated sidebar rows.
    var source = asArray(data.repData);

    // Estimate only if repData is missing. Keep role-specific sources separated.
    if(!source.length){
      source = [].concat(
        asArray(data.rmMatrix).map(function(r){ return Object.assign({}, r, { role: 'RM' }); }),
        asArray(data.csmMatrix).map(function(r){ return Object.assign({}, r, { role: 'CSM' }); })
      );
    }
    if(!source.length){
      source = asArray(data.ownerMatrix);
    }

    var map = {};
    var colors = ['#2563EB','#0891B2','#7C3AED','#16A34A','#D97706','#DC2626','#0E7490','#4F46E5','#be185d','#6B7280'];

    source.forEach(function(r){
      var id = String(r.id || r.ownerId || r.rmOwnerId || r.csmOwnerId || r.name || r.ownerName || '').trim();
      var name = String(r.name || r.ownerName || r.rmOwnerName || r.csmOwnerName || id || '').trim();
      var role = normalizeRole(r.role || r.type);
      if(!name && !id) return;
      if(!role || role === 'Owner'){
        if(asArray(data.rmMatrix).some(function(x){ return String(x.id || x.ownerId || x.rmOwnerId) === id; })) role = 'RM';
        else if(asArray(data.csmMatrix).some(function(x){ return String(x.id || x.ownerId || x.csmOwnerId) === id; })) role = 'CSM';
      }
      var key = role + ':' + id;
      if(map[key]) return;
      map[key] = Object.assign({}, r, {
        id: id,
        name: name,
        role: role || 'Owner',
        color: r.color || colors[Object.keys(map).length % colors.length],
        accounts: num(r.accounts || r.activeAccounts || 0),
        activeAccounts: num(r.activeAccounts || r.accounts || 0)
      });
    });

    return Object.keys(map).map(function(k){ return map[k]; }).filter(function(r){
      return String(r.name || '').trim() && !/^unknown|—|-$/i.test(String(r.name || '').trim());
    }).sort(function(a,b){
      var ar = a.role === 'RM' ? 0 : a.role === 'CSM' ? 1 : 2;
      var br = b.role === 'RM' ? 0 : b.role === 'CSM' ? 1 : 2;
      return ar - br || String(a.name).localeCompare(String(b.name));
    });
  }
  function normalizeRetentionData(){
    if(!window.R) return [];
    var owners = buildRetentionOwners(window.R);
    // Keep a normalized display list for sidebar/financial owner rows,
    // but do not mutate the original JSON role logic elsewhere.
    window.R.__displayOwners = owners;
    return owners;
  }
  window.retGetOwnerList = function(){ return normalizeRetentionData(); };

  window.renderRetentionSidebar = function(activeMode){
    activeMode = activeMode || 'overview';
    var side = byId('sideRepLinks');
    if(!side) return;
    var data = window.R || {};
    var repData = normalizeRetentionData();
    var fin = filteredSplit(data);
    side.style.display = 'block';
    var title = byId('repsSectionTitle');
    if(title){ title.style.display = 'block'; title.textContent = 'Retention'; }
    var links = [
      '<button class="nav-item' + (activeMode === 'overview' ? ' active' : '') + '" id="side-ret-overview" onclick="switchMainPanel(\'retention\')"><span class="nav-icon" style="color:var(--cyan)">🛡️</span>Team Overview<span class="view-tag">VIEW</span></button>',
      '<button class="nav-item' + (activeMode === 'financial' ? ' active' : '') + '" id="side-ret-financial" onclick="switchRetentionFinancial()"><span class="nav-icon" style="color:var(--green)">💰</span>Financial Details<span class="nav-badge">' + fin.booked.length + '/' + fin.cashed.length + '</span></button>',
      '<div class="sidebar-section" style="padding:12px 10px 5px;margin:0;font-size:8px">Retention Team</div>'
    ];
    if(!repData.length){
      links.push('<div style="padding:8px 16px;color:rgba(139,173,138,.72);font-size:10px;line-height:1.45">No RM / CSM owners in Supabase retention views</div>');
    }
    repData.forEach(function(r){
      var color = r.color || 'var(--cyan)';
      var short = String(r.name || '').split(' ')[0] || 'Owner';
      var active = activeMode === 'owner' && String(window.RET_SELECTED_OWNER_ID || '') === String(r.id) ? ' active' : '';
      var badge = r.accounts || r.activeAccounts || 0;
      links.push('<button class="nav-item' + active + '" id="side-ret-' + safe(r.id) + '" onclick="selectRetentionOwner(\'' + safe(r.id) + '\')"><span class="nav-icon" style="color:' + color + '">' + (r.role === 'RM' ? '◆' : '●') + '</span>' + safe(short) + ' <span class="ret">' + safe(r.role || '') + '</span><span class="nav-badge">' + badge + '</span></button>');
    });
    side.innerHTML = links.join('');
  };

  window.renderRetentionFinancialDetails = function(){
    var data = window.R || {};
    normalizeRetentionData();
    var split = data.dealsSplit || {};
    var fin = filteredSplit(data);
    var booked = fin.booked;
    var cashed = fin.cashed;
    var renewed = asArray(split.renewed);
    var delayed = asArray(data.delayedRenewals || data.accountsToRenew);
    var churn = asArray(split.churn);
    var repData = data.repData || [];
    var ownerDetails = data.ownerDetails || {};
    var y = currentYear();

    set('retFinTopGrid', [
      {v: money(total(cashed)), l:'Cashed CY', s: cashed.length + ' deals · current stage date ' + y, c:'var(--green)'},
      {v: money(total(booked)), l:'Booked CY', s: booked.length + ' deals · current stage date ' + y, c:'var(--purple)'},
      {v: money(total(renewed)), l:'Renewed Value', s: renewed.length + ' renewed companies', c:'var(--cyan)'},
      {v: money(total(delayed)), l:'Delayed Exposure', s: delayed.length + ' overdue renewals', c:'var(--red)'},
      {v: money(total(churn)), l:'Churn Value', s: churn.length + ' churn deals', c:'var(--amber)'}
    ].map(function(x){ return '<div class="ret-fin-card" style="--fc:' + x.c + '"><div class="ret-fin-card-v">' + x.v + '</div><div class="ret-fin-card-l">' + x.l + '</div><div class="ret-fin-card-s">' + x.s + '</div></div>'; }).join(''));

    setText('retFinCashedBadge', cashed.length + ' · ' + money(total(cashed)));
    setText('retFinBookedBadge', booked.length + ' · ' + money(total(booked)));
    setText('retFinRenewedBadge', renewed.length + ' · ' + money(total(renewed)));
    setText('retFinDelayedBadge', delayed.length + ' · ' + money(total(delayed)));
    setText('retFinOwnerBadge', repData.length + ' owners · CY rule');

    function dealRow(row,i,kind,status){
      var stageDate = stageEnteredDate(row, status === 'Cashed' ? 'cashed' : status === 'Booked' ? 'booked' : null);
      var startDate = contractStartDate(row);
      return '<tr class="' + rowClass(i, kind) + '"><td><div style="font-weight:900">' + link(row.name || row.dealName || row.dealname || 'Unnamed Deal', row.hubspotUrl || row.dealUrl) + '</div><div style="font-size:10px;color:var(--muted)">' + link(row.companyName || 'Unknown Company', row.companyUrl) + '</div></td><td>' + safe(ownerLabel(row)) + '</td><td class="c" style="font-family:var(--mono);font-weight:900">' + money(amount(row)) + '</td><td class="c">' + safe(dateText(startDate)) + '</td><td class="c">' + safe(dateText(stageDate)) + '</td><td class="c"><span class="badge ' + (kind === 'ok' ? 'bg' : kind === 'risk' ? 'br' : 'bp') + '">' + safe(status) + '</span></td></tr>';
    }

    set('retFinCashedBody', cashed.length ? cashed.map(function(r,i){ return dealRow(r,i,'ok','Cashed'); }).join('') : empty(6, 'No cashed retention deals matched: current-stage date ' + y + '.'));
    set('retFinBookedBody', booked.length ? booked.map(function(r,i){ return dealRow(r,i,'warn','Booked'); }).join('') : empty(6, 'No booked retention deals matched: current-stage date ' + y + '.'));
    var cT = byId('retFinCashedToggle'); if(cT) cT.style.display = cashed.length > 5 ? 'block' : 'none';
    var bT = byId('retFinBookedToggle'); if(bT) bT.style.display = booked.length > 5 ? 'block' : 'none';

    set('retFinRenewedBody', renewed.length ? renewed.map(function(r,i){ return '<tr class="' + rowClass(i,'ok') + '"><td><div style="font-weight:900">' + link(r.companyName || 'Unknown Company', r.companyUrl) + '</div><div style="font-size:10px;color:var(--muted)">' + safe(r.renewalSourceDealName || r.sourceDealName || '') + '</div></td><td>' + link(r.name || r.renewedDealName || 'Renewed deal', r.hubspotUrl || r.renewedDealUrl) + '</td><td class="c" style="font-family:var(--mono);font-weight:900">' + money(r.renewalValue == null ? r.amount : r.renewalValue) + '</td><td class="c">' + safe(r.originalContractRenewalDate || r.contractRenewalDate) + '</td><td class="c"><span class="badge ' + (/cash/i.test(String(r.renewalType || '')) ? 'bg' : 'bp') + '">' + safe(r.renewalType || 'Renewed') + '</span></td><td>' + safe([r.rmOwnerName,r.csmOwnerName].filter(Boolean).join(' / ')) + '</td></tr>'; }).join('') : empty(6,'No renewed companies found under the current-year renewal logic.'));
    set('retFinDelayedBody', delayed.length ? delayed.map(function(r,i){ return '<tr class="' + rowClass(i,'risk') + '"><td><div style="font-weight:900">' + link(r.companyName || r.name || r.dealName || 'Renewal', r.companyUrl || r.hubspotUrl) + '</div><div style="font-size:10px;color:var(--muted)">' + safe(r.reason || r.alert || 'Delayed renewal') + '</div></td><td>' + safe([r.rmOwnerName,r.csmOwnerName].filter(Boolean).join(' / ') || r.ownerName) + '</td><td class="c" style="font-family:var(--mono);font-weight:900;color:var(--red)">' + money(r.renewalValue == null ? r.amount : r.renewalValue) + '</td><td class="c">' + safe(r.contractRenewalDate || r.renewalDate) + '</td><td class="c"><span class="badge br">' + num(r.daysOverdue) + 'd</span></td><td class="c"><span class="badge ba">Follow up</span></td></tr>'; }).join('') : empty(6,'No delayed renewal exposure found.'));
    var rT = byId('retFinRenewedToggle'); if(rT) rT.style.display = renewed.length > 5 ? 'block' : 'none';
    var dT = byId('retFinDelayedToggle'); if(dT) dT.style.display = delayed.length > 5 ? 'block' : 'none';

    var filteredOwnerStats = {};
    repData.forEach(function(r){ filteredOwnerStats[String(r.id)] = { booked:0, cashed:0, cashValue:0 }; });
    function matchOwners(row){
      var ids = [row && row.ownerId, row && row.rmOwnerId, row && row.csmOwnerId, row && row.hubspot_owner_id, first(row, ['hubspot_owner_id'])].filter(Boolean).map(String);
      var names = [row && row.ownerName, row && row.rmOwnerName, row && row.csmOwnerName].filter(Boolean).map(String);
      return repData.filter(function(r){ return ids.indexOf(String(r.id)) >= 0 || names.indexOf(String(r.name)) >= 0; });
    }
    booked.forEach(function(row){ matchOwners(row).forEach(function(r){ filteredOwnerStats[String(r.id)].booked += 1; }); });
    cashed.forEach(function(row){ matchOwners(row).forEach(function(r){ filteredOwnerStats[String(r.id)].cashed += 1; filteredOwnerStats[String(r.id)].cashValue += amount(row); }); });

    var head = ['Owner','Booked','Cashed','Renewed','Delayed','Cash Value'];
    var rows = repData.map(function(r){
      var original = (ownerDetails[String(r.id)] && ownerDetails[String(r.id)].metrics) || r || {};
      var filteredMetrics = filteredOwnerStats[String(r.id)] || {booked:0,cashed:0,cashValue:0};
      var renewedCount = num(original.renewed);
      var delayedCount = num(original.delayed);
      return '<div class="ret-fin-owner-cell"><div class="ret-fin-owner-name"><span class="ret-fin-dot" style="--oc:' + (r.color || 'var(--cyan)') + '"></span>' + safe(r.name) + ' <span class="ret">' + safe(r.role || '') + '</span></div></div>' +
        '<div class="ret-fin-owner-cell" style="font-family:var(--mono);font-weight:900">' + num(filteredMetrics.booked) + '</div>' +
        '<div class="ret-fin-owner-cell" style="font-family:var(--mono);font-weight:900;color:var(--green)">' + num(filteredMetrics.cashed) + '</div>' +
        '<div class="ret-fin-owner-cell" style="font-family:var(--mono);font-weight:900;color:var(--cyan)">' + renewedCount + '</div>' +
        '<div class="ret-fin-owner-cell" style="font-family:var(--mono);font-weight:900;color:' + (delayedCount > 0 ? 'var(--red)' : 'var(--green)') + '">' + delayedCount + '</div>' +
        '<div class="ret-fin-owner-cell" style="font-family:var(--mono);font-weight:900;color:var(--green)">' + money(filteredMetrics.cashValue) + '</div>';
    }).join('');
    set('retFinOwnerGrid', head.map(function(h){ return '<div class="ret-fin-owner-cell ret-fin-owner-head">' + h + '</div>'; }).join('') + (rows || '<div class="ret-fin-empty" style="grid-column:1/-1">No owner financial summary found.</div>'));

    if(window.console && console.info){
      console.info('[Retention Financial Rule]', {
        year: y,
        rule: 'Booked/Cashed: deal stage is Booked or Cashed and date entered current stage is current year. Retention only; Acquisition untouched.',
        owners: repData.length,
        bookedSource: fin.bookedSource.length,
        bookedMatched: booked.length,
        cashedSource: fin.cashedSource.length,
        cashedMatched: cashed.length
      });
    }
  };

  window.selectRetentionOwner = function(repId){
    normalizeRetentionData();
    var data = window.R || {};
    var rep = (data.repData || []).find(function(r){ return String(r.id) === String(repId); });
    if(!rep) return;
    APP_MAIN_PANEL = 'retention';
    APP_RETENTION_VIEW = 'owner';
    APP_RETENTION_OWNER_ID = String(repId);
    RET_SELECTED_OWNER_ID = String(repId);
    RETENTION_SUBVIEW = 'owner';
    document.querySelectorAll('.tab-btn').forEach(function(t){ t.classList.remove('active'); });
    document.querySelectorAll('.panel').forEach(function(p){ p.classList.remove('active'); });
    document.querySelectorAll('.nav-item').forEach(function(n){ n.classList.remove('active'); });
    var tabs = byId('tabsBar'); if(tabs) tabs.style.display = 'none';
    byId('side-retention') && byId('side-retention').classList.add('active');
    byId('panel-retention') && byId('panel-retention').classList.add('active');
    if(typeof setRetentionOwnerMode === 'function') setRetentionOwnerMode(true);
    window.renderRetentionSidebar('owner');
    var title = byId('topbarTitle'); if(title) title.textContent = 'Retention · ' + rep.name;
    var sub = byId('topbarSub'); if(sub) sub.textContent = (rep.role || 'Owner') + ' · owner page · priority actions, financial movement, activity quality';
    if(typeof window.renderRetention === 'function') window.renderRetention();
    if(typeof window.renderRetentionOwnerDetails === 'function') window.renderRetentionOwnerDetails(repId);
    window.scrollTo({top:0, behavior:'smooth'});
  };

  if(typeof window.loadData === 'function' && !window.loadData.__retentionOwnerFinancialWrapped){
    var oldLoadData = window.loadData;
    window.loadData = async function(){
      var result;
      try{
        result = oldLoadData.apply(this, arguments);
        if(result && typeof result.then === 'function') await result;
      } finally {
        normalizeRetentionData();
        if(window.APP_MAIN_PANEL === 'retention' || (byId('panel-retention') && byId('panel-retention').classList.contains('active')) || (byId('panel-retention-financial') && byId('panel-retention-financial').classList.contains('active'))){
          if(typeof window.renderRetention === 'function') window.renderRetention();
          if(typeof window.renderRetentionFinancialDetails === 'function') window.renderRetentionFinancialDetails();
          window.renderRetentionSidebar(window.APP_RETENTION_VIEW === 'financial' ? 'financial' : window.APP_RETENTION_VIEW === 'owner' ? 'owner' : 'overview');
        }
      }
      return result;
    };
    window.loadData.__retentionOwnerFinancialWrapped = true;
  }
})();



/* ═══════════════════════════════════════════
   RETENTION FINANCIAL DETAILS — SHEETS ONLY PATCH
   Scope: Retention Financial panel only.
   Source: R.retentionSheets2026 only.
   Acquisition is intentionally untouched.
   ═══════════════════════════════════════════ */
(function(){
  if(window.__retentionFinancialSheetsOnlyPatch) return;
  window.__retentionFinancialSheetsOnlyPatch = true;

  var MONTHS = [
    {key:'All', label:'All Months', short:'All'},
    {key:'Jan', label:'January', short:'Jan'},
    {key:'Feb', label:'February', short:'Feb'},
    {key:'Mar', label:'March', short:'Mar'},
    {key:'Apr', label:'April', short:'Apr'},
    {key:'May', label:'May', short:'May'},
    {key:'Jun', label:'June', short:'Jun'},
    {key:'Jul', label:'July', short:'Jul'},
    {key:'Aug', label:'August', short:'Aug'},
    {key:'Sep', label:'September', short:'Sep'},
    {key:'Oct', label:'October', short:'Oct'},
    {key:'Nov', label:'November', short:'Nov'},
    {key:'Dec', label:'December', short:'Dec'}
  ];

  window.RET_FIN_SHEET_MONTH = window.RET_FIN_SHEET_MONTH || 'All';

  function byId(id){ return document.getElementById(id); }
  function htmlSafe(v){
    return String(v == null ? '' : v)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }
  function money(v){
    if(typeof window.fmt === 'function') return window.fmt(Number(v || 0));
    var n = Number(v || 0);
    if(!isFinite(n) || !n) return '$0';
    if(Math.abs(n) >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
    if(Math.abs(n) >= 1000) return '$' + Math.round(n / 1000) + 'K';
    return '$' + Math.round(n).toLocaleString();
  }
  function number(v){
    var n = Number(String(v == null ? 0 : v).replace(/[^0-9.-]/g,''));
    return isFinite(n) ? n : 0;
  }
  function asArray(v){ return Array.isArray(v) ? v : []; }
  function set(id, value){ var el = byId(id); if(el) el.innerHTML = value; }
  function setText(id, value){ var el = byId(id); if(el) el.textContent = value; }
  function norm(v){ return String(v || '').trim().toLowerCase().replace(/\s+/g,' '); }
  function selectedMonth(){ return window.RET_FIN_SHEET_MONTH || 'All'; }
  function monthLabel(key){
    var item = MONTHS.find(function(m){ return m.key === key; });
    return item ? item.label : 'All Months';
  }
  function statusClass(status){
    var s = norm(status);
    if(s.indexOf('late') >= 0) return 'ba';
    if(s.indexOf('delayed') >= 0) return 'br';
    if(s.indexOf('renewed on time') >= 0 || s === 'renewed') return 'bg';
    if(s.indexOf('upcoming') >= 0) return 'bb';
    return 'bp';
  }
  function productKey(row){
    var p = norm(row && row.product);
    if(p.indexOf('talentera') >= 0) return 'Talentera';
    if(p.indexOf('after') >= 0) return 'AfterHire';
    if(p.indexOf('evalufy') >= 0) return 'Evalufy';
    return row && row.product ? String(row.product) : 'Talentera';
  }
  function monthlyValue(row, bucket, month){
    if(!row) return 0;
    if(!month || month === 'All'){
      return bucket === 'booked' ? number(row.bookedValue) : number(row.collectedValue);
    }
    var map = bucket === 'booked' ? row.bookingByMonth : row.collectionByMonth;
    var p = productKey(row);
    var cell = map && map[month];
    if(cell){
      var direct = number(cell[p]);
      if(direct) return direct;
      var sum = 0;
      Object.keys(cell).forEach(function(k){ sum += number(cell[k]); });
      if(sum) return sum;
    }
    var rowMonth = bucket === 'booked' ? row.bookingMonth : row.collectionMonth;
    var total = bucket === 'booked' ? number(row.bookedValue) : number(row.collectedValue);
    return rowMonth === month ? total : 0;
  }
  function renewalValueForMonth(row, month){
    if(!row) return 0;
    if(!month || month === 'All') return number(row.renewalValue2026);
    return row.renewalMonth === month ? number(row.renewalValue2026) : 0;
  }
  function rowIncluded(row, month){
    if(!row) return false;
    if(!month || month === 'All') return true;
    return row.renewalMonth === month || monthlyValue(row, 'booked', month) > 0 || monthlyValue(row, 'collected', month) > 0;
  }
  function dueStatusIncluded(row, month){
    if(!row) return false;
    if(!month || month === 'All') return true;
    return row.renewalMonth === month;
  }
  function sheetsData(){
    var data = window.R || {};
    return data.retentionSheets2026 || {};
  }
  function sheetAccounts(){
    return asArray(sheetsData().accounts);
  }
  function filteredAccounts(){
    var m = selectedMonth();
    return sheetAccounts().filter(function(row){ return rowIncluded(row, m); });
  }
  function dueRows(rows, statusNeedle){
    var m = selectedMonth();
    return rows.filter(function(row){
      return norm(row.status).indexOf(statusNeedle) >= 0 && dueStatusIncluded(row, m);
    });
  }
  function remainingFor(row, month){
    return Math.max(monthlyValue(row, 'booked', month) - monthlyValue(row, 'collected', month), 0);
  }
  function rowKey(row){
    return String(row.gid || '') + '|' + norm(row.clientName) + '|' + norm(row.product);
  }
  function groupOwners(rows){
    var m = selectedMonth();
    var map = {};
    function add(ownerName, role, row){
      ownerName = String(ownerName || '').trim();
      if(!ownerName) return;
      var key = role + ':' + ownerName.toLowerCase();
      if(!map[key]) map[key] = { name: ownerName, role: role, accounts: {}, renewal: 0, booked: 0, collected: 0, remaining: 0 };
      map[key].accounts[rowKey(row)] = true;
      map[key].renewal += renewalValueForMonth(row, m);
      map[key].booked += monthlyValue(row, 'booked', m);
      map[key].collected += monthlyValue(row, 'collected', m);
      map[key].remaining += remainingFor(row, m);
    }
    rows.forEach(function(row){
      add(row.rm, 'RM', row);
      add(row.csm, 'CSM', row);
    });
    return Object.keys(map).map(function(k){
      var x = map[k];
      x.accountCount = Object.keys(x.accounts).length;
      return x;
    }).sort(function(a,b){
      return (a.role === b.role ? 0 : a.role === 'RM' ? -1 : 1) || a.name.localeCompare(b.name);
    });
  }
  function rowClass(i, kind){
    return (i >= 10 ? 'ret-hidden ' : '') + (kind === 'risk' ? 'ret-row-critical' : kind === 'ok' ? 'ret-row-ok' : 'ret-row-warning');
  }
  function empty(cols, msg){ return '<tr><td colspan="' + cols + '" class="ret-fin-empty">' + htmlSafe(msg) + '</td></tr>'; }
  function badge(status){ return '<span class="badge ' + statusClass(status) + '">' + htmlSafe(status || '—') + '</span>'; }
  function cellMoney(v, color){ return '<span style="font-family:var(--mono);font-weight:900;color:' + color + '">' + money(v) + '</span>'; }
  function ownerText(row){ return [row.rm ? 'RM: ' + row.rm : '', row.csm ? 'CSM: ' + row.csm : ''].filter(Boolean).join(' · ') || '—'; }

  function ensureFilterUI(){
    var panel = byId('panel-retention-financial');
    if(!panel) return;
    var heroTitle = panel.querySelector('.ret-fin-hero-title');
    var heroSub = panel.querySelector('.ret-fin-hero-sub');
    if(heroTitle) heroTitle.textContent = 'Retention Financial Details — Sheets Only';
    if(heroSub) heroSub.textContent = 'This view no longer uses HubSpot financial/deal rows. Renewal value, booked value, collection, remaining collection, delayed and renewed-late logic are read only from the three Google Sheets inside retentionSheets2026.';

    var styleId = 'retFinSheetsOnlyStyles';
    if(!byId(styleId)){
      var style = document.createElement('style');
      style.id = styleId;
      style.textContent = '.ret-sheet-filter-card{background:var(--surface);border:1px solid var(--border);border-top:3px solid var(--cyan);border-radius:var(--r-lg);box-shadow:var(--sh);margin-bottom:14px;overflow:hidden}.ret-sheet-filter-inner{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:13px 18px;background:var(--surface2);border-bottom:1px solid var(--border)}.ret-sheet-filter-left{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.ret-sheet-label{font-size:10px;font-weight:900;color:var(--text2);text-transform:uppercase;letter-spacing:.1em}.ret-sheet-select{height:34px;padding:0 11px;border:1px solid var(--border);border-radius:9px;background:#fff;font-size:11px;font-weight:800;color:var(--text2);font-family:var(--font)}.ret-sheet-note{font-size:10px;color:var(--muted);font-weight:800}.ret-sheet-source{padding:10px 18px;background:#fff;font-size:10px;color:var(--muted);font-weight:700;line-height:1.55}.ret-sheet-pill{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--border);border-radius:999px;padding:4px 8px;background:var(--surface);font-size:9px;font-weight:900;color:var(--text2);margin-right:5px}.ret-fin-top-grid{grid-template-columns:repeat(6,1fr)}@media(max-width:1200px){.ret-fin-top-grid{grid-template-columns:repeat(3,1fr)}}@media(max-width:700px){.ret-fin-top-grid{grid-template-columns:1fr}}';
      document.head.appendChild(style);
    }

    var filter = byId('retFinSheetFilter');
    if(!filter){
      filter = document.createElement('div');
      filter.id = 'retFinSheetFilter';
      filter.className = 'ret-sheet-filter-card';
      var hero = panel.querySelector('.ret-fin-hero');
      if(hero && hero.parentNode) hero.parentNode.insertBefore(filter, hero.nextSibling);
    }
    var options = MONTHS.map(function(m){ return '<option value="' + m.key + '"' + (selectedMonth() === m.key ? ' selected' : '') + '>' + m.label + '</option>'; }).join('');
    var src = sheetsData().sourceSheets || {};
    filter.innerHTML = '<div class="ret-sheet-filter-inner"><div class="ret-sheet-filter-left"><span class="ret-sheet-label">Month Filter</span><select class="ret-sheet-select" id="retFinMonthSelect" onchange="RET_FIN_SHEET_MONTH=this.value; renderRetentionFinancialDetails();"><option value="All"' + (selectedMonth()==='All'?' selected':'') + '>All Months</option>' + options.replace('<option value="All" selected>All Months</option>','').replace('<option value="All">All Months</option>','') + '</select><span class="ret-sheet-note">Applies to all cards, owner summary and tables.</span></div><span class="badge bb">Sheets only</span></div><div class="ret-sheet-source"><span class="ret-sheet-pill">Budget: ' + htmlSafe(src.budget || '1- 2026 Budget') + '</span><span class="ret-sheet-pill">Booking: ' + htmlSafe(src.booking || 'Retention Accounts Booking') + '</span><span class="ret-sheet-pill">Collection: ' + htmlSafe(src.collection || 'Retention Accounts Collection') + '</span><span class="ret-sheet-pill">Last updated: ' + htmlSafe(sheetsData().lastUpdated || (window.R && window.R.generatedAt) || '—') + '</span></div>';
  }

  function updateStaticLabels(){
    var panel = byId('panel-retention-financial');
    if(!panel) return;
    var boardTitle = panel.querySelector('.ret-fin-board-title');
    if(boardTitle) boardTitle.innerHTML = '📊 Sheet Owner Summary';
    var subs = panel.querySelectorAll('.ret-fin-subtitle');
    if(subs[0]) subs[0].innerHTML = '💵 Collection From Sheets';
    if(subs[1]) subs[1].innerHTML = '📝 Booked From Sheets';
    if(subs[2]) subs[2].innerHTML = '📋 Renewal Overview From Sheets';
    if(subs[3]) subs[3].innerHTML = '🚨 Delayed / Renewed Late From Sheets';
    var notes = panel.querySelectorAll('.ret-fin-mini-note');
    if(notes[0]) notes[0].textContent = 'Source = Retention Accounts Collection. Month filter uses collection month / product columns from the sheet only.';
    if(notes[1]) notes[1].textContent = 'Source = Retention Accounts Booking. Month filter uses booking month / product columns from the sheet only.';
    if(notes[2]) notes[2].textContent = 'Source = 1- 2026 Budget. Shows renewal value, renewal month, product, RM, CSM and sheet renewal status.';
    if(notes[3]) notes[3].textContent = 'Delayed = renewal month passed with no booking. Renewed Late = booking month after renewal month. Both are calculated from the sheets output.';

    function setHead(bodyId, html){
      var body = byId(bodyId);
      var table = body && body.closest('table');
      var head = table && table.querySelector('thead tr');
      if(head) head.innerHTML = html;
    }
    setHead('retFinCashedBody','<th>Client</th><th>RM / CSM</th><th class="c">Product</th><th class="c">Collection Month</th><th class="c">Collected</th><th class="c">Remaining</th>');
    setHead('retFinBookedBody','<th>Client</th><th>RM / CSM</th><th class="c">Product</th><th class="c">Booking Month</th><th class="c">Booked</th><th class="c">Status</th>');
    setHead('retFinRenewedBody','<th>Client</th><th>GID</th><th class="c">Product</th><th class="c">Renewal Month</th><th class="c">Renewal Value</th><th class="c">Sheet Status</th>');
    setHead('retFinDelayedBody','<th>Client</th><th>RM</th><th>CSM</th><th class="c">Product</th><th class="c">Renewal Month</th><th class="c">Value / Status</th>');
  }

  window.renderRetentionSidebar = function(activeMode){
    activeMode = activeMode || 'overview';
    var side = byId('sideRepLinks');
    if(!side) return;
    var data = window.R || {};
    var repData = typeof window.retGetOwnerList === 'function' ? window.retGetOwnerList() : asArray(data.repData || data.ownerMatrix);
    var accounts = sheetAccounts();
    var bookedCount = accounts.filter(function(a){ return number(a.bookedValue) > 0; }).length;
    var collectedCount = accounts.filter(function(a){ return number(a.collectedValue) > 0; }).length;
    side.style.display = 'block';
    var title = byId('repsSectionTitle');
    if(title){ title.style.display = 'block'; title.textContent = 'Retention'; }
    var links = [
      '<button class="nav-item' + (activeMode === 'overview' ? ' active' : '') + '" id="side-ret-overview" onclick="switchMainPanel(\'retention\')"><span class="nav-icon" style="color:var(--cyan)">🛡️</span>Team Overview<span class="view-tag">VIEW</span></button>',
      '<button class="nav-item' + (activeMode === 'financial' ? ' active' : '') + '" id="side-ret-financial" onclick="switchRetentionFinancial()"><span class="nav-icon" style="color:var(--green)">💰</span>Financial Details<span class="nav-badge">' + bookedCount + '/' + collectedCount + '</span></button>',
      '<div class="sidebar-section" style="padding:12px 10px 5px;margin:0;font-size:8px">Retention Team</div>'
    ];
    if(!repData.length){
      links.push('<div style="padding:8px 16px;color:rgba(139,173,138,.72);font-size:10px;line-height:1.45">No RM / CSM owners in Supabase retention views</div>');
    }
    repData.forEach(function(r){
      var color = r.color || 'var(--cyan)';
      var short = String(r.name || '').split(' ')[0] || 'Owner';
      var active = activeMode === 'owner' && String(window.RET_SELECTED_OWNER_ID || '') === String(r.id) ? ' active' : '';
      var badgeValue = r.accounts || r.activeAccounts || 0;
      links.push('<button class="nav-item' + active + '" id="side-ret-' + htmlSafe(r.id) + '" onclick="selectRetentionOwner(\'' + htmlSafe(r.id) + '\')"><span class="nav-icon" style="color:' + color + '">' + (r.role === 'RM' ? '◆' : '●') + '</span>' + htmlSafe(short) + ' <span class="ret">' + htmlSafe(r.role || '') + '</span><span class="nav-badge">' + badgeValue + '</span></button>');
    });
    side.innerHTML = links.join('');
  };

  window.switchRetentionFinancial = function(){
    window.APP_MAIN_PANEL = 'retention';
    window.APP_RETENTION_VIEW = 'financial';
    window.APP_RETENTION_OWNER_ID = null;
    window.RET_SELECTED_OWNER_ID = null;
    window.RETENTION_SUBVIEW = 'financial';
    if(typeof window.setRetentionOwnerMode === 'function') window.setRetentionOwnerMode(false);
    document.querySelectorAll('.tab-btn').forEach(function(t){ t.classList.remove('active'); });
    document.querySelectorAll('.panel').forEach(function(p){ p.classList.remove('active'); });
    document.querySelectorAll('.nav-item').forEach(function(n){ n.classList.remove('active'); });
    var tabs = byId('tabsBar'); if(tabs) tabs.style.display = 'none';
    byId('side-retention') && byId('side-retention').classList.add('active');
    byId('panel-retention-financial') && byId('panel-retention-financial').classList.add('active');
    window.renderRetentionSidebar('financial');
    var title = byId('topbarTitle'); if(title) title.textContent = 'Retention · Financial Details';
    var sub = byId('topbarSub'); if(sub) sub.textContent = 'Sheets only · 1- 2026 Budget + Booking + Collection · Month filter applied to all financial tables';
    window.renderRetentionFinancialDetails();
    window.scrollTo({top:0, behavior:'smooth'});
  };

  window.renderRetentionFinancialDetails = function(){
    var data = window.R || {};
    ensureFilterUI();
    updateStaticLabels();
    var rs = sheetsData();
    var all = sheetAccounts();
    var rows = filteredAccounts();
    var m = selectedMonth();
    var monthText = monthLabel(m);

    if(!rs || !all.length){
      set('retFinTopGrid','<div class="ret-fin-card" style="--fc:var(--red);grid-column:1/-1"><div class="ret-fin-card-v">No Sheet Data</div><div class="ret-fin-card-l">retentionSheets2026 missing</div><div class="ret-fin-card-s">Run the n8n sheet workflow and make sure Supabase retention views contains retentionSheets2026.accounts.</div></div>');
      set('retFinOwnerGrid','<div class="ret-fin-empty" style="grid-column:1/-1">No owner summary because retentionSheets2026.accounts is empty.</div>');
      set('retFinCashedBody', empty(6,'No collection rows from sheets.'));
      set('retFinBookedBody', empty(6,'No booking rows from sheets.'));
      set('retFinRenewedBody', empty(6,'No renewal overview rows from sheets.'));
      set('retFinDelayedBody', empty(6,'No delayed / renewed-late rows from sheets.'));
      return;
    }

    var renewalTotal = rows.reduce(function(s,r){ return s + renewalValueForMonth(r,m); }, 0);
    var bookedTotal = rows.reduce(function(s,r){ return s + monthlyValue(r,'booked',m); }, 0);
    var collectedTotal = rows.reduce(function(s,r){ return s + monthlyValue(r,'collected',m); }, 0);
    var remainingTotal = rows.reduce(function(s,r){ return s + remainingFor(r,m); }, 0);
    var delayedRows = dueRows(rows, 'delayed');
    var lateRows = dueRows(rows, 'late');
    var upcomingRows = dueRows(rows, 'upcoming');

    set('retFinTopGrid', [
      {v: money(renewalTotal), l:'Renewal Value', s: rows.length + ' accounts · ' + monthText, c:'var(--cyan)'},
      {v: money(bookedTotal), l:'Booked Value', s: rows.filter(function(r){ return monthlyValue(r,'booked',m) > 0; }).length + ' rows · Booking sheet', c:'var(--purple)'},
      {v: money(collectedTotal), l:'Cash Collected', s: rows.filter(function(r){ return monthlyValue(r,'collected',m) > 0; }).length + ' rows · Collection sheet', c:'var(--green)'},
      {v: money(remainingTotal), l:'Booked Not Cash', s:'Booked - Cash collected · ' + monthText, c:'var(--blue)'},
      {v: delayedRows.length.toLocaleString(), l:'Delayed Accounts', s:'Due month passed · no booking/collection', c:'var(--red)'},
      {v: lateRows.length.toLocaleString(), l:'Renewed Late', s:'Booking after renewal month', c:'var(--amber)'}
    ].map(function(x){ return '<div class="ret-fin-card" style="--fc:' + x.c + '"><div class="ret-fin-card-v">' + x.v + '</div><div class="ret-fin-card-l">' + x.l + '</div><div class="ret-fin-card-s">' + x.s + '</div></div>'; }).join(''));

    setText('retFinCashedBadge', rows.filter(function(r){ return monthlyValue(r,'collected',m) > 0; }).length + ' · ' + money(collectedTotal));
    setText('retFinBookedBadge', rows.filter(function(r){ return monthlyValue(r,'booked',m) > 0; }).length + ' · ' + money(bookedTotal));
    setText('retFinRenewedBadge', rows.length + ' · ' + money(renewalTotal));
    setText('retFinDelayedBadge', (delayedRows.length + lateRows.length) + ' action rows');

    var owners = groupOwners(rows);
    var ownerGrid = byId('retFinOwnerGrid');
    if(ownerGrid) ownerGrid.style.gridTemplateColumns = '1.15fr .45fr .65fr .85fr .85fr .85fr .85fr';
    setText('retFinOwnerBadge', owners.length + ' sheet owners · ' + monthText);
    ensureRetExportButton('retFinOwnerBadge','retFinOwnerGrid','retention-owner-financial-summary');
    var ownerHead = ['Owner','Role','Accounts','Renewal','Booked','Collected','Remaining'];
    var ownerHtml = owners.map(function(o){
      return '<div class="ret-fin-owner-cell"><div class="ret-fin-owner-name"><span class="ret-fin-dot" style="--oc:' + (o.role === 'RM' ? 'var(--blue)' : 'var(--cyan)') + '"></span>' + htmlSafe(o.name) + '</div></div>' +
        '<div class="ret-fin-owner-cell"><span class="ret">' + htmlSafe(o.role) + '</span></div>' +
        '<div class="ret-fin-owner-cell" style="font-family:var(--mono);font-weight:900">' + o.accountCount.toLocaleString() + '</div>' +
        '<div class="ret-fin-owner-cell" style="font-family:var(--mono);font-weight:900;color:var(--cyan)">' + money(o.renewal) + '</div>' +
        '<div class="ret-fin-owner-cell" style="font-family:var(--mono);font-weight:900;color:var(--purple)">' + money(o.booked) + '</div>' +
        '<div class="ret-fin-owner-cell" style="font-family:var(--mono);font-weight:900;color:var(--green)">' + money(o.collected) + '</div>' +
        '<div class="ret-fin-owner-cell" style="font-family:var(--mono);font-weight:900;color:var(--blue)">' + money(o.remaining) + '</div>';
    }).join('');
    set('retFinOwnerGrid', ownerHead.map(function(h){ return '<div class="ret-fin-owner-cell ret-fin-owner-head">' + h + '</div>'; }).join('') + (ownerHtml || '<div class="ret-fin-empty" style="grid-column:1/-1">No RM/CSM values found in the sheet rows.</div>'));

    function clientCell(row){
      return '<div style="font-weight:900">' + htmlSafe(row.clientName || 'Unknown Client') + '</div><div style="font-size:10px;color:var(--muted)">GID: ' + htmlSafe(row.gid || '—') + ' · ' + htmlSafe(row.location || 'No location') + '</div>';
    }
    function collectionRow(row,i){
      var collected = monthlyValue(row,'collected',m);
      return '<tr class="' + rowClass(i,'ok') + '"><td>' + clientCell(row) + '</td><td>' + htmlSafe(ownerText(row)) + '</td><td class="c">' + htmlSafe(row.product || '—') + '</td><td class="c">' + htmlSafe(m === 'All' ? (row.collectionMonth || '—') : m) + '</td><td class="c">' + cellMoney(collected,'var(--green)') + '</td><td class="c">' + cellMoney(remainingFor(row,m),'var(--blue)') + '</td></tr>';
    }
    function bookingRow(row,i){
      var booked = monthlyValue(row,'booked',m);
      return '<tr class="' + rowClass(i,'warn') + '"><td>' + clientCell(row) + '</td><td>' + htmlSafe(ownerText(row)) + '</td><td class="c">' + htmlSafe(row.product || '—') + '</td><td class="c">' + htmlSafe(m === 'All' ? (row.bookingMonth || '—') : m) + '</td><td class="c">' + cellMoney(booked,'var(--purple)') + '</td><td class="c">' + badge(row.status) + '</td></tr>';
    }
    function overviewRow(row,i){
      return '<tr class="' + rowClass(i,'ok') + '"><td>' + clientCell(row) + '</td><td class="c" style="font-family:var(--mono)">' + htmlSafe(row.gid || '—') + '</td><td class="c">' + htmlSafe(row.product || '—') + '</td><td class="c">' + htmlSafe(row.renewalMonth || '—') + '</td><td class="c">' + cellMoney(renewalValueForMonth(row,m),'var(--cyan)') + '</td><td class="c">' + badge(row.renewalStatusFromSheet || row.status) + '</td></tr>';
    }
    function actionRow(row,i){
      var st = row.status || '—';
      var kind = norm(st).indexOf('delayed') >= 0 ? 'risk' : 'warn';
      return '<tr class="' + rowClass(i,kind) + '"><td>' + clientCell(row) + '</td><td>' + htmlSafe(row.rm || '—') + '</td><td>' + htmlSafe(row.csm || '—') + '</td><td class="c">' + htmlSafe(row.product || '—') + '</td><td class="c">' + htmlSafe(row.renewalMonth || '—') + '</td><td class="c">' + cellMoney(number(row.renewalValue2026),'var(--red)') + '<div style="margin-top:4px">' + badge(st) + '</div></td></tr>';
    }

    var collectionRows = rows.filter(function(r){ return monthlyValue(r,'collected',m) > 0; });
    var bookingRows = rows.filter(function(r){ return monthlyValue(r,'booked',m) > 0; });
    var actionRows = rows.filter(function(r){
      var s = norm(r.status);
      return (s.indexOf('delayed') >= 0 || s.indexOf('late') >= 0) && dueStatusIncluded(r,m);
    });

    set('retFinCashedBody', collectionRows.length ? collectionRows.map(collectionRow).join('') : empty(6, 'No collection rows found from the Collection sheet for ' + monthText + '.'));
    set('retFinBookedBody', bookingRows.length ? bookingRows.map(bookingRow).join('') : empty(6, 'No booking rows found from the Booking sheet for ' + monthText + '.'));
    set('retFinRenewedBody', rows.length ? rows.map(overviewRow).join('') : empty(6, 'No renewal accounts found from 1- 2026 Budget for ' + monthText + '.'));
    set('retFinDelayedBody', actionRows.length ? actionRows.map(actionRow).join('') : empty(6, 'No delayed or renewed-late accounts found for ' + monthText + '.'));

    [
      ['retFinCashedToggle', collectionRows.length],
      ['retFinBookedToggle', bookingRows.length],
      ['retFinRenewedToggle', rows.length],
      ['retFinDelayedToggle', actionRows.length]
    ].forEach(function(pair){
      var btn = byId(pair[0]);
      if(btn){ btn.style.display = pair[1] > 10 ? 'block' : 'none'; btn.textContent = '▼ Show more'; }
    });

    if(window.console && console.info){
      console.info('[Retention Financial Rule]', {
        rule: 'Sheets only. No HubSpot financial/deal rows are used in Retention Financial Details.',
        month: m,
        sourceSheets: rs.sourceSheets || {},
        accounts: rows.length,
        bookedValue: bookedTotal,
        collectedValue: collectedTotal,
        delayedAccounts: delayedRows.length,
        renewedLateAccounts: lateRows.length,
        upcomingAccounts: upcomingRows.length
      });
    }
  };
})();

function updateClock(){
  const now=new Date(),riy=new Date(now.toLocaleString("en-US",{timeZone:"Asia/Riyadh"}));
  if($("topbarSub")&&D && !$("panel-retention")?.classList.contains("active") && !$("panel-financial")?.classList.contains("active"))$("topbarSub").textContent=`${riy.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})} Riyadh · Manual refresh`;
}
setInterval(updateClock,60000);
window.__dashboardAutoRefreshTimer && clearInterval(window.__dashboardAutoRefreshTimer);

window.addEventListener('DOMContentLoaded', function(){ if(typeof window.loadData === 'function') window.loadData({ keepView:true, keepScroll:true }); }, { once:true });

// Smooth mode: full auto-refresh disabled. Use the Refresh button for a controlled data reload.
window.__dashboardAutoRefreshTimer = null;
window.TALENTERA_AUTO_REFRESH_DISABLED = true;

/* ═══════════════════════════════════════════
   ACQUISITION REP TABS — RESTORE YEST / MTD / YTD SUMMARY
   Scoped to Acquisition owner tabs only. Does not touch Retention or tables.
   ═══════════════════════════════════════════ */
(function(){
  if(window.__acqRepTabsPeriodSummaryRestored) return;
  window.__acqRepTabsPeriodSummaryRestored = true;

  function q(id){ return document.getElementById(id); }
  function slug(name){ return String(name || '').toLowerCase().replace(/\s/g,'-'); }
  function safe(v){
    return String(v ?? '')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }
  function money(v){
    try { return typeof fmt === 'function' ? fmt(Number(v || 0)) : ('$' + Math.round(Number(v || 0)).toLocaleString()); }
    catch(e){ return '$0'; }
  }
  function rateColor(v){
    var n = Number(v || 0);
    try { return typeof rcColor === 'function' ? rcColor(n) : (n >= 50 ? 'var(--green)' : n >= 30 ? 'var(--amber)' : 'var(--red)'); }
    catch(e){ return 'var(--muted)'; }
  }
  function shouldShowRep(rep){
    if(!rep || rep.type === 'view') return false;
    var n = String(rep.name || '').toLowerCase();
    return /marita|zein|ursula|ahmad|mohammed khalid|jehad/.test(n);
  }
  function cell(value,label,color,sub){
    return '<div class="ret-kpi-compact" style="--rk:'+color+';min-height:78px">' +
      '<div class="ret-kpi-v">'+safe(value)+'</div>' +
      '<div class="ret-kpi-l">'+safe(label)+'</div>' +
      (sub ? '<div class="ret-kpi-s">'+safe(sub)+'</div>' : '') +
    '</div>';
  }
  function periodRow(title, subtitle, color, stats){
    return '<div class="ret-kpi-period-row" style="--pc:'+color+';grid-template-columns:125px repeat(6,1fr)">' +
      '<div class="ret-kpi-period-label"><div class="ret-kpi-period-name">'+safe(title)+'</div><div class="ret-kpi-period-sub">'+safe(subtitle)+'</div></div>' +
      cell(stats.calls, 'Calls', 'var(--blue)', stats.connected + ' connected') +
      cell(stats.rate + '%', 'Conn. Rate', rateColor(stats.rate), stats.connected + '/' + stats.calls) +
      cell(stats.meetings, 'Meetings', 'var(--purple)', 'Completed only') +
      cell(stats.leads, 'Leads', '#0E7490', '↓' + stats.inbound + ' · ↑' + stats.outbound) +
      cell(stats.won, 'Won', 'var(--green)', money(stats.wonAmt)) +
      cell(stats.lost, 'Lost', 'var(--red)', money(stats.lostAmt)) +
    '</div>';
  }
  function summaryHtml(rep){
    var calls = rep.calls || {};
    var meetings = rep.meetings || {};
    var y = {
      calls: Number(calls.yest || 0),
      connected: Number(calls.yestConn || 0),
      rate: Number(rep.connRateYest || 0),
      meetings: Number(meetings.yest || 0),
      leads: Number(rep.leadsYest || 0),
      inbound: Number(rep.leadsYestInbound || 0),
      outbound: Number(rep.leadsYestOutbound || 0),
      won: Number(rep.wonYest || 0),
      wonAmt: Number(rep.wonAmtYest || 0),
      lost: Number(rep.lostYest || 0),
      lostAmt: Number(rep.lostAmtYest || 0)
    };
    var m = {
      calls: Number(calls.mtd || 0),
      connected: Number(calls.mtdConn || 0),
      rate: Number(rep.connRateMTD || 0),
      meetings: Number(meetings.mtd || 0),
      leads: Number(rep.leadsMTD || 0),
      inbound: Number(rep.leadsMTDInbound || 0),
      outbound: Number(rep.leadsMTDOutbound || 0),
      won: Number(rep.won || 0),
      wonAmt: Number(rep.wonAmt || 0),
      lost: Number(rep.lost || 0),
      lostAmt: Number(rep.lostAmt || 0)
    };
    var t = {
      calls: Number(calls.ytd || 0),
      connected: Number(calls.ytdConn || 0),
      rate: Number(rep.connRateYTD || 0),
      meetings: Number(meetings.ytd || 0),
      leads: Number(rep.leadsYTD || 0),
      inbound: Number(rep.leadsYTDInbound || 0),
      outbound: Number(rep.leadsYTDOutbound || 0),
      won: Number(rep.wonYTD || 0),
      wonAmt: Number(rep.wonAmtYTD || 0),
      lost: Number(rep.lostYTD || 0),
      lostAmt: Number(rep.lostAmtYTD || 0)
    };
    return '<div class="ret-kpi-master-card acq-rep-period-summary" data-acq-period-summary style="margin-bottom:14px;border-top-color:'+safe(rep.color || 'var(--green)')+'">' +
      '<div class="ret-kpi-master-hd"><div class="ret-kpi-master-title">📌 Yesterday · MTD · YTD Summary</div><span class="badge bb">'+safe(rep.name || 'Rep')+'</span></div>' +
      periodRow('Yesterday', 'daily execution', 'var(--blue)', y) +
      periodRow('MTD', 'month to date', 'var(--amber)', m) +
      periodRow('YTD', 'year to date', 'var(--green)', t) +
    '</div>';
  }
  function renderRepPeriod(rep){
    var panel = q('panel-' + slug(rep.name));
    if(!panel) return;
    panel.querySelectorAll('[data-acq-period-summary]').forEach(function(n){ n.remove(); });
    var hero = panel.querySelector('.rep-hero');
    if(hero) hero.insertAdjacentHTML('afterend', summaryHtml(rep));
    else panel.insertAdjacentHTML('afterbegin', summaryHtml(rep));
  }
  function renderAllRepPeriods(){
    if(!window.D || !Array.isArray(D.repData)) return;
    D.repData.filter(shouldShowRep).forEach(renderRepPeriod);
  }

  window.enhanceAcquisitionRepPeriodSummaries = renderAllRepPeriods;

  var prevInteractive = window.enhanceAcquisitionInteractiveViews;
  window.enhanceAcquisitionInteractiveViews = function(){
    var result;
    if(typeof prevInteractive === 'function') result = prevInteractive.apply(this, arguments);
    renderAllRepPeriods();
    return result;
  };
  try { enhanceAcquisitionInteractiveViews = window.enhanceAcquisitionInteractiveViews; } catch(e) {}

  var prevRender = window.render;
  if(typeof prevRender === 'function' && !prevRender.__acqRepPeriodsWrapped){
    window.render = function(){
      var res = prevRender.apply(this, arguments);
      setTimeout(renderAllRepPeriods, 0);
      setTimeout(renderAllRepPeriods, 200);
      return res;
    };
    window.render.__acqRepPeriodsWrapped = true;
    try { render = window.render; } catch(e) {}
  }

  var prevSwitchTab = window.switchTab;
  if(typeof prevSwitchTab === 'function' && !prevSwitchTab.__acqRepPeriodsWrapped){
    window.switchTab = function(){
      var res = prevSwitchTab.apply(this, arguments);
      setTimeout(renderAllRepPeriods, 0);
      return res;
    };
    window.switchTab.__acqRepPeriodsWrapped = true;
    try { switchTab = window.switchTab; } catch(e) {}
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(renderAllRepPeriods, 0); });
  else setTimeout(renderAllRepPeriods, 0);
})();
