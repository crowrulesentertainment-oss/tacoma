(() => {
 const $ = (selector, root = document) => root.querySelector(selector);
 const menu = $("#menuToggle"), nav = $("#navLinks");
 if (menu && nav) {
  menu.addEventListener("click", () => {const open=nav.classList.toggle("open");menu.setAttribute("aria-expanded",String(open));});
  nav.querySelectorAll("a").forEach(link=>link.addEventListener("click",()=>{nav.classList.remove("open");menu.setAttribute("aria-expanded","false");}));
 }
 const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",year:"numeric",month:"numeric",day:"numeric"}).formatToParts(new Date());
 const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));
 const y=Number(p.year),month=Number(p.month),day=Number(p.day);
 const currentYear=month>2||(month===2&&day>14)?y+1:y;
 const eventDay=new Date(Date.UTC(currentYear,1,14)).toLocaleDateString("en-US",{weekday:"long",timeZone:"UTC"});
 const target=new Date(currentYear+"-02-14T00:00:00-08:00").getTime();
 const eventYear=$("#eventYear");if(eventYear)eventYear.textContent=String(currentYear);
 const eventWeekday=$("#eventWeekday");if(eventWeekday)eventWeekday.textContent="VALENTINE'S DAY · "+eventDay.toUpperCase();
 const hero=$("#heroSeasonYear");if(hero)hero.textContent="FEBRUARY 14, "+currentYear+" · TACOMA, WA";
 const footer=$("#footerYear");if(footer)footer.textContent=String(new Date().getFullYear());
 const units={days:$("#days"),hours:$("#hours"),minutes:$("#minutes"),seconds:$("#seconds")};
 const update=()=>{const remaining=Math.max(0,target-Date.now());const values={days:Math.floor(remaining/86400000),hours:Math.floor(remaining%86400000/3600000),minutes:Math.floor(remaining%3600000/60000),seconds:Math.floor(remaining%60000/1000)};Object.entries(units).forEach(([key,node])=>{if(node)node.textContent=String(values[key]).padStart(key==="days"?3:2,"0");});const label=$("#seasonEyebrow");if(label)label.textContent=remaining===0?"HAPPY VALENTINE'S DAY, TACOMA":"COUNTDOWN TO FEBRUARY 14, "+currentYear;};
 update();window.setInterval(update,1000);
 const field=$(".petal-field");
 if(field&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches){for(let i=0;i<18;i++){const petal=document.createElement("span");petal.className="petal";petal.style.left=Math.random()*100+"%";petal.style.animationDuration=12+Math.random()*16+"s";petal.style.animationDelay=-Math.random()*24+"s";petal.style.opacity=String(.18+Math.random()*.38);petal.style.transform="scale("+(.55+Math.random()*.8)+")";field.appendChild(petal);}}
})();