import { mkdtemp, readdir, readFile, rm } from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import MessageLogger, {
  CSV_HEADER,
  formatDate,
  formatFolderStamp,
} from "./MessageLogger";

describe("date formats", () => {
  const date = new Date(2024, 0, 5, 7, 8, 9, 4);

  it("formats the CSV date like the old moment format", () => {
    expect(formatDate(date)).toBe("2024-01-05 07:08:09.004");
  });

  it("formats the run folder stamp", () => {
    expect(formatFolderStamp(date)).toBe("2024-01-05_07-08-09");
  });
});

describe("MessageLogger", () => {
  let root;
  let clock;
  const now = () => new Date(clock);
  const createLogger = () =>
    new MessageLogger("conn/1", { rootFolder: root, now });
  const connectionFolder = () => path.join(root, "conn_1");

  beforeEach(async () => {
    root = await mkdtemp(path.join(os.tmpdir(), "mqtt5-logger-"));
    clock = new Date(2024, 0, 5, 10, 0, 0, 123).getTime();
  });

  afterEach(() => rm(root, { recursive: true, force: true }));

  it("writes the header once and appends rows in the old CSV format", async () => {
    const logger = createLogger();

    logger.startLogging();
    logger.enqueue({ topic: "a/b", payload: "1", properties: { qos: 1 } });
    logger.enqueue({ topic: "a/b", payload: "2" });
    await logger.stopLogging();

    const csv = await readFile(
      path.join(logger.logsFolder, "a_b.csv"),
      "utf-8"
    );
    const when = new Date(2024, 0, 5, 10, 0, 0, 123).getTime();

    expect(csv).toBe(
      `${CSV_HEADER}` +
        `${when};2024-01-05 10:00:00.123;1;{"qos":1}\n` +
        `${when};2024-01-05 10:00:00.123;2;\n`
    );
  });

  it("creates sibling dated folders when toggled repeatedly", async () => {
    const logger = createLogger();

    for (let run = 0; run < 3; run++) {
      logger.startLogging();
      logger.enqueue({ topic: "t", payload: String(run) });
      await logger.stopLogging();
      clock += 1000;
    }

    const folders = await readdir(connectionFolder());

    expect(folders).toEqual([
      "2024-01-05_10-00-00",
      "2024-01-05_10-00-01",
      "2024-01-05_10-00-02",
    ]);
    expect(await readdir(path.join(connectionFolder(), folders[0]))).toEqual([
      "t.csv",
    ]);
  });

  it("does not duplicate the header when restarted in the same second", async () => {
    const logger = createLogger();

    logger.startLogging();
    logger.enqueue({ topic: "t", payload: "1" });
    logger.stopLogging();
    logger.startLogging();
    logger.enqueue({ topic: "t", payload: "2" });
    await logger.stopLogging();

    const csv = await readFile(path.join(logger.logsFolder, "t.csv"), "utf-8");

    expect(csv.split(CSV_HEADER)).toHaveLength(2);
    expect(csv.trim().split("\n")).toHaveLength(3);
  });

  it("ignores messages while stopped", async () => {
    const logger = createLogger();

    logger.enqueue({ topic: "t", payload: "1" });
    await logger.stopLogging();

    await expect(readdir(connectionFolder())).rejects.toThrow();
  });

  it("keeps every row of a large burst in order", async () => {
    const logger = createLogger();
    const total = 20_000;

    logger.startLogging();
    for (let i = 0; i < total; i++) {
      logger.enqueue({ topic: "burst", payload: String(i) });
    }
    await logger.stopLogging();

    const lines = (
      await readFile(path.join(logger.logsFolder, "burst.csv"), "utf-8")
    )
      .trim()
      .split("\n");

    expect(lines).toHaveLength(total + 1);
    expect(lines[1].split(";")[2]).toBe("0");
    expect(lines[total].split(";")[2]).toBe(String(total - 1));
  });

  it("uses a fallback file name for a missing topic", async () => {
    const logger = createLogger();

    logger.startLogging();
    logger.enqueue({ payload: "x" });
    await logger.stopLogging();

    expect(await readdir(logger.logsFolder)).toEqual(["unknown-topic.csv"]);
  });
});
