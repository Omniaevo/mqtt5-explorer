/**
 * Fields of a saved connection, grouped by type. Used by the renderer model
 * (copy) and by the main process (validation), so both stay in step.
 */
const REQUIRED_STRINGS = Object.freeze(["id", "name", "host"]);
const OPTIONAL_STRINGS = Object.freeze([
  "username",
  "password",
  "caCert",
  "clientId",
  "clientCert",
  "clientKey",
  "caCertPath",
  "clientCertPath",
  "clientKeyPath",
]);
const NUMBERS = Object.freeze(["port", "version"]);
const PROTOCOLS = Object.freeze(["mqtt", "mqtts", "ws", "wss"]);

export const ConnectionFields = Object.freeze({
  requiredStrings: REQUIRED_STRINGS,
  optionalStrings: OPTIONAL_STRINGS,
  numbers: NUMBERS,
  protocols: PROTOCOLS,
  /** Every persisted field, including the protocol, topics and certificate flag. */
  all: Object.freeze([
    ...REQUIRED_STRINGS,
    ...OPTIONAL_STRINGS,
    ...NUMBERS,
    "protocol",
    "topics",
    "validateCertificate",
    // Renderer only (Home recents): an ISO string, or a timestamp in old data
    "lastConnectedAt",
    // Renderer only (Home alert): message of the last failed attempt
    "lastError",
  ]),
});
