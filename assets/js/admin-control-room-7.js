/* Tacoma Community Hub · Community Alerts desk
 * Uses the existing, RLS-protected hub_announcements table so published alerts
 * appear through the Hub's existing public announcement feed.
 */
(()=>{"use strict";
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=v=>v?new Date(v).toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"}):"No schedule";
document.addEventListener("DOMContentLoaded",()=>{
 if(document.body.dataset.page!=="admin")return;
 const workspace=$("#admin-content");if(!workspace)return;
 let installed=false,db,user,alerts=[];
 const install=async()=>{
  if(installed||workspace.classList.contains("hidden"))return;
  db=window.__hubSupabaseClient;if(!db)return;
  const auth=await db.auth.getUser();user=auth.data?.user;if(!user)return;
  const {data:admin,error}=await db.from("hub_admins").select("role").eq("user_id",user.id).maybeSingle();
  if(error||String(admin?.role||"").toLowerCase()!=="admin")return;
  installed=true;
  const nav=$(".admin-workspace-nav");
  if(nav&&!nav.querySelector('a[href="#admin7-alerts"]')){const a=document.createElement("a");a.href="#admin7-alerts";a.textContent="Community alerts";nav.append(a)}
  const section=document.createElement("section");section.id="admin7-alerts";section.className="admin7-alerts";
  section.innerHTML='<span class="eyebrow">COMMUNITY COMMUNICATIONS · ALERT DESK</span><div class="admin7-head"><div><h2>Community Alerts</h2><p>Create and manage important Tacoma and Pierce County notices, including safety information, service disruptions, closures and urgent community updates. Published alerts use the Hub announcement feed and its existing public visibility rules.</p></div><span class="admin7-live-label">ADMIN ONLY</span></div>'+
  '<div class="admin7-stats"><article><b id="a7-total">—</b><span>Alerts on file</span></article><article><b id="a7-active">—</b><span>Published now</span></article><article><b id="a7-urgent">—</b><span>Urgent priority</span></article><article><b id="a7-draft">—</b><span>Drafts</span></article></div>'+
  '<div class="admin7-layout"><form id="a7-form" class="admin7-form"><h3 id="a7-form-title">Create a community alert</h3><input type="hidden" id="a7-id"><label>Alert headline<input id="a7-title" maxlength="140" required placeholder="Example: Community center temporarily closed"></label><label>Alert details<textarea id="a7-body" rows="5" maxlength="5000" required placeholder="Share verified details, who is affected and where people can find updates."></textarea></label><div class="admin7-fields"><label>Alert type<select id="a7-category"><option value="safety">Safety information</option><option value="service">Service disruption</option><option value="maintenance">Closure / maintenance</option><option value="community">Community update</option><option value="events">Event update</option></select></label><label>Priority<select id="a7-priority"><option value="urgent">Urgent</option><option value="important" selected>Important</option><option value="normal">Normal</option></select></label><label>Audience<select id="a7-audience"><option value="everyone">Everyone</option><option value="members">Active members</option></select></label><label>Publication status<select id="a7-status"><option value="draft">Save as draft</option><option value="published">Publish alert</option><option value="archived">Resolved / archive</option></select></label><label>Display from<input id="a7-start" type="datetime-local"></label><label>Display until<input id="a7-end" type="datetime-local"></label></div><p class="admin7-hint">Use clear, factual wording. Do not publish unverified reports, private personal information or details that could put someone at risk. For immediate emergencies, direct people to 911 or the appropriate official agency.</p><div class="admin7-actions"><button class="button-primary" type="submit" id="a7-save">Save alert</button><button class="button" type="button" id="a7-clear">Clear form</button></div><div class="admin7-note" id="a7-note" role="status" aria-live="polite"></div></form>'+
  '<div class="admin7-list"><div class="admin7-list-head"><div><h3>Alert management</h3><p>Review, edit, publish or archive important notices.</p></div><button class="button" type="button" id="a7-refresh">↻ Refresh</button></div><div class="admin7-filters"><input type="search" id="a7-search" placeholder="Search alerts…" aria-label="Search alerts"><select id="a7-filter" aria-label="Filter alerts"><option value="">All alert statuses</option><option value="published">Published</option><option value="draft">Drafts</option><option value="archived">Archived / resolved</option></select></div><div class="admin7-note" id="a7-list-note" role="status" aria-live="polite">Loading alerts…</div><div id="a7-items"></div></div></div>';
  workspace.insertBefore(section,workspace.querySelector(".admin-workspace-footer")||null);
  const note=(id,msg,bad=false)=>{const el=$("#"+id);if(el){el.textContent=msg;el.className="admin7-note"+(bad?" is-error":"")}};
  const clear=()=>{$("#a7-form").reset();$("#a7-id").value="";$("#a7-form-title").textContent="Create a community alert";$("#a7-save").textContent="Save alert";$("#a7-priority").value="important";$("#a7-status").value="draft"};
  const load=async()=>{
   $("#a7-refresh").disabled=true;note("a7-list-note","Loading community alerts…");
   try{
    const {data,error}=await db.from("hub_announcements").select("id,title,body,category,priority,status,audience,starts_at,ends_at,created_at,updated_at").in("category",["safety","service","maintenance","community","events"]).in("priority",["important","urgent","normal"]).order("created_at",{ascending:false}).limit(300);
    if(error)throw error;
    alerts=data||[];
    $("#a7-total").textContent=alerts.length;
    const now=Date.now();
    $("#a7-active").textContent=alerts.filter(a=>a.status==="published"&&(!a.starts_at||new Date(a.starts_at).getTime()<=now)&&(!a.ends_at||new Date(a.ends_at).getTime()>now)).length;
    $("#a7-urgent").textContent=alerts.filter(a=>a.priority==="urgent"&&a.status==="published").length;
    $("#a7-draft").textContent=alerts.filter(a=>a.status==="draft").length;
    draw();
   }catch(e){note("a7-list-note","Could not load alerts: "+(e.message||"Unknown error"),true)}
   finally{$("#a7-refresh").disabled=false}
  };
  const draw=()=>{
   const q=$("#a7-search").value.trim().toLowerCase(),status=$("#a7-filter").value;
   const rows=alerts.filter(a=>(!status||a.status===status)&&(!q||[a.title,a.body,a.category,a.priority].join(" ").toLowerCase().includes(q)));
   note("a7-list-note",rows.length+" alert"+(rows.length===1?"":"s")+" shown.");
   $("#a7-items").innerHTML=rows.length?rows.map(a=>'<article class="admin7-item"><div class="admin7-item-top"><div><span class="admin7-chip '+(a.priority==="urgent"?"urgent":a.priority==="important"?"important":"normal")+'">'+esc(a.priority)+'</span> <span class="admin7-chip status">'+esc(a.status)+'</span></div><small>'+esc(a.category.replaceAll("_"," "))+'</small></div><h4>'+esc(a.title)+'</h4><p>'+esc(a.body)+'</p><div class="admin7-meta"><span>Audience: '+esc(a.audience)+'</span><span>From: '+esc(fmt(a.starts_at))+'</span><span>Until: '+esc(fmt(a.ends_at))+'</span></div><div class="admin7-actions"><button type="button" class="button" data-edit="'+esc(a.id)+'">Edit</button><button type="button" class="button" data-publish="'+esc(a.id)+'">'+(a.status==="published"?"Unpublish":"Publish")+'</button><button type="button" class="button" data-archive="'+esc(a.id)+'">Resolve / archive</button></div></article>').join(""):'<div class="admin7-empty">No alerts match this filter.</div>';
   $("#a7-items").querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>{const a=alerts.find(x=>x.id===b.dataset.edit);$("#a7-id").value=a.id;$("#a7-title").value=a.title;$("#a7-body").value=a.body;$("#a7-category").value=a.category;$("#a7-priority").value=a.priority;$("#a7-audience").value=a.audience;$("#a7-status").value=a.status;$("#a7-start").value=a.starts_at?new Date(a.starts_at).toISOString().slice(0,16):"";$("#a7-end").value=a.ends_at?new Date(a.ends_at).toISOString().slice(0,16):"";$("#a7-form-title").textContent="Edit community alert";$("#a7-save").textContent="Update alert";$("#a7-form").scrollIntoView({behavior:"smooth",block:"start"})}));
   $("#a7-items").querySelectorAll("[data-publish],[data-archive]").forEach(b=>b.addEventListener("click",async()=>{const a=alerts.find(x=>x.id===(b.dataset.publish||b.dataset.archive));const status=b.dataset.archive?"archived":a.status==="published"?"draft":"published";if(!window.confirm((status==="published"?"Publish":status==="draft"?"Unpublish":"Resolve and archive")+" this alert?"))return;b.disabled=true;const {error}=await db.from("hub_announcements").update({status,updated_by:user.id,updated_at:new Date().toISOString()}).eq("id",a.id);if(error){note("a7-list-note","Update failed: "+error.message,true);b.disabled=false;return}await db.from("hub_admin_activity").insert({actor_id:user.id,action:"community_alert_"+status,target_type:"announcement",target_id:a.id,summary:"Community alert "+status,details:{title:a.title,priority:a.priority}});note("a7-note","Alert "+status+".");await load()}));
  };
  $("#a7-form").addEventListener("submit",async e=>{
   e.preventDefault();const id=$("#a7-id").value,start=$("#a7-start").value,end=$("#a7-end").value;
   const payload={title:$("#a7-title").value.trim(),body:$("#a7-body").value.trim(),category:$("#a7-category").value,priority:$("#a7-priority").value,audience:$("#a7-audience").value,status:$("#a7-status").value,starts_at:start?new Date(start).toISOString():null,ends_at:end?new Date(end).toISOString():null,updated_by:user.id,updated_at:new Date().toISOString()};
   if(!payload.title||!payload.body){note("a7-note","A headline and alert details are required.",true);return}
   if(payload.starts_at&&payload.ends_at&&payload.ends_at<=payload.starts_at){note("a7-note","Display-until must be later than display-from.",true);return}
   $("#a7-save").disabled=true;
   try{
    const result=id?await db.from("hub_announcements").update(payload).eq("id",id).select("id").single():await db.from("hub_announcements").insert({...payload,created_by:user.id}).select("id").single();
    if(result.error)throw result.error;
    await db.from("hub_admin_activity").insert({actor_id:user.id,action:id?"community_alert_updated":"community_alert_created",target_type:"announcement",target_id:result.data.id,summary:payload.title,details:{category:payload.category,priority:payload.priority,status:payload.status}});
    note("a7-note","Community alert saved.");clear();await load();
   }catch(err){note("a7-note","Could not save alert: "+(err.message||"Unknown error"),true)}
   finally{$("#a7-save").disabled=false}
  });
  $("#a7-clear").addEventListener("click",clear);$("#a7-refresh").addEventListener("click",load);$("#a7-search").addEventListener("input",draw);$("#a7-filter").addEventListener("change",draw);
  await load();
 };
 const observer=new MutationObserver(()=>install().catch(e=>console.error("Community alerts:",e)));
 observer.observe(workspace,{attributes:true,attributeFilter:["class"]});install().catch(e=>console.error("Community alerts:",e));
});
})();