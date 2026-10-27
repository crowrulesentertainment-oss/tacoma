
/*
 * CrowRules Community Hub — reusable listing renderer
 *
 * Expected page elements:
 *   #directory-listings
 *   #directory-search (optional)
 *   #directory-status-filter (optional)
 *   #directory-empty (optional)
 *
 * Add data-category="resources" to the listing container
 * to show only one category. Omit it to show all records.
 */
(() => {
  "use strict";

  const records = Array.isArray(window.CROW_RULES_LISTINGS)
    ? window.CROW_RULES_LISTINGS
    : [];

  const container = document.getElementById("directory-listings");
  if (!container) return;

  const search = document.getElementById("directory-search");
  const statusFilter = document.getElementById("directory-status-filter");
  const empty = document.getElementById("directory-empty");

  const category = container.dataset.category || "";
  const allowedStatuses = ["starter", "reviewed", "recheck"];

  const escapeHTML = value =>
    String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);

  function safeWebsite(value) {
    try {
      const url = new URL(value);
      if (url.protocol === "https:" || url.protocol === "http:") {
        return url.href;
      }
    } catch (_) {
      // Invalid or missing URL: omit the link.
    }
    return null;
  }

  function statusLabel(record) {
    if (record.status === "reviewed" && record.lastChecked) {
      return "Reviewed " + record.lastChecked;
    }
    if (record.status === "recheck") {
      return "Needs rechecking";
    }
    return "Starter listing · not individually verified";
  }

  function accessibilityText(accessibility) {
    if (!accessibility || accessibility.status !== "confirmed") {
      return "Not yet confirmed";
    }
    return accessibility.notes || "Details confirmed; see provider for specifics";
  }

  function renderCard(record) {
    const website = safeWebsite(record.website);
    const contact = record.contact || {};
    const accessibility = record.accessibility || {};
    const tags = Array.isArray(record.tags) ? record.tags : [];

    const phone = contact.phone
      ? `<p><strong>Phone:</strong> ${escapeHTML(contact.phone)}</p>`
      : "";

    const email = contact.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact.email)
      ? `<p><strong>Email:</strong> <a href="mailto:${escapeHTML(contact.email)}">${escapeHTML(contact.email)}</a></p>`
      : "";

    const address = contact.address
      ? `<p><strong>Address:</strong> ${escapeHTML(contact.address)}</p>`
      : "";

    const websiteLink = website
      ? `<a class="listing-website" href="${escapeHTML(website)}" target="_blank" rel="noopener noreferrer">Visit official website ↗</a>`
      : `<span class="listing-muted">Official website not available</span>`;

    const checkedDate = record.lastChecked
      ? escapeHTML(record.lastChecked)
      : "Not yet checked";

    const tagMarkup = tags.map(tag =>
      `<span class="listing-tag">${escapeHTML(tag)}</span>`
    ).join(" ");

    return `
      <article class="listing-card">
        <div class="listing-card-top">
          <span class="listing-category">${escapeHTML(record.categoryLabel || record.category || "Community")}</span>
          <span class="listing-status">${escapeHTML(statusLabel(record))}</span>
        </div>

        <h2>${escapeHTML(record.name || "Unnamed listing")}</h2>
        <p class="listing-description">${escapeHTML(record.description || "Description not yet provided.")}</p>

        <dl class="listing-details">
          <div>
            <dt>Service area</dt>
            <dd>${escapeHTML(record.serviceArea || "Not yet confirmed")}</dd>
          </div>
          <div>
            <dt>Accessibility information</dt>
            <dd>${escapeHTML(accessibilityText(accessibility))}</dd>
          </div>
          <div>
            <dt>Last checked</dt>
            <dd>${checkedDate}</dd>
          </div>
        </dl>

        <div class="listing-contact">
          ${phone}${email}${address}
        </div>

        ${record.notes ? `<p class="listing-note">${escapeHTML(record.notes)}</p>` : ""}
        <div class="listing-tags">${tagMarkup}</div>
        <div class="listing-card-footer">${websiteLink}</div>
      </article>
    `;
  }

  function render() {
    const query = search ? search.value.trim().toLowerCase() : "";
    const chosenStatus = statusFilter ? statusFilter.value : "";

    const filtered = records.filter(record => {
      if (category && record.category !== category) return false;

      const recordStatus = allowedStatuses.includes(record.status)
        ? record.status
        : "starter";

      if (chosenStatus && recordStatus !== chosenStatus) return false;

      const searchable = [
        record.name,
        record.categoryLabel,
        record.category,
        record.serviceArea,
        record.description,
        record.notes,
        ...(record.tags || [])
      ].join(" ").toLowerCase();

      return !query || searchable.includes(query);
    });

    container.innerHTML = filtered.map(renderCard).join("");

    if (empty) {
      empty.hidden = filtered.length > 0;
    }
  }

  if (search) search.addEventListener("input", render);
  if (statusFilter) statusFilter.addEventListener("change", render);

  render();
})();
