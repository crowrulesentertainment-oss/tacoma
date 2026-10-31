/* Tacoma Community Hub · Member Profiles Control Room
 * Canonical profile source: public.hub_member_profiles.
 * Membership state and moderation controls remain in public.members.
 * Requires an authenticated user with hub_admins.role = 'admin'.
 */
(()=>{"use strict";
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const date=v=>v?new Date(v).toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"}):"—";
const note=(el,msg,bad=false)=>{if(el){el.textContent=msg;el.className="admin6-note"+(bad?" is-error":"")}};
document.addEventListener("DOMContentLoaded",()=>{
 if(document.body.dataset.page!=="admin")return;
 const db=window.__hubSupabaseClient;if(!db)return;
 let installed=false,installing=false,profiles=[],members=[],profileCount=0,currentUser=null;
 const install=async()=>{
  const section=$("#admin3-members");if(!section||installed||installing)return;installing=true;
  const {data:{user},error:authError}=await db.auth.getUser();
  if(authError||!user){installing=false;return;}
  const {data:admin,error:adminError}=await db.from("hub_admins").select("role").eq("user_id",user.id).maybeSingle();
  if(adminError||String(admin?.role||"").toLowerCase()!=="admin"){installing=false;return;}
  installed=true;currentUser=user;
  section.replaceChildren();
  const directory=document.createElement("div");directory.className="admin6-directory";
  directory.innerHTML='<span class="eyebrow">08 · MEMBER SERVICES</span><h2>Member profile directory</h2><p>Member identity and profile details are read from <code>hub_member_profiles</code>. Membership status and suspension controls remain in the membership record.</p>'+
   '<div class="admin6-summary" id="a6-summary"><article><b id="a6-total">—</b><span>Profiles</span></article><article><b id="a6-public">—</b><span>Public profiles</span></article><article><b id="a6-active">—</b><span>Active memberships</span></article><article><b id="a6-suspended">—</b><span>Suspended memberships</span></article></div>'+
   '<div class="admin6-toolbar"><input id="a6-search" type="search" placeholder="Search name, email, location, bio or interests…" aria-label="Search member profiles"><select id="a6-filter" aria-label="Filter membership status"><option value="">All membership statuses</option><option value="Active">Active</option><option value="Pending">Pending</option><option value="Suspended">Suspended</option><option value="profile-only">Profile only</option></select><button type="button" class="button" id="a6-refresh">↻ Refresh members</button></div>'+
   '<div class="admin6-note" id="a6-note" role="status" aria-live="polite">Loading member profiles…</div><div class="admin6-table-wrap" id="a6-table"></div>';
  section.append(directory);
  const load=async()=>{
   const btn=$("#a6-refresh");if(btn)btn.disabled=true;
   note($("#a6-note"),"Loading Hub member profiles…");
   try{
    const [p,m]=await Promise.all([
     db.from("hub_member_profiles").select("user_id,display_name,bio,interests,avatar_url,location,is_public,created_at,updated_at").order("created_at",{ascending:false}).limit(1000),
     db.from("members").select("id,user_id,display_name,avatar_url,email,username,role,membership_type,status,created_at,suspension_reason,suspended_until").limit(2000)
    ]);
    if(p.error)throw new Error("Member profiles: "+p.error.message);
    if(m.error)throw new Error("Membership records: "+m.error.message);
    const profileData=p.data||[];members=m.data||[];profileCount=profileData.length;
    const byUser=new Map(members.filter(x=>x.user_id).map(x=>[x.user_id,x]));
    const profileRows=profileData.map(x=>({...x,membership:byUser.get(x.user_id)||null}));
    profiles=profileRows;
    $("#a6-total").textContent=profileCount;
    $("#a6-public").textContent=profileRows.filter(x=>x.is_public).length;
    $("#a6-active").textContent=members.filter(x=>x.status==="Active").length;
    $("#a6-suspended").textContent=members.filter(x=>x.status==="Suspended").length;
    draw();
   }catch(e){note($("#a6-note"),e.message||"Could not load member records.",true);$("#a6-table").innerHTML="";}
   finally{if(btn)btn.disabled=false}
  };
  const draw=()=>{
   const term=($("#a6-search")?.value||"").trim().toLowerCase(),filter=$("#a6-filter")?.value||"";
   const rows=profiles.filter(p=>{
    const m=p.membership||{},hay=[p.display_name,p.bio,p.location,(p.interests||[]).join(" "),m.email,m.username,m.role,m.membership_type].join(" ").toLowerCase();
    const status=m.status||"profile-only";
    return (!filter||status===filter)&&(!term||hay.includes(term));
   });
   note($("#a6-note"),rows.length+" of "+profileCount+" Hub members shown.");
   $("#a6-table").innerHTML=rows.length?'<table class="admin6-table"><thead><tr><th>Member profile</th><th>Contact & membership</th><th>Profile visibility</th><th>Joined</th><th>Membership action</th></tr></thead><tbody>'+rows.map(p=>{
    const m=p.membership||{},name=p.display_name||m.username||"Hub member",status=m.status||"Profile only",interests=Array.isArray(p.interests)?p.interests:[];
    const avatar=p.avatar_url?'<img class="admin6-avatar" src="'+esc(p.avatar_url)+'" alt="" loading="lazy" referrerpolicy="no-referrer">':'<span class="admin6-avatar admin6-avatar-fallback">'+esc(name.slice(0,1).toUpperCase())+'</span>';
    const suspended=status==="Suspended";
    const action=m.id?(suspended?'<button class="button" type="button" data-a6-restore="'+esc(m.id)+'">Reinstate</button>':'<button class="button" type="button" data-a6-suspend="'+esc(m.id)+'">Suspend</button>'):'<span class="admin6-muted">No membership row</span>';
    const visibility='<span class="admin6-visibility '+(p.is_public?"is-public":"is-private")+'">'+(p.is_public?"Public profile":"Private profile")+'</span>';
    return '<tr><td><div class="admin6-person">'+avatar+'<div><strong>'+esc(name)+'</strong><small>'+esc(p.location||"Location not provided")+'</small><small>'+esc(p.bio||"No biography provided")+'</small>'+(interests.length?'<div class="admin6-tags">'+interests.map(v=>'<span>'+esc(v)+'</span>').join("")+'</div>':"")+'</div></div></td><td><strong>'+esc(m.email||"Email unavailable")+'</strong><small>@'+esc(m.username||"no username")+'</small><small>'+esc(m.role||m.membership_type||"Member")+' · '+esc(status)+'</small>'+(m.suspension_reason?'<small class="admin6-reason">Reason: '+esc(m.suspension_reason)+'</small>':"")+'</td><td>'+visibility+'</td><td>'+esc(date(p.created_at||m.created_at))+'</td><td>'+action+'</td></tr>';
   }).join("")+'</tbody></table>':'<div class="admin6-empty">No member profiles match this search.</div>';
   $("#a6-table").querySelectorAll("[data-a6-suspend]").forEach(b=>b.addEventListener("click",()=>changeStatus(b,"suspend")));
   $("#a6-table").querySelectorAll("[data-a6-restore]").forEach(b=>b.addEventListener("click",()=>changeStatus(b,"restore")));
  };
  const audit=async(action,m,reason)=>{const {error}=await db.from("hub_admin_activity").insert({actor_id:currentUser.id,action,target_type:"member",target_id:String(m.id),summary:action==="member_suspended"?"Hub membership suspended":"Hub membership reinstated",details:{user_id:m.user_id,reason:reason||null,source:"hub_member_profiles_admin"}});if(error)console.warn("Member action audit write failed:",error.message)};
  const changeStatus=async(btn,mode)=>{
   const m=members.find(x=>x.id===btn.dataset.a6Suspend||x.id===btn.dataset.a6Restore);if(!m)return;
   let reason=null;
   if(mode==="suspend"){reason=window.prompt("Reason for suspending this Hub membership:");if(!reason?.trim())return}
   else if(!window.confirm("Reinstate this Hub membership?"))return;
   btn.disabled=true;
   const patch=mode==="suspend"?{status:"Suspended",suspension_reason:reason.trim().slice(0,1000),suspended_by:currentUser.id,updated_at:new Date().toISOString()}:{status:"Active",suspension_reason:null,suspended_until:null,suspended_by:null,updated_at:new Date().toISOString()};
   const {error}=await db.from("members").update(patch).eq("id",m.id);
   if(error){note($("#a6-note"),"Membership update failed: "+error.message,true);btn.disabled=false;return}
   await audit(mode==="suspend"?"member_suspended":"member_reinstated",m,reason);
   note($("#a6-note"),mode==="suspend"?"Membership suspended.":"Membership reinstated.");
   await load();
  };
  $("#a6-search").addEventListener("input",draw);$("#a6-filter").addEventListener("change",draw);$("#a6-refresh").addEventListener("click",load);
  await load();
 };
 const observer=new MutationObserver(()=>{if($("#admin3-members")&&!installed)install().catch(e=>console.error("Member profile control room:",e))});
 observer.observe(document.body,{childList:true,subtree:true});
 if($("#admin3-members"))install().catch(e=>console.error("Member profile control room:",e));
});
})();