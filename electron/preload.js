const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  openFolder:       ()          => ipcRenderer.invoke('dialog:openFolder'),
  readFolderImages: (folderPath) => ipcRenderer.invoke('folder:readImages', folderPath),
  readFileAsBase64: (filePath)  => ipcRenderer.invoke('file:readAsBase64', filePath),
  openImageFile:    ()          => ipcRenderer.invoke('dialog:openImage'),
  saveJSON:         (data)      => ipcRenderer.invoke('dialog:saveJSON', data),
  openJSON:         ()          => ipcRenderer.invoke('dialog:openJSON'),
})
