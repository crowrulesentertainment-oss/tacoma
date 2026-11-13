(()=>{"use strict";
const $=(s,r=document)=>r.querySelector(s),esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let db,actor;
const note=(s,bad=false)=>{const e=$("#menu-manager-status");if(e){e.textContent=s;e.className="menu-manager-status "+(bad?"bad":"ok")}};
const basePath=()=>location.pathname.replace(/[^/]*$/,"");
const route=h=>{try{const u=new URL(h,location.href);return u.origin===location.origin?decodeURIComponent(u.pathname).replace(basePath(),""):""}catch{return""}};
const labelOf=a=>(a.getAttribute("aria-label")||a.textContent||"").replace(/[↗→⌄]+/g,"").replace(/\s+/g," ").trim().slice(0,100);
function candidates(){
 const found=new Map(),add=(a,group,order)=>{
  if(!a||!a.matches("a[href]"))return;
  const href=route(a.getAttribute("href")||"");
  if(!href||href.startsWith("#")||href==="admin.html"||href==="email-operations.html")return;
  const label=labelOf(a);if(!label)return;
  const key=href.toLowerCase();
  if(!found.has(key))found.set(key,{href,label,menu_group:group,display_order:order,enabled:true});
 };
 const nav=$("#primary-nav");
 if(nav){
  let n=0;
  nav.querySelectorAll(":scope > a[href],:scope > .nav-dropdown a[href]").forEach(a=>{
   const drop=a.closest(".nav-dropdown");
   const parent=drop?.querySelector(".nav-drop-button")?.textContent||"";
   const group=drop?( /involv/i.test(parent)?"get-involved":"community"):"main";
   add(a,group,++n*10);
  });
 }
 document.querySelectorAll(".footer-main>div").forEach((col,i)=>{
  const heading=(col.querySelector("h2,h3")?.textContent||"").toLowerCase();
  const group=heading.includes("particip")?"footer-participate":heading.includes("community")?"footer-community":heading.includes("operation")?"footer-operations":"footer-discover";
  col.querySelectorAll("a[href]").forEach((a,j)=>add(a,group,(i+1)*100+j*10));
 });
 // Keep annual campaign destinations manageable even when the current admin page's
 // own header/footer does not contain the public campaign link.
 const loveIsLocal=route("valentines/");
 if(loveIsLocal&&!found.has(loveIsLocal.toLowerCase()))found.set(loveIsLocal.toLowerCase(),{href:loveIsLocal,label:"Love Is Local",menu_group:"main",display_order:60,enabled:true});
 return [...found.values()];
}
async function syncNewLinks(){
 const found=candidates();
 const {data,error}=await db.from("hub_menu_items").select("href");
 if(error)throw error;
 const existing=new Set((data||[]).map(x=>route(x.href).toLowerCase()).filter(Boolean));
 const missing=found.filter(x=>!existing.has(x.href.toLowerCase()));
 if(!missing.length)return 0;
 const {error:insertError}=await db.from("hub_menu_items").insert(missing);
 if(insertError)throw insertError;
 return missing.length;
}
async function apply(){
 if(!db)return;
 const {data,error}=await db.from("hub_menu_items").select("href,enabled");
 if(error){console.warn("Hub menu settings unavailable",error);return}
 const map=new Map((data||[]).map(x=>[route(x.href).toLowerCase(),!!x.enabled]));
 document.querySelectorAll("header a[href],footer a[href]").forEach(a=>{
  const key=route(a.getAttribute("href")||"").toLowerCase();
  if(!key||!map.has(key))return;
  a.hidden=!map.get(key);a.setAttribute("aria-hidden",String(!map.get(key)));
 });
 document.querySelectorAll(".nav-dropdown").forEach(d=>{
  const links=[...d.querySelectorAll(".nav-drop-menu a")];
  if(links.length)d.hidden=links.every(a=>a.hidden);
 });
 document.querySelectorAll(".footer-main>div").forEach(col=>{
  const links=[...col.querySelectorAll("a[href]")];
  if(links.length)col.hidden=links.every(a=>a.hidden);
 });
}
async function loadRows(){
 const {data,error}=await db.from("hub_menu_items").select("*").order("menu_group").order("display_order").order("label");
 if(error)throw error;
 const groups={"main":"Main navigation","get-involved":"Get Involved dropdown","community":"Community dropdown","footer-discover":"Footer · Discover","footer-participate":"Footer · Participate","footer-community":"Footer · Community links","footer-operations":"Footer · Operations"};
 const box=$("#menu-manager-list");
 box.innerHTML=Object.entries(groups).map(([g,title])=>{
  const rows=(data||[]).filter(x=>x.menu_group===g);if(!rows.length)return"";
  return '<section class="menu-group"><h3>'+title+'</h3>'+rows.map(x=>'<label class="menu-row"><span><b>'+esc(x.label)+'</b><small>'+esc(x.href)+'</small></span><span class="menu-switch"><input type="checkbox" data-menu-id="'+esc(x.id)+'" '+(x.enabled?"checked":"")+'><i></i></span></label>').join("")+'</section>';
 }).join("");
 box.querySelectorAll("[data-menu-id]").forEach(input=>input.addEventListener("change",async()=>{
  input.disabled=true;
  const {error}=await db.from("hub_menu_items").update({enabled:input.checked,updated_at:new Date().toISOString(),updated_by:actor.id}).eq("id",input.dataset.menuId);
  input.disabled=false;
  if(error){input.checked=!input.checked;note("Could not save this menu setting: "+error.message,true);return}
  note("Menu setting saved. The public navigation updates on its next page load.");await apply();
 }));
 note("Menu controls loaded. New header and footer links are automatically discovered when the Control Room opens.");
}
async function refreshManager(){
 note("Scanning the Hub for new navigation links…");
 const added=await syncNewLinks();
 await loadRows();await apply();
 if(added)note(added+" new navigation "+(added===1?"link was":"links were")+" added automatically. New links default to visible; you can switch them off here.");
}
async function boot(){
 if(document.body.dataset.page!=="admin")return;
 db=window.__hubSupabaseClient;if(!db)return;
 const {data:{user}}=await db.auth.getUser();if(!user)return;
 const {data:adm}=await db.from("hub_admins").select("role").eq("user_id",user.id).maybeSingle();
 if(String(adm?.role).toLowerCase()!=="admin")return;
 if($("#admin-menu-manager"))return;
 actor=user;const w=$("#admin-content");if(!w)return;
 const section=document.createElement("section");section.className="admin-workspace-section menu-manager-section";section.id="admin-menu-manager";
 section.innerHTML='<div class="admin-section-heading"><div><span class="eyebrow">08 · Public navigation</span><h2>Menu visibility manager</h2><p>New links added to the Hub header or footer are detected automatically and added here. Turn links on or off without deleting pages or content.</p></div><span class="admin-section-icon">☷</span></div><div class="menu-manager-toolbar"><span>ON = visible · OFF = hidden · New links default to ON</span><button type="button" class="button" id="menu-manager-refresh">↻ Scan & refresh</button></div><div id="menu-manager-status" class="menu-manager-status">Discovering navigation links…</div><div id="menu-manager-list"></div><p class="menu-manager-footnote">Automatic discovery covers internal page links, including directory-style URLs such as new-years-eve-2027/, in the site header and footer. Admin/control-room and email-operations links are excluded. Direct page URLs remain accessible; this manager controls navigation visibility only.</p>';
 w.append(section);
 const nav=$(".admin-workspace-nav");if(nav){const a=document.createElement("a");a.href="#admin-menu-manager";a.textContent="Menu visibility";nav.append(a)}
 $("#menu-manager-refresh").addEventListener("click",()=>refreshManager().catch(e=>note("Menu scan failed: "+e.message,true)));
 await refreshManager();
}
document.addEventListener("DOMContentLoaded",()=>{setTimeout(()=>boot().catch(e=>note(e.message,true)),700)});
document.addEventListener("DOMContentLoaded",()=>{
 const cfg=window.HUB_CONFIG||{};
 if(window.supabase&&cfg.url&&cfg.key){
  const sharedKey="sb-cevylpnoexugwgygvtgu-auth-token";
  try{
   if(!localStorage.getItem(sharedKey)){
    const legacy=localStorage.getItem("tacoma-community-hub-auth");
    if(legacy)localStorage.setItem(sharedKey,legacy);
   }
   const verifier=localStorage.getItem("tacoma-community-hub-auth-code-verifier");
   if(verifier&&!localStorage.getItem(sharedKey+"-code-verifier"))localStorage.setItem(sharedKey+"-code-verifier",verifier);
  }catch(error){console.warn("Hub shared-session migration skipped:",error)}
  const c=window.__hubSupabaseClient||window.supabase.createClient(cfg.url,cfg.key,{auth:{storage:window.localStorage,storageKey:sharedKey,persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  setTimeout(()=>{if(document.body.dataset.page!=="admin")return;c.auth.onAuthStateChange(()=>setTimeout(()=>boot().catch(console.warn),250))},900);
 }
});
})();