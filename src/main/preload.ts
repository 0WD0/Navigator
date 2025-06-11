const { contextBridge, ipcRenderer } = require('electron')

// 暴露API到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 文件操作
  openPdfFile: () => ipcRenderer.invoke('open-pdf-file'),
  readPdfFile: (filePath: string) => ipcRenderer.invoke('read-pdf-file', filePath),
  checkFileExists: (filePath: string) => ipcRenderer.invoke('check-file-exists', filePath),
  
  // 应用信息
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // 事件监听
  onMenuAction: (callback: (event: any, action: string) => void) => {
    ipcRenderer.on('menu-action', callback)
    return () => ipcRenderer.removeListener('menu-action', callback)
  }
}) 