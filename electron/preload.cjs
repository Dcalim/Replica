const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  isElectron: true,
  selectFolder: () => ipcRenderer.invoke("select-folder"),
});
