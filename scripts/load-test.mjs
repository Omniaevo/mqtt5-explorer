#!/usr/bin/env node
// Dev tool (PLAN D15): publishes a steady MQTT load to check the perf target by hand.
// Usage: npm run load-test -- --rate 2000 --topics 10000 --depth 5 --retained 500
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import mqtt from "mqtt";

const TOPIC_ROOT = "loadtest";
const TICK_MS = 100;

export function parseOptions(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      url: { type: "string", default: "mqtt://localhost:1883" },
      rate: { type: "string", default: "1000" },
      topics: { type: "string", default: "5000" },
      depth: { type: "string", default: "4" },
      retained: { type: "string", default: "0" },
      duration: { type: "string", default: "120" },
    },
  });
  const options = {
    url: values.url,
    rate: Number(values.rate),
    topics: Number(values.topics),
    depth: Number(values.depth),
    retained: Number(values.retained),
    duration: Number(values.duration),
  };
  for (const key of ["rate", "topics", "depth", "duration"]) {
    if (!(options[key] > 0)) throw new Error(`--${key} must be a positive number`);
  }
  if (!(options.retained >= 0)) throw new Error("--retained must be >= 0");
  options.retained = Math.min(options.retained, options.topics);
  return options;
}

/** Maps a topic index to a unique path of `depth` levels (base-N digits). */
export function buildTopic(index, topicCount, depth) {
  const branching = Math.max(2, Math.ceil(Math.pow(topicCount, 1 / depth)));
  const levels = [];
  let rest = index;
  for (let level = 0; level < depth; level++) {
    levels.unshift(`l${depth - 1 - level}_${rest % branching}`);
    rest = Math.floor(rest / branching);
  }
  return [TOPIC_ROOT, ...levels].join("/");
}

/** Payload kind is stable per topic, so charts see consistent data. */
export function buildPayload(index, random = Math.random) {
  switch (index % 5) {
    case 0:
      return (random() * 100).toFixed(2);
    case 1:
      return random() < 0.5 ? "true" : "false";
    case 2:
      return random() < 0.5 ? "on" : "off";
    case 3:
      return JSON.stringify({
        temp: Number((random() * 40).toFixed(1)),
        stats: { min: Math.floor(random() * 10), max: Math.floor(random() * 100) },
      });
    default:
      return `status ${Math.floor(random() * 1000)} ok`;
  }
}

function connect(url) {
  return new Promise((resolve, reject) => {
    const client = mqtt.connect(url);
    client.once("connect", () => resolve(client));
    client.once("error", reject);
  });
}

async function publishRetained(client, options) {
  const publishes = Array.from(
    { length: options.retained },
    (_, i) =>
      new Promise((resolve, reject) =>
        client.publish(
          buildTopic(i, options.topics, options.depth),
          buildPayload(i),
          { retain: true },
          (err) => (err ? reject(err) : resolve()),
        ),
      ),
  );
  await Promise.all(publishes);
  console.log(`Published ${options.retained} retained messages`);
}

function runLoad(client, options) {
  let sentTotal = 0;
  let sentLastSecond = 0;
  let owed = 0;
  const onSent = (err) => {
    if (err) return;
    sentTotal++;
    sentLastSecond++;
  };

  const publishTimer = setInterval(() => {
    owed += (options.rate * TICK_MS) / 1000; // keeps fractional msgs for low rates
    for (; owed >= 1; owed--) {
      const index = Math.floor(Math.random() * options.topics);
      client.publish(buildTopic(index, options.topics, options.depth), buildPayload(index), onSent);
    }
  }, TICK_MS);

  const reportTimer = setInterval(() => {
    console.log(`sent ${sentLastSecond} msg/s (target ${options.rate}, total ${sentTotal})`);
    sentLastSecond = 0;
  }, 1000);

  return new Promise((resolve) =>
    setTimeout(() => {
      clearInterval(publishTimer);
      clearInterval(reportTimer);
      resolve();
    }, options.duration * 1000),
  );
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  console.log("Load test options:", options);
  const client = await connect(options.url);
  if (options.retained > 0) await publishRetained(client, options);
  await runLoad(client, options);
  await client.endAsync();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err.message || err.code || err);
    process.exit(1);
  });
}
