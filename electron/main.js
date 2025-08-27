const {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  protocol,
  shell,
} = require("electron");
const path = require("path");
const { Worker } = require("worker_threads");

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    title: "Choralith Audio Explorer",
    icon: path.join(__dirname, "assets", "icon.png"),
    width: 900,
    height: 600,
    webPreferences: {
      sandbox: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
  } else {
    const indexPath = path.join(__dirname, "..", "dist", "index.html");
    win.loadFile(indexPath);
  }

  ipcMain.handle("select-folder", async () => {
    const result = await dialog.showOpenDialog(win, {
      properties: ["openDirectory"],
    });

    if (result.canceled || result.filePaths.length === 0) return [];

    const folder = result.filePaths[0];

    return new Promise((resolve, reject) => {
      const worker = new Worker(path.join(__dirname, "scanner-worker.js"), {
        workerData: { folder },
      });

      worker.on("message", (message) => {
        if (message.type === "progress") {
          win.webContents.send("scan-progress", {
            current: message.current,
            total: message.total,
          });
        } else if (message.type === "done") {
          resolve(message.tracks);
        }
      });

      worker.on("error", reject);
      worker.on("exit", (code) => {
        if (code !== 0)
          reject(new Error(`Worker stopped with exit code ${code}`));
      });
    });
  });

  ipcMain.on("open-folder", (event, filePath) => {
    shell.showItemInFolder(filePath);
  });
}

app.whenReady().then(() => {
  protocol.registerFileProtocol("localfile", (request, callback) => {
    const url = request.url.replace("localfile://", "");
    callback(decodeURIComponent(url));
  });

  createWindow();
});
