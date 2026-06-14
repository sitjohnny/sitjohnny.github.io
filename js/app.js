import { STOPS } from "./data.js";

const CATEGORY_LABELS = {
  latino: "Latino",
  himalayan: "Himalayan",
  "indian-bengali": "Indian Bengali",
  filipino: "Filipino",
  "coffee-cafe": "Coffee Cafe",
  desserts: "Desserts",
  "chinese-peruvian": "Chinese Peruvian",
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderStop(stop, index) {
  const stopNumber = index + 1;
  const categoryLabel = CATEGORY_LABELS[stop.category] ?? stop.category;

  return `
    <li class="crawl-stop">
      <div class="crawl-stop__rail" aria-hidden="true">
        <span class="crawl-stop__node">${stopNumber}</span>
      </div>
      <article class="crawl-card" data-id="${stopNumber}" data-category="${escapeHtml(stop.category)}">
        <header class="crawl-card__header">
          <span class="crawl-card__badge">${stopNumber}</span>
          <h2 class="crawl-card__name">${escapeHtml(stop.name)}</h2>
          <span class="category-pill" data-category="${escapeHtml(stop.category)}">${escapeHtml(categoryLabel)}</span>
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

function render() {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `
    <ol class="crawl-timeline">
      ${STOPS.map(renderStop).join("")}
    </ol>
  `;
}

render();
