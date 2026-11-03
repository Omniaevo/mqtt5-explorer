"use strict";

import { autoUpdater } from "electron-updater";
import { app, dialog, Menu, BrowserWindow, shell, Tray } from "electron";
import path from "path";
import Store from "electron-store";
import fs from "fs";
import appIcon from "../../resources/icon.png?asset";
import aboutIcon from "../../resources/about.png?asset";
import trayIconWindows from "../../resources/img/tray/tray.ico?asset";
import trayIconMac from "../../resources/img/tray/trayTemplate.png?asset";
import trayIconLinux from "../../resources/img/tray/tray.png?asset";
import { registerIpcHandlers } from "./ipcHandlers";
import TabManager from "./TabManager";
import TooltipOverlay from "./TooltipOverlay";
import { PINNED_TABS_KEY, restorePinnedTabs } from "./pinnedTabs";
import { tabMenuTemplate } from "./tabMenu";
import { registerTabsIpc } from "./tabsIpc";
import { registerTooltipIpc } from "./tooltipIpc";
import { registerWindowIpc, windowState } from "./windowIpc";
import { createTabViewFactory, loadRoute } from "./createTabView";
import { Channel, FixedTabId, MenuEvent, TabKind } from "../shared/ipcChannels";

const isDevelopment = process.env.NODE_ENV !== "production";
const isSingleInstance = app.requestSingleInstanceLock();
const isMac = process.platform === "darwin";
const isWindows = process.platform === "win32";
const appName = "MQTT5 Explorer";
const COPYRIGHT_YEAR = 2021;
const LICENSE_URL_BASE = "https://github.com/Omniaevo/mqtt5-explorer/blob";

const store = new Store();

let win;
let tray;
let tabs;
let removeTabsIpc;
let stopFollowingConnections;
let removeWindowIpc;
let removeTooltipIpc;
let menuKind;

// The menu depends on the kind of the active tab
const activeKind = () => tabs?.active()?.kind ?? TabKind.HOME;
const refreshMenu = () => {
  const kind = activeKind();

  if (kind === menuKind) return;

  menuKind = kind;
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate(kind)));
};
// Windows and Linux have no menu bar: the shell button pops the menu up
const popupAppMenu = ({ x, y }) => {
  if (isMac || !win) return;

  Menu.buildFromTemplate(menuTemplate(activeKind())).popup({ window: win, x, y });
};
// Right click on a tab: the menu is native, so it paints above the views
const popupTabMenu = (tabId) => {
  if (!win || !tabs) return;

  const template = tabMenuTemplate({
    tab: tabs.list().find((tab) => tab.id === tabId),
    canPin: tabs.canPin(tabId),
    actions: {
      pin: () => tabs.pin(tabId),
      unpin: () => tabs.unpin(tabId),
      unload: () => tabs.unload(tabId),
    },
  });

  if (template.length > 0) Menu.buildFromTemplate(template).popup({ window: win });
};
const focusWindow = () => {
  if (!win) return;
  if (!win.isVisible()) win.show();
  if (win.isMinimized()) win.restore();

  // Ensure window is visible then focus
  setTimeout(() => win.focus(), 200);
};
const openSettings = () => tabs?.open(TabKind.SETTINGS);
// Menu and tray events act on the view the user is looking at
const sendToActiveView = (channel, ...args) =>
  tabs?.sendToActive(channel, ...args);
// Import and export live in Home: select it first
const sendToHome = (channel, ...args) => {
  tabs?.select(FixedTabId.HOME);
  tabs?.sendTo(FixedTabId.HOME, channel, ...args);
};
const ipc = registerIpcHandlers({
  store,
  focusWindow,
  onSessionFocus: (webContents) => tabs?.select(tabs.tabIdOf(webContents.id)),
});

const aboutMenu = [
  {
    label: "Report a bug",
    click: () => {
      shell.openExternal(import.meta.env.MAIN_VITE_GITHUB_BUGS);
    },
  },
  {
    label: "Keyboard shortcuts",
    accelerator: "CommandOrControl+K",
    click: () => {
      const meta = isMac ? "Cmd" : "Ctrl";

      dialog
        .showMessageBox(win, {
          type: "info",
          title: "Keyboard shortcuts",
          message:
            `Edit settings\t\t\t\t\t${meta} + COMMA\n` +
            `Toggle search\t\t\t\t\t${meta} + F\n` +
            `Notifications and logging\t\t${meta} + Shift + N\n` +
            `Reload the tab\t\t\t\t\t${meta} + R\n` +
            `Force reload the tab\t\t\t${meta} + Shift + R\n` +
            `Close the tab\t\t\t\t\t${meta} + W\n` +
            `Next tab\t\t\t\t\t\tCtrl + Tab\n` +
            `Previous tab\t\t\t\t\tCtrl + Shift + Tab\n` +
            `Quit the app\t\t\t\t\t${meta} + Q\n` +
            `Show shortcuts\t\t\t\t${meta} + K\n` +
            `About the app\t\t\t\t\t${meta} + I`,
          buttons: ["Ok"],
        })
        .then(() => {
          // Do nothing, just close the dialog
        })
        .catch((err) => {
          if (isDevelopment) console.error(err);
        });
    },
  },
  {
    label: `About ${appName}`,
    accelerator: "CommandOrControl+I",
    click: () => {
      dialog
        .showMessageBox(win, {
          type: "info",
          title: `About ${appName}`,
          message: appName,
          detail:
            `Version: ${app.getVersion()}-${process.platform}\n\n` +
            `Copyright (C) ${COPYRIGHT_YEAR} Omniaevo SRL and contributors\n\n` +
            "This program comes with ABSOLUTELY NO WARRANTY. " +
            "It is free software, and you are welcome to redistribute it " +
            "under the terms of the GNU General Public License version 3 only.",
          icon: aboutIcon,
          buttons: ["GitHub page", "View license", "Close"],
        })
        .then((box) => {
          if (box.response === 0) {
            // Open GitHub page
            shell.openExternal(import.meta.env.MAIN_VITE_GITHUB_PAGE);
          } else if (box.response === 1) {
            shell.openExternal(
              `${LICENSE_URL_BASE}/v${app.getVersion()}/LICENSE`
            );
          }
        })
        .catch((err) => {
          if (isDevelopment) console.error(err);
        });
    },
  },
];

let menuTemplate = (kind = TabKind.HOME) => [
  ...(isMac
    ? [
        {
          label: appName,
          submenu: [
            ...aboutMenu,
            {
              type: "separator",
            },
            {
              label: "Settings",
              accelerator: "CommandOrControl+,",
              click: () => {
                openSettings();
              },
            },
          ],
        },
      ]
    : []),
  {
    label: "Window",
    submenu: [
      {
        label: "Reload",
        accelerator: "CommandOrControl+R",
        click: () => tabs?.reloadActive(),
      },
      {
        label: "Force reload",
        accelerator: "CommandOrControl+Shift+R",
        click: () => tabs?.reloadActive(true),
      },
      {
        type: "separator",
      },
      {
        label: "Close tab",
        accelerator: "CommandOrControl+W",
        click: () => tabs?.closeActive(),
      },
      {
        label: "Next tab",
        accelerator: "Ctrl+Tab",
        click: () => tabs?.selectNext(),
      },
      {
        label: "Previous tab",
        accelerator: "Ctrl+Shift+Tab",
        click: () => tabs?.selectPrevious(),
      },
      {
        type: "separator",
      },
      // Cmd + W belongs to "Close tab"
      ...(isMac
        ? [
            {
              label: "Close window",
              accelerator: "Cmd+Shift+W",
              role: "close",
            },
          ]
        : []),
      {
        label: `Quit ${appName}`,
        role: "quit",
      },
    ],
  },
  {
    label: "Edit",
    submenu: [
      {
        label: "Copy",
        role: "copy",
      },
      {
        label: "Cut",
        role: "cut",
      },
      {
        label: "Paste",
        role: "paste",
      },
      ...(!isMac
        ? [
            {
              type: "separator",
            },
            {
              label: "Settings",
              accelerator: "CommandOrControl+,",
              click: () => {
                openSettings();
              },
            },
          ]
        : []),
    ],
  },
  ...(kind === TabKind.HOME
    ? [
        {
          label: "Connections",
          submenu: [
            {
              label: "Export all",
              click: () => sendToHome(MenuEvent.EXPORT_DATA),
            },
            {
              label: "Import from file",
              click: () => {
                dialog
                  .showOpenDialog({
                    properties: ["openFile"],
                    filters: [
                      { name: "Json (*.json)", extensions: ["json"] },
                      { name: "All Files", extensions: ["*"] },
                    ],
                  })
                  .then((result) => {
                    if (result.canceled) return;

                    const fileContent = fs.readFileSync(
                      result.filePaths[0],
                      "utf8"
                    );

                    sendToHome(MenuEvent.IMPORT_DATA, fileContent);
                  })
                  .catch((err) => {
                    sendToHome(MenuEvent.IMPORT_DATA, `Error: ${err}`);
                  });
              },
            },
          ],
        },
      ]
    : []),
  {
    label: "Tools",
    submenu: [
      ...(kind === TabKind.CONNECTION
        ? [
            {
              label: "Toggle search",
              accelerator: "CommandOrControl+F",
              click: () => sendToActiveView(MenuEvent.SEARCH),
            },
            {
              label: "Toggle logging",
              accelerator: "CommandOrControl+Shift+N",
              click: () => sendToActiveView(MenuEvent.NOTIFICATION),
            },
          ]
        : []),
      {
        label: "Open logs folder",
        click: () => {
          if (!fs.existsSync(ipc.logsFolder)) {
            fs.mkdirSync(ipc.logsFolder);
          }

          shell.openPath(ipc.logsFolder);
        },
      },
    ],
  },
  ...(!isMac
    ? [
        {
          label: "Help",
          submenu: aboutMenu,
        },
      ]
    : []),
];
let trayTemplate = [
  {
    label: `Show/hide ${appName}`,
    click: () => {
      // Show/hide the app window
      if (!win) return;

      if (win.isVisible()) win.hide();
      else win.show();
    },
  },
  {
    label: "Show/hide settings",
    click: () => {
      if (!win) return;
      if (!win.webContents) return;

      if (!win.isVisible()) win.show();
      if (win.isMinimized()) win.restore();

      openSettings();
    },
  },
  { type: "separator" },
  { label: `Quit ${appName}`, role: "quit" },
];

async function createWindow() {
  // Create the browser window.
  const webPreferences = {
    preload: path.join(__dirname, "../preload/index.js"),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
  };

  win = new BrowserWindow({
    width: store.get("app_width") || 1366,
    height: store.get("app_height") || 768,
    title: appName,
    icon: appIcon,
    webPreferences,
    // The shell draws the title bar and the window controls
    frame: false,
  });

  // Alt must not bring the menu bar back; the accelerators stay active
  if (!isMac) win.setMenuBarVisibility(false);

  // The window webContents is the shell; every tab is a view above it
  const createView = createTabViewFactory(win, webPreferences);
  const getContentSize = () => {
    const [width, height] = win.getContentSize();
    return { width, height };
  };

  tabs = new TabManager({
    createView,
    getContentSize,
    onChange: (snapshot) => {
      win.webContents.send(Channel.TABS_STATE, snapshot);
      refreshMenu();
    },
    onPinnedChange: (connectionIds) => store.set(PINNED_TABS_KEY, connectionIds),
  });
  stopFollowingConnections = restorePinnedTabs({ store, tabs });
  removeTabsIpc = registerTabsIpc({
    tabs,
    getShellContents: () => win.webContents,
    onContextMenu: popupTabMenu,
  });

  removeTooltipIpc = registerTooltipIpc({
    overlay: new TooltipOverlay({ createView, getContentSize }),
    getShellContents: () => win.webContents,
  });

  removeWindowIpc = registerWindowIpc({
    getWindow: () => win,
    getShellContents: () => win.webContents,
    onOpenMenu: popupAppMenu,
  });

  // Create the tray icon
  tray = new Tray(
    isWindows ? trayIconWindows : isMac ? trayIconMac : trayIconLinux
  );

  tray.setToolTip(appName);
  tray.setIgnoreDoubleClickEvents(true);
  tray.setContextMenu(Menu.buildFromTemplate(trayTemplate));

  // Use the custom title
  win.on("page-title-updated", (event) => event.preventDefault());

  // Catch window resizing for storing the information
  win.on("resize", () => {
    tabs.resize();

    const size = win.getSize();

    // Save to local storage
    store.set("app_width", size[0]);
    store.set("app_height", size[1]);
  });

  // Maximize, restore and full screen do not always fire "resize" first
  ["maximize", "unmaximize", "enter-full-screen", "leave-full-screen"].forEach(
    (eventName) =>
      win.on(eventName, () => {
        tabs.resize();
        win.webContents.send(Channel.WINDOW_STATE, windowState(win));
      })
  );

  // Close to tray
  win.on("close", (event) => {
    if (store.get("close_to_tray") !== "false") {
      event.preventDefault();
      win.hide();
    }
  });

  // The window gives the focus to the shell; the content must have it
  win.on("focus", () => tabs.focusActive());

  refreshMenu();

  await loadRoute(win.webContents, "/shell");
  tabs.focusActive();

  if (process.env.ELECTRON_RENDERER_URL) {
    if (!process.env.IS_TEST) win.webContents.openDevTools({ mode: "detach" });
  } else {
    // Verify if the app can be updated.
    autoUpdater.checkForUpdatesAndNotify();
  }
}

// Prevent multiple windows
if (!isSingleInstance) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!win) return;

    if (!win.isVisible()) win.show();
    if (win.isMinimized()) win.restore();

    win.focus();
  });
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (!isMac) app.quit();
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  // A second instance quits: it must not build a window that fails to load
  if (isSingleInstance) await createWindow();
});

app.on("before-quit", async (event) => {
  event.preventDefault();

  try {
    // Flush log files before the process exits
    await ipc.shutdown();

    if (stopFollowingConnections) stopFollowingConnections();
    if (removeTabsIpc) removeTabsIpc();
    if (removeWindowIpc) removeWindowIpc();
    if (removeTooltipIpc) removeTooltipIpc();
    // Destroying the window also destroys the tab views
    if (win && !win.isDestroyed()) win.destroy();
    if (tray) tray.destroy();
  } finally {
    // The process must exit even if a cleanup step fails
    app.removeAllListeners();
    app.exit();
  }
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (isWindows) {
    process.on("message", (data) => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}
