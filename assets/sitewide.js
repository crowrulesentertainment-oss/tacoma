/* CrowRules Tacoma Community Hub — unified public-site experience.
   Shared navigation, cinematic hero, live Tacoma weather, accessibility and page utilities. */
(() => {
  "use strict";
  if (window.__CRH_SITEWIDE_V2__) return;
  window.__CRH_SITEWIDE_V2__ = true;

  const ROOT = "https://crowrulesentertainment-oss.github.io/tacoma/";
  const WEATHER_URL = "https://api.open-meteo.com/v1/forecast?latitude=47.2529&longitude=-122.4443&current=temperature_2m,weather_code,is_day&temperature_unit=fahrenheit&timezone=America%2FLos_Angeles";
  const REDUCED = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const onReady = fn => document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", fn, { once: true }) : fn();
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const groups = [
    { title: "Discover", links: [["Community home",""],["Community tools","community/"],["Discover listings","discover/"],["Community directory","directory/"],["Local businesses","businesses/"],["Events calendar","events/"],["Explore Tacoma map","map/"]] },
    { title: "Help & resources", links: [["Community resources","resources/"],["Services","services/"],["Education & learning","education/"],["Family resources","family/"],["Parks & recreation","parks/"],["Jobs & careers","jobs/"]] },
    { title: "Connect & participate", links: [["Community bulletin","bulletin/"],["Community Q&A","questions/"],["Neighborhood guides","neighborhoods/"],["Community partners","partners/"],["Community voices","voices/"],["Get involved","get-involved/"]] },
    { title: "Civic & trust", links: [["Public meetings","meetings/"],["Public data","civic-data/"],["Local offers","deals/"],["Community notices","alerts/"],["Trust & verification","trust/"],["Privacy notice","privacy/"],["Community guidelines","community-guidelines/"]] }
  ];

  function addSharedStylesheet() {
    const found = [...document.querySelectorAll('link[rel="stylesheet"]')].some(link => {
      try { return new URL(link.href, location.href).pathname.endsWith("/assets/sitewide.css"); } catch { return false; }
    });
    if (found || !document.head) return;
    const script = document.currentScript || [...document.scripts].find(s => /\/assets\/sitewide\.js(?:\?|$)/.test(s.src));
    if (!script?.src) return;
    const link = el("link"); link.rel = "stylesheet"; link.href = new URL("sitewide.css", script.src).href;
    document.head.append(link);
  }

  function buildHeader() {
    if (location.pathname.includes("/admin/")) return;
    const existing = document.querySelector(".crh-site-header");
    if (existing) { buildExplore(existing.querySelector(".crh-global-nav")); return; }
    let oldNav = document.querySelector(".navlinks, .nav-links");
    const oldHeader = oldNav?.closest(".topbar, .site-header, .navbar");
    const header = el("header", "crh-site-header");
    header.setAttribute("data-crh-shared-header", "true");
    const inner = el("div", "crh-site-header-inner");
    const brand = el("a", "crh-site-brand");
    brand.href = ROOT; brand.setAttribute("aria-label", "CrowRules Tacoma Community Hub home");
    const mark = el("span", "crh-site-brand-mark", "C"); mark.setAttribute("aria-hidden", "true");
    const wordmark = el("span", "crh-site-wordmark");
    wordmark.append(el("strong", "", "CrowRules"), el("small", "", "TACOMA COMMUNITY HUB"));
    brand.append(mark, wordmark);
    const home = el("a", "crh-home-link", "Community Home"); home.href = ROOT;
    const nav = oldNav || el("nav", "navlinks crh-global-nav");
    nav.classList.add("crh-global-nav"); nav.setAttribute("aria-label", "Primary navigation");
    inner.append(brand, home, nav); header.append(inner);
    const main = document.querySelector("main, [role='main'], .main-content, #main-content");
    document.body.insertBefore(header, main || document.body.firstChild);
    if (oldHeader && !oldHeader.contains(header)) oldHeader.remove();
    if (oldNav && oldNav.parentElement !== inner) nav.remove();
    buildExplore(nav);
  }

  function buildExplore(nav) {
    if (!nav) return;
    nav.classList.add("crh-global-nav");
    nav.replaceChildren();
    const wrap = el("div", "crh-explore");
    const toggle = el("button", "crh-explore-toggle");
    toggle.type = "button"; toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-haspopup", "true"); toggle.setAttribute("aria-controls", "crh-explore-panel");
    const label = el("span", "", "Explore");
    const chevron = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    chevron.setAttribute("viewBox","0 0 20 20"); chevron.setAttribute("width","16"); chevron.setAttribute("height","16"); chevron.setAttribute("aria-hidden","true");
    const path = document.createElementNS("http://www.w3.org/2000/svg","path");
    path.setAttribute("d","m5 7 5 5 5-5"); path.setAttribute("fill","none"); path.setAttribute("stroke","currentColor"); path.setAttribute("stroke-width","1.8"); path.setAttribute("stroke-linecap","round"); path.setAttribute("stroke-linejoin","round");
    chevron.append(path); toggle.append(label,chevron);
    const panel = el("div","crh-explore-panel"); panel.id = "crh-explore-panel"; panel.hidden = true;
    panel.setAttribute("aria-label","Explore all community sections");
    const currentPath = path => path.replace(/index\.html$/,"").replace(/\/$/,"") || "/tacoma";
    const current = currentPath(location.pathname);
    groups.forEach((group,index) => {
      const section = el("section","crh-explore-group");
      const heading = el("h2","",group.title); heading.id = "crh-explore-title-"+index; section.setAttribute("aria-labelledby",heading.id);
      const list = el("ul");
      group.links.forEach(([text,path]) => {
        const li = el("li"); const a = el("a","",text); a.href = ROOT + path;
        const target = currentPath("/tacoma/" + path);
        if (target === current || (path && current.endsWith("/"+path.replace(/\/$/,"")))) a.setAttribute("aria-current","page");
        li.append(a); list.append(li);
      });
      section.append(heading,list); panel.append(section);
    });
    const close = ({focus=false}={}) => { panel.hidden = true; toggle.setAttribute("aria-expanded","false"); wrap.classList.remove("is-open"); if(focus)toggle.focus(); };
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded",String(open)); panel.hidden = !open; wrap.classList.toggle("is-open",open);
      if (open) {
        const first = panel.querySelector('a[aria-current="page"]') || panel.querySelector("a");
        if (window.matchMedia("(max-width: 760px)").matches) first?.focus({preventScroll:true});
      }
    });
    panel.addEventListener("click",event=>{if(event.target.closest("a"))close()});
    document.addEventListener("pointerdown",event=>{if(!wrap.contains(event.target))close()});
    document.addEventListener("keydown",event=>{if(event.key==="Escape"&&!panel.hidden)close({focus:true})});
    wrap.append(toggle,panel); nav.append(wrap);

    // A real mobile menu button is paired with the Explore panel, rather than hiding navigation without a control.
    const inner = nav.closest(".crh-site-header-inner");
    if (inner && !inner.querySelector(".crh-mobile-menu-toggle")) {
      const mobile = el("button","crh-mobile-menu-toggle");
      mobile.type = "button"; mobile.setAttribute("aria-expanded","false"); mobile.setAttribute("aria-controls","crh-explore-panel");
      mobile.innerHTML = '<span class="crh-mobile-menu-icon" aria-hidden="true"><i></i><i></i><i></i></span><span>Explore sections</span>';
      mobile.addEventListener("click",()=>{
        const open = mobile.getAttribute("aria-expanded") !== "true";
        mobile.setAttribute("aria-expanded",String(open));
        nav.classList.toggle("crh-mobile-open",open);
        if (!open) close();
        else { panel.hidden = false; toggle.setAttribute("aria-expanded","true"); wrap.classList.add("is-open"); }
      });
      inner.append(mobile);
    }
  }

  function buildHero() {
    if (location.pathname.includes("/admin/")) return [];
    let heroes = [...document.querySelectorAll(".hero, .addon-hero, [data-crh-hero]")].filter(h=>!h.closest(".admin-shell"));
    if (!heroes.length) {
      const main = document.querySelector("main, [role='main'], .main-content, #main-content") || document.body;
      const h1 = main.querySelector("h1");
      if (h1) {
        const hero = el("section","crh-universal-hero hero"); hero.setAttribute("data-crh-hero","true");
        const content = el("div","crh-universal-hero-content");
        content.append(el("span","crh-hero-eyebrow","TACOMA & PIERCE COUNTY"));
        content.append(h1);
        const intro = [...main.querySelectorAll("p")].find(p=>p.textContent.trim().length>25);
        if (intro) { intro.classList.add("crh-hero-intro"); content.append(intro); }
        hero.append(content); main.insertBefore(hero,main.firstChild); heroes = [hero];
      }
    }
    return heroes.map(hero=>{
      hero.classList.add("cr-global-cinematic-hero");
      // Remove only known visual overlays; preserve page content and interactive components.
      hero.querySelectorAll(".cr-global-weather-scene,.cr-global-weather-readout,.scene,.hero-scene,.weather-panel,.weather-widget,.cr-weather-atmosphere").forEach(n=>n.remove());
      const scene = el("div","cr-global-weather-scene"); scene.setAttribute("aria-hidden","true");
      [["cr-gw-distant-clouds",""],["cr-gw-sun",""],["cr-gw-cloud c1",""],["cr-gw-cloud c2",""],["cr-gw-haze",""],["cr-gw-rain",""],["cr-gw-snow",""],["cr-gw-lightning",""],["cr-gw-stars",""],["cr-gw-skyline",""],["cr-gw-reflection",""]].forEach(([cls])=>scene.append(el("div",cls)));
      const readout = el("div","cr-global-weather-readout"); readout.setAttribute("role","status"); readout.setAttribute("aria-live","polite");
      const icon=el("span","cr-gw-icon","🌦️"); icon.setAttribute("aria-hidden","true");
      const details=el("span","cr-gw-details"); details.append(el("span","cr-gw-place","TACOMA · PIERCE COUNTY"),el("span","cr-gw-condition","Checking local weather…"));
      readout.append(icon,details,el("span","cr-gw-temperature","—°F"));
      hero.prepend(scene); hero.append(readout);
      return {hero,icon,condition:readout.querySelector(".cr-gw-condition"),temperature:readout.querySelector(".cr-gw-temperature")};
    });
  }

  function applyWeather(views) {
    if (!views.length) return;
    const classes = ["clear","cloudy","fog","drizzle","rain","snow","storm","night"];
    const classify = (code,day) => {
      let type = code===0?"clear":[45,48].includes(code)?"fog":[71,73,75,77,85,86].includes(code)?"snow":[95,96,99].includes(code)?"storm":[51,53,55,56,57].includes(code)?"drizzle":[61,63,65,66,67,80,81,82].includes(code)?"rain":"cloudy";
      const labels={clear:"Clear skies",cloudy:"Cloudy skies",fog:"Fog and low visibility",drizzle:"Light drizzle",rain:"Rain in Tacoma",snow:"Snow in Tacoma",storm:"Thunderstorm conditions"};
      const icons={clear:day?"☀️":"🌙",cloudy:"☁️",fog:"🌫️",drizzle:"🌦️",rain:"🌧️",snow:"❄️",storm:"⛈️"};
      return {type,day,icon:icons[type],label:day?labels[type]:"Night · "+labels[type]};
    };
    const render = (state,temp) => views.forEach(v=>{
      v.hero.classList.remove(...classes.map(c=>"cr-gw-"+c));
      v.hero.classList.add("cr-gw-"+state.type); if(!state.day)v.hero.classList.add("cr-gw-night");
      v.hero.dataset.weatherCondition=state.type; v.icon.textContent=state.icon;
      v.condition.textContent=state.label; v.temperature.textContent=temp;
    });
    const fallback = () => {
      const state={type:"cloudy",day:true,icon:"🌐",label:"Tacoma weather unavailable"};
      render(state,"—°F");
    };
    const update = async () => {
      try {
        const response=await fetch(WEATHER_URL,{cache:"no-store",headers:{Accept:"application/json"}});
        if(!response.ok)throw Error("Weather request failed");
        const data=await response.json(),cur=data?.current;
        if(!cur||typeof cur.weather_code!=="number"||typeof cur.temperature_2m!=="number")throw Error("Invalid weather response");
        const state=classify(cur.weather_code,Number(cur.is_day)===1);
        render(state,Math.round(cur.temperature_2m)+"°F");
      } catch { fallback(); }
    };
    if(REDUCED())document.documentElement.classList.add("cr-reduced-motion");
    update();
    window.setInterval(()=>{if(!document.hidden)update()},15*60*1000);
    document.addEventListener("visibilitychange",()=>{if(!document.hidden)update()});
  }

  function addUtilities() {
    const main=document.querySelector("main,[role='main'],.main-content,#main-content");
    if(main&&!main.id)main.id="main-content";
    if(!document.querySelector(".crh-skip-link")){
      const skip=el("a","crh-skip-link","Skip to main content"); skip.href="#"+(main?.id||"main-content");
      skip.addEventListener("click",()=>{const target=document.getElementById(skip.hash.slice(1));if(target){if(!target.hasAttribute("tabindex"))target.tabIndex=-1;target.focus({preventScroll:true})}});
      document.body.prepend(skip);
    }
    if(!document.querySelector(".crh-reading-progress")){
      const progress=el("div","crh-reading-progress");progress.setAttribute("role","progressbar");progress.setAttribute("aria-label","Page reading progress");progress.setAttribute("aria-valuemin","0");progress.setAttribute("aria-valuemax","100");progress.setAttribute("aria-valuenow","0");document.body.append(progress);
      let queued=false;
      const update=()=>{const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);const value=Math.max(0,Math.min(100,Math.round(scrollY/max*100)));progress.style.width=value+"%";progress.setAttribute("aria-valuenow",String(value));document.querySelector(".crh-back-top")?.classList.toggle("is-visible",scrollY>520);queued=false};
      const queue=()=>{if(!queued){queued=true;requestAnimationFrame(update)}};
      addEventListener("scroll",queue,{passive:true});addEventListener("resize",queue,{passive:true});update();
    }
    if(!document.querySelector(".crh-back-top")){
      const top=el("button","crh-back-top");top.type="button";top.setAttribute("aria-label","Back to top");top.innerHTML='<span aria-hidden="true">↑</span><span class="crh-back-label">Back to top</span>';
      top.addEventListener("click",()=>scrollTo({top:0,behavior:REDUCED()?"auto":"smooth"}));document.body.append(top);
    }
    document.querySelectorAll('a[target="_blank"]').forEach(a=>{const rel=new Set((a.rel||"").split(/\s+/).filter(Boolean));rel.add("noopener");rel.add("noreferrer");a.rel=[...rel].join(" ")});
    const footer=document.querySelector(".addon-foot");
    if(footer&&!footer.querySelector("[data-cr-policy-links]")){
      const p=el("p");p.dataset.crPolicyLinks="true";
      const links=[["Privacy notice","privacy/"],["Community guidelines","community-guidelines/"],["Trust & verification","trust/"]];
      links.forEach(([label,path],i)=>{if(i)p.append(document.createTextNode(" · "));const a=el("a","",label);a.href=ROOT+path;p.append(a)});footer.append(p);
    }
  }

  function init() {
    if (location.pathname.includes("/admin/")) return;
    buildHeader();
    const weatherViews=buildHero();
    applyWeather(weatherViews);
    addUtilities();
  }
  addSharedStylesheet();
  onReady(init);
})();