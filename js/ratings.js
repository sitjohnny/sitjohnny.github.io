const STORAGE_KEY = "crawl_ratings";
const VALID_RATINGS = new Set([1, 2, 3, 4, 5]);

function loadRatings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    const ratings = {};

    for (const [key, value] of Object.entries(parsed)) {
      const num = Number(value);
      if (VALID_RATINGS.has(num)) {
        ratings[String(key)] = num;
      }
    }

    return ratings;
  } catch {
    return {};
  }
}

let ratings = loadRatings();

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings));
}

export function getRating(id) {
  const value = ratings[String(id)];
  return value ?? null;
}

export function setRating(id, value) {
  const sid = String(id);

  if (value === null || value === undefined) {
    delete ratings[sid];
    persist();
    return null;
  }

  const num = Number(value);
  if (!VALID_RATINGS.has(num)) return getRating(id);

  ratings[sid] = num;
  persist();
  return num;
}

export function getAllRatings() {
  return { ...ratings };
}
