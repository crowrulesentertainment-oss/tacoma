(()=>{"use strict";
const $=s=>document.querySelector(s);
const cfg=window.HUB_CONFIG||{};
const KEY="tacomaHubSecurityTestHistory.v1",MAX=50;
let running=false;
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function read(){try{const v=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(v)?v.filter(x=>x&&typeof x.time==="string"&&typeof x.test==="string").slice(0,MAX):[];}catch{return [];}}
function render(){
 const rows=$("#ops-security-history-rows"),status=$("#ops-security-history-status");if(!rows||!status)return;
 const list=read();
 if(!list.length){rows.innerHTML='<tr><td colspan="4">No local security-test results recorded yet.</td></tr>';status.textContent="0 test results saved in this browser.";return;}
 rows.innerHTML=list.map(x=>'<tr><td>'+esc(new Date(x.time).toLocaleString())+'</td><td>'+esc(x.test)+'</td><td>'+esc(x.status===null?"Unavailable":x.status)+'</td><td><span class="ops-status '+(x.outcome==="PASS"?"sent":"failed")+'">'+esc(x.outcome)+'</span><div class="ops-small">'+esc(x.note||"")+'</div></td></tr>').join("");
 status.textContent=list.length+" local result(s) · newest first · maximum "+MAX+".";
}
function save(item){
 try{const next=[item,...read()].slice(0,MAX);localStorage.setItem(KEY,JSON.stringify(next));render();return true;}
 catch{const status=$("#ops-security-history-status");if(status)status.textContent="Test ran, but this browser blocked local storage; result was not saved.";return false;}
}
function show(text,ok=false){const el=$("#ops-auth-test-status");if(!el)return;el.textContent=text;el.className=ok?"ops-alert ops-success":"ops-alert";}
async function run(){
 const btn=$("#ops-auth-test");if(running||!btn)return;
 const base=String(cfg.url||"").replace(/\/$/,"");
 if(!base){show("Cannot test: Supabase URL is not configured.");save({time:new Date().toISOString(),test:"Unauthenticated endpoint",status:null,outcome:"FAIL",note:"Supabase URL unavailable"});return;}
 running=true;btn.disabled=true;show("Sending a read-only request without Authorization…");
 let record={time:new Date().toISOString(),test:"Unauthenticated endpoint",status:null,outcome:"INCONCLUSIVE",note:""};
 try{
  const response=await fetch(base+"/functions/v1/member-email-operations",{method:"GET",cache:"no-store"});
  record.status=response.status;
  if(response.status===401){record.outcome="PASS";record.note="Missing-token request rejected";show("PASS · HTTP 401 Unauthorized · Unauthenticated request rejected · "+new Date().toLocaleString(),true);}
  else if(response.status===403){record.outcome="INCONCLUSIVE";record.note="Unexpected 403 for missing token";show("Unexpected HTTP 403. This did not confirm the expected missing-token rejection.");}
  else{record.outcome="FAIL";record.note="Unexpected HTTP response";show("NOT PASSED · HTTP "+response.status+" · Unexpected response. No reconciliation action was requested.");}
 }catch(e){record.outcome="INCONCLUSIVE";record.note="Browser could not read endpoint response (network/CORS)";show("TEST INCONCLUSIVE · Browser could not read the endpoint response. Check network/CORS and try again.");}
 finally{save(record);running=false;btn.disabled=false;}
}
function csvCell(v){return '"'+String(v??"").replace(/"/g,'""')+'"';}
function exportHistory(){const list=read();if(!list.length){const s=$("#ops-security-history-status");if(s)s.textContent="Nothing to export yet.";return;}
 const csv=[["time","test","http_status","outcome","note"],...list.map(x=>[x.time,x.test,x.status??"",x.outcome,x.note||""])].map(row=>row.map(csvCell).join(",")).join("\r\n");
 const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="tacoma-security-test-history.csv";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
}
document.addEventListener("DOMContentLoaded",()=>{
 const b=$("#ops-auth-test");if(b)b.addEventListener("click",run);
 const exp=$("#ops-security-export");if(exp)exp.addEventListener("click",exportHistory);
 const clear=$("#ops-security-clear");if(clear)clear.addEventListener("click",()=>{if(!window.confirm("Clear only this browser's saved security-test history? This will not affect server records."))return;try{localStorage.removeItem(KEY);render();}catch{const s=$("#ops-security-history-status");if(s)s.textContent="Browser blocked local storage; history could not be cleared."; }});
 render();
});
})();