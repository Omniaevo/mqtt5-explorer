import { WebContentsView } from "electron";
import path from "path";

/**
 * Builds the `createView` function of `TabManager`.
 * Every view gets the same secure `webPreferences` as the window.
 *
 * @param {BrowserWindow} win
 * @param {Electron.WebPreferences} webPreferences
 * @param {() => string} getBackgroundColor Color a view shows before its page paints.
 */
export function createTabViewFactory(win, webPreferences, getBackgroundColor) {
  return (route) => {
    const view = new WebContentsView({ webPreferences });

    view.setBackgroundColor(getBackgroundColor());

    win.contentView.addChildView(view);
    loadRoute(view.webContents, route);

    return {
      webContentsId: view.webContents.id,
      setBounds: (bounds) => view.setBounds(bounds),
      setVisible: (visible) => view.setVisible(visible),
      setBackgroundColor: (color) => view.setBackgroundColor(color),
      // Adding a child again moves it above its siblings
      bringToFront: () => win.contentView.addChildView(view),
      send: (channel, ...args) => view.webContents.send(channel, ...args),
      focus: () => view.webContents.focus(),
      reload: (ignoreCache) =>
        ignoreCache
          ? view.webContents.reloadIgnoringCache()
          : view.webContents.reload(),
      destroy: () => {
        win.contentView.removeChildView(view);
        view.webContents.close();
      },
    };
  };
}

/** Loads one route of the renderer bundle (dev server or built file). */
export function loadRoute(webContents, route) {
  const devUrl = process.env.ELECTRON_RENDERER_URL;

  if (devUrl) {
    // URL adds the "/" path: "http://host:port#/route" fails with ERR_FAILED
    const url = new URL(devUrl);

    url.hash = route;
    return webContents.loadURL(url.href);
  }

  return webContents.loadFile(path.join(__dirname, "../renderer/index.html"), {
    hash: route,
  });
}
