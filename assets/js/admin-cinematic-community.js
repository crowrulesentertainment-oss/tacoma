/* Tacoma Community Hub — cinematic admin presentation enhancement.
   Visual-only: no Supabase calls, data mutations, or admin action overrides. */
(()=>{"use strict";
 const PHOTO="https://commons.wikimedia.org/wiki/Special:FilePath/Commencement_Bay,_Tacoma,_WA_-_2017-04-09_-_11.jpg?width=2200";
 const boot=()=>{
  if(!document.body.classList.contains("admin-page"))return;
  document.documentElement.classList.add("tacoma-cinematic-admin");
  const apply=()=>{
   const hero=document.querySelector(".admin-workspace-top");
   if(hero){hero.dataset.visualTheme="commencement-bay";hero.setAttribute("aria-label","Tacoma Community Hub operations dashboard");}
  };
  apply();
  const root=document.querySelector("#main");
  if(root)new MutationObserver(apply).observe(root,{childList:true,subtree:true});
  const probe=new Image();
  probe.onload=()=>document.documentElement.classList.add("tacoma-hero-photo-ready");
  probe.onerror=()=>document.documentElement.classList.add("tacoma-hero-photo-fallback");
  probe.src=PHOTO;
 };
 document.readyState==="loading"?document.addEventListener("DOMContentLoaded",boot,{once:true}):boot();
})();