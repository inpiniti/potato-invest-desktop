import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __filename$1 = fileURLToPath(import.meta.url);
const __dirname$1 = path.dirname(__filename$1);
process.env.DIST = path.join(__dirname$1, "../dist");
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, "../public");
let win;
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
function createWindow() {
  console.log("Preload path:", path.join(__dirname$1, "preload.js"));
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC || "", "electron-vite.svg"),
    autoHideMenuBar: true,
    // 메뉴바 숨김
    webPreferences: {
      preload: path.join(__dirname$1, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
      // Preload 스크립트가 작동하도록 설정
    }
  });
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(process.env.DIST || "", "index.html"));
  }
  win.maximize();
}
try {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient("potato-invest", process.execPath, [path.resolve(process.argv[1])]);
    }
  } else {
    app.setAsDefaultProtocolClient("potato-invest");
  }
} catch (error) {
  console.error("딥링크 프로토콜 등록 실패:", error);
}
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, commandLine) => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
      const url = commandLine.find((arg) => arg.startsWith("potato-invest://"));
      if (url) {
        win.webContents.send("deep-link", url);
      }
    }
  });
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
      win = null;
    }
  });
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
  app.on("open-url", (event, url) => {
    event.preventDefault();
    if (win) {
      win.webContents.send("deep-link", url);
    }
  });
  ipcMain.handle("open-external", async (_, url) => {
    await shell.openExternal(url);
  });
  ipcMain.handle("oauth-login", async (_, loginUrl) => {
    return new Promise((resolve, reject) => {
      let isResolved = false;
      const authWindow = new BrowserWindow({
        width: 500,
        height: 800,
        // 높이 증가 (700 → 800)
        show: false,
        autoHideMenuBar: true,
        // 메뉴바 숨김
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });
      authWindow.loadURL(loginUrl);
      authWindow.show();
      authWindow.webContents.on("will-redirect", (event, url) => {
        handleCallback(url);
      });
      authWindow.webContents.on("did-navigate", (event, url) => {
        handleCallback(url);
      });
      function handleCallback(url) {
        if (isResolved) return;
        if (url.includes("potato-invest://") || url.includes("#access_token=")) {
          isResolved = true;
          authWindow.close();
          const hashIndex = url.indexOf("#");
          if (hashIndex !== -1) {
            const hash = url.substring(hashIndex + 1);
            const params = new URLSearchParams(hash);
            const accessToken = params.get("access_token");
            const refreshToken = params.get("refresh_token");
            if (accessToken && refreshToken) {
              resolve({ accessToken, refreshToken });
            } else {
              reject(new Error("토큰을 찾을 수 없습니다"));
            }
          } else {
            reject(new Error("잘못된 리다이렉트 URL"));
          }
        }
      }
      authWindow.on("closed", () => {
        if (!isResolved) {
          isResolved = true;
          resolve(null);
        }
      });
    });
  });
  app.whenReady().then(createWindow);
}
