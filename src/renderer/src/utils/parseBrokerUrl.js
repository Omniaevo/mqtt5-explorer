const DEFAULT_PORTS = Object.freeze({
  mqtt: 1883,
  mqtts: 8883,
  ws: 80,
  wss: 443,
});

/**
 * Parses `mqtt|mqtts|ws|wss://host[:port][/path]` typed by the user.
 * Returns `{ protocol, host, port }`, or `undefined` when the text is not a broker URL.
 * An IPv6 host keeps its brackets, so the URL built from it stays valid. The path is ignored.
 */
export default function parseBrokerUrl(text) {
  if (typeof text !== "string") return undefined;

  let url;

  try {
    url = new URL(text.trim());
  } catch {
    return undefined;
  }

  const protocol = url.protocol.slice(0, -1);

  if (!(protocol in DEFAULT_PORTS) || !url.hostname) return undefined;

  // The URL parser drops a port equal to the default of a special scheme (ws, wss)
  const port = url.port ? Number(url.port) : DEFAULT_PORTS[protocol];

  return { protocol, host: url.hostname, port };
}
