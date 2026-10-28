/* Shared CrowRules Community Hub admin behavior. */
(() => {
  const cfg = window.CROW_HUB_ADMIN_CONFIG;
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
  const html = value => String(value ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dateText = value => value ? new Date(value).toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"}) : "—";
  const fmtStatus = value => String(value||"unknown").replaceAll("_"," ");
  const statusClass = value => ["published","approved","live","connected"].includes(value) ? "good" : ["pending_review","changes_requested","scheduled","warning"].includes(value) ? "warn" : ["rejected","archived","error","failed"].includes(value) ? "bad" : "neutral";
  const badge = value => '<span class="status '+statusClass(value)+'"><span class="dot"></span>'+html(fmtStatus(value))+'</span>';
  const toast = (message, type="") => { const el=$("#notice"); if(el){el.textContent=message;el.className="notice "+type;el.hidden=false;} };
  const clearToast = () => {const el=$("#notice");if(el){el.hidden=true;el.textContent="";}};
  const sb = window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const path = location.pathname;
  const isLogin = path.endsWith("/login.html") || path.endsWith("/admin/");
  const nav = [
    ["index.html","◈","Control Room"],
    ["submissions.html","▤","Submission Review"],
    ["content.html","▦","Content Manager"],
    ["reports.html","⚑","Listing Reports"],
    ["events.html","◷","Events"],
    ["system.html","⌁","System Health"]
  ];
  const mountNav = () => {
    const side=$("#admin-nav"); if(!side)return;
    side.innerHTML=nav.map(([href,icon,label])=>'<a href="'+href+'" '+(path.endsWith("/"+href)?'aria-current="page"':'')+'><span class="nav-icon">'+icon+'</span>'+label+'</a>').join("");
  };
  const setUser = user => { const el=$("#admin-user"); if(el)el.textContent=user?.email||"Administrator"; };
  async function requireAdmin(){
    const {data:{session},error}=await sb.auth.getSession();
    if(error) throw error;
    if(!session){location.replace("login.html?next="+encodeURIComponent(path));return null;}
    const {data:{user},error:userError}=await sb.auth.getUser();
    if(userError)throw userError;
    if(!user || user.app_metadata?.role!=="admin"){
      document.body.innerHTML='<main class="login-screen"><section class="login-card"><div class="brand"><div class="brand-mark">C</div><div><strong>CrowRules Community Hub</strong><small>Admin access</small></div></div><p class="eyebrow">Access restricted</p><h1 class="page-title">Administrator permission required</h1><p class="page-subtitle">You are signed in, but this account does not have the trusted <code>app_metadata.role = admin</code> claim. Contact the project administrator to assign access.</p><div class="form-actions"><button class="btn primary" id="signout-now">Sign out</button><a class="btn" href="login.html">Return to login</a></div></section></main>';
      $("#signout-now")?.addEventListener("click",async()=>{await sb.auth.signOut();location.replace("login.html");});
      return null;
    }
    setUser(user); mountNav();
    $("#signout")?.addEventListener("click",async()=>{await sb.auth.signOut();location.replace("login.html");});
    return user;
  }
  async function signIn(){
    const form=$("#login-form"); if(!form)return;
    const recovering = new URLSearchParams(location.hash.slice(1)).get("type")==="recovery";
    if(recovering){form.hidden=true;$("#recovery-form").hidden=false;toast("Choose a new password for your account.","success");}
    form.addEventListener("submit",async e=>{
      e.preventDefault();clearToast();
      const button=$('button[type="submit"]',form);button.disabled=true;button.textContent="Signing in…";
      const email=cfg.adminEmail;const password=$("#password").value;
      try{
        const {data,error}=await sb.auth.signInWithPassword({email,password});
        if(error)throw error;
        const user=data.user;
        if(user?.app_metadata?.role!=="admin"){await sb.auth.signOut();throw new Error("This account is not authorized as a Community Hub administrator.");}
        const params=new URLSearchParams(location.search);const next=params.get("next");
        const safeNext=next&&next.startsWith("/tacoma/admin/")&&!next.includes("//")?next:cfg.dashboardPath;
        location.replace(safeNext);
      }catch(err){toast(err.message||"Sign-in failed. Check your credentials and try again.","error");}
      finally{button.disabled=false;button.textContent="Sign in securely";}
    });
    sb.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        $("#login-form").hidden = true;
        $("#recovery-form").hidden = false;
        toast("Choose a new password for your account.","success");
      }
    });
    $("#recovery-form")?.addEventListener("submit",async e=>{
      e.preventDefault();clearToast();
      const password=$("#new-password").value;
      if(password.length<10){toast("Use at least 10 characters for the new password.","error");return;}
      const button=$('button[type="submit"]',e.currentTarget);button.disabled=true;
      try{
        const {error}=await sb.auth.updateUser({password});
        if(error)throw error;
        toast("Password updated. Sign in with your new password.","success");
        await sb.auth.signOut();$("#recovery-form").hidden=true;$("#login-form").hidden=false;
      }catch(err){toast(err.message||"Password update failed.","error");}
      finally{button.disabled=false;}
    });
    $("#forgot-password")?.addEventListener("click",async e=>{
      e.preventDefault();clearToast();const email=cfg.adminEmail;
      const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+cfg.loginPath});
      if(error)toast(error.message,"error");else toast("If password recovery is enabled, check your inbox for the reset link.","success");
    });
  }
  async function count(table,filters=[]){
    let q=sb.from(table).select("id",{count:"exact",head:true});
    for(const [column,operator,value] of filters)q=q.filter(column,operator,value);
    const {count,error}=await q;if(error)throw error;return count??0;
  }
  async function dashboard(){
    const metrics=$("#metrics");if(!metrics)return;
    try{
      const [pending,changes,content,events,latest]=await Promise.all([
        count("community_hub_submissions",[["status","eq","pending_review"]]),
        count("community_hub_submissions",[["status","eq","changes_requested"]]),
        count("community_hub_content",[["status","eq","published"]]),
        count("community_hub_content",[["content_type","eq","event"],["status","eq","published"],["starts_at","gte",new Date().toISOString()]]),
        sb.from("community_hub_submissions").select("id,title,submission_type,status,created_at,organization").order("created_at",{ascending:false}).limit(6)
      ]);
      metrics.innerHTML=[
        ["Pending review",pending,"Awaiting moderation","▤"],
        ["Changes requested",changes,"Follow-up needed","↻"],
        ["Published listings",content,"Live public content","▦"],
        ["Upcoming events",events,"Published future events","◷"]
      ].map(([label,value,foot,icon])=>'<article class="metric"><span class="metric-icon">'+icon+'</span><div class="metric-label">'+label+'</div><div class="metric-value">'+value+'</div><div class="metric-foot">'+foot+'</div></article>').join("");
      if(latest.error)throw latest.error;
      const list=$("#recent-submissions");
      list.innerHTML=latest.data?.length?latest.data.map(item=>'<div class="list-item"><div><div class="item-title">'+html(item.title)+'</div><div class="item-meta">'+html(item.submission_type)+' · '+dateText(item.created_at)+'</div></div>'+badge(item.status)+'</div>').join(""):'<div class="empty">No submissions yet. New community contributions will appear here.</div>';
      $("#dashboard-refresh")?.addEventListener("click",()=>location.reload());
    }catch(err){toast("Dashboard data could not be loaded: "+err.message,"error");}
  }
  const typeLabel = value => ({resource:"Resource",event:"Event",directory:"Directory listing",service:"Service",education:"Education",story:"Community story",volunteer:"Volunteer opportunity",idea:"Idea",announcement:"Announcement"}[value]||value);
  async function submissions(){
    const table=$("#submissions-table");if(!table)return;
    const status=$("#status-filter"), type=$("#type-filter"), search=$("#search-filter");
    async function load(){
      clearToast();table.innerHTML='<tr><td colspan="8"><div class="skeleton"></div></td></tr>';
      let q=sb.from("community_hub_submissions").select("*").order("created_at",{ascending:false}).limit(250);
      if(status.value!=="all")q=q.eq("status",status.value);
      if(type.value!=="all")q=q.eq("submission_type",type.value);
      if(search.value.trim())q=q.ilike("title","%"+search.value.trim().replace(/[%_,]/g," ")+"%");
      const {data,error}=await q;if(error){table.innerHTML="";toast("Could not load submissions: "+error.message,"error");return;}
      table.innerHTML=(data||[]).map(row=>'<tr><td><strong>'+html(row.title)+'</strong><div class="item-meta">'+html(row.organization||row.contact_name||"Community submission")+'</div><div class="item-meta">'+html((row.description||"").slice(0,150))+'</div></td><td>'+html(typeLabel(row.submission_type))+'</td><td>'+badge(row.status)+'</td><td>'+html(row.location_text||"—")+'</td><td>'+html(dateText(row.created_at))+'</td><td>'+html(row.submitter_email||row.contact_email||"—")+'</td><td><button class="btn small" data-review="'+row.id+'">Review</button></td></tr>').join("")||'<tr><td colspan="7"><div class="empty">No submissions match these filters.</div></td></tr>';
      $$("[data-review]",table).forEach(btn=>btn.addEventListener("click",()=>openReview(data.find(x=>x.id===btn.dataset.review))));
    }
    function openReview(row){
      const modal=$("#review-panel");if(!row||!modal)return;
      $("#review-title").textContent=row.title;$("#review-meta").textContent=typeLabel(row.submission_type)+" · Submitted "+dateText(row.created_at);
      $("#review-description").textContent=row.description||"";
      $("#review-details").innerHTML=[
        ["Organization",row.organization],["Location",row.location_text],["Website",row.website_url],["Starts",dateText(row.starts_at)],["Ends",dateText(row.ends_at)],["Submitter",row.submitter_email||row.contact_email],["Source page",row.source_page]
      ].filter(x=>x[1]).map(([k,v])=>'<div class="health-row"><span class="muted">'+html(k)+'</span><span>'+((k==="Website"&&/^https?:\/\//i.test(v))?'<a target="_blank" rel="noopener noreferrer" href="'+html(v)+'">'+html(v)+'</a>':html(v))+'</span></div>').join("");
      $("#review-notes").value=row.review_notes||"";modal.hidden=false;modal.dataset.id=row.id;modal.dataset.status=row.status;
    }
    $("#review-close")?.addEventListener("click",()=>{$("#review-panel").hidden=true;});
    $("#review-actions")?.addEventListener("click",async e=>{
      const btn=e.target.closest("[data-action]");if(!btn)return;
      const rowId=$("#review-panel").dataset.id;const action=btn.dataset.action;
      if(action==="approve"){
        btn.disabled=true;
        try{const {data,error}=await sb.rpc("approve_community_hub_submission",{p_submission_id:rowId,p_review_notes:$("#review-notes").value.trim()||null});if(error)throw error;toast("Submission approved and published to the matching public content feed.","success");$("#review-panel").hidden=true;await load();}
        catch(err){toast("Approval failed. The database may not yet have the atomic approval function installed: "+err.message,"error");}
        finally{btn.disabled=false;}
        return;
      }
      const statusValue=action==="reject"?"rejected":"changes_requested";
      const {data:{user}}=await sb.auth.getUser();
      const {error}=await sb.from("community_hub_submissions").update({status:statusValue,review_notes:$("#review-notes").value.trim()||null,reviewed_at:new Date().toISOString(),reviewed_by:user.id,updated_at:new Date().toISOString()}).eq("id",rowId);
      if(error){toast("Could not update submission: "+error.message,"error");return;}
      toast("Submission marked "+fmtStatus(statusValue)+".","success");$("#review-panel").hidden=true;await load();
    });
    [status,type].forEach(el=>el.addEventListener("change",load));let timer;search.addEventListener("input",()=>{clearTimeout(timer);timer=setTimeout(load,250);});
    $("#submissions-refresh")?.addEventListener("click",load);await load();
  }
  async function contentManager(){
    const table=$("#content-table");if(!table)return;
    const search=$("#content-search"),status=$("#content-status"),type=$("#content-type");
    async function load(){
      clearToast();table.innerHTML='<tr><td colspan="7"><div class="skeleton"></div></td></tr>';
      let q=sb.from("community_hub_content").select("*").order("created_at",{ascending:false}).limit(300);
      if(status.value!=="all")q=q.eq("status",status.value);
      if(type.value!=="all")q=q.eq("content_type",type.value);
      if(search.value.trim())q=q.ilike("title","%"+search.value.trim().replace(/[%_,]/g," ")+"%");
      const {data,error}=await q;if(error){table.innerHTML="";toast("Could not load content: "+error.message,"error");return;}
      table.innerHTML=(data||[]).map(row=>'<tr><td><strong>'+html(row.title)+'</strong><div class="item-meta">'+html(row.organization||"")+'</div></td><td>'+html(typeLabel(row.content_type))+'</td><td>'+badge(row.status)+'</td><td>'+(row.is_featured?'<span class="status good">Featured</span>':'—')+'</td><td>'+html(row.location_text||"—")+'</td><td>'+badge(row.verification_status||"not_checked")+(row.last_reviewed_at?'<div class="item-meta">Reviewed '+html(dateText(row.last_reviewed_at))+'</div>':'<div class="item-meta">No review date</div>')+'</td><td>'+html(dateText(row.updated_at||row.created_at))+'</td><td><button class="btn small" data-edit="'+row.id+'">Edit</button></td></tr>').join("")||'<tr><td colspan="8"><div class="empty">No content found.</div></td></tr>';
      $$("[data-edit]",table).forEach(btn=>btn.addEventListener("click",()=>edit(data.find(x=>x.id===btn.dataset.edit))));
    }
    function edit(row){
      const form=$("#content-form");form.reset();$("#content-id").value=row?.id||"";
      $("#content-form-title").textContent=row?"Edit listing":"Create listing";
      for(const key of ["content_type","title","description","category","organization","website_url","location_text","starts_at","ends_at","image_url","status","verification_status","last_reviewed_at"]){const el=$("#"+key);if(el)el.value=row?.[key]?(["starts_at","ends_at"].includes(key)?new Date(row[key]).toISOString().slice(0,16):key==="last_reviewed_at"?new Date(row[key]).toISOString().slice(0,10):row[key]):(key==="content_type"?"resource":key==="category"?"general":key==="status"?"draft":key==="verification_status"?"not_checked":"");}
      $("#is_featured").checked=!!row?.is_featured;$("#content-panel").hidden=false;$("#content-panel").scrollIntoView({behavior:"smooth",block:"start"});
    }
    $("#content-new")?.addEventListener("click",()=>edit(null));$("#content-cancel")?.addEventListener("click",()=>$("#content-panel").hidden=true);
    $("#content-form")?.addEventListener("submit",async e=>{
      e.preventDefault();clearToast();const btn=$('button[type="submit"]',e.currentTarget);btn.disabled=true;
      const val=id=>$("#"+id).value.trim();
      if(val("content_type")==="event"&&!val("starts_at")){toast("Events need a start date and time.","error");btn.disabled=false;return;}
      if(val("starts_at")&&val("ends_at")&&new Date(val("ends_at"))<new Date(val("starts_at"))){toast("The end date must be after the start date.","error");btn.disabled=false;return;}
      const payload={content_type:val("content_type"),title:val("title"),description:val("description"),category:val("category")||"general",organization:val("organization")||null,website_url:val("website_url")||null,location_text:val("location_text")||null,starts_at:val("starts_at")?new Date(val("starts_at")).toISOString():null,ends_at:val("ends_at")?new Date(val("ends_at")).toISOString():null,image_url:val("image_url")||null,status:val("status"),is_featured:$("#is_featured").checked,verification_status:val("verification_status")||"not_checked",last_reviewed_at:val("last_reviewed_at")?new Date(val("last_reviewed_at")+"T12:00:00").toISOString():null,updated_at:new Date().toISOString(),published_at:val("status")==="published"?new Date().toISOString():null};
      try{
        const id=val("content-id");const result=id?await sb.from("community_hub_content").update(payload).eq("id",id):await sb.from("community_hub_content").insert(payload);
        if(result.error)throw result.error;toast(id?"Listing updated.":"Listing created.","success");$("#content-panel").hidden=true;await load();
      }catch(err){toast("Save failed: "+err.message,"error");}finally{btn.disabled=false;}
    });
    $("#content-refresh")?.addEventListener("click",load);[status,type].forEach(el=>el.addEventListener("change",load));let timer;search.addEventListener("input",()=>{clearTimeout(timer);timer=setTimeout(load,250);});
    $("#content-table")?.addEventListener("click",async e=>{
      const btn=e.target.closest("[data-archive]");if(!btn)return;
      if(!confirm("Archive this listing? It will no longer appear in the published public feed."))return;
      const {error}=await sb.from("community_hub_content").update({status:"archived",updated_at:new Date().toISOString()}).eq("id",btn.dataset.archive);
      if(error)toast("Archive failed: "+error.message,"error");else{toast("Listing archived.","success");await load();}
    });
    $("#content-form")?.addEventListener("change",e=>{
      if(e.target.id==="content_type")$("#starts_at").required=e.target.value==="event";
    });
    await load();
    const params=new URLSearchParams(location.search);
    if(params.get("new")==="event"){edit(null);$("#content_type").value="event";$("#starts_at").required=true;}
    if(params.get("edit")){
      const {data,error}=await sb.from("community_hub_content").select("*").eq("id",params.get("edit")).maybeSingle();
      if(error)toast("Could not open listing: "+error.message,"error");else if(data)edit(data);
    }
  }
  async function reportsManager(){
    const table=$("#reports-table");if(!table)return;
    const state=$("#report-status"),reason=$("#report-reason"),search=$("#report-search");
    const labels={outdated_information:"Outdated information",incorrect_contact:"Incorrect contact details",closed_or_unavailable:"Closed / unavailable",duplicate_listing:"Duplicate listing",broken_link:"Broken link",other:"Other"};
    async function load(){
      table.innerHTML='<tr><td colspan="5"><div class="skeleton"></div></td></tr>';
      let q=sb.from("community_hub_listing_reports").select("*").order("created_at",{ascending:false}).limit(300);
      if(state.value!=="all")q=q.eq("status",state.value);
      if(reason.value!=="all")q=q.eq("report_reason",reason.value);
      if(search.value.trim())q=q.ilike("listing_title","%"+search.value.trim().replace(/[%_,]/g," ")+"%");
      const {data,error}=await q;
      if(error){table.innerHTML='<tr><td colspan="5"><div class="empty">Could not load reports.</div></td></tr>';toast("Could not load listing reports: "+error.message,"error");return;}
      table.innerHTML=(data||[]).map(row=>'<tr><td><strong>'+html(row.listing_title)+'</strong><div class="item-meta">'+html(row.details||"No extra details supplied.")+'</div><div class="item-meta">Report ID: '+html(row.id)+'</div></td><td>'+html(labels[row.report_reason]||row.report_reason)+'</td><td>'+html(dateText(row.created_at))+'</td><td>'+badge(row.status)+'</td><td><div class="filters"><select aria-label="New status for '+html(row.listing_title)+'" data-report-status="'+row.id+'"><option value="new" '+(row.status==="new"?"selected":"")+'>New</option><option value="reviewing" '+(row.status==="reviewing"?"selected":"")+'>Reviewing</option><option value="resolved" '+(row.status==="resolved"?"selected":"")+'>Resolved</option><option value="dismissed" '+(row.status==="dismissed"?"selected":"")+'>Dismissed</option></select><button class="btn small" data-report-save="'+row.id+'">Save</button>'+(row.content_id?'<a class="btn small" href="content.html?edit='+encodeURIComponent(row.content_id)+'">Open listing</a>':'')+'</div></td></tr>').join("")||'<tr><td colspan="5"><div class="empty">No reports match these filters.</div></td></tr>';
      $("[data-report-save]",table).forEach(btn=>btn.addEventListener("click",async()=>{
        const select=$('[data-report-status="'+btn.dataset.reportSave+'"]',table);if(!select)return;
        btn.disabled=true;
        try{
          const {data:{user}}=await sb.auth.getUser();
          const final=["resolved","dismissed"].includes(select.value);
          const {error}=await sb.from("community_hub_listing_reports").update({status:select.value,reviewed_at:final?new Date().toISOString():null,reviewed_by:final?user.id:null}).eq("id",btn.dataset.reportSave);
          if(error)throw error;
          toast("Report status updated.","success");await load();
        }catch(err){toast("Could not update report: "+err.message,"error");btn.disabled=false;}
      }));
    }
    $("#reports-refresh")?.addEventListener("click",load);[state,reason].forEach(el=>el.addEventListener("change",load));let timer;search.addEventListener("input",()=>{clearTimeout(timer);timer=setTimeout(load,250);});await load();
  }
  async function eventsPage(){
    const table=$("#events-table");if(!table)return;
    const search=$("#events-search"),state=$("#events-state");
    async function load(){
      let q=sb.from("community_hub_content").select("*").eq("content_type","event").order("starts_at",{ascending:true}).limit(300);
      if(state.value!=="all")q=q.eq("status",state.value);
      if(search.value.trim())q=q.ilike("title","%"+search.value.trim().replace(/[%_,]/g," ")+"%");
      const {data,error}=await q;if(error){toast("Could not load events: "+error.message,"error");return;}
      table.innerHTML=(data||[]).map(row=>'<tr><td><strong>'+html(row.title)+'</strong><div class="item-meta">'+html(row.organization||"")+'</div></td><td>'+html(dateText(row.starts_at))+'</td><td>'+html(row.location_text||"—")+'</td><td>'+badge(row.status)+'</td><td>'+(row.is_featured?'<span class="status good">Featured</span>':'—')+'</td><td><a class="btn small" href="content.html?edit='+encodeURIComponent(row.id)+'">Edit listing</a></td></tr>').join("")||'<tr><td colspan="6"><div class="empty">No events match these filters.</div></td></tr>';
    }
    $("#events-refresh")?.addEventListener("click",load);[search,state].forEach(el=>el.addEventListener(el===search?"input":"change",load));$("#event-new")?.addEventListener("click",()=>location.href="content.html?new=event");await load();
  }
  async function systemHealth(){
    const list=$("#health-checks");if(!list)return;
    const checks=[];
    async function check(label,detail,fn){try{await fn();checks.push({label,detail,state:"connected"});}catch(err){checks.push({label,detail:err.message||"Check failed",state:"error"});}}
    await check("Authentication session","Supabase Auth session is valid",async()=>{const {data:{user},error}=await sb.auth.getUser();if(error)throw error;if(!user||user.app_metadata?.role!=="admin")throw new Error("No authorized admin user");});
    await check("Submission table","Read access to community_hub_submissions",async()=>{const {error}=await sb.from("community_hub_submissions").select("id",{head:true,count:"exact"});if(error)throw error;});
    await check("Public content table","Read access to community_hub_content",async()=>{const {error}=await sb.from("community_hub_content").select("id",{head:true,count:"exact"});if(error)throw error;});
    await check("Approval workflow","Atomic approve_community_hub_submission RPC is available",async()=>{const {error}=await sb.rpc("approve_community_hub_submission",{p_submission_id:"00000000-0000-0000-0000-000000000000",p_review_notes:"health-check"});if(!error)return;if(/Submission not found|not accessible/i.test(error.message))return;if(/PGRST202|Could not find the function|function .* does not exist/i.test(error.message))throw new Error("Approval RPC is not installed or not exposed yet.");if(error.code==="42501")throw new Error("RPC exists, but admin role or RLS permission was denied.");throw error;});
    list.innerHTML=checks.map(c=>'<div class="health-row"><div><div class="health-title">'+html(c.label)+'</div><div class="health-detail">'+html(c.detail)+'</div></div>'+badge(c.state)+'</div>').join("");
    const overall=checks.every(c=>c.state==="connected");$("#health-overall").innerHTML=badge(overall?"connected":"warning");$("#health-checked").textContent="Checked "+new Date().toLocaleString();
    $("#health-refresh")?.addEventListener("click",systemHealth);
  }
  document.addEventListener("DOMContentLoaded",async()=>{
    if(isLogin){const recovering=new URLSearchParams(location.hash.slice(1)).get("type")==="recovery";await sb.auth.getSession().then(({data})=>{if(data.session&&!recovering)location.replace(cfg.dashboardPath);});signIn();return;}
    try{const user=await requireAdmin();if(!user)return;await dashboard();await submissions();await contentManager();await reportsManager();await eventsPage();await systemHealth();}catch(err){toast("Admin initialization failed: "+err.message,"error");}
  });
  window.CrowHubAdmin={supabase:sb};
})();