/* Tacoma Community Hub · Control Room UX layer
   Presentation-only enhancements. Existing Supabase/RLS actions remain authoritative. */
(()=>{"use strict";
const ready=fn=>document.readyState==="loading"?document.addEventListener("DOMContentLoaded",fn,{once:true}):fn();
ready(()=>{
 if(document.body.dataset.page!=="admin")return;
 const main=document.querySelector("#main");if(!main)return;
 const install=()=>{
  const workspace=document.querySelector("#admin-content"),sections=[...document.querySelectorAll(".admin-workspace-section")];
  if(!workspace||!sections.length)return false;
  if(workspace.dataset.uxEnhanced==="true")return true;
  workspace.dataset.uxEnhanced="true";
  const nav=document.querySelector(".admin-workspace-nav");
  const bar=document.createElement("section");bar.className="admin-commandbar";bar.setAttribute("aria-label","Control Room quick tools");
  bar.innerHTML='<div class="admin-command-search"><span aria-hidden="true">⌕</span><input id="admin-command-search" type="search" placeholder="Search submissions, reports, chat and history…" aria-label="Search all Control Room records"><kbd>Ctrl K</kbd></div><div class="admin-command-actions"><button type="button" class="button" id="admin-expand-all">Expand all</button><button type="button" class="button" id="admin-collapse-all">Collapse all</button><a class="button" href="index.html">View public Hub ↗</a></div><div class="admin-command-results" id="admin-command-results" aria-live="polite"></div>';
  workspace.insertBefore(bar,workspace.firstChild);
  if(nav)nav.setAttribute("aria-label","Jump to Control Room workspace");
  const note=document.createElement("p");note.className="admin-enhancement-note";note.innerHTML='<strong>Operations tip:</strong> Use the search above to narrow visible records. Search only filters what is already loaded; database permissions continue to control every action.';bar.after(note);
  sections.forEach((section,index)=>{
   const head=section.querySelector(".admin-section-heading");if(!head)return;
   const content=[...section.children].filter(el=>el!==head);
   content.forEach(el=>el.setAttribute("data-admin-collapsible",""));
   const tools=document.createElement("div");tools.className="admin-section-tools";
   const count=document.createElement("span");count.className="admin-enhancement-count";count.textContent="Section "+String(index+1).padStart(2,"0");
   const toggle=document.createElement("button");toggle.type="button";toggle.textContent="Collapse section";toggle.setAttribute("aria-expanded","true");
   tools.append(count,toggle);head.append(tools);
   toggle.addEventListener("click",()=>{const collapsed=section.classList.toggle("admin-collapsed");toggle.textContent=collapsed?"Expand section":"Collapse section";toggle.setAttribute("aria-expanded",String(!collapsed))});
  });
  const search=document.querySelector("#admin-command-search"),results=document.querySelector("#admin-command-results");
  const searchable=()=>[
   ...document.querySelectorAll("#admin-queue tbody tr"),
   ...document.querySelectorAll("#admin-reports tbody tr"),
   ...document.querySelectorAll("#admin-chat-messages .admin-chat-item"),
   ...document.querySelectorAll("#admin-moderation-history tbody tr"),
   ...document.querySelectorAll("#admin-chat-channels .admin-channel-item")
  ];
  const applySearch=()=>{
   const term=(search.value||"").trim().toLowerCase();let shown=0,total=0;
   searchable().forEach(el=>{total++;const match=!term||(el.textContent||"").toLowerCase().includes(term);el.hidden=!match;if(match)shown++});
   sections.forEach(section=>{const own=[...section.querySelectorAll("#admin-queue tbody tr,#admin-reports tbody tr,#admin-chat-messages .admin-chat-item,#admin-moderation-history tbody tr,#admin-chat-channels .admin-channel-item")];section.classList.toggle("admin-search-empty",!!term&&own.length>0&&!own.some(x=>!x.hidden))});
   results.replaceChildren();
   if(term){const label=document.createElement("span");label.textContent=shown+" matching records · "+(total-shown)+" hidden";results.append(label);if(!shown){const empty=document.createElement("span");empty.textContent="No loaded records match that search.";results.append(empty)}}
   else{const label=document.createElement("span");label.textContent="Search spans the currently loaded review queue, reports, chat messages, moderation history and channel list.";results.append(label)}
  };
  search.addEventListener("input",applySearch);
  document.querySelector("#admin-expand-all").addEventListener("click",()=>sections.forEach(s=>{s.classList.remove("admin-collapsed");const b=s.querySelector(".admin-section-tools button");if(b){b.textContent="Collapse section";b.setAttribute("aria-expanded","true")}}));
  document.querySelector("#admin-collapse-all").addEventListener("click",()=>sections.forEach(s=>{s.classList.add("admin-collapsed");const b=s.querySelector(".admin-section-tools button");if(b){b.textContent="Expand section";b.setAttribute("aria-expanded","false")}}));
  document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();search.focus();search.select()}if(e.key==="Escape"&&document.activeElement===search){search.value="";applySearch();search.blur()}});
  if(nav&&"IntersectionObserver"in window){const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(!entry.isIntersecting)return;const link=nav.querySelector('a[href="#'+entry.target.id+'"]');nav.querySelectorAll("a").forEach(a=>a.removeAttribute("aria-current"));if(link)link.setAttribute("aria-current","location")})},{rootMargin:"-18% 0px -68% 0px"});sections.forEach(s=>observer.observe(s))}
  const refresh=document.querySelector("#admin-refresh-all");if(refresh){const indicator=document.createElement("span");indicator.className="admin-live-indicator";indicator.textContent="Live data refresh enabled";refresh.insertAdjacentElement("afterend",indicator)}
  const observer=new MutationObserver(()=>applySearch());["#admin-queue","#admin-reports","#admin-chat-messages","#admin-moderation-history","#admin-chat-channels"].forEach(sel=>{const el=document.querySelector(sel);if(el)observer.observe(el,{childList:true,subtree:true})});
  applySearch();return true;
 };
 if(install())return;
 const observer=new MutationObserver(()=>{if(install())observer.disconnect()});observer.observe(main,{childList:true,subtree:true});setTimeout(()=>observer.disconnect(),10000);
});
})();