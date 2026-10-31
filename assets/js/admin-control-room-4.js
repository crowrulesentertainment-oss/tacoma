/* Tacoma Community Hub · Admin Control Room 4.0
 * Event operations bridge. Read-only overview; detailed changes remain in the
 * dedicated New Year's Eve Event Control Room. Admin authorization is checked
 * independently before any event data is queried.
 */
(()=>{"use strict";
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
document.addEventListener("DOMContentLoaded",()=>{
 if(document.body.dataset.page!=="admin")return;
 const workspace=$("#admin-content");if(!workspace)return;
 let installed=false,db;
 const eventUrl="new-years-eve-2027/admin.html";
 const publicUrl="new-years-eve-2027/";
 const render=()=>{
  if(installed||workspace.classList.contains("hidden"))return;
  db=window.__hubSupabaseClient;if(!db)return;
  installed=true;
  const section=document.createElement("section");
  section.id="admin4-event-operations";section.className="admin4-event";
  section.innerHTML='<div class="admin4-event-head"><div><span class="eyebrow">TACOMA NIGHTS × TACOMA COMMUNITY HUB</span><h2>24 Hours of Tacoma · Event Operations</h2><p>One-day operations bridge for the December 31, 2026 noon – January 1, 2027 noon community broadcast. Use the dedicated event desk for schedule, crew, guest, volunteer and submission management.</p></div><div class="admin4-event-actions"><a class="primary" href="'+eventUrl+'">Open Event Control Room ↗</a><a href="'+publicUrl+'">Public event page ↗</a></div></div><div class="admin4-event-stats"><div class="admin4-event-stat"><b id="a4-programs">—</b><span>Schedule blocks</span></div><div class="admin4-event-stat"><b id="a4-teams">—</b><span>Hosting teams</span></div><div class="admin4-event-stat"><b id="a4-people">—</b><span>Hosts · guests · volunteers</span></div><div class="admin4-event-stat"><b id="a4-pending">—</b><span>Submissions awaiting review</span></div><div class="admin4-event-stat"><b id="a4-broadcast">—</b><span>Broadcast status</span></div></div><div class="admin4-event-foot"><span id="a4-state" class="admin4-event-status">Checking event operations…</span><span id="a4-updated">Not refreshed</span><button type="button" id="a4-refresh">↻ Refresh event overview</button></div><p class="admin4-event-note" id="a4-note" role="status" aria-live="polite">Event details are visible only to authorized Hub administrators.</p>';
  const nav=$(".admin-workspace-nav");if(nav){const a=document.createElement("a");a.href="#admin4-event-operations";a.textContent="Event operations";nav.append(a)}
  workspace.insertBefore(section,workspace.querySelector(".admin-workspace-footer")||null);
  const refresh=async()=>{
   const btn=$("#a4-refresh");if(btn)btn.disabled=true;
   $("#a4-state").className="admin4-event-status";$("#a4-state").textContent="Checking event operations…";$("#a4-note").textContent="Reading event management records.";
   try{
    const {data:{user},error:authError}=await db.auth.getUser();if(authError)throw authError;if(!user)throw Error("Sign in again to view event operations.");
    const {data:admin,error:roleError}=await db.from("hub_admins").select("role").eq("user_id",user.id).maybeSingle();if(roleError)throw roleError;if(String(admin?.role||"").toLowerCase()!=="admin"){section.hidden=true;const navLink=document.querySelector('.admin-workspace-nav a[href="#admin4-event-operations"]');if(navLink)navLink.hidden=true;throw Error("Event operations are restricted to Hub administrators.");}
    const opts={count:"exact",head:true};
    const [programs,teams,people,submissions,broadcast]=await Promise.all([
     db.from("tacoma_nye_schedule").select("id",opts).eq("event_key","nye_2026_2027"),
     db.from("tacoma_nye_teams").select("id",opts),
     db.from("tacoma_nye_people").select("id",opts),
     db.from("tacoma_nye_submissions").select("id",opts).in("status",["new","reviewing"]),
     db.from("tacoma_nye_broadcast").select("status").eq("event_key","nye_2026_2027").maybeSingle()
    ]);
    for(const [name,result] of [["Schedule",programs],["Teams",teams],["People",people],["Submissions",submissions],["Broadcast",broadcast]])if(result.error)throw Error(name+": "+result.error.message);
    $("#a4-programs").textContent=String(programs.count??0);$("#a4-teams").textContent=String(teams.count??0);$("#a4-people").textContent=String(people.count??0);$("#a4-pending").textContent=String(submissions.count??0);$("#a4-broadcast").textContent=String((broadcast.data?.status||"planning").toUpperCase());
    $("#a4-state").className="admin4-event-status is-live";$("#a4-state").textContent="Event database connected · administrator verified";$("#a4-note").textContent="This overview is read-only. Use the Event Control Room to make changes. Broadcast status is an operator-entered status; it does not verify a live YouTube signal.";
    $("#a4-updated").textContent="Updated "+new Date().toLocaleTimeString();
   }catch(error){$("#a4-state").className="admin4-event-status is-error";$("#a4-state").textContent="Event overview needs attention";$("#a4-note").textContent=error.message||"Could not load event data.";["a4-programs","a4-teams","a4-people","a4-pending","a4-broadcast"].forEach(id=>$("#"+id).textContent="—");}
   finally{if(btn)btn.disabled=false;}
  };
  $("#a4-refresh").addEventListener("click",refresh);refresh();
 };
 const observe=new MutationObserver(render);observe.observe(workspace,{attributes:true,attributeFilter:["class"]});render();
 dbReady();
 function dbReady(){let tries=0;const timer=setInterval(()=>{tries++;if(window.__hubSupabaseClient){db=window.__hubSupabaseClient;render();clearInterval(timer)}if(tries>=30)clearInterval(timer)},200)}
});
})();