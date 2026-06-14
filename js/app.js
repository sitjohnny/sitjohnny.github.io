import { STOPS } from "./data.js";
import { getAllState, getState, setState } from "./state.js";

const TOTAL_STOPS = STOPS.length;

let activeCategory = null;
let activeSearch = "";
let searchDebounceTimer = null;

let favorites = new Set(
  JSON.parse(localStorage.getItem("crawl_favorites") || "[]").map(String),
);
let showFavoritesOnly = false;

function saveFavorites() {
  localStorage.setItem("crawl_favorites", JSON.stringify([...favorites]));
}

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
  card.setAttribute("aria-label", getToggleAriaLabel(name, status));

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

function getSearchText(stop) {
  return [stop.name, stop.snapshot, ...stop.tags].join(" ").toLowerCase();
}

function renderStop(stop, index) {
  const stopNumber = index + 1;
  const categoryLabel = CATEGORY_LABELS[stop.category] ?? stop.category;
  const status = getState(stopNumber);
  const searchText = escapeHtml(getSearchText(stop));

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
        data-search-text="${searchText}"
        tabindex="0"
        aria-label="${escapeHtml(getToggleAriaLabel(stop.name, status))}"
      >
        <header class="crawl-card__header">
          <h2 class="crawl-card__name">${escapeHtml(stop.name)}${skippedSrMarkup(status)}</h2>
          <span class="category-pill" data-category="${escapeHtml(stop.category)}">${escapeHtml(categoryLabel)}</span>
          <button class="btn-favorite" type="button" aria-label="Add to favorites">☆</button>
        </header>
        <p class="crawl-card__address">${escapeHtml(stop.address)}</p>
        ${
          stop.crawlMove
            ? `
        <div class="crawl-move-box">
          <span class="crawl-move-label">💡 Crawl Move</span>
          <p class="crawl-move-text">${escapeHtml(stop.crawlMove)}</p>
        </div>
        `
            : ""
        }
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
  initFavorites();
}

function toggleFavorite(id) {
  const sid = String(id);
  if (favorites.has(sid)) {
    favorites.delete(sid);
  } else {
    favorites.add(sid);
  }
  saveFavorites();
  updateFavoriteUI(sid);
  updateFavoritesBadge();
  applyFilters();
}

function updateFavoriteUI(id) {
  const sid = String(id);
  const card = document.querySelector(`.stop-card[data-id="${sid}"]`);
  if (!card) return;
  const btn = card.querySelector(".btn-favorite");
  if (!btn) return;
  const isFav = favorites.has(sid);
  btn.textContent = isFav ? "⭐" : "☆";
  btn.setAttribute(
    "aria-label",
    isFav ? "Remove from favorites" : "Add to favorites",
  );
  card.classList.toggle("stop-favorited", isFav);
}

function updateFavoritesBadge() {
  const badge = document.getElementById("favorites-badge");
  if (!badge) return;
  const count = favorites.size;
  badge.textContent = `⭐ ${count}`;
  badge.style.display = count > 0 || showFavoritesOnly ? "flex" : "none";
  badge.classList.toggle("active", showFavoritesOnly);
}

function initFavorites() {
  favorites.forEach((id) => updateFavoriteUI(id));
  updateFavoritesBadge();
}

function applyFilters() {
  const stops = document.querySelectorAll(".crawl-stop");
  stops.forEach((stopEl) => {
    const card = stopEl.querySelector(".stop-card");
    if (!card) return;

    const matchesFilter =
      !activeCategory || card.dataset.category === activeCategory;
    const matchesSearch =
      !activeSearch || card.dataset.searchText.includes(activeSearch);
    const matchesFavorites =
      !showFavoritesOnly || favorites.has(card.dataset.id);
    const visible = matchesSearch && matchesFilter && matchesFavorites;

    card.style.display = visible ? "" : "none";
    stopEl.style.display = visible ? "" : "none";
  });

  const anyVisible = [...document.querySelectorAll(".stop-card")].some(
    (c) => c.style.display !== "none",
  );
  const noResults = document.getElementById("no-results");
  if (noResults) {
    noResults.style.display = anyVisible ? "none" : "block";
    noResults.textContent = showFavoritesOnly
      ? "No favorites yet — tap ☆ on any stop to save it."
      : "No stops match — try a different search.";
  }
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

function cycleCardStatus(card) {
  const id = Number(card.dataset.id);
  const name = card.dataset.name;
  const current = getState(id);
  const next = STATUS_CYCLE[current];

  setState(id, next);
  updateCardStatus(card, name, next);
}

function handleCardClick(event) {
  const card = event.target.closest(".stop-card");
  if (!card) return;

  if (event.target.closest(".btn-favorite, .crawl-card__actions, a, button")) {
    return;
  }

  cycleCardStatus(card);
}

function handleCardKeydown(event) {
  if (event.key !== "Enter" && event.key !== " ") return;

  const card = event.target.closest(".stop-card");
  if (!card || event.target !== card) return;

  event.preventDefault();
  cycleCardStatus(card);
}

function injectSearchUI() {
  const filterBar = document.getElementById("category-filter");
  if (!filterBar || document.getElementById("search-container")) return;

  filterBar.insertAdjacentHTML(
    "beforebegin",
    `<div id="search-container">
  <div id="search-input-wrapper">
    <input
      id="search-input"
      type="search"
      placeholder="Search stops, food, dishes..."
      autocomplete="off"
      autocorrect="off"
      autocapitalize="none"
    />
    <button id="search-clear" type="button" aria-label="Clear search" style="display:none">×</button>
  </div>
  <button id="favorites-badge" type="button" aria-label="View favorites" style="display:none">⭐ 0</button>
</div>`,
  );

  const app = document.getElementById("app");
  if (app && !document.getElementById("no-results")) {
    app.insertAdjacentHTML(
      "afterend",
      `<div id="no-results" style="display:none; text-align:center; padding:40px 16px; color:#666; font-size:15px;">
  No stops match — try a different search.
</div>`,
    );
  }

  const searchInput = document.getElementById("search-input");
  const searchClear = document.getElementById("search-clear");

  searchInput.addEventListener("input", () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      activeSearch = document
        .getElementById("search-input")
        .value.trim()
        .toLowerCase();
      document.getElementById("search-clear").style.display = activeSearch
        ? "inline-block"
        : "none";
      applyFilters();
    }, 150);
  });

  searchClear.addEventListener("click", () => {
    clearTimeout(searchDebounceTimer);
    document.getElementById("search-input").value = "";
    activeSearch = "";
    document.getElementById("search-clear").style.display = "none";
    applyFilters();
  });

  document.getElementById("favorites-badge").addEventListener("click", () => {
    showFavoritesOnly = !showFavoritesOnly;
    updateFavoritesBadge();
    applyFilters();
  });
}

function handleFavoriteClick(event) {
  const btn = event.target.closest(".btn-favorite");
  if (!btn) return;

  event.stopPropagation();
  const card = btn.closest(".stop-card");
  if (!card) return;

  toggleFavorite(card.dataset.id);
}

function init() {
  const app = document.getElementById("app");
  if (!app) return;

  injectSearchUI();

  const banner = document.getElementById("next-stop-banner");
  if (banner) {
    banner.addEventListener("click", handleBannerClick);
  }

  const filterBar = document.getElementById("category-filter");
  if (filterBar) {
    filterBar.addEventListener("click", handleFilterClick);
  }

  app.addEventListener("click", handleCardClick);
  app.addEventListener("keydown", handleCardKeydown);
  app.addEventListener("click", handleFavoriteClick);
  window.addEventListener("progressChanged", () => {
    updateHeader();
    updateNextStopBanner();
  });
  render();
  updateHeader();
  updateNextStopBanner();
}

init();
