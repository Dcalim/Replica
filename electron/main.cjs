const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

const isDev = !app.isPackaged;
const BACKEND_PORT = process.env.PORT || "3001";
const FRONTEND_DEV_URL = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";

/** @type {import("child_process").ChildProcess | null} */
let backendProcess = null;

/** @type {import("electron").BrowserWindow | null} */
let mainWindow = null;

function getBackendEntry() {
  return path.join(__dirname, "../BackEnd/src/index.js");
}

function startBackend() {
  if (backendProcess) {
    return;
  }

  backendProcess = spawn("node", [getBackendEntry()], {
    cwd: path.join(__dirname, "../BackEnd"),
    env: {
      ...process.env,
      PORT: BACKEND_PORT,
      NODE_ENV: isDev ? "development" : "production",
    },
    stdio: "inherit",
  });

  backendProcess.on("exit", () => {
    backendProcess = null;
  });
}

function stopBackend() {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "Replica",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL(FRONTEND_DEV_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "../FrontEnd/dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

ipcMain.handle("select-folder", async () => {
  const window = BrowserWindow.getFocusedWindow() ?? mainWindow;

  const result = await dialog.showOpenDialog(window, {
    properties: ["openDirectory"],
    title: "Choose a folder to scan",
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  stopBackend();

  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  stopBackend();
});
