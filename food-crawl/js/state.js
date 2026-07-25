const STORAGE_KEY = "crawl-progress";
const STOP_COUNT = 17;
const VALID_STATUSES = new Set(["pending", "visited", "skipped"]);

function createDefaultState() {
  const state = {};
  for (let id = 1; id <= STOP_COUNT; id += 1) {
    state[id] = "pending";
  }
  return state;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();

    const parsed = JSON.parse(raw);
    const state = createDefaultState();

    for (let id = 1; id <= STOP_COUNT; id += 1) {
      const value = parsed[id] ?? parsed[String(id)];
      if (VALID_STATUSES.has(value)) {
        state[id] = value;
      }
    }

    return state;
  } catch {
    return createDefaultState();
  }
}

let state = loadState();

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getState(id) {
  const numId = Number(id);
  return state[numId] ?? "pending";
}

export function setState(id, status) {
  const numId = Number(id);
  if (numId < 1 || numId > STOP_COUNT || !VALID_STATUSES.has(status)) return;

  state[numId] = status;
  persist();

  window.dispatchEvent(
    new CustomEvent("progressChanged", {
      detail: { id: numId, status },
    }),
  );
}

export function getAllState() {
  return { ...state };
}

export function resetAll() {
  state = createDefaultState();
  persist();
}
