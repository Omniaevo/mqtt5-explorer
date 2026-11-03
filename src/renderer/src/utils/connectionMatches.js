const SEARCHED_FIELDS = ["name", "host", "clientId"];

/** True when the query is empty or found, ignoring case, in the name, host or client id. */
export default function connectionMatches(connection, query) {
  const needle = query.trim().toLowerCase();

  if (!needle) return true;

  return SEARCHED_FIELDS.some((field) =>
    String(connection[field] ?? "").toLowerCase().includes(needle),
  );
}
