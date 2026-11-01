(() => {
const cfg=window.CROWRULES_SUPABASE;
const {createClient}=window.supabase||{};
const client=cfg&&createClient?createClient(cfg.url,cfg.publishableKey):null;
const $=id=>document.getElementById(id);
const state={user:null,rows:[],contacts:{},listings:[],seasons:[],type:"all",status:"pending",season:"all"};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const say=(id,msg,kind="")=>{const n=$(id);if(n){n.textContent=msg;n.className="message "+kind;}};
const setConnection=(s)=>{$("connectionState").textContent=s;$("connectionState").style.color=s.includes("SECURE")?"#a6d8b8":"#e58da2";};
const showDashboard=on=>{$("dashboard").classList.toggle("hidden",!on);$("loginPanel").classList.toggle("hidden",on);$("signOut").classList.toggle("hidden",!on);};
function ensureClient(){if(!client){say("loginMessage","Supabase client could not load. Check network access and the configuration script.","error");return false;}return true;}
async function verifySession(session){
 if(!session?.user){state.user=null;showDashboard(false);setConnection("● SIGNED OUT");return;}
 const {data,error}=await client.auth.getUser();
 if(error||!data.user){await client.auth.signOut();showDashboard(false);say("loginMessage","Your session could not be verified. Please sign in again.","error");return;}
 if(data.user.app_metadata?.role!=="admin"){await client.auth.signOut();showDashboard(false);say("loginMessage","This account does not have the CrowRules administrator role.","error");setConnection("● ACCESS DENIED");return;}
 state.user=data.user;showDashboard(true);setConnection("● ADMIN SESSION SECURE");await refreshAll();
}
async function refreshAll(){
 say("queueMessage","Loading submissions…");say("listingMessage","");
 const [sub,contacts,list,seasons]=await Promise.all([
  client.from("valentines_submissions").select("*").order("created_at",{ascending:false}).limit(250),
  client.from("valentines_submission_contacts").select("submission_id,submitter_email"),
  client.from("valentines_featured_listings").select("*").order("season_year",{ascending:false}).order("sort_order").order("created_at",{ascending:false}),
  client.from("valentines_seasons").select("*").order("season_year",{ascending:false})
 ]);
 if(sub.error){say("queueMessage",sub.error.message,"error");return;}
 if(contacts.error){say("queueMessage","Submissions loaded, but private contact records could not be loaded: "+contacts.error.message,"error");}
 if(list.error){say("listingMessage",list.error.message,"error");return;}
 if(seasons.error){say("seasonMessage",seasons.error.message,"error");}
 state.rows=sub.data||[];state.contacts=Object.fromEntries((contacts.data||[]).map(x=>[x.submission_id,x]));state.listings=list.data||[];state.seasons=seasons.data||[];populateSeasonFilter();
 $("pendingCount").textContent=state.rows.filter(x=>x.status==="pending").length;
 $("approvedCount").textContent=state.rows.filter(x=>x.status==="approved").length;
 $("listingCount").textContent=state.listings.filter(x=>x.is_published).length;
 $("eventCount").textContent=state.rows.filter(x=>x.submission_type==="event").length;
 say("queueMessage",state.rows.length+" submissions loaded.","ok");renderSubmissions();renderListings();renderSeasons();
}
function populateSeasonFilter(){
 const select=$("submissionSeasonFilter");if(!select)return;
 const previous=state.season;
 const years=[...new Set([...state.rows.map(x=>Number(x.season_year)),...state.seasons.map(x=>Number(x.season_year))].filter(Number.isFinite))].sort((a,b)=>b-a);
 select.replaceChildren(new Option("All years","all"));
 years.forEach(y=>select.add(new Option(String(y),String(y))));
 select.value=years.includes(Number(previous))?previous:"all";state.season=select.value;
}
function renderSubmissions(){
 const rows=state.rows.filter(x=>(state.type==="all"||x.submission_type===state.type)&&(state.status==="all"||x.status===state.status)&&(state.season==="all"||String(x.season_year)===state.season));
 const host=$("submissionList");
 if(!rows.length){host.innerHTML='<div class="empty">No submissions in this view yet.</div>';return;}
 host.innerHTML=rows.map(x=>`<article class="submission-card" data-id="${esc(x.id)}"><div class="submission-top"><span class="type-tag">${esc(x.submission_type.replace("_"," "))} · ${esc(x.season_year)}</span><span class="status-tag ${esc(x.status)}">${esc(x.status)}</span></div><h3>${esc(x.title)}</h3><p>${esc(x.body)}</p><div class="meta"><span>By ${esc(x.submitter_name)}</span><span>${esc(x.organization||"Community member")}</span><span>${new Date(x.created_at).toLocaleString()}</span></div><div class="contact">PRIVATE CONTACT · ${esc(state.contacts[x.id]?.submitter_email||"No contact email attached")} ${x.website_url?" · "+esc(x.website_url):""} ${x.address?" · "+esc(x.address):""} ${x.event_start?" · "+new Date(x.event_start).toLocaleString():""}</div><div class="review-tools"><textarea class="review-notes" placeholder="Private moderator notes (never public)…">${esc(x.review_notes||"")}</textarea><div class="actions"><button class="btn primary" data-action="approved">Approve</button><button class="btn" data-action="rejected">Reject</button><button class="btn" data-action="archived">Archive</button>${x.submission_type==="business"?'<button class="btn" data-action="feature">Create listing</button>':""}</div></div></article>`).join("");
}
async function updateSubmission(id,status,notes){
 const {error}=await client.from("valentines_submissions").update({status,review_notes:notes||null,reviewed_at:new Date().toISOString(),reviewed_by:state.user.id,updated_at:new Date().toISOString()}).eq("id",id);
 if(error){say("queueMessage",error.message,"error");return false;}
 say("queueMessage","Submission updated: "+status+".","ok");await refreshAll();return true;
}
function renderListings(){
 const host=$("listingList");
 if(!state.listings.length){host.innerHTML='<div class="empty">No featured listings created yet.</div>';return;}
 host.innerHTML=state.listings.map(x=>`<article class="listing-card" data-id="${esc(x.id)}"><div class="details"><span class="status-tag ${x.is_published?"approved":"archived"}">${x.is_published?"Published":"Draft"}</span><h3>${esc(x.name)}</h3><p>${esc(x.description)}</p><div class="meta">${esc(x.category)} · ${esc(x.address||"No address")} · Season ${esc(x.season_year)}</div></div><div class="actions"><button class="btn" data-action="edit">Edit</button><button class="btn" data-action="toggle">${x.is_published?"Unpublish":"Publish"}</button><button class="btn" data-action="delete">Delete</button></div></article>`).join("");
}

function renderSeasons(){
 const host=$("seasonList");if(!host)return;
 if(!state.seasons.length){host.innerHTML='<div class="empty">No annual seasons created yet.</div>';return;}
 host.innerHTML=state.seasons.map(s=>'<article class="listing-card" data-year="'+esc(s.season_year)+'"><div class="details"><span class="status-tag '+(s.status==="archived"?"archived":"approved")+'">'+esc(s.status)+'</span><h3>'+esc(s.display_name)+'</h3><p>'+esc(s.theme||"No theme set")+'</p><div class="meta">'+esc(s.event_date)+' · '+esc(s.highlights||"No highlights added yet")+'</div></div><div class="actions"><button class="btn" data-season-action="edit">Edit</button></div></article>').join("");
}
function clearSeason(){
 $("seasonForm").reset();$("seasonYear").value="";$("seasonName").value="";$("seasonDate").value="";$("seasonTheme").value="";$("seasonStatus").value="planning";$("seasonHighlights").value="";
}
function editSeason(s){
 $("seasonYear").value=s.season_year;$("seasonName").value=s.display_name;$("seasonDate").value=s.event_date;$("seasonTheme").value=s.theme||"";$("seasonStatus").value=s.status;$("seasonHighlights").value=s.highlights||"";
 $("seasonForm").scrollIntoView({behavior:"smooth",block:"start"});
}
function resetListing(){ $("listingForm").reset();$("listingId").value="";$("sourceSubmissionId").value="";$("listingCategory").value="Local business";$("listingSeasonYear").value=String(state.seasons.find(s=>s.status==="open")?.season_year||state.seasons.find(s=>s.status==="planning")?.season_year||new Date().getFullYear());$("listingPublished").checked=false;$("listingFormTitle").textContent="Create a featured listing"; }
function editListing(x){$("listingId").value=x.id;$("sourceSubmissionId").value=x.source_submission_id||"";$("listingName").value=x.name;$("listingDescription").value=x.description;$("listingCategory").value=x.category;$("listingLabel").value=x.display_label||"";$("listingWebsite").value=x.website_url||"";$("listingAddress").value=x.address||"";$("listingImage").value=x.image_url||"";$("listingSeasonYear").value=x.season_year||"";$("listingPublished").checked=x.is_published;$("listingFormTitle").textContent="Edit featured listing";$("listingForm").scrollIntoView({behavior:"smooth",block:"start"});}
$("loginForm").addEventListener("submit",async e=>{e.preventDefault();if(!ensureClient())return;say("loginMessage","Signing in…");const {data,error}=await client.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});if(error){say("loginMessage",error.message,"error");return;}await verifySession(data.session);});
$("googleLogin").addEventListener("click",async()=>{if(!ensureClient())return;const {error}=await client.auth.signInWithOAuth({provider:"google",options:{redirectTo:location.href}});if(error)say("loginMessage",error.message,"error");});
$("signOut").addEventListener("click",async()=>{await client.auth.signOut();showDashboard(false);state.user=null;setConnection("● SIGNED OUT");});
$("refresh").addEventListener("click",refreshAll);$("refreshListings").addEventListener("click",refreshAll);$("cancelListing").addEventListener("click",resetListing);
$("typeFilters").addEventListener("click",e=>{const b=e.target.closest("[data-type]");if(!b)return;state.type=b.dataset.type;$("typeFilters").querySelectorAll("button").forEach(x=>x.classList.toggle("active",x===b));renderSubmissions();});
$("statusFilters").addEventListener("click",e=>{const b=e.target.closest("[data-status]");if(!b)return;state.status=b.dataset.status;$("statusFilters").querySelectorAll("button").forEach(x=>x.classList.toggle("active",x===b));renderSubmissions();});
$("submissionSeasonFilter").addEventListener("change",e=>{state.season=e.target.value;renderSubmissions();});
$("submissionList").addEventListener("click",async e=>{const b=e.target.closest("button[data-action]");if(!b)return;const card=b.closest("[data-id]");const row=state.rows.find(x=>x.id===card.dataset.id);if(!row)return;if(b.dataset.action==="feature"){editListing({id:"",source_submission_id:row.id,name:row.organization||row.title,description:row.body,category:row.category||"Local business",display_label:"",website_url:row.website_url||"",address:row.address||"",image_url:"",season_year:row.season_year,is_published:false});document.querySelector('[data-panel="listingsPanel"]').click();return;}await updateSubmission(row.id,b.dataset.action,card.querySelector(".review-notes").value);});
$("listingForm").addEventListener("submit",async e=>{e.preventDefault();const id=$("listingId").value;const payload={name:$("listingName").value.trim(),description:$("listingDescription").value.trim(),category:$("listingCategory").value.trim()||"Local business",display_label:$("listingLabel").value.trim()||null,website_url:$("listingWebsite").value.trim()||null,address:$("listingAddress").value.trim()||null,image_url:$("listingImage").value.trim()||null,season_year:Number($("listingSeasonYear").value),is_published:$("listingPublished").checked,source_submission_id:$("sourceSubmissionId").value||null,updated_at:new Date().toISOString()};const result=id?await client.from("valentines_featured_listings").update(payload).eq("id",id):await client.from("valentines_featured_listings").insert(payload);if(result.error){say("listingMessage",result.error.message,"error");return;}say("listingMessage","Featured listing saved.","ok");resetListing();await refreshAll();});
$("listingList").addEventListener("click",async e=>{const b=e.target.closest("button[data-action]");if(!b)return;const card=b.closest("[data-id]");const x=state.listings.find(z=>z.id===card.dataset.id);if(!x)return;if(b.dataset.action==="edit"){editListing(x);return;}if(b.dataset.action==="toggle"){const {error}=await client.from("valentines_featured_listings").update({is_published:!x.is_published,updated_at:new Date().toISOString()}).eq("id",x.id);if(error){say("listingMessage",error.message,"error");return;}await refreshAll();return;}if(b.dataset.action==="delete"&&confirm("Delete this featured listing?")){const {error}=await client.from("valentines_featured_listings").delete().eq("id",x.id);if(error){say("listingMessage",error.message,"error");return;}await refreshAll();}});

$("refreshSeasons").addEventListener("click",refreshAll);
$("clearSeason").addEventListener("click",clearSeason);
$("seasonForm").addEventListener("submit",async e=>{
 e.preventDefault();
 const season_year=Number($("seasonYear").value);
 const payload={season_year,display_name:$("seasonName").value.trim(),event_date:$("seasonDate").value,theme:$("seasonTheme").value.trim()||null,status:$("seasonStatus").value,highlights:$("seasonHighlights").value.trim()||null,updated_at:new Date().toISOString()};
 const {error}=await client.from("valentines_seasons").upsert(payload,{onConflict:"season_year"});
 if(error){say("seasonMessage",error.message,"error");return;}
 say("seasonMessage","Annual season saved.","ok");await refreshAll();
});
$("seasonList").addEventListener("click",e=>{
 const b=e.target.closest("button[data-season-action]");if(!b)return;
 const card=b.closest("[data-year]"),s=state.seasons.find(x=>String(x.season_year)===card.dataset.year);if(s)editSeason(s);
});
resetListing();
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b));document.querySelectorAll(".panel").forEach(panel=>panel.classList.toggle("hidden",panel.id!==b.dataset.panel));}));
if(ensureClient()){client.auth.getSession().then(({data,error})=>{if(error){setConnection("● AUTH ERROR");say("loginMessage",error.message,"error");return;}verifySession(data.session);});client.auth.onAuthStateChange((_event,session)=>{setTimeout(()=>verifySession(session),0);});}
})();