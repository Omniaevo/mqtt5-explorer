import { describe, expect, it, vi } from "vitest";
import TooltipOverlay from "./TooltipOverlay";

const WINDOW_WIDTH = 1000;
const ANCHOR = { x: 100, y: 4, width: 100, height: 30 };

function createOverlay() {
  const view = {
    webContentsId: 7,
    setBounds: vi.fn(),
    setVisible: vi.fn(),
    setBackgroundColor: vi.fn(),
    bringToFront: vi.fn(),
    send: vi.fn(),
  };
  const createView = vi.fn(() => view);
  const overlay = new TooltipOverlay({
    createView,
    getContentSize: () => ({ width: WINDOW_WIDTH, height: 600 }),
  });

  return { overlay, view, createView };
}

const request = (anchor = ANCHOR) => ({ title: "Broker", subtitle: "mqtt://h:1883", anchor });

describe("TooltipOverlay", () => {
  it("creates the view only on the first tooltip", () => {
    const { overlay, createView } = createOverlay();

    expect(createView).not.toHaveBeenCalled();

    overlay.show(request());
    overlay.show(request());

    expect(createView).toHaveBeenCalledTimes(1);
  });

  it("waits for the page before sending the content", () => {
    const { overlay, view } = createOverlay();

    overlay.show(request());
    expect(view.send).not.toHaveBeenCalled();

    overlay.markReady();
    expect(view.send).toHaveBeenCalledWith("tooltip:content", {
      id: 1,
      title: "Broker",
      subtitle: "mqtt://h:1883",
    });
  });

  it("centers the view below the anchor", () => {
    const { overlay, view } = createOverlay();

    overlay.show(request());
    overlay.place({ id: 1, width: 60, height: 20 });

    expect(view.setBounds).toHaveBeenLastCalledWith({ x: 120, y: 38, width: 60, height: 20 });
  });

  it("keeps the view inside the window on the right edge", () => {
    const { overlay, view } = createOverlay();

    overlay.show(request({ ...ANCHOR, x: 980, width: 20 }));
    overlay.place({ id: 1, width: 200, height: 20 });

    expect(view.setBounds).toHaveBeenLastCalledWith(expect.objectContaining({ x: 800 }));
  });

  it("keeps the view inside the window on the left edge", () => {
    const { overlay, view } = createOverlay();

    overlay.show(request({ ...ANCHOR, x: 0, width: 20 }));
    overlay.place({ id: 1, width: 200, height: 20 });

    expect(view.setBounds).toHaveBeenLastCalledWith(expect.objectContaining({ x: 0 }));
  });

  it("shows the view above the others once placed", () => {
    const { overlay, view } = createOverlay();

    overlay.show(request());
    overlay.place({ id: 1, width: 60, height: 20 });

    expect(view.bringToFront).toHaveBeenCalled();
    expect(view.setVisible).toHaveBeenLastCalledWith(true);
  });

  it("ignores a size report of an older tooltip", () => {
    const { overlay, view } = createOverlay();

    overlay.show(request());
    overlay.show(request());
    overlay.place({ id: 1, width: 60, height: 20 });

    expect(view.setVisible).not.toHaveBeenLastCalledWith(true);
  });

  it("ignores a size report after hide", () => {
    const { overlay, view } = createOverlay();

    overlay.show(request());
    overlay.hide();
    overlay.place({ id: 1, width: 60, height: 20 });

    expect(view.setVisible).toHaveBeenLastCalledWith(false);
  });

  it("owns only the webContents of its view", () => {
    const { overlay } = createOverlay();

    overlay.show(request());

    expect([overlay.owns(7), overlay.owns(8)]).toEqual([true, false]);
  });
});
