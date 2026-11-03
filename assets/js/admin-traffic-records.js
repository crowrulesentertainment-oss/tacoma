/* Tacoma Community Hub · traffic records for administrators */
(()=>{"use strict";
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
document.addEventListener("DOMContentLoaded",()=>{
 if(document.body.dataset.page!=="admin")return;
 const workspace=$("#admin-content");if(!workspace)return;
 let installed=false,db;
 const install=async()=>{
  if(installed||workspace.classList.contains("hidden"))return;
  db=window.__hubSupabaseClient;if(!db)return;
  const {data:{user},error:authError}=await db.auth.getUser();if(authError||!user)return;
  const {data:admin,error}=await db.from("hub_admins").select("role").eq("user_id",user.id).maybeSingle();
  if(error||String(admin?.role||"").toLowerCase()!=="admin")return;
  installed=true;
  const nav=$(".admin-workspace-nav");
  if(nav&&!nav.querySelector('a[href="#admin-traffic-records"]')){const a=document.createElement("a");a.href="#admin-traffic-records";a.textContent="Traffic records";nav.append(a)}
  const section=document.createElement("section");section.id="admin-traffic-records";section.className="admin-traffic-records";
  section.innerHTML='<div class="atr-head"><div><span class="eyebrow">AUDIENCE & COMMUNITY ACTIVITY</span><h2>Traffic & engagement records</h2><p>All-time totals plus the strongest recorded calendar day, week and month. Views and submissions count events; chatters are unique participants in public chat.</p></div><button class="button" type="button" id="atr-refresh">↻ Refresh records</button></div><div class="atr-period-note" id="atr-since">Loading historical records…</div><div class="atr-grid" id="atr-grid"><div class="atr-loading">Loading analytics…</div></div><div class="atr-channel-section"><div class="atr-channel-heading"><div><h3>Most chatters by channel</h3><p>All-time unique participants per channel, alongside each channel's strongest day, week and month.</p></div></div><div class="atr-channel-table-wrap"><table class="atr-channel-table"><thead><tr><th>Chat channel</th><th>All-time people</th><th>Best day</th><th>Best week</th><th>Best month</th></tr></thead><tbody id="atr-channel-rows"><tr><td colspan="5">Loading channel records…</td></tr></tbody></table></div></div><p class="atr-footnote">Page-view tracking begins when this update reaches visitors. Earlier page views cannot be reconstructed. Submission and chat records use existing Hub history. Weeks are Monday–Sunday; months are calendar months. Chatters are deduplicated by member account, anonymous chat token, or nickname when no ID is available.</p><div class="atr-status" id="atr-status" role="status" aria-live="polite"></div>';
  workspace.insertBefore(section,workspace.querySelector(".admin-workspace-footer")||null);
  const render=async()=>{
   const btn=$("#atr-refresh");btn.disabled=true;$("#atr-status").textContent="Refreshing records…";
   try{
    const {data,error}=await db.rpc("hub_admin_traffic_records");if(error)throw error;
    const metrics=data||{},groups=[["views","Page views","Views"],["submits","Submissions","Submits"],["chatters","Unique chatters","People"]];
    $("#atr-grid").innerHTML=groups.map(([key,title,short])=>{const v=metrics[key]||{};return '<article class="atr-card"><div class="atr-card-title"><span>'+esc(title)+'</span><small>ACTIVITY HISTORY</small></div><div class="atr-values"><div><b>'+Number(v.all_time||0).toLocaleString()+'</b><span>All time</span></div><div><b>'+Number(v.day||0).toLocaleString()+'</b><span>Best day</span></div><div><b>'+Number(v.week||0).toLocaleString()+'</b><span>Best week</span></div><div><b>'+Number(v.month||0).toLocaleString()+'</b><span>Best month</span></div></div></article>'}).join("");
    const channels=Array.isArray(metrics.channel_chatters)?metrics.channel_chatters:[];
    $("#atr-channel-rows").innerHTML=channels.length?channels.map(c=>'<tr><th scope="row">'+esc(c.channel||c.room)+'<small>'+esc(c.room)+'</small></th><td>'+Number(c.all_time||0).toLocaleString()+'</td><td>'+Number(c.day||0).toLocaleString()+'</td><td>'+Number(c.week||0).toLocaleString()+'</td><td>'+Number(c.month||0).toLocaleString()+'</td></tr>').join(''):'<tr><td colspan="5">No public chat activity recorded yet.</td></tr>';
    $("#atr-since").textContent=metrics.tracked_since?"Page-view tracking active since "+new Date(metrics.tracked_since).toLocaleString():"Page-view tracking is ready; the first visit will establish the start date.";
    $("#atr-status").textContent="Records updated "+new Date().toLocaleTimeString();
   }catch(e){$("#atr-grid").innerHTML='<div class="atr-error">Analytics could not load: '+esc(e.message||"Unknown error")+'</div>';$("#atr-status").textContent="Check the traffic analytics migration and administrator permissions."}
   finally{btn.disabled=false}
  };
  $("#atr-refresh").addEventListener("click",render);await render();
 };
 const observer=new MutationObserver(()=>install().catch(e=>console.error("Traffic records:",e)));
 observer.observe(workspace,{attributes:true,attributeFilter:["class"]});install().catch(e=>console.error("Traffic records:",e));
});
})();