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
