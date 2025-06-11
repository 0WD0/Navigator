import React, { useState, useEffect } from 'react'
import { PDFViewer } from './components/PDFViewer'
import { StatusBar } from './components/StatusBar'
import { HelpPanel } from './components/HelpPanel'
import { useKeyboard } from './hooks/useKeyboard'
import { useNavigationStore } from './store/navigation'

export const App: React.FC = () => {
  const [showHelp, setShowHelp] = useState(false)
  const { filePath, setFilePath } = useNavigationStore()
  const { mode, commandBuffer } = useKeyboard()

  useEffect(() => {
    // 监听文件打开事件
    const handleOpenFile = async () => {
      if (window.electronAPI) {
        const path = await window.electronAPI.openPdfFile()
        if (path) {
          setFilePath(path)
        }
      }
    }

    // 添加全局快捷键
    const handleGlobalKeydown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'o') {
        event.preventDefault()
        handleOpenFile()
      } else if (event.key === '?' && mode === 'normal') {
        event.preventDefault()
        setShowHelp(!showHelp)
      }
    }

    document.addEventListener('keydown', handleGlobalKeydown)
    
    return () => {
      document.removeEventListener('keydown', handleGlobalKeydown)
    }
  }, [setFilePath, showHelp, mode])

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* 主内容区域 */}
      <div className="flex-1 flex">
        <PDFViewer filePath={filePath} />
      </div>

      {/* 状态栏 */}
      <StatusBar mode={mode} commandBuffer={commandBuffer} />

      {/* 帮助面板 */}
      <HelpPanel 
        isVisible={showHelp} 
        onClose={() => setShowHelp(false)} 
      />

      {/* 欢迎屏幕 */}
      {!filePath && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
          <div className="text-center max-w-md">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Navigator Demo
            </h1>
            <p className="text-gray-600 mb-6">
              引用导航器 - 以批注为核心的知识管理系统
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>按 <kbd className="bg-gray-200 px-2 py-1 rounded">Ctrl+O</kbd> 打开PDF文件</p>
              <p>按 <kbd className="bg-gray-200 px-2 py-1 rounded">?</kbd> 查看快捷键帮助</p>
              <p>使用 <kbd className="bg-gray-200 px-2 py-1 rounded">j/k</kbd> 导航页面</p>
            </div>
            <div className="mt-6 text-xs text-gray-400">
              vim-friendly 设计，所有操作都可以通过键盘完成
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 