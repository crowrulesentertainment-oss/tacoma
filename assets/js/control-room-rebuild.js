/* Control Room 2026 workspace orchestration. Does not replace or disable existing modules. */
(()=>{"use strict";
const boot=()=>{
 if(document.body.dataset.page!=="admin")return;
 const main=document.querySelector("#main");if(!main)return;
 let installed=false;
 const enhance=()=>{
  const w=document.querySelector("#admin-content");
  if(!w||w.classList.contains("hidden"))return false;
  if(installed)return true;installed=true;w.classList.add("cr-control-room");
  const top=w.querySelector(".admin-workspace-top");
  if(top&&!w.querySelector(".cr-console-intro")){
   const intro=document.createElement("div");intro.className="cr-console-intro";
   intro.innerHTML='<div><span class="eyebrow">TACOMA COMMUNITY HUB · OPERATIONS</span><h2>Community Operations Center</h2><p>One workspace for moderation, members, live conversation, community alerts, events and platform oversight.</p></div><div class="cr-console-clock"><span>LOCAL OPERATIONS TIME</span><strong id="cr-console-time">—</strong><small>America / Los Angeles</small></div>';
   top.insertAdjacentElement("afterend",intro);
  }
  const nav=w.querySelector(".admin-workspace-nav");
  const labels={"#admin-review":"Submission review","#admin-history-section":"Moderation history","#admin-reports-section":"Reports & corrections","#admin-chat-section":"Chat moderation","#admin-channels-section":"Channel management","#admin-homepage-section":"Homepage presentation","#admin-moderators-section":"Moderator access","#admin-traffic-records":"Traffic & records","#admin4-event-operations":"Event operations","#admin3-members":"Member services","#admin3-announcements":"Announcements","#admin3-activity":"Activity log","#admin3-health":"System health"};
  if(nav){nav.setAttribute("aria-label","Operations center navigation");nav.querySelectorAll("a").forEach(a=>{const label=labels[a.getAttribute("href")];if(label)a.textContent=label;});}
  const stats=w.querySelector(".admin-stats-grid");if(stats){stats.setAttribute("aria-label","Live community overview");}
  const topActions=w.querySelector(".admin-top-actions");
  if(topActions&&!topActions.querySelector(".cr-public-link")){const a=document.createElement("a");a.className="button cr-public-link";a.href="index.html";a.textContent="Open public Hub ↗";topActions.append(a);}
  const updateClock=()=>{const el=document.querySelector("#cr-console-time");if(el)el.textContent=new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit",second:"2-digit"}).format(new Date())};
  updateClock();setInterval(updateClock,1000);
  const refresh=document.querySelector("#admin-refresh-all");
  if(refresh&&!refresh.dataset.crBound){refresh.dataset.crBound="1";refresh.addEventListener("click",()=>{const s=document.querySelector("#admin-workspace-status");if(s)s.textContent="Refresh requested · updating available workspace records…"});}
  return true;
 };
 if(!enhance()){const mo=new MutationObserver(()=>{if(enhance())mo.disconnect()});mo.observe(main,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});setTimeout(()=>mo.disconnect(),30000);}
};
document.readyState==="loading"?document.addEventListener("DOMContentLoaded",boot,{once:true}):boot();
})();