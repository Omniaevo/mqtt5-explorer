import { ipcMain } from "electron";
import { Channel } from "../shared/ipcChannels";

const MAX_TEXT_LENGTH = 200;
const MAX_VIEW_SIZE = 2000;
const LISTENER_CHANNELS = [
  Channel.TOOLTIP_SHOW,
  Channel.TOOLTIP_HIDE,
  Channel.TOOLTIP_READY,
  Channel.TOOLTIP_SIZE,
];

const isFiniteNumbers = (...values) => values.every(Number.isFinite);
const isText = (value) => typeof value === "string" && value !== "";

/** Returns a safe tooltip request, or undefined when invalid. */
export function parseTooltipRequest(request) {
  if (typeof request !== "object" || request === null) return undefined;

  const { title, subtitle, anchor } = request;

  if (!isText(title)) return undefined;
  if (subtitle !== undefined && typeof subtitle !== "string") return undefined;
  if (typeof anchor !== "object" || anchor === null) return undefined;

  const { x, y, width, height } = anchor;

  if (!isFiniteNumbers(x, y, width, height)) return undefined;

  return {
    title: title.slice(0, MAX_TEXT_LENGTH),
    subtitle: subtitle ? subtitle.slice(0, MAX_TEXT_LENGTH) : undefined,
    anchor: { x, y, width, height },
  };
}

/** Returns a safe size report, or undefined when invalid. */
export function parseSizeReport(report) {
  if (typeof report !== "object" || report === null) return undefined;

  const { id, width, height } = report;

  if (!Number.isInteger(id) || !isFiniteNumbers(width, height)) return undefined;
  if (width <= 0 || height <= 0) return undefined;

  return {
    id,
    width: Math.min(Math.round(width), MAX_VIEW_SIZE),
    height: Math.min(Math.round(height), MAX_VIEW_SIZE),
  };
}

/**
 * Registers the tooltip channels. The shell asks for a tooltip; only the
 * tooltip view reports that it is ready and how big its content is.
 *
 * @param {object} deps
 * @param {import("./TooltipOverlay").default} deps.overlay
 * @param {() => Electron.WebContents} deps.getShellContents
 * @returns {() => void} Removes the handlers.
 */
export function registerTooltipIpc({ overlay, getShellContents }) {
  const onSender = (channel, isAllowed, handler) =>
    ipcMain.on(channel, (event, ...args) => {
      if (isAllowed(event.sender)) handler(...args);
    });
  const isShell = (sender) => sender === getShellContents();
  const isOverlay = (sender) => overlay.owns(sender.id);

  onSender(Channel.TOOLTIP_SHOW, isShell, (request) => {
    const parsed = parseTooltipRequest(request);

    if (parsed) overlay.show(parsed);
  });
  onSender(Channel.TOOLTIP_HIDE, isShell, () => overlay.hide());
  onSender(Channel.TOOLTIP_READY, isOverlay, () => overlay.markReady());
  onSender(Channel.TOOLTIP_SIZE, isOverlay, (report) => {
    const parsed = parseSizeReport(report);

    if (parsed) overlay.place(parsed);
  });

  return () =>
    LISTENER_CHANNELS.forEach((channel) => ipcMain.removeAllListeners(channel));
}
