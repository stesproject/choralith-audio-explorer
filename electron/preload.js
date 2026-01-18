const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  pickFolder: () => ipcRenderer.invoke("pick-folder"),
  scanFolder: (folderPath, cachedTracks, cachedStats) =>
    ipcRenderer.invoke("scan-folder", folderPath, cachedTracks, cachedStats),
  onScanProgress: (callback) => ipcRenderer.on("scan-progress", callback),
  openFolder: (filePath) => ipcRenderer.send("open-folder", filePath),
});
