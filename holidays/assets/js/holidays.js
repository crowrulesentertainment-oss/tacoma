(()=>{"use strict";
const $=s=>document.querySelector(s);
const menu=$(".menu-toggle"),nav=$("#nav");
if(menu&&nav){menu.addEventListener("click",()=>{const open=nav.classList.toggle("open");menu.setAttribute("aria-expanded",String(open));});nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{nav.classList.remove("open");menu.setAttribute("aria-expanded","false");}));}
const year=$("#year");if(year)year.textContent=new Date().getFullYear();
const client=window.supabase&&window.HUB_CONFIG?window.supabase.createClient(window.HUB_CONFIG.url,window.HUB_CONFIG.key):null;
const routes={"thanksgiving":"../thanksgiving/","halloween":"../halloween/","black-friday":"../black-friday/","valentines-day":"../valentines/","christmas-eve":"../christmas/","christmas-day":"../christmas/","new-years-eve":"../new-years-eve-2027/","easter":"../easter/"};
const safeUrl=u=>{if(typeof u!=="string"||!u.trim())return "";try{const x=new URL(u,location.href);return ["https:","http:"].includes(x.protocol)?x.href:""}catch{return ""}};
const nice=d=>new Date(d+"T12:00:00").toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});
const holidayImages={
"halloween":"photo-1509557965875-b88c97052f0e",
"veterans-day":"photo-1506157786151-b8491531f063",
"thanksgiving":"photo-1512621776951-a57141f2eefd",
"black-friday":"photo-1513883049090-d0b7439799bf",
"christmas-eve":"photo-1512389142860-9c449e58a543",
"christmas-day":"photo-1512389142860-9c449e58a543",
"boxing-day":"photo-1513883049090-d0b7439799bf",
"new-years-eve":"photo-1467810563316-b5476525c0f9",
"new-years-day":"photo-1467810563316-b5476525c0f9",
"valentines-day":"photo-1518199266791-5375a83190b7",
"st-patricks-day":"photo-1513558161293-cdaf765edfd4",
"easter":"photo-1457301547464-91995555cd25",
"mothers-day":"photo-1490750967868-88aa4486c946",
"memorial-day":"photo-1500530855697-b586d89ba3ee",
"juneteenth":"photo-1511632765486-a01980e01a18",
"independence-day":"photo-1498931299472-f7a63a5a1cfa",
"labor-day":"photo-1521737711867-e3b97375f902"
};
const imageFor=h=>safeUrl(h.hero_image_url)||"https://images.unsplash.com/"+(holidayImages[h.slug]||"photo-1511632765486-a01980e01a18")+"?auto=format&fit=crop&w=1200&q=85";
const nextDate=d=>{const p=d.split("-").map(Number);return new Date(p[0],p[1]-1,p[2],0,0,0)};
function renderCountdown(item){if(!item)return;$("#next-title").textContent=item.name;$("#next-date").textContent=nice(item.holiday_date)+" · "+item.year;const update=()=>{let n=Math.max(0,nextDate(item.holiday_date)-Date.now()),days=Math.floor(n/86400000);n%=86400000;$("#days").textContent=String(days).padStart(2,"0");$("#hours").textContent=String(Math.floor(n/3600000)).padStart(2,"0");$("#minutes").textContent=String(Math.floor(n%3600000/60000)).padStart(2,"0");$("#seconds").textContent=String(Math.floor(n%60000/1000)).padStart(2,"0");};update();setInterval(update,1000);}
function card(h){const link=routes[h.slug]||("holiday.html?slug="+encodeURIComponent(h.slug)+"&year="+h.year);const image=imageFor(h);const title=h.name.replace(/\\s+/g," ").trim();const article=document.createElement("article");article.className="event-card";const a=document.createElement("a");a.className="card-image";a.href=link;a.setAttribute("aria-label","Explore "+title);const photo=document.createElement("img");photo.className="card-photo";photo.src=image;photo.alt=title+" celebration";photo.loading="lazy";photo.decoding="async";photo.onerror=()=>{photo.onerror=null;photo.src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=85";};const tag=document.createElement("span");tag.className="season-tag";tag.textContent=new Date(h.holiday_date+"T12:00:00").toLocaleDateString("en-US",{month:"long",year:"numeric"}).toUpperCase();const arrow=document.createElement("span");arrow.className="card-arrow";arrow.textContent="↗";const copy=document.createElement("div");copy.className="card-image-copy";const small=document.createElement("small");small.textContent=String(h.year)+" · "+String(h.holiday_type||"HOLIDAY").toUpperCase();const heading=document.createElement("h3");heading.textContent=title;copy.append(small,heading);a.append(photo,tag,arrow,copy);const info=document.createElement("div");info.className="card-info";const p=document.createElement("p");p.textContent=h.description||"Explore this annual celebration and discover ways to take part.";const l=document.createElement("a");l.className="text-link";l.href=link;l.textContent="Explore "+title+" →";info.append(p,l);article.append(a,info);return article;}
function renderTimeline(items){const root=$("#holiday-timeline");root.replaceChildren();items.slice(0,7).forEach((h,i)=>{const item=document.createElement("div");item.className="timeline-item";const dot=document.createElement("span");dot.className="timeline-dot "+["amber","rose","green","blue"][i%4];const body=document.createElement("div");const small=document.createElement("small");small.textContent=nice(h.holiday_date)+" · "+h.year;const b=document.createElement("b");b.textContent=h.name;const a=document.createElement("a");a.href=routes[h.slug]||("holiday.html?slug="+encodeURIComponent(h.slug)+"&year="+h.year);a.textContent="Visit celebration →";body.append(small,b,a);item.append(dot,body);root.append(item);});}
async function load(){if(!client){$("#holiday-sync-status").textContent="Live calendar unavailable. Showing the published website content.";return;}
const status=$("#holiday-sync-status");
try{const [{data:holidays,error},{data:years},{data:themes}] = await Promise.all([client.from("holidays").select("id,year_id,name,slug,holiday_date,description,holiday_type,is_featured,is_published,sort_order,hero_image_url").eq("is_published",true).order("holiday_date",{ascending:true}),client.from("holiday_years").select("id,year,is_active"),client.from("crowrules_holiday_calendar").select("starts_on,ends_on,background_url,accent_color,secondary_color,css_class,particle_set,priority").eq("is_active",true).order("priority",{ascending:true})]);
if(error)throw error;
const yearMap=new Map((years||[]).map(y=>[y.id,y.year]));
const currentYear=new Date().getFullYear();
const currentYearRows=(holidays||[]).map(h=>({...h,year:yearMap.get(h.year_id)||new Date(h.holiday_date+"T12:00:00").getFullYear()})).filter(h=>Number(h.year)===currentYear).sort((a,b)=>a.holiday_date.localeCompare(b.holiday_date)||a.sort_order-b.sort_order);
const grid=$("#holiday-grid");grid.replaceChildren(...currentYearRows.map(card));
const yearLabel=$("#current-year-label");if(yearLabel)yearLabel.textContent=String(currentYear);
status.textContent=currentYearRows.length+" celebrations for "+currentYear+" · synced with the central database";
const now=new Date();const today=[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
const upcoming=currentYearRows.filter(h=>h.holiday_date>=today);
if(upcoming.length){renderCountdown(upcoming[0]);}else{$("#next-title").textContent="That's a wrap for "+currentYear;$("#next-date").textContent="The next calendar year begins January 1.";["days","hours","minutes","seconds"].forEach(id=>$("#"+id).textContent="--");}
renderTimeline(currentYearRows);
// Re-open the page at local midnight on January 1 so an already-open tab rolls
// forward automatically without requiring the visitor to refresh.
const nextYearStart=new Date(currentYear+1,0,1,0,0,2);
window.setTimeout(()=>window.location.reload(),Math.max(1000,nextYearStart.getTime()-Date.now()));
const theme=(themes||[]).find(t=>today>=t.starts_on&&today<=t.ends_on);if(theme){const bg=safeUrl(theme.background_url);if(bg)document.querySelector(".hero-backdrop").style.backgroundImage="linear-gradient(90deg,rgba(4,12,20,.9),rgba(4,12,20,.38)),url('"+bg.replace(/'/g,"%27")+"')";if(theme.accent_color)document.documentElement.style.setProperty("--gold",theme.accent_color);if(theme.secondary_color)document.documentElement.style.setProperty("--cyan",theme.secondary_color);}
}catch(e){console.error("Holiday Hub live sync:",e);status.textContent="Could not load the live holiday calendar. Please refresh later.";}}
load();
})();