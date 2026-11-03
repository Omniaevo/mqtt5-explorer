import { Channel } from "../shared/ipcChannels";

const TOOLTIP_ROUTE = "/tooltip";
const TRANSPARENT = "#00000000";
const ANCHOR_GAP = 4;
// Room for the tooltip to lay out before its real size is known
const MEASURE_HEIGHT = 200;

/**
 * Draws a tooltip above the tab views. The shell cannot do it: native views
 * paint over the shell page. The view is created on the first tooltip, stays
 * hidden while the page measures its content, then shrinks to the content
 * size so the transparent area never blocks the mouse. The view factory and
 * the window size are injected, so the logic runs without Electron.
 */
class TooltipOverlay {
  #createView;
  #getContentSize;
  #view;
  #ready = false;
  #request = null;
  #lastRequestId = 0;

  /**
   * @param {object} deps
   * @param {(route: string) => object} deps.createView Same view shape as `TabManager`, plus `setBackgroundColor` and `bringToFront`.
   * @param {() => {width: number, height: number}} deps.getContentSize
   */
  constructor({ createView, getContentSize }) {
    this.#createView = createView;
    this.#getContentSize = getContentSize;
  }

  /**
   * Starts a tooltip. It shows when the page reports its size.
   * @param {{title: string, subtitle?: string, anchor: {x: number, y: number, width: number, height: number}}} request
   */
  show({ title, subtitle, anchor }) {
    this.#view ??= this.#createHiddenView();
    this.#request = { id: ++this.#lastRequestId, title, subtitle, anchor };

    this.#view.setVisible(false);
    this.#view.setBounds({ x: 0, y: 0, width: this.#getContentSize().width, height: MEASURE_HEIGHT });
    this.#sendRequest();
  }

  hide() {
    this.#request = null;
    this.#view?.setVisible(false);
  }

  /** The page is loaded: send the tooltip that waited for it. */
  markReady() {
    this.#ready = true;
    this.#sendRequest();
  }

  /**
   * The page drew the content. Places the view below the anchor, inside the window.
   * An answer for an older tooltip is ignored.
   */
  place({ id, width, height }) {
    if (this.#request?.id !== id) return;

    const { anchor } = this.#request;
    const maxX = Math.max(this.#getContentSize().width - width, 0);
    const centered = Math.round(anchor.x + (anchor.width - width) / 2);

    this.#view.setBounds({
      x: Math.min(Math.max(centered, 0), maxX),
      y: Math.round(anchor.y + anchor.height + ANCHOR_GAP),
      width,
      height,
    });
    this.#view.setVisible(true);
    this.#view.bringToFront();
  }

  /** True when the webContents is the view of this tooltip. */
  owns(webContentsId) {
    return this.#view?.webContentsId === webContentsId;
  }

  #createHiddenView() {
    const view = this.#createView(TOOLTIP_ROUTE);

    view.setBackgroundColor(TRANSPARENT);
    view.setVisible(false);

    return view;
  }

  #sendRequest() {
    if (!this.#ready || !this.#request) return;

    const { id, title, subtitle } = this.#request;

    this.#view.send(Channel.TOOLTIP_CONTENT, { id, title, subtitle });
  }
}

export default TooltipOverlay;
