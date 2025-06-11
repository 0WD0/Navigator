const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const isDev = require('electron-is-dev')

// 开发环境检测 - 使用electron-is-dev更可靠

let mainWindow: any = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false // 允许加载本地文件
    },
    titleBarStyle: 'hiddenInset', // macOS风格
    show: false
  })

  // 加载应用
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// 应用事件处理
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC 处理器
ipcMain.handle('open-pdf-file', async () => {
  if (!mainWindow) return null
  
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'PDF Files', extensions: ['pdf'] }
    ],
    title: '选择PDF文件'
  })

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0]
    console.log('选择的PDF文件:', filePath)
    
    // 验证文件是否存在且可读
    try {
      await fs.promises.access(filePath, fs.constants.R_OK)
      return filePath
    } catch (error) {
      console.error('文件访问失败:', error)
      return null
    }
  }
  return null
})

// 读取PDF文件内容
ipcMain.handle('read-pdf-file', async (event: any, filePath: string) => {
  try {
    console.log('读取PDF文件:', filePath)
    const buffer = await fs.promises.readFile(filePath)
    return buffer
  } catch (error) {
    console.error('读取PDF文件失败:', error)
    throw error
  }
})

// 检查文件是否存在
ipcMain.handle('check-file-exists', async (event: any, filePath: string) => {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK)
    return true
  } catch {
    return false
  }
})

ipcMain.handle('get-app-version', () => {
  return app.getVersion()
}) 