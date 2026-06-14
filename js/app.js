import { STOPS } from "./data.js";
import { getAllRatings, getRating, setRating } from "./ratings.js";
import { getAllState, getState, setState } from "./state.js";

const TOTAL_STOPS = STOPS.length;

const SORT_MODES = ["crawl", "rating-desc", "rating-asc"];
const SORT_LABELS = {
  crawl: "★",
  "rating-desc": "Top ★",
  "rating-asc": "Low ★",
};
let activeCategory = null;
let activeSearch = "";
let searchDebounceTimer = null;

let favorites = new Set(
  JSON.parse(localStorage.getItem("crawl_favorites") || "[]").map(String),
);
let showFavoritesOnly = false;
let showRemainingOnly = localStorage.getItem("crawl_remaining_only") === "true";
let sortMode = localStorage.getItem("crawl_sort_mode") || "crawl";
if (!SORT_MODES.includes(sortMode)) {
  sortMode = "crawl";
}

function saveFavorites() {
  localStorage.setItem("crawl_favorites", JSON.stringify([...favorites]));
}

function getRatedCount() {
  return Object.keys(getAllRatings()).length;
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

function getRatingGroupLabel(rating) {
  if (rating === null) return "Rate this stop";
  return `Rated ${rating} out of 5 stars`;
}

function renderRatingStars(stopNumber) {
  const rating = getRating(stopNumber);
  const groupLabel = escapeHtml(getRatingGroupLabel(rating));

  const stars = [1, 2, 3, 4, 5]
    .map((value) => {
      const filled = rating !== null && value <= rating;
      const pressed = rating === value ? "true" : "false";
      return `<button
        class="card-rating__star${filled ? " card-rating__star--filled" : ""}"
        type="button"
        data-value="${value}"
        aria-label="Rate ${value} star${value === 1 ? "" : "s"}"
        aria-pressed="${pressed}"
      >${filled ? "★" : "☆"}</button>`;
    })
    .join("");

  return `
        <div class="card-rating" role="group" aria-label="${groupLabel}">
          ${stars}
        </div>`;
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

function getSortedStopEntries() {
  const entries = STOPS.map((stop, index) => ({ stop, index }));

  if (sortMode === "rating-desc") {
    return entries.sort((a, b) => {
      const diff =
        (getRating(b.index + 1) ?? -1) - (getRating(a.index + 1) ?? -1);
      return diff !== 0 ? diff : a.index - b.index;
    });
  }

  if (sortMode === "rating-asc") {
    return entries.sort((a, b) => {
      const ra = getRating(a.index + 1) ?? 999;
      const rb = getRating(b.index + 1) ?? 999;
      const diff = ra - rb;
      return diff !== 0 ? diff : a.index - b.index;
    });
  }

  return entries;
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
          <button class="btn-favorite" type="button" aria-label="Add to favorites">♡</button>
        </header>
        ${renderRatingStars(stopNumber)}
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

  const scrollBtn = banner.querySelector(".next-stop-banner__scroll");
  const directionsEl = banner.querySelector(".next-stop-banner__directions");
  const titleEl = banner.querySelector(".next-stop-banner__title");
  const addressEl = banner.querySelector(".next-stop-banner__address");
  const next = findNextStop();

  if (!next) {
    banner.classList.add("next-stop-banner--complete");
    banner.classList.remove("next-stop-banner--active");
    banner.removeAttribute("data-target-id");
    if (scrollBtn) {
      scrollBtn.disabled = true;
      scrollBtn.setAttribute("aria-label", "Crawl complete");
    }
    if (directionsEl) {
      directionsEl.hidden = true;
    }
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
  banner.dataset.targetId = String(next.stopNumber);
  if (scrollBtn) {
    scrollBtn.disabled = false;
    scrollBtn.setAttribute(
      "aria-label",
      `Go to stop ${next.stopNumber}, ${next.stop.name}`,
    );
  }
  if (directionsEl) {
    directionsEl.hidden = false;
    directionsEl.href = next.stop.mapsUrl;
    directionsEl.setAttribute("aria-label", `Directions to ${next.stop.name}`);
  }
  if (titleEl) {
    titleEl.textContent = `Next Stop → #${next.stopNumber} ${next.stop.name}`;
  }
  if (addressEl) {
    addressEl.textContent = next.stop.address;
  }
}

function handleBannerClick() {
  const banner = document.getElementById("next-stop-banner");
  if (!banner) return;

  const scrollBtn = banner.querySelector(".next-stop-banner__scroll");
  if (!scrollBtn || scrollBtn.disabled) return;

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

  const entries = getSortedStopEntries();

  app.innerHTML = `
    <ol class="crawl-timeline">
      ${entries.map(({ stop, index }) => renderStop(stop, index)).join("")}
    </ol>
  `;

  applyFilters();
  initFavorites();
  initRatings();
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
  btn.textContent = isFav ? "♥" : "♡";
  btn.classList.toggle("is-favorited", isFav);
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
  badge.textContent = `♥ ${count}`;
  badge.style.display = count > 0 || showFavoritesOnly ? "flex" : "none";
  badge.classList.toggle("active", showFavoritesOnly);
}

function updateRatingUI(id) {
  const sid = String(id);
  const card = document.querySelector(`.stop-card[data-id="${sid}"]`);
  if (!card) return;

  const rating = getRating(sid);
  const group = card.querySelector(".card-rating");
  if (!group) return;

  group.setAttribute("aria-label", getRatingGroupLabel(rating));

  group.querySelectorAll(".card-rating__star").forEach((star) => {
    const value = Number(star.dataset.value);
    const filled = rating !== null && value <= rating;
    star.textContent = filled ? "★" : "☆";
    star.classList.toggle("card-rating__star--filled", filled);
    star.setAttribute("aria-pressed", rating === value ? "true" : "false");
  });
}

function initRatings() {
  for (let id = 1; id <= TOTAL_STOPS; id += 1) {
    if (getRating(id) !== null) {
      updateRatingUI(id);
    }
  }
}

function updateRemainingFilter() {
  const btn = document.getElementById("remaining-filter");
  if (!btn) return;
  btn.classList.toggle("active", showRemainingOnly);
  btn.setAttribute("aria-pressed", showRemainingOnly ? "true" : "false");
}

function updateSortControl() {
  const btn = document.getElementById("sort-rating");
  if (!btn) return;
  const ratedCount = getRatedCount();
  btn.textContent = SORT_LABELS[sortMode];
  btn.style.display = ratedCount > 0 || sortMode !== "crawl" ? "flex" : "none";
  btn.classList.toggle("active", sortMode !== "crawl");
  btn.setAttribute("aria-pressed", sortMode !== "crawl" ? "true" : "false");
  btn.setAttribute(
    "aria-label",
    sortMode === "crawl"
      ? "Sort by rating"
      : sortMode === "rating-desc"
        ? "Sorted by top rated"
        : "Sorted by lowest rated",
  );
}

function initFavorites() {
  favorites.forEach((id) => updateFavoriteUI(id));
  updateFavoritesBadge();
}

function getNoResultsMessage() {
  if (showFavoritesOnly) {
    return "No favorites yet — tap ♡ on any stop to save it.";
  }
  if (showRemainingOnly) {
    return "All done — every stop is visited or skipped.";
  }
  return "No stops match — try a different search.";
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
    const matchesRemaining =
      !showRemainingOnly || getState(card.dataset.id) === "pending";
    const visible =
      matchesSearch && matchesFilter && matchesFavorites && matchesRemaining;

    card.style.display = visible ? "" : "none";
    stopEl.style.display = visible ? "" : "none";
  });

  const anyVisible = [...document.querySelectorAll(".stop-card")].some(
    (c) => c.style.display !== "none",
  );
  const noResults = document.getElementById("no-results");
  if (noResults) {
    noResults.style.display = anyVisible ? "none" : "block";
    noResults.textContent = getNoResultsMessage();
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

  if (
    event.target.closest(
      ".btn-favorite, .card-rating, .crawl-card__actions, a, button",
    )
  ) {
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
  <div id="search-controls">
    <button id="remaining-filter" type="button" aria-label="Show remaining stops only" aria-pressed="false">To go</button>
    <button id="sort-rating" type="button" aria-label="Sort by rating" aria-pressed="false" style="display:none">★</button>
    <button id="favorites-badge" type="button" aria-label="View favorites" style="display:none">♥ 0</button>
  </div>
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

  document.getElementById("remaining-filter").addEventListener("click", () => {
    showRemainingOnly = !showRemainingOnly;
    localStorage.setItem("crawl_remaining_only", String(showRemainingOnly));
    updateRemainingFilter();
    applyFilters();
  });

  document.getElementById("sort-rating").addEventListener("click", () => {
    const currentIndex = SORT_MODES.indexOf(sortMode);
    sortMode = SORT_MODES[(currentIndex + 1) % SORT_MODES.length];
    localStorage.setItem("crawl_sort_mode", sortMode);
    updateSortControl();
    render();
  });

  updateRemainingFilter();
  updateSortControl();
}

function handleFavoriteClick(event) {
  const btn = event.target.closest(".btn-favorite");
  if (!btn) return;

  event.stopPropagation();
  const card = btn.closest(".stop-card");
  if (!card) return;

  toggleFavorite(card.dataset.id);
}

function handleRatingClick(event) {
  const star = event.target.closest(".card-rating__star");
  if (!star) return;

  event.stopPropagation();
  const card = star.closest(".stop-card");
  if (!card) return;

  const value = Number(star.dataset.value);
  const current = getRating(card.dataset.id);
  const next = current === value ? null : value;

  setRating(card.dataset.id, next);
  updateRatingUI(card.dataset.id);
  updateSortControl();
  applyFilters();

  if (sortMode !== "crawl") {
    render();
  }
}

function init() {
  const app = document.getElementById("app");
  if (!app) return;

  injectSearchUI();

  const banner = document.getElementById("next-stop-banner");
  const bannerScrollBtn = banner?.querySelector(".next-stop-banner__scroll");
  if (bannerScrollBtn) {
    bannerScrollBtn.addEventListener("click", handleBannerClick);
  }

  const filterBar = document.getElementById("category-filter");
  if (filterBar) {
    filterBar.addEventListener("click", handleFilterClick);
  }

  app.addEventListener("click", handleCardClick);
  app.addEventListener("keydown", handleCardKeydown);
  app.addEventListener("click", handleFavoriteClick);
  app.addEventListener("click", handleRatingClick);
  window.addEventListener("progressChanged", () => {
    updateHeader();
    updateNextStopBanner();
    applyFilters();
  });
  render();
  updateHeader();
  updateNextStopBanner();
}

init();
