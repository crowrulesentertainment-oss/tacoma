(()=>{"use strict";
let schedule=[
["2026-12-31","12:00 PM–1:00 PM","The Grand Opening","Live","Opening team"],
["2026-12-31","1:00 PM–2:00 PM","Tacoma Community Voices","Live interviews","Team A"],
["2026-12-31","2:00 PM–3:00 PM","Local Creators Showcase","Hybrid","Team B"],
["2026-12-31","3:00 PM–4:00 PM","Back Deck Live: New Year's Special","Live","Back Deck Live team"],
["2026-12-31","4:00 PM–5:00 PM","Support Local Tacoma","Interviews and features","Team B"],
["2026-12-31","5:00 PM–6:00 PM","Tacoma Sports & Entertainment","Live","Team B"],
["2026-12-31","6:00 PM–7:00 PM","Tacoma Nights: Evening Edition","Live","Team C"],
["2026-12-31","7:00 PM–8:00 PM","Tacoma's Year in Review","Hybrid","Team C"],
["2026-12-31","8:00 PM–9:00 PM","Tacoma Then & Now","Prerecorded and live","Team C"],
["2026-12-31","9:00 PM–10:00 PM","The Community Celebration","Live","Team C"],
["2026-12-31","10:00 PM–11:00 PM","Countdown to 2027","Live","Team D"],
["2026-12-31","11:00 PM–12:00 AM","The Midnight Celebration","Live and cinematic","Team D"],
["2027-01-01","12:00 AM–1:00 AM","Welcome to 2027","Live","Team E"],
["2027-01-01","1:00 AM–2:00 AM","Tacoma After Dark","Hybrid","Team E"],
["2027-01-01","2:00 AM–3:00 AM","The Overnight Lounge","Prerecorded and live check-ins","Team E"],
["2027-01-01","3:00 AM–4:00 AM","Tacoma Memories","Prerecorded","Team E"],
["2027-01-01","4:00 AM–5:00 AM","Early Morning Reflections","Hybrid","Team E"],
["2027-01-01","5:00 AM–6:00 AM","Wake Up Tacoma","Live","Team F"],
["2027-01-01","6:00 AM–7:00 AM","Good Morning Tacoma","Live","Team F"],
["2027-01-01","7:00 AM–8:00 AM","Tacoma Today","Live","Team F"],
["2027-01-01","8:00 AM–9:00 AM","Community Organizations","Interviews and features","Team F"],
["2027-01-01","9:00 AM–10:00 AM","Tacoma's 2027 Wishlist","Live participation","Team F"],
["2027-01-01","10:00 AM–11:00 AM","The Community Time Capsule","Hybrid","Team G"],
["2027-01-01","11:00 AM–12:00 PM","Grand Finale & Sign-Off","Live","Team G"]
];
const list=document.querySelector("#schedule-list"),search=document.querySelector("#schedule-filter"),tabs=[...document.querySelectorAll("[data-day]")];let day="all";
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function render(){const q=(search?.value||"").trim().toLowerCase();const rows=schedule.filter(r=>(day==="all"||(day==="dec31"&&r[0]==="2026-12-31")||(day==="jan1"&&r[0]==="2027-01-01"))&&r.join(" ").toLowerCase().includes(q));if(!list)return;list.innerHTML=rows.length?rows.map(r=>'<article class="schedule-item"><div><div class="schedule-day">'+(r[0]==="2026-12-31"?"THURSDAY · DEC 31":"FRIDAY · JAN 1")+'</div><div class="schedule-time">'+esc(r[1])+'</div></div><div><h3>'+esc(r[2])+'</h3><p>'+esc(r[3])+' · '+esc(r[4])+'</p></div></article>').join(""):'<div class="schedule-empty">No programs match that search. Try another term.</div>'}
search?.addEventListener("input",render);tabs.forEach(b=>b.addEventListener("click",()=>{day=b.dataset.day;tabs.forEach(x=>x.classList.toggle("active",x===b));render()}));render();
async function loadManagedSchedule(){try{const cfg=window.HUB_CONFIG||{};if(!window.supabase||!cfg.url||!cfg.key)return;const client=window.supabase.createClient(cfg.url,cfg.key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});const {data,error}=await client.from("tacoma_nye_public_schedule").select("starts_at,ends_at,title,format,team_label,status").order("starts_at");if(error)throw error;if(!data?.length)return;const dateKey=value=>{const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date(value));const get=k=>parts.find(p=>p.type===k)?.value||"";return get("year")+"-"+get("month")+"-"+get("day")};const time=value=>new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",hour:"numeric",minute:"2-digit"}).format(new Date(value));schedule=data.map(row=>[dateKey(row.starts_at),time(row.starts_at)+"–"+time(row.ends_at),row.title,row.format+(row.status==="proposed"?" · Proposed":""),row.team_label||"Team to be assigned"]);render()}catch(error){console.warn("Managed event schedule unavailable; using published schedule fallback.",error)}}loadManagedSchedule();
const clock=document.querySelector("#pacific-clock");function tickClock(){if(clock)clock.textContent=new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit",second:"2-digit",timeZoneName:"short"}).format(new Date())}tickClock();setInterval(tickClock,1000);
const target=new Date("2026-12-31T12:00:00-08:00").getTime(),end=new Date("2027-01-01T12:00:00-08:00").getTime();const pad=n=>String(n).padStart(2,"0");
function countdown(){const now=Date.now(),status=document.querySelector("#countdown-status");if(now>=end){["count-days","count-hours","count-minutes","count-seconds"].forEach(id=>document.getElementById(id).textContent="00");if(status)status.textContent="The 24-hour broadcast has concluded. Thank you, Tacoma.";return}let remaining=Math.max(0,target-now);if(now>=target)remaining=end-now;const d=Math.floor(remaining/86400000),h=Math.floor(remaining%86400000/3600000),m=Math.floor(remaining%3600000/60000),s=Math.floor(remaining%60000/1000);document.getElementById("count-days").textContent=pad(d);document.getElementById("count-hours").textContent=pad(h);document.getElementById("count-minutes").textContent=pad(m);document.getElementById("count-seconds").textContent=pad(s);if(status)status.textContent=now<target?"Counting down to the opening broadcast.":now<end?"The 24-hour celebration is underway — welcome to Tacoma's New Year.":"The broadcast has concluded."}
countdown();setInterval(countdown,1000);
})();