(()=>{"use strict";
const $=s=>document.querySelector(s);
const cfg=window.HUB_CONFIG||{};
let running=false;
function show(text,ok=false){const el=$("#ops-auth-test-status");if(!el)return;el.textContent=text;el.className=ok?"ops-alert ops-success":"ops-alert";}
async function run(){
 const btn=$("#ops-auth-test");if(running||!btn)return;
 const base=String(cfg.url||"").replace(/\/$/,"");
 if(!base){show("Cannot test: Supabase URL is not configured.");return;}
 running=true;btn.disabled=true;show("Sending a read-only request without Authorization…");
 try{
  const response=await fetch(base+"/functions/v1/member-email-operations",{method:"GET",cache:"no-store"});
  const body=await response.json().catch(()=>({}));
  if(response.status===401){
   show("PASS · HTTP 401 Unauthorized · "+String(body.error||"Unauthenticated request rejected.")+" · "+new Date().toLocaleString(),true);
  }else if(response.status===403){
   show("Unexpected HTTP 403. This did not confirm the expected missing-token rejection. Response: "+String(body.error||"Forbidden."));
  }else{
   show("NOT PASSED · HTTP "+response.status+" · "+String(body.error||"Unexpected response. No reconciliation action was requested."));
  }
 }catch(e){
  show("TEST INCONCLUSIVE · Browser could not read the endpoint response. Check network/CORS and try again. "+String(e?.message||"Request failed."));
 }finally{running=false;btn.disabled=false;}
}
document.addEventListener("DOMContentLoaded",()=>{const b=$("#ops-auth-test");if(b)b.addEventListener("click",run);});
})();