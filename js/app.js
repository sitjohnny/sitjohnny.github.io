import { STOPS } from "./data.js";
import { getAllState, getState, setState } from "./state.js";

const TOTAL_STOPS = STOPS.length;

let activeCategory = null;
let searchQuery = "";

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

function findNextStop() {
  for (let index = 0; index < STOPS.length; index += 1) {
    const stopNumber = index + 1;
    if (getState(stopNumber) === "pending") {
      return { stopNumber, stop: STOPS[index] };
    }
  }
  return null;
}

function scrollToStopCard(stopId) {
  const card = document.querySelector(`.stop-card[data-id="${stopId}"]`);
  const header = document.getElementById("progress-header");
  if (!card || !header) return;

  const headerOffset = header.getBoundingClientRect().height + 12;
  const cardTop = card.getBoundingClientRect().top + window.scrollY;

  window.scrollTo({
    top: cardTop - headerOffset,
    behavior: "smooth",
  });
}

function updateNextStopBanner() {
  const banner = document.getElementById("next-stop-banner");
  if (!banner) return;

  const titleEl = banner.querySelector(".next-stop-banner__title");
  const addressEl = banner.querySelector(".next-stop-banner__address");
  const next = findNextStop();

  if (!next) {
    banner.classList.add("next-stop-banner--complete");
    banner.classList.remove("next-stop-banner--active");
    banner.disabled = true;
    banner.removeAttribute("data-target-id");
    banner.setAttribute("aria-label", "Crawl complete");
    if (titleEl) {
      titleEl.textContent = "🎉 Crawl complete! Great eating.";
    }
    if (addressEl) {
      addressEl.textContent = "";
    }
    return;
  }

  banner.classList.remove("next-stop-banner--complete");
  banner.classList.add("next-stop-banner--active");
  banner.disabled = false;
  banner.dataset.targetId = String(next.stopNumber);
  banner.setAttribute(
    "aria-label",
    `Go to stop ${next.stopNumber}, ${next.stop.name}`,
  );
  if (titleEl) {
    titleEl.textContent = `Next Stop → #${next.stopNumber} ${next.stop.name}`;
  }
  if (addressEl) {
    addressEl.textContent = next.stop.address;
  }
}

function handleBannerClick() {
  const banner = document.getElementById("next-stop-banner");
  if (!banner || banner.disabled) return;

  const stopId = banner.dataset.targetId;
  if (!stopId) return;

  scrollToStopCard(stopId);
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

  applyFilters();
}

function matchesCategory(category) {
  return !activeCategory || category === activeCategory;
}

function matchesSearch(name, address) {
  if (!searchQuery) return true;
  const query = searchQuery.toLowerCase();
  return (
    name.toLowerCase().includes(query) ||
    address.toLowerCase().includes(query)
  );
}

function applyFilters() {
  const stops = document.querySelectorAll(".crawl-stop");
  stops.forEach((stopEl) => {
    const card = stopEl.querySelector(".stop-card");
    if (!card) return;

    const category = card.dataset.category;
    const name = card.dataset.name;
    const address =
      card.querySelector(".crawl-card__address")?.textContent ?? "";

    const visible =
      matchesCategory(category) && matchesSearch(name, address);
    stopEl.hidden = !visible;
  });
}

function updateFilterButtons() {
  const buttons = document.querySelectorAll(".category-filter__btn");
  buttons.forEach((btn) => {
    const category = btn.dataset.category || null;
    const isActive = category ? category === activeCategory : !activeCategory;
    btn.classList.toggle("category-filter__btn--active", isActive);
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

function handleFilterClick(event) {
  const btn = event.target.closest(".category-filter__btn");
  if (!btn) return;

  const category = btn.dataset.category || null;

  if (category && category === activeCategory) {
    activeCategory = null;
  } else if (category) {
    activeCategory = category;
  } else {
    activeCategory = null;
  }

  updateFilterButtons();
  applyFilters();
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

  const banner = document.getElementById("next-stop-banner");
  if (banner) {
    banner.addEventListener("click", handleBannerClick);
  }

  const filterBar = document.getElementById("category-filter");
  if (filterBar) {
    filterBar.addEventListener("click", handleFilterClick);
  }

  app.addEventListener("click", handleToggleClick);
  window.addEventListener("progressChanged", () => {
    updateHeader();
    updateNextStopBanner();
  });
  render();
  updateHeader();
  updateNextStopBanner();
}

init();
