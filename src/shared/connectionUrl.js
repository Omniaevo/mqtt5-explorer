/** Broker URL of a connection, e.g. `mqtts://localhost:8883`. */
export const connectionUrl = ({ protocol, host, port }) =>
  `${protocol}://${host}:${port}`;
