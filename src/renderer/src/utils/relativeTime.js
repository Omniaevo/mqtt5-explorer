// Pure relative-time label for the live tile back face.

// Largest unit first, size in seconds
const UNITS = [
  ["year", 31536000],
  ["month", 2592000],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

/** Short label such as "2 hr. ago". Under one minute gives "now". */
export function formatRelativeTime(timestamp, now = Date.now(), locale) {
  const seconds = Math.trunc((timestamp - now) / 1000);
  const formatter = new Intl.RelativeTimeFormat(locale, {
    numeric: "auto",
    style: "short",
  });
  const unit = UNITS.find(([, size]) => Math.abs(seconds) >= size);

  if (!unit) return formatter.format(0, "second");
  return formatter.format(Math.trunc(seconds / unit[1]), unit[0]);
}
