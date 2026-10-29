// Pure selectors that build the hub sections from the saved connections.

const RECENT_LIMIT = 4;

const byName = (a, b) =>
  a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

export const pinnedConnections = (list) => list.filter((c) => c.pinned);

/** Newest first; connections never connected are left out. */
export const recentConnections = (list, limit = RECENT_LIMIT) =>
  list
    .filter((c) => c.lastConnectedAt)
    .sort((a, b) => b.lastConnectedAt - a.lastConnectedAt)
    .slice(0, limit);

export const allConnections = (list) => [...list].sort(byName);

/** Case-insensitive match on name or host; empty query keeps all. */
export const filterConnections = (list, query) => {
  const search = (query || "").trim().toLowerCase();

  return list.filter(
    (c) =>
      c.name.toLowerCase().includes(search) ||
      (c.host || "").toLowerCase().includes(search)
  );
};
