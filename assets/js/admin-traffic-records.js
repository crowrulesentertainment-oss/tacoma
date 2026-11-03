/* Tacoma Community Hub · traffic records for administrators */
(()=>{"use strict";
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const dateLabel=value=>{if(!value)return"—";const d=new Date(value+"T12:00:00");return Number.isNaN(d.getTime())?String(value):new Intl.DateTimeFormat("en-US",{weekday:"long",month:"short",day:"numeric",year:"numeric",timeZone:"America/Los_Angeles"}).format(d)};
const sectionMarkup=()=>'<div class="atr-head"><div><span class="eyebrow">AUDIENCE & COMMUNITY ACTIVITY</span><h2>Traffic & engagement records</h2><p>Live counts for today (Pacific Time), plus the strongest recorded day, week and month.</p></div><button class="button" type="button" id="atr-refresh">↻ Refresh records</button></div><div class="atr-period-note" id="atr-since">Connecting to analytics…</div><div class="atr-grid" id="atr-grid"><div class="atr-loading">Loading analytics…</div></div><div class="atr-channel-section"><div class="atr-channel-heading"><div><h3>Most chatters by channel</h3><p>Today’s participants, all-time unique participants, and each channel’s busiest recorded day, week and month.</p></div></div><div class="atr-channel-table-wrap"><table class="atr-channel-table"><thead><tr><th>Chat channel</th><th>Today</th><th>All-time people</th><th>Best day</th><th>Best week</th><th>Best month</th></tr></thead><tbody id="atr-channel-rows"><tr><td colspan="6">Loading channel records…</td></tr></tbody></table></div></div><p class="atr-footnote">Today and daily records use Tacoma/Pacific Time. “Best day” shows both the highest count and the date it occurred; ties show the earliest date. Weeks are Monday–Sunday; months are calendar months. Chatters are deduplicated by member account, anonymous chat token, or nickname. Page-view tracking begins when tracking is enabled; earlier page views cannot be reconstructed.</p><div class="atr-status" id="atr-status" role="status" aria-live="polite"></div>';
function start(){
 if(document.body.dataset.page!=="admin")return;
 let workspaceObserver=null,installed=false,installing=false,db=null;
 const install=async()=>{
  const workspace=$("#admin-content");
  if(!workspace||workspace.classList.contains("hidden")||installed||installing)return;
  db=window.__hubSupabaseClient;
  if(!db){console.warn("Traffic records: Supabase client is not ready.");return}
  installing=true;
  try{
   const nav=workspace.querySelector(".admin-workspace-nav");
   if(nav&&!nav.querySelector('a[href="#admin-traffic-records"]')){const a=document.createElement("a");a.href="#admin-traffic-records";a.textContent="Traffic & engagement";nav.append(a)}
   let section=workspace.querySelector("#admin-traffic-records");
   if(!section){section=document.createElement("section");section.id="admin-traffic-records";section.className="admin-traffic-records admin-workspace-section";section.innerHTML=sectionMarkup();const footer=workspace.querySelector(".admin-workspace-footer");if(footer)workspace.insertBefore(section,footer);else workspace.append(section)}
   installed=true;
   const render=async()=>{
    const btn=$("#atr-refresh",section),grid=$("#atr-grid",section),status=$("#atr-status",section);
    if(btn)btn.disabled=true;if(status)status.textContent="Refreshing records…";
    try{
     const {data,error}=await db.rpc("hub_admin_traffic_records");if(error)throw error;
     const metrics=data||{},groups=[["views","Page views"],["submits","Submissions"],["chatters","Unique chatters"]];
     grid.innerHTML=groups.map(([key,title])=>{const v=metrics[key]||{};return '<article class="atr-card"><div class="atr-card-title"><span>'+esc(title)+'</span><small>ACTIVITY HISTORY</small></div><div class="atr-values"><div class="atr-today"><b>'+Number(v.today||0).toLocaleString()+'</b><span>Today</span></div><div><b>'+Number(v.day||0).toLocaleString()+'</b><span>Best day · '+esc(dateLabel(v.day_date))+'</span></div><div><b>'+Number(v.week||0).toLocaleString()+'</b><span>Best week</span></div><div><b>'+Number(v.month||0).toLocaleString()+'</b><span>Best month</span></div><div><b>'+Number(v.all_time||0).toLocaleString()+'</b><span>All time</span></div></div></article>'}).join("");
     const channels=Array.isArray(metrics.channel_chatters)?metrics.channel_chatters:[];
     $("#atr-channel-rows",section).innerHTML=channels.length?channels.map(c=>'<tr><th scope="row">'+esc(c.channel||c.room)+'<small>'+esc(c.room)+'</small></th><td>'+Number(c.today||0).toLocaleString()+'</td><td>'+Number(c.all_time||0).toLocaleString()+'</td><td>'+Number(c.day||0).toLocaleString()+'<small>'+esc(dateLabel(c.day_date))+'</small></td><td>'+Number(c.week||0).toLocaleString()+'</td><td>'+Number(c.month||0).toLocaleString()+'</td></tr>').join(""):'<tr><td colspan="6">No public chat activity recorded yet.</td></tr>';
     $("#atr-since",section).textContent=metrics.tracked_since?"Today: "+dateLabel(metrics.today_date)+" (Pacific Time) · Page-view tracking active since "+new Date(metrics.tracked_since).toLocaleString():"Today: "+dateLabel(metrics.today_date)+" (Pacific Time) · Page-view tracking is ready; the first visit will establish the start date.";
     if(status)status.textContent="Records updated "+new Date().toLocaleTimeString();
    }catch(e){grid.innerHTML='<div class="atr-error">Analytics could not load: '+esc(e.message||"Unknown error")+'</div>';if(status)status.textContent="The section is visible, but the analytics request failed. Check the administrator RPC permissions.";console.error("Traffic records RPC failed:",e)}
    finally{if(btn)btn.disabled=false}
   };
   $("#atr-refresh",section).addEventListener("click",render);await render();
  }catch(e){installing=false;console.error("Traffic records could not initialize:",e);return}
  installing=false;
 };
 const watchWorkspace=()=>{
  const found=$("#admin-content");
  if(!found){if(!workspaceObserver){workspaceObserver=new MutationObserver(()=>{if($("#admin-content")){workspaceObserver.disconnect();workspaceObserver=null;watchWorkspace()}});workspaceObserver.observe(document.body,{childList:true,subtree:true})}return}
  if(workspaceObserver){workspaceObserver.disconnect();workspaceObserver=null}
  const visibilityObserver=new MutationObserver(()=>{if(!found.classList.contains("hidden"))install()});
  visibilityObserver.observe(found,{attributes:true,attributeFilter:["class"]});if(!found.classList.contains("hidden"))install();
 };
 watchWorkspace();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();