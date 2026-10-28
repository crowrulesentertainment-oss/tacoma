/* CrowRules Tacoma Community Hub — accessible sitewide interactions. */
(() => {
  "use strict";
  if (window.__CROW_RULES_SITEWIDE__) return;
  window.__CROW_RULES_SITEWIDE__ = true;
  const ready = fn => document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", fn, { once: true }) : fn();

  ready(() => {
    const body = document.body;
    const main = document.querySelector("main, [role='main'], .main-content, #main-content");
    if (main && !main.id) main.id = "main-content";

    // Keyboard users can bypass repeated navigation and jump directly to content.
    if (!document.querySelector(".crh-skip-link")) {
      const skip = document.createElement("a");
      skip.className = "crh-skip-link";
      skip.href = "#" + (main?.id || "main-content");
      skip.textContent = "Skip to main content";
      document.body.prepend(skip);
      skip.addEventListener("click", () => {
        const target = document.getElementById(skip.hash.slice(1));
        if (target) {
          if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
        }
      });
    }

    // Reading progress indicator, updated without an external dependency.
    const progress = document.createElement("div");
    progress.className = "crh-reading-progress";
    progress.setAttribute("role", "progressbar");
    progress.setAttribute("aria-label", "Page reading progress");
    progress.setAttribute("aria-valuemin", "0");
    progress.setAttribute("aria-valuemax", "100");
    progress.setAttribute("aria-valuenow", "0");
    document.body.append(progress);
    let scrollQueued = false;
    const updateProgress = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const value = Math.max(0, Math.min(100, Math.round((window.scrollY / max) * 100)));
      progress.style.width = value + "%";
      progress.setAttribute("aria-valuenow", String(value));
      backTop.classList.toggle("is-visible", window.scrollY > 520);
      scrollQueued = false;
    };
    const onScroll = () => {
      if (!scrollQueued) {
        scrollQueued = true;
        window.requestAnimationFrame(updateProgress);
      }
    };

    // Responsive menu enhancement for both navigation class variants used across pages.
    const nav = document.querySelector(".navlinks, .nav-links");
    if (nav && !nav.querySelector(".crh-menu-toggle")) {
      const host = nav.parentElement;
      if (host) {
        host.classList.add("crh-nav-host");
        if (!nav.id) nav.id = "crh-primary-navigation";
        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "crh-menu-toggle";
        toggle.setAttribute("aria-controls", nav.id);
        toggle.setAttribute("aria-expanded", "false");
        toggle.innerHTML = '<span class="crh-menu-icon" aria-hidden="true"><i></i><i></i><i></i></span><span class="crh-menu-label">Menu</span>';
        toggle.addEventListener("click", () => {
          const open = toggle.getAttribute("aria-expanded") === "true";
          toggle.setAttribute("aria-expanded", String(!open));
          nav.classList.toggle("crh-open", !open);
          toggle.setAttribute("aria-label", open ? "Open navigation menu" : "Close navigation menu");
        });
        nav.parentElement.insertBefore(toggle, nav);
        nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
          nav.classList.remove("crh-open");
          toggle.setAttribute("aria-expanded", "false");
          toggle.setAttribute("aria-label", "Open navigation menu");
        }));
        document.addEventListener("keydown", event => {
          if (event.key === "Escape" && nav.classList.contains("crh-open")) {
            nav.classList.remove("crh-open");
            toggle.setAttribute("aria-expanded", "false");
            toggle.focus();
          }
        });
        document.addEventListener("click", event => {
          if (!nav.contains(event.target) && !toggle.contains(event.target) && nav.classList.contains("crh-open")) {
            nav.classList.remove("crh-open");
            toggle.setAttribute("aria-expanded", "false");
          }
        });
        const mobileQuery = window.matchMedia("(max-width: 960px)");
        const resetOnDesktop = event => {
          if (!event.matches) {
            nav.classList.remove("crh-open");
            toggle.setAttribute("aria-expanded", "false");
          }
        };
        if (mobileQuery.addEventListener) mobileQuery.addEventListener("change", resetOnDesktop);
        else mobileQuery.addListener(resetOnDesktop);
      }
    }

    // A low-distraction return-to-top control is available after meaningful scrolling.
    const backTop = document.createElement("button");
    backTop.type = "button";
    backTop.className = "crh-back-top";
    backTop.setAttribute("aria-label", "Back to top");
    backTop.innerHTML = '<span aria-hidden="true">↑</span><span class="crh-back-label">Back to top</span>';
    backTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    });
    body.append(backTop);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    updateProgress();

    // Safer defaults for any external links that open a new tab.
    document.querySelectorAll('a[target="_blank"]').forEach(link => {
      const rel = new Set((link.getAttribute("rel") || "").split(/\s+/).filter(Boolean));
      rel.add("noopener");
      rel.add("noreferrer");
      link.setAttribute("rel", [...rel].join(" "));
    });
  });
})();


/* One weather-reactive cinematic atmosphere shared across all public hero sections. */
(() => {
  "use strict";
  const boot = () => {
    const heroes = [...document.querySelectorAll(".hero")].filter(hero => !hero.closest(".admin-shell"));
    if (!heroes.length) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const markup = '<div class="cr-gw-sun"></div><div class="cr-gw-cloud c1"></div><div class="cr-gw-cloud c2"></div><div class="cr-gw-haze"></div><div class="cr-gw-rain"></div><div class="cr-gw-snow"></div><div class="cr-gw-lightning"></div><div class="cr-gw-stars"></div><div class="cr-gw-skyline"></div><div class="cr-gw-reflection"></div>';
    const views = heroes.map(hero => {
      hero.classList.add("hero", "cr-global-cinematic-hero");
      let scene = hero.querySelector(":scope > .cr-global-weather-scene");
      if (!scene) {
        scene = document.createElement("div");
        scene.className = "cr-global-weather-scene";
        scene.setAttribute("aria-hidden", "true");
        scene.innerHTML = markup;
        hero.prepend(scene);
      }
      let readout = hero.querySelector(":scope > .cr-global-weather-readout");
      if (!readout) {
        readout = document.createElement("div");
        readout.className = "cr-global-weather-readout";
        readout.setAttribute("role", "status");
        readout.setAttribute("aria-live", "polite");
        readout.innerHTML = '<span class="cr-gw-icon" aria-hidden="true">🌦️</span><span><span class="cr-gw-place">Tacoma · Pierce County</span><span class="cr-gw-condition">Loading local weather…</span></span><span class="cr-gw-temperature">—°F</span>';
        hero.append(readout);
      }
      return {hero, icon:readout.querySelector(".cr-gw-icon"), condition:readout.querySelector(".cr-gw-condition"), temperature:readout.querySelector(".cr-gw-temperature")};
    });
    const classify = (code, day) => {
      let type = code === 0 ? "clear" : [45,48].includes(code) ? "fog" :
        [71,73,75,77,85,86].includes(code) ? "snow" :
        [95,96,99].includes(code) ? "storm" :
        [51,53,55,56,57].includes(code) ? "drizzle" :
        [61,63,65,66,67,80,81,82].includes(code) ? "rain" : "cloudy";
      const labels = {clear:"Clear skies",cloudy:"Cloudy skies",fog:"Fog and low visibility",drizzle:"Light drizzle",rain:"Rain in Tacoma",snow:"Snow in Tacoma",storm:"Thunderstorm conditions"};
      const icons = {clear:day?"☀️":"🌙",cloudy:day?"☁️":"☁️",fog:"🌫️",drizzle:"🌦️",rain:"🌧️",snow:"❄️",storm:"⛈️"};
      return {type, night:!day, icon:icons[type], label:day?labels[type]:"Night · "+labels[type]};
    };
    async function update() {
      try {
        const response = await fetch("https://api.open-meteo.com/v1/forecast?latitude=47.2529&longitude=-122.4443&current=temperature_2m,weather_code,is_day&temperature_unit=fahrenheit&timezone=America%2FLos_Angeles", {cache:"no-store",headers:{Accept:"application/json"}});
        if (!response.ok) throw new Error("Weather unavailable");
        const data = await response.json(), current = data?.current;
        if (!current || typeof current.weather_code !== "number" || typeof current.temperature_2m !== "number") throw new Error("Invalid weather response");
        const state = classify(current.weather_code, Number(current.is_day) === 1);
        for (const view of views) {
          view.hero.classList.remove("cr-gw-clear","cr-gw-cloudy","cr-gw-fog","cr-gw-drizzle","cr-gw-rain","cr-gw-snow","cr-gw-storm","cr-gw-night");
          view.hero.classList.add("cr-gw-" + state.type);
          if (state.night) view.hero.classList.add("cr-gw-night");
          view.hero.dataset.weatherCondition = state.type;
          view.icon.textContent = state.icon;
          view.condition.textContent = state.label;
          view.temperature.textContent = Math.round(current.temperature_2m) + "°F";
        }
      } catch (_) {
        for (const view of views) {
          view.icon.textContent = "🌐";
          view.condition.textContent = "Local weather unavailable";
          view.temperature.textContent = "—°F";
          view.hero.classList.add("cr-gw-cloudy");
        }
      }
    }
    if (reduceMotion) document.documentElement.classList.add("cr-reduced-motion");
    update();
    window.setInterval(update, 15 * 60 * 1000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) update(); });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();
})();

/* Add one clear doorway to the community expansion without overcrowding every nav. */
(() => {
  const addCommunityLink = () => {
    if (location.pathname.includes("/admin/")) return;
    const nav = document.querySelector(".navlinks, .nav-links");
    if (!nav || [...nav.querySelectorAll("a")].some(a => /\/community\/$/.test(new URL(a.href, location.href).pathname))) return;
    const a = document.createElement("a");
    a.href = "https://crowrulesentertainment-oss.github.io/tacoma/community/";
    a.textContent = "Community tools";
    a.dataset.crCommunityTools = "true";
    nav.append(a);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addCommunityLink, {once:true});
  else addCommunityLink();
})();
