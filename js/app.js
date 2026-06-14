import { STOPS } from "./data.js";
import { getAllState, getState, setState } from "./state.js";

const TOTAL_STOPS = STOPS.length;

const CATEGORY_LABELS = {
  latino: "Latino",
  himalayan: "Himalayan",
  "indian-bengali": "Indian Bengali",
  filipino: "Filipino",
  "coffee-cafe": "Coffee Cafe",
  desserts: "Desserts",
  "chinese-peruvian": "Chinese Peruvian",
};

const STATUS_CYCLE = {
  pending: "visited",
  visited: "skipped",
  skipped: "pending",
};

const ACTION_LABELS = {
  pending: "Visited",
  visited: "Skipped",
  skipped: "Pending",
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getToggleAriaLabel(name, currentStatus) {
  return `Mark ${name} as ${ACTION_LABELS[currentStatus]}`;
}

function skippedSrMarkup(status) {
  return status === "skipped"
    ? '<span class="visually-hidden">(Skipped)</span>'
    : "";
}

function updateCardStatus(card, name, status) {
  card.dataset.status = status;

  const toggle = card.querySelector(".stop-card__toggle");
  if (toggle) {
    toggle.setAttribute("aria-label", getToggleAriaLabel(name, status));
  }

  const heading = card.querySelector(".crawl-card__name");
  if (!heading) return;

  const existing = heading.querySelector(".visually-hidden");
  if (status === "skipped") {
    if (!existing) {
      const span = document.createElement("span");
      span.className = "visually-hidden";
      span.textContent = "(Skipped)";
      heading.appendChild(span);
    }
  } else if (existing) {
    existing.remove();
  }
}

function renderStop(stop, index) {
  const stopNumber = index + 1;
  const categoryLabel = CATEGORY_LABELS[stop.category] ?? stop.category;
  const status = getState(stopNumber);

  return `
    <li class="crawl-stop">
      <div class="crawl-stop__rail" aria-hidden="true">
        <span class="crawl-stop__node">${stopNumber}</span>
      </div>
      <article
        class="crawl-card stop-card"
        data-id="${stopNumber}"
        data-name="${escapeHtml(stop.name)}"
        data-status="${status}"
        data-category="${escapeHtml(stop.category)}"
      >
        <header class="crawl-card__header">
          <span class="crawl-card__badge">${stopNumber}</span>
          <h2 class="crawl-card__name">${escapeHtml(stop.name)}${skippedSrMarkup(status)}</h2>
          <span class="category-pill" data-category="${escapeHtml(stop.category)}">${escapeHtml(categoryLabel)}</span>
          <button
            type="button"
            class="stop-card__toggle"
            aria-label="${escapeHtml(getToggleAriaLabel(stop.name, status))}"
          >
            <span class="stop-card__toggle-icon" aria-hidden="true"></span>
          </button>
        </header>
        <p class="crawl-card__address">${escapeHtml(stop.address)}</p>
        <div class="crawl-move">
          <p class="crawl-move__label">💡 Crawl Move</p>
          <p class="crawl-move__text">${escapeHtml(stop.crawlMove)}</p>
        </div>
        <p class="crawl-card__snapshot">${escapeHtml(stop.snapshot)}</p>
        <div class="crawl-card__actions">
          <a class="btn btn-menu" href="${escapeHtml(stop.menuUrl)}" target="_blank" rel="noopener">📋 Menu</a>
          <a class="btn btn-directions" href="${escapeHtml(stop.mapsUrl)}" target="_blank" rel="noopener">📍 Directions</a>
        </div>
      </article>
    </li>
  `;
}

function updateHeader() {
  const countsEl = document.getElementById("progress-counts");
  const fillEl = document.getElementById("progress-fill");
  const trackEl = document.querySelector(".progress-header__track");
  if (!countsEl || !fillEl) return;

  const allState = getAllState();
  let visited = 0;
  let skipped = 0;

  for (const status of Object.values(allState)) {
    if (status === "visited") visited += 1;
    else if (status === "skipped") skipped += 1;
  }

  const remaining = TOTAL_STOPS - visited - skipped;
  const percent = Math.round((visited / TOTAL_STOPS) * 100);

  countsEl.textContent = `${visited} visited · ${skipped} skipped · ${remaining} to go`;
  fillEl.style.width = `${percent}%`;

  if (trackEl) {
    trackEl.setAttribute("aria-valuenow", String(percent));
    trackEl.setAttribute("aria-label", `${percent}% crawl complete`);
  }
}

function render() {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `
    <ol class="crawl-timeline">
      ${STOPS.map(renderStop).join("")}
    </ol>
  `;
}

function handleToggleClick(event) {
  const toggle = event.target.closest(".stop-card__toggle");
  if (!toggle) return;

  const card = toggle.closest(".stop-card");
  if (!card) return;

  const id = Number(card.dataset.id);
  const name = card.dataset.name;
  const current = getState(id);
  const next = STATUS_CYCLE[current];

  setState(id, next);
  updateCardStatus(card, name, next);
}

function init() {
  const app = document.getElementById("app");
  if (!app) return;

  app.addEventListener("click", handleToggleClick);
  window.addEventListener("progressChanged", updateHeader);
  render();
  updateHeader();
}

init();
