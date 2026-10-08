import { ref } from "vue";
import toPlain from "../utils/toPlain";

const DEFAULT_TOPIC = "example/topic";
const NUMERIC_PROPERTIES = ["messageExpiryInterval", "topicAlias"];

const isBlank = (value) =>
  value === undefined || value === null || value === "";

/**
 * State of the publish form.
 * @param {() => boolean} isV5 True when MQTT 5 properties are supported.
 */
export function usePublishForm(isV5) {
  const form = ref(undefined);
  const userProperties = ref([]);
  const advancedProperties = ref(false);

  /** Fills the form from `{ topic, value }` (a topic node or similar). */
  function load({ topic, value = {} }) {
    const { userProperties: stored = {}, ...properties } = toPlain(
      value.properties ?? {}
    );

    form.value = {
      topic,
      payload: value.payload,
      retain: value.retain ?? false,
      qos: value.qos ?? 0,
      properties: { contentType: "", ...properties },
    };
    userProperties.value = isV5()
      ? Object.entries(stored).map(([key, val]) => ({ key, value: val }))
      : [];
  }

  function loadEmpty() {
    load({ topic: DEFAULT_TOPIC });
  }

  function reset() {
    form.value = undefined;
    userProperties.value = [];
    advancedProperties.value = false;
  }

  /** @returns {object} Packet ready for `Connection.publish`. */
  function toPacket() {
    const { properties, ...packet } = toPlain(form.value);

    if (!isV5()) return packet;

    const cleaned = Object.fromEntries(
      Object.entries(properties).filter(([, val]) => !isBlank(val))
    );

    NUMERIC_PROPERTIES.forEach((key) => {
      if (key in cleaned) cleaned[key] = Number(cleaned[key]);
    });

    cleaned.userProperties = Object.fromEntries(
      userProperties.value.map(({ key, value }) => [key, value])
    );

    return { ...packet, properties: cleaned };
  }

  return {
    form,
    userProperties,
    advancedProperties,
    load,
    loadEmpty,
    reset,
    toPacket,
  };
}
