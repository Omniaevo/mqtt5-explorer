"use strict";

import { autoUpdater } from "electron-updater";
// eslint-disable-next-line prettier/prettier
import {
  app,
  dialog,
  Menu,
  BrowserWindow,
  shell,
  Tray,
} from "electron";
import path from "path";
import Store from "electron-store";
import fs from "fs";
import appIcon from "../../resources/icon.png?asset";
import aboutIcon from "../../resources/about.png?asset";
import trayIconWindows from "../../resources/img/tray/tray.ico?asset";
import trayIconMac from "../../resources/img/tray/trayTemplate.png?asset";
import trayIconLinux from "../../resources/img/tray/tray.png?asset";
import { registerIpcHandlers } from "./ipcHandlers";
import { MenuEvent, Page } from "../shared/ipcChannels";

const isDevelopment = process.env.NODE_ENV !== "production";
const isSingleInstance = app.requestSingleInstanceLock();
const isMac = process.platform === "darwin";
const isWindows = process.platform === "win32";
const appName = "MQTT5 Explorer";

const store = new Store();

let win;
let tray;

const showPage = (page) => {
  if (Object.values(pages).includes(page)) {
    Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate(page)));
  }
};
const focusWindow = () => {
  if (!win) return;
  if (!win.isVisible()) win.show();
  if (win.isMinimized()) win.restore();

  // Ensure window is visible then focus
  setTimeout(() => win.focus(), 200);
};
const ipc = registerIpcHandlers({
  getWindow: () => win,
  store,
  onPageChange: showPage,
  focusWindow,
});

const pages = Page;
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
            `Reload the page\t\t\t\t${meta} + R\n` +
            `Force reload the page\t\t\t${meta} + Shift + R\n` +
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
          detail: `Version: ${app.getVersion()}-${process.platform}`,
          icon: aboutIcon,
          buttons: ["GitHub page", "Close"],
        })
        .then((box) => {
          if (box.response === 0) {
            // Open GitHub page
            shell.openExternal(import.meta.env.MAIN_VITE_GITHUB_PAGE);
          }
        })
        .catch((err) => {
          if (isDevelopment) console.error(err);
        });
    },
  },
];

let menuTemplate = (page = pages.HOME) => [
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
                if (win != undefined && win.webContents != undefined) {
                  win.webContents.send(MenuEvent.SETTINGS);
                }
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
        role: "reload",
      },
      {
        label: "Force reload",
        role: "forceReload",
      },
      {
        type: "separator",
      },
      ...(isMac ? [{ label: "Close window", role: "close" }] : []),
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
      ...(page === pages.HOME && !isMac
        ? [
            {
              type: "separator",
            },
            {
              label: "Settings",
              accelerator: "CommandOrControl+,",
              click: () => {
                if (win != undefined && win.webContents != undefined) {
                  win.webContents.send(MenuEvent.SETTINGS);
                }
              },
            },
          ]
        : []),
    ],
  },
  ...(page === pages.HOME
    ? [
        {
          label: "Connections",
          submenu: [
            {
              label: "Export all",
              click: () => {
                if (win != undefined && win.webContents != undefined) {
                  win.webContents.send(MenuEvent.EXPORT_DATA);
                }
              },
            },
            {
              label: "Import from file",
              click: () => {
                if (win == undefined || win.webContents == undefined) return;

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

                    win.webContents.send(MenuEvent.IMPORT_DATA, fileContent);
                  })
                  .catch((err) => {
                    win.webContents.send(
                      MenuEvent.IMPORT_DATA,
                      `Error: ${err}`
                    );
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
      ...(page === pages.VIEWER
        ? [
            {
              label: "Toggle search",
              accelerator: "CommandOrControl+F",
              click: () => {
                if (win != undefined && win.webContents != undefined) {
                  win.webContents.send(MenuEvent.SEARCH);
                }
              },
            },
            {
              label: "Toggle logging",
              accelerator: "CommandOrControl+Shift+N",
              click: () => {
                if (win != undefined && win.webContents != undefined) {
                  win.webContents.send(MenuEvent.NOTIFICATION);
                }
              },
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

      win.webContents.send(MenuEvent.SETTINGS);
    },
  },
  { type: "separator" },
  { label: `Quit ${appName}`, role: "quit" },
];

async function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: store.get("app_width") || 1366,
    height: store.get("app_height") || 768,
    title: appName,
    icon: appIcon,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
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
    const size = win.getSize();

    // Save to local storage
    store.set("app_width", size[0]);
    store.set("app_height", size[1]);
  });

  // Close to tray
  win.on("close", (event) => {
    if (store.get("close_to_tray") !== "false") {
      event.preventDefault();
      win.hide();
    }
  });

  // A page reload drops the renderer state, so the MQTT session must go too
  win.webContents.on("did-start-loading", () => ipc.resetSession());

  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate()));

  if (process.env.ELECTRON_RENDERER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.ELECTRON_RENDERER_URL);
    if (!process.env.IS_TEST) win.webContents.openDevTools({ mode: "detach" });
  } else {
    // Load the built index.html when not in development
    await win.loadFile(path.join(__dirname, "../renderer/index.html"));

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
app.on("ready", async () => createWindow());

app.on("before-quit", (event) => {
  event.preventDefault();

  if (win) win.destroy();
  if (tray) tray.destroy();

  app.removeAllListeners();
  app.exit();
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
