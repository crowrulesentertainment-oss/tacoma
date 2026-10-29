(()=>{"use strict";
document.addEventListener("DOMContentLoaded",()=>{
 const exportButton=document.getElementById("ops-export");
 const autoRefresh=document.getElementById("ops-auto-refresh");
 const refreshButton=document.getElementById("ops-refresh");
 if(exportButton)exportButton.addEventListener("click",()=>{
  const table=document.getElementById("ops-rows");
  if(!table)return;
  const rows=Array.from(table.querySelectorAll("tr")).map(tr=>Array.from(tr.querySelectorAll("th,td")).map(cell=>cell.innerText.replace(/\s+/g," ").trim()));
  if(!rows.length||rows[0].length===1&&/No records match|Loading ledger/i.test(rows[0][0])){alert("There are no filtered ledger rows to export.");return;}
  const csv=rows.map(row=>row.map(value=>'"'+value.replace(/"/g,'""')+'"').join(",")).join("\r\n");
  const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="tacoma-email-delivery-report-"+new Date().toISOString().slice(0,10)+".csv";
  document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
 });
 let timer=null;
 const syncTimer=()=>{
  if(timer){clearInterval(timer);timer=null;}
  if(autoRefresh&&autoRefresh.checked&&refreshButton){
   timer=setInterval(()=>{if(!document.hidden&&!refreshButton.disabled)refreshButton.click();},60000);
  }
 };
 if(autoRefresh){autoRefresh.addEventListener("change",syncTimer);syncTimer();}
});
})();