# Electron 开发指南 - Navigator 项目

这是一份针对 Navigator 项目的 Electron 开发指南，适合第一次接触 Electron 的开发者。

## 📖 目录

1. [Electron 基础概念](#electron-基础概念)
2. [项目结构详解](#项目结构详解)
3. [开发环境设置](#开发环境设置)
4. [核心开发流程](#核心开发流程)
5. [调试技巧](#调试技巧)
6. [常见问题解决](#常见问题解决)
7. [最佳实践](#最佳实践)
8. [部署和分发](#部署和分发)

## 🎯 Electron 基础概念

### 什么是 Electron？

Electron 让您能够使用 Web 技术（HTML、CSS、JavaScript）来构建跨平台的桌面应用程序。它将 Chromium 浏览器引擎和 Node.js 运行时结合在一起。

### 核心架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron 应用架构                         │
├─────────────────────────────────────────────────────────────┤
│  主进程 (Main Process)                                      │
│  - 管理应用生命周期                                         │
│  - 创建和管理渲染进程                                       │
│  - 处理系统级操作 (文件、菜单等)                            │
│  - 文件: src/main/main.ts                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ├── IPC 通信
                              │
┌─────────────────────────────────────────────────────────────┐
│  渲染进程 (Renderer Process)                                │
│  - 运行 Web 页面                                           │
│  - 处理 UI 交互                                            │
│  - 文件: src/ (React 组件)                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ├── Preload 脚本
                              │
┌─────────────────────────────────────────────────────────────┐
│  Preload 脚本                                              │
│  - 在渲染进程中安全地暴露 Node.js API                       │
│  - 文件: src/main/preload.ts                              │
└─────────────────────────────────────────────────────────────┘
```

## 📁 项目结构详解

```
navigator/
├── src/                          # 源代码目录
│   ├── main/                     # Electron 主进程
│   │   ├── main.ts              # 主进程入口文件
│   │   └── preload.ts           # Preload 脚本
│   ├── components/               # React 组件
│   │   ├── PDFViewer.tsx        # PDF 查看器组件
│   │   ├── StatusBar.tsx        # 状态栏组件
│   │   └── HelpPanel.tsx        # 帮助面板组件
│   ├── hooks/                    # 自定义 React Hooks
│   │   └── useKeyboard.ts       # vim-style 键盘控制
│   ├── store/                    # 状态管理
│   │   └── navigation.ts        # 导航状态 (Zustand)
│   ├── types/                    # TypeScript 类型定义
│   │   └── index.ts             # 全局类型
│   ├── App.tsx                  # React 应用根组件
│   ├── main.tsx                 # React 应用入口
│   └── index.css                # 全局样式
├── dist/                         # Vite 构建输出 (Web 部分)
├── dist-electron/                # TypeScript 编译输出 (Electron 部分)
├── package.json                  # 项目配置和依赖
├── tsconfig.json                # TypeScript 配置 (渲染进程)
├── tsconfig.electron.json       # TypeScript 配置 (主进程)
├── vite.config.ts               # Vite 构建配置
└── index.html                   # HTML 入口文件
```

### 关键文件说明

#### 1. `src/main/main.ts` - 主进程

```typescript
// 主进程负责：
// - 创建和管理窗口
// - 处理应用生命周期事件
// - 提供系统 API (文件对话框、菜单等)
// - 处理 IPC 消息

const { app, BrowserWindow, dialog, ipcMain } = require('electron')

// 创建窗口
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // 关键！
      contextIsolation: true,     // 安全设置
      nodeIntegration: false      // 安全设置
    }
  })
}

// IPC 处理器 - 处理来自渲染进程的请求
ipcMain.handle('open-pdf-file', async () => {
  // 打开文件对话框
  const result = await dialog.showOpenDialog(/* ... */)
  return result.filePaths[0]
})
```

#### 2. `src/main/preload.ts` - Preload 脚本

```typescript
// Preload 脚本在渲染进程启动前运行
// 它是主进程和渲染进程之间的安全桥梁

const { contextBridge, ipcRenderer } = require('electron')

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  openPdfFile: () => ipcRenderer.invoke('open-pdf-file'),
  readPdfFile: (filePath: string) => ipcRenderer.invoke('read-pdf-file', filePath)
})
```

#### 3. `src/App.tsx` - React 应用

```typescript
// 渲染进程中的 React 应用
// 可以使用通过 preload 暴露的 electronAPI

export const App: React.FC = () => {
  const handleOpenFile = async () => {
    // 调用主进程的文件对话框
    const filePath = await window.electronAPI.openPdfFile()
    if (filePath) {
      setFilePath(filePath)
    }
  }
  
  return <div>...</div>
}
```

## ⚙️ 开发环境设置

### 安装依赖

```bash
npm install
```

### 开发脚本说明

```bash
# 启动完整开发环境 (推荐)
npm run dev
# 这会并行运行:
# - Vite 开发服务器 (端口 3000)
# - Electron 应用

# 单独启动 Vite 开发服务器
npm run dev:vite

# 单独编译并启动 Electron
npm run dev:electron

# 编译 Electron 主进程
npm run build:electron

# 构建生产版本
npm run build
```

### 开发环境检查

```bash
# 检查 Vite 服务器是否运行
curl http://localhost:3000

# 检查进程状态
ps aux | grep -E "(vite|electron)" | grep -v grep
```

## 🔄 核心开发流程

### 1. 修改 UI (渲染进程)

1. 编辑 `src/components/` 中的 React 组件
2. Vite 会自动热重载，无需重启
3. 在浏览器开发者工具中调试

### 2. 修改主进程逻辑

1. 编辑 `src/main/main.ts` 或 `src/main/preload.ts`
2. 运行 `npm run build:electron` 重新编译
3. 重启 Electron 应用 (Ctrl+R 或重新运行 `npm run dev`)

### 3. 添加新的 IPC 通信

#### 步骤 1: 在主进程中添加处理器

```typescript
// src/main/main.ts
ipcMain.handle('my-new-function', async (event, arg1, arg2) => {
  // 处理逻辑
  return result
})
```

#### 步骤 2: 在 preload 中暴露 API

```typescript
// src/main/preload.ts
contextBridge.exposeInMainWorld('electronAPI', {
  // 现有的 API...
  myNewFunction: (arg1, arg2) => ipcRenderer.invoke('my-new-function', arg1, arg2)
})
```

#### 步骤 3: 更新类型定义

```typescript
// src/types/index.ts
declare global {
  interface Window {
    electronAPI: {
      // 现有的方法...
      myNewFunction: (arg1: string, arg2: number) => Promise<any>
    }
  }
}
```

#### 步骤 4: 在渲染进程中使用

```typescript
// src/components/MyComponent.tsx
const result = await window.electronAPI.myNewFunction('hello', 42)
```

## 🐛 调试技巧

### 1. 渲染进程调试

```javascript
// 在任何 React 组件中
console.log('渲染进程日志:', data)

// 在 Chrome DevTools 中查看:
// - 右键 → 检查元素
// - 或者主菜单 → View → Toggle Developer Tools
```

### 2. 主进程调试

```javascript
// src/main/main.ts
console.log('主进程日志:', data)

// 日志会出现在启动应用的终端中
```

### 3. IPC 通信调试

```javascript
// 在 preload.ts 中
console.log('发送 IPC 消息:', methodName, args)

// 在 main.ts 中
ipcMain.handle('method-name', async (event, ...args) => {
  console.log('收到 IPC 消息:', args)
  // ...
})
```

### 4. 常用调试命令

```bash
# 查看应用输出日志
npm run dev 2>&1 | tee debug.log

# 启动时显示详细错误信息
DEBUG=* npm run dev

# 检查端口占用
lsof -i :3000
```

## ❗ 常见问题解决

### 1. "ERR_FILE_NOT_FOUND" 错误

**原因**: Electron 找不到 HTML 文件

**解决方案**:
```bash
# 确保 Vite 开发服务器在运行
npm run dev:vite

# 检查端口 3000 是否可访问
curl http://localhost:3000
```

### 2. "require() of ES module not supported" 错误

**原因**: ES 模块和 CommonJS 混用

**解决方案**:
```typescript
// 在 main.ts 中使用 CommonJS 语法
const { app } = require('electron') // ✅
// import { app } from 'electron'   // ❌
```

### 3. TypeScript 编译错误

**解决方案**:
```bash
# 清理并重新编译
rm -rf dist-electron
npm run build:electron
```

### 4. PDF 加载失败

**常见原因和解决方案**:

```typescript
// 检查文件路径
console.log('文件路径:', filePath)

// 检查文件是否存在
const exists = await window.electronAPI.checkFileExists(filePath)
console.log('文件存在:', exists)

// 检查文件大小
const buffer = await window.electronAPI.readPdfFile(filePath)
console.log('文件大小:', buffer.byteLength, 'bytes')
```

### 5. 热重载不工作

**解决方案**:
```bash
# 重启开发服务器
pkill -f "vite|electron"
npm run dev
```

## 🏆 最佳实践

### 1. 安全性

```typescript
// ✅ 正确的安全配置
new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,      // 禁用 Node.js 集成
    contextIsolation: true,      // 启用上下文隔离
    preload: path.join(__dirname, 'preload.js')
  }
})

// ❌ 不安全的配置
new BrowserWindow({
  webPreferences: {
    nodeIntegration: true,       // 危险！
    contextIsolation: false      // 危险！
  }
})
```

### 2. IPC 通信

```typescript
// ✅ 使用 invoke/handle 模式 (推荐)
// Main process
ipcMain.handle('get-data', async () => {
  return await fetchData()
})

// Renderer process
const data = await window.electronAPI.getData()

// ❌ 避免使用 send/on 模式 (复杂)
```

### 3. 错误处理

```typescript
// ✅ 在主进程中处理错误
ipcMain.handle('risky-operation', async (event, arg) => {
  try {
    return await riskyOperation(arg)
  } catch (error) {
    console.error('操作失败:', error)
    throw error  // 传递给渲染进程
  }
})

// ✅ 在渲染进程中处理错误
try {
  const result = await window.electronAPI.riskyOperation(arg)
} catch (error) {
  setError(`操作失败: ${error.message}`)
}
```

### 4. 文件结构

```
src/
├── main/              # 主进程相关文件
├── renderer/          # 渲染进程相关文件 (如果项目较大)
├── shared/            # 共享的类型和工具
└── assets/            # 静态资源
```

### 5. 类型安全

```typescript
// 定义清晰的 IPC API 类型
interface ElectronAPI {
  openPdfFile(): Promise<string | null>
  readPdfFile(filePath: string): Promise<ArrayBuffer>
  checkFileExists(filePath: string): Promise<boolean>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
```

## 📦 部署和分发

### 1. 构建生产版本

```bash
npm run build
```

### 2. 打包桌面应用

```bash
# 使用 electron-builder (已配置)
npx electron-builder

# 或者添加到 package.json scripts
"dist": "electron-builder"
```

### 3. 平台特定构建

```bash
# Windows
npx electron-builder --win

# macOS
npx electron-builder --mac

# Linux
npx electron-builder --linux
```

### 4. 配置 electron-builder

```json
// package.json
{
  "build": {
    "appId": "com.navigator.demo",
    "productName": "Navigator Demo",
    "directories": {
      "output": "dist"
    },
    "files": [
      "dist-electron/**/*",
      "dist/**/*"
    ],
    "mac": {
      "category": "public.app-category.productivity"
    },
    "win": {
      "target": "nsis"
    },
    "linux": {
      "target": "AppImage"
    }
  }
}
```

## 🚀 下一步学习

1. **Electron 官方文档**: https://www.electronjs.org/docs
2. **进阶主题**:
   - 自动更新 (electron-updater)
   - 原生菜单系统
   - 系统托盘
   - 文件关联
   - 深度链接

3. **性能优化**:
   - 懒加载
   - 进程间通信优化
   - 内存管理

4. **安全性**:
   - 内容安全策略 (CSP)
   - 代码签名
   - 权限管理

## 💡 实用技巧

### 快速开发循环

```bash
# 监控文件变化并自动重新编译主进程
npm install --save-dev nodemon
npx nodemon --watch src/main --ext ts --exec "npm run build:electron"
```

### 调试配置

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Electron Main",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "windows": {
        "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron.cmd"
      },
      "args": ["."],
      "outputCapture": "std"
    }
  ]
}
```

这份指南涵盖了 Navigator 项目中 Electron 开发的核心概念和实践。建议您从简单的修改开始，逐步熟悉 Electron 的开发模式。有任何具体问题都可以随时询问！ 