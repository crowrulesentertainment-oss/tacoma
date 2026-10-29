(()=>{"use strict";
const $=s=>document.querySelector(s),cfg=window.HUB_CONFIG||{};
let client=null,session=null,busy=false;
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const dt=v=>v?new Date(v).toLocaleString([],{dateStyle:"medium",timeStyle:"short"}):"—";
async function loadAudit(){
 if(busy)return;busy=true;const btn=$("#ops-audit-refresh");if(btn)btn.disabled=true;
 const status=$("#ops-audit-status"),body=$("#ops-audit-rows");
 try{
  if(!client){if(!window.supabase||!cfg.url||!cfg.key)throw Error("Supabase configuration unavailable.");client=window.supabase.createClient(cfg.url,cfg.key,{auth:{persistSession:true,autoRefreshToken:true}});}
  const {data,error}=await client.auth.getSession();if(error)throw error;session=data?.session;
  if(!session?.access_token){status.textContent="Sign in with an authorized administrator account to view audit history.";body.innerHTML='<tr><td colspan="6">Administrator sign-in required.</td></tr>';return;}
  const res=await fetch(String(cfg.url).replace(/\/$/,"")+"/functions/v1/member-email-audit",{headers:{Authorization:"Bearer "+session.access_token,apikey:cfg.key}});
  const dataOut=await res.json().catch(()=>({error:"Invalid server response"}));if(!res.ok)throw Error(dataOut.error||"Audit request failed.");
  const rows=dataOut.rows||[];status.textContent="Loaded "+rows.length+" audit record(s) · refreshed "+dt(dataOut.generated_at)+". Showing at most 200 records.";
  if(!rows.length){body.innerHTML='<tr><td colspan="6">No reconciliation audit entries recorded yet.</td></tr>';return;}
  body.innerHTML=rows.map(r=>'<tr><td>'+esc(dt(r.occurred_at))+'</td><td>'+esc(r.admin_email||r.admin_user_id||"Not captured")+'</td><td>'+esc(r.action)+'</td><td><div>Ledger: <code>'+esc(r.ledger_id)+'</code></div><div class="ops-small">Activity: '+esc(r.activity_id)+'</div></td><td>'+esc(r.prior_status)+' → '+esc(r.resulting_status)+'<div class="ops-small">'+esc(r.outcome)+'</div></td><td><div>'+esc(r.confirmation_phrase)+'</div><div class="ops-small">'+esc(r.details)+'</div></td></tr>').join("");
 }catch(e){status.textContent=e.message||"Could not load audit history.";body.innerHTML='<tr><td colspan="6">Audit history could not be loaded. Check the administrator session and server logs.</td></tr>';}
 finally{busy=false;if(btn)btn.disabled=false;}
}
document.addEventListener("DOMContentLoaded",()=>{
 const btn=$("#ops-audit-refresh");if(btn)btn.addEventListener("click",loadAudit);
 const signIn=$("#ops-signin-form");if(signIn)signIn.addEventListener("submit",()=>setTimeout(loadAudit,1200));
 const refresh=$("#ops-refresh");if(refresh)refresh.addEventListener("click",()=>setTimeout(loadAudit,700));
 const signout=$("#ops-signout");if(signout)signout.addEventListener("click",()=>{const body=$("#ops-audit-rows");if(body)body.innerHTML='<tr><td colspan="6">Sign in to view audit history.</td></tr>';const status=$("#ops-audit-status");if(status)status.textContent="Administrator sign-in required.";});
 loadAudit();
});
})();