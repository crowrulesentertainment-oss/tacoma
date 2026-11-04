(()=>{"use strict";
const $=(s,r=document)=>r.querySelector(s);
const STORE="tacoma-nye-broadcast-planner-v2";
const titles=[
"The Grand Opening","Tacoma Community Voices","Local Creators Showcase","Back Deck Live: New Year's Special",
"Support Local Tacoma","Tacoma Sports & Entertainment","Tacoma Nights: Evening Edition","Tacoma's Year in Review",
"Tacoma Then & Now","The Community Celebration","Countdown to 2027","The Midnight Celebration",
"Welcome to 2027","Tacoma After Dark","The Overnight Lounge","Tacoma Memories",
"Early Morning Reflections","Wake Up Tacoma","Good Morning Tacoma","Tacoma Today",
"Community Organizations","Tacoma's 2027 Wishlist","The Community Time Capsule","Grand Finale & Sign-Off"
];
const formats=["Live","Remote host","Hybrid","Pre-recorded","Interview","Community feature","Performance","Backup / holding"];
const shiftNames=["SHIFT A · OPENING & AFTERNOON","SHIFT B · EVENING & MIDNIGHT","SHIFT C · OVERNIGHT","SHIFT D · MORNING & FINALE"];
const shiftTimes=["12 PM – 6 PM · DEC 31","6 PM – 12 AM · DEC 31","12 AM – 6 AM · JAN 1","6 AM – 12 PM · JAN 1"];
let rows=[];
function defaults(){return titles.map((title,i)=>({title,host:"",producer:"",format:i===0||i===3||i===5||i===6||i===9||i===10||i===11||i===12||i===17||i===18||i===19||i===23?"Live":"Hybrid",backup:"",notes:""}))}
function load(){try{const v=JSON.parse(localStorage.getItem(STORE)||"null");rows=Array.isArray(v)&&v.length===24?v:defaults()}catch{rows=defaults()}}
function save(){try{localStorage.setItem(STORE,JSON.stringify(rows));$("#v2-save-state").textContent="Saved in this browser · "+new Date().toLocaleTimeString();$("#v2-save-state").className="v2-saved"}catch{$("#v2-save-state").textContent="Browser storage unavailable";$("#v2-save-state").className="v2-unsaved"}}
function timeLabel(i){const h=(12+i)%24;const end=(h+1)%24;const f=n=>{const am=n<12?"AM":"PM";let v=n%12;if(!v)v=12;return v+" "+am};return f(h)+" – "+f(end)}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function render(){
 const root=$("#v2-planner");if(!root)return;
 let html="",count=0;
 for(let shift=0;shift<4;shift++){
  html+='<div class="v2-shift"><b>'+shiftNames[shift]+'</b><span>'+shiftTimes[shift]+'</span></div>';
  for(let j=0;j<6;j++){
   const i=shift*6+j,r=rows[i];
   html+='<article class="v2-block" data-row="'+i+'"><div class="v2-time"><b>HOUR '+String(i+1).padStart(2,"0")+'</b><small>'+timeLabel(i)+'</small></div>'+
    '<div class="v2-field v2-block-title"><label>Program / segment</label><input data-key="title" maxlength="140" value="'+esc(r.title)+'" placeholder="Program title"></div>'+
    '<div class="v2-field"><label>Primary host</label><input data-key="host" maxlength="100" value="'+esc(r.host)+'" placeholder="Host name"></div>'+
    '<div class="v2-field"><label>Producer / shift lead</label><input data-key="producer" maxlength="100" value="'+esc(r.producer)+'" placeholder="Producer name"></div>'+
    '<div class="v2-field"><label>Format / source</label><select data-key="format">'+formats.map(x=>'<option '+(r.format===x?"selected":"")+'>'+x+'</option>').join("")+'</select></div>'+
    '<div class="v2-field"><label>Backup / relief host</label><input data-key="backup" maxlength="100" value="'+esc(r.backup)+'" placeholder="Backup host / recorded fallback"></div>'+
    '<div class="v2-field"><label>Producer notes / cue</label><input data-key="notes" maxlength="300" value="'+esc(r.notes)+'" placeholder="Intro, guest, replay, fallback…"></div>'+
    '</article>';
   count++;
  }
 }
 root.innerHTML=html;
 root.querySelectorAll("[data-key]").forEach(el=>el.addEventListener("input",()=>{const card=el.closest("[data-row]"),i=Number(card.dataset.row);rows[i][el.dataset.key]=el.value;$("#v2-save-state").textContent="Changes pending save…";$("#v2-save-state").className="v2-unsaved;"}));
}
function report(){return "24 HOURS OF TACOMA — PRODUCTION RUN SHEET\nDecember 31, 2026 noon – January 1, 2027 noon Pacific\n\n"+rows.map((r,i)=>"HOUR "+String(i+1).padStart(2,"0")+" · "+timeLabel(i)+"\nProgram: "+(r.title||"TBD")+"\nHost: "+(r.host||"UNASSIGNED")+"\nProducer: "+(r.producer||"UNASSIGNED")+"\nFormat: "+(r.format||"TBD")+"\nBackup: "+(r.backup||"NOT SET")+"\nNotes: "+(r.notes||"—")).join("\n\n")}
function download(){const lines=[["Hour","Pacific time","Program","Primary host","Producer","Format","Backup","Notes"],...rows.map((r,i)=>[i+1,timeLabel(i),r.title,r.host,r.producer,r.format,r.backup,r.notes])];const csv=lines.map(row=>row.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(",")).join("\r\n");const blob=new Blob([csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="24-hours-of-tacoma-run-of-show-v2.csv";a.click();URL.revokeObjectURL(url)}
async function copy(text){try{await navigator.clipboard.writeText(text);return true}catch{return false}}
function inject(){
 const workspace=$("#workspace");if(!workspace||$("#v2-operations"))return;
 const panel=document.createElement("section");panel.id="v2-operations";panel.className="v2-wrap";
 panel.innerHTML='<div class="v2-head"><div><p class="v2-kicker">MASTER CONTROL · VERSION 2.0</p><h2>24-hour production command center</h2><p class="v2-sub">The fast lane for host changes and the planning desk for every hour of the broadcast. Remote scene changes are queued to your selected online encoder; guest admission and camera connection still happen in the private Remote Host Room.</p></div><span class="v2-tag">PRODUCER WORKSPACE</span></div>'+
 '<div class="v2-quickgrid">'+
 '<button class="v2-action primary-action" id="v2-open-room"><b>① OPEN REMOTE HOST ROOM ↗</b><span>Send or manage private invitations, check camera and microphone, and admit the incoming host.</span></button>'+
 '<button class="v2-action" id="v2-take-remote"><b>② TAKE REMOTE HOST</b><span>Queue scene 04 REMOTE HOST on the selected encoder.</span></button>'+
 '<button class="v2-action" id="v2-two-up"><b>③ TWO-HOST LAYOUT</b><span>Queue scene 03 TWO HOSTS for the handoff conversation.</span></button>'+
 '<button class="v2-action" id="v2-main-host"><b>④ RETURN TO MAIN HOST</b><span>Queue scene 02 MAIN STUDIO when the remote guest is released.</span></button></div>'+
 '<div class="v2-note"><b>Safe handoff:</b> Open the Remote Host Room first. Confirm the guest is admitted, camera and microphone are working, and the host is ready. Then use TAKE REMOTE HOST. Keep the outgoing host connected until the incoming host is confirmed on the program monitor.</div>'+
 '<div class="v2-statrow"><div class="v2-stat"><small>PROGRAM HOURS</small><b>24</b></div><div class="v2-stat"><small>SHIFT ROTATIONS</small><b>4 × 6 HRS</b></div><div class="v2-stat"><small>PLANNED SEGMENTS</small><b>24</b></div><div class="v2-stat"><small>PLAN STORAGE</small><b>LOCAL DRAFT</b></div></div>'+
 '<div class="v2-head"><div><p class="v2-kicker">RUN OF SHOW · DEC 31 NOON → JAN 1 NOON</p><h3>24-hour planning board</h3><p class="v2-sub">Edit the title, host, producer, format, relief host and production notes for each hour. Your draft saves in this browser and can be copied or exported for the team.</p></div></div>'+
 '<div class="v2-tools"><button id="v2-save">Save planning draft</button><button id="v2-copy">Copy complete run sheet</button><button id="v2-export">Download CSV</button><button id="v2-reset">Restore starting schedule</button></div>'+
 '<div id="v2-planner"></div><div class="v2-foot"><span id="v2-save-state">Draft not saved yet.</span><span>Pacific Time · Draft planner does not publish changes to the event website or database.</span></div>';
 const toolbar=$("#workspace .toolbar");if(toolbar)toolbar.insertAdjacentElement("afterend",panel);else workspace.prepend(panel);
 $("#v2-open-room").addEventListener("click",()=>window.open("remote-host-room.html","_blank","noopener"));
 $("#v2-take-remote").addEventListener("click",()=>{const b=$('[data-presenter="remote"]');if(b&&!b.disabled)b.click();else alert("Select an online encoder bridge first. Pair or select it in Encoder Producer Control.")});
 $("#v2-two-up").addEventListener("click",()=>{const b=$('[data-presenter="two"]');if(b&&!b.disabled)b.click();else alert("Select an online encoder bridge first. Pair or select it in Encoder Producer Control.")});
 $("#v2-main-host").addEventListener("click",()=>{const b=$('[data-presenter="self"]');if(b&&!b.disabled)b.click();else alert("Select an online encoder bridge first. Pair or select it in Encoder Producer Control.")});
 $("#v2-save").addEventListener("click",save);
 $("#v2-copy").addEventListener("click",async()=>{if(await copy(report()))alert("Run sheet copied. Paste it into your production document or team message.");else alert("Clipboard permission was blocked. Try again from a secure browser context.")});
 $("#v2-export").addEventListener("click",download);
 $("#v2-reset").addEventListener("click",()=>{if(confirm("Restore the original 24-hour program titles and clear all host and producer assignments in this browser?")){rows=defaults();save();render()}});
 render();
}
function start(){load();inject();const target=$("#workspace");if(target){new MutationObserver(()=>{if(!target.hidden)inject()}).observe(target,{attributes:true,attributeFilter:["hidden","style"]})}}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();