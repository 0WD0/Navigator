const { contextBridge, ipcRenderer } = require('electron')

// 暴露API到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 文件操作
  openPdfFile: () => ipcRenderer.invoke('open-pdf-file'),
  readPdfFile: (filePath: string) => ipcRenderer.invoke('read-pdf-file', filePath),
  checkFileExists: (filePath: string) => ipcRenderer.invoke('check-file-exists', filePath),
  
  // 新增：文件对话框和文本文件读取
  openFileDialog: (options: any) => ipcRenderer.invoke('open-file-dialog', options),
  readFileAsText: (filePath: string) => ipcRenderer.invoke('read-file-as-text', filePath),
  
  // 应用信息
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // 事件监听
  onMenuAction: (callback: (_event: any, _action: string) => void) => {
    ipcRenderer.on('menu-action', callback)
    return () => ipcRenderer.removeListener('menu-action', callback)
  }
}) 