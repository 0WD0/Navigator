import React, { useState } from 'react'
import { PDFViewer } from './components/PDFViewer'
import { StatusBar } from './components/StatusBar'
import { HelpPanel } from './components/HelpPanel'
import { useKeyboard } from './hooks/useKeyboard'

function App() {
  const [filePath, setFilePath] = useState<string>('')
  const { 
    mode, 
    commandBuffer, 
    keySequence, 
    showHelp, 
    setShowHelp, 
    getHelpInfo 
  } = useKeyboard()

  const handleFileOpen = async () => {
    try {
      const selectedPath = await window.electronAPI.openPdfFile()
      if (selectedPath) {
        setFilePath(selectedPath)
      }
    } catch (error) {
      console.error('打开文件失败:', error)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* 主内容区域 */}
      <div className="flex-1 relative">
        <PDFViewer filePath={filePath} />
        
        {/* 文件打开按钮（当没有文件时显示） */}
        {!filePath && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                Navigator - 引用导向的知识管理系统
              </h2>
              <p className="text-gray-300 mb-6">
                按 Ctrl+O 打开 PDF 文件开始使用
              </p>
              <button
                onClick={handleFileOpen}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors"
              >
                选择 PDF 文件
              </button>
              <div className="mt-4 text-sm text-gray-400">
                按 ? 查看所有快捷键
              </div>
            </div>
          </div>
        )}

        {/* 帮助面板 */}
        {showHelp && (
          <HelpPanel 
            onClose={() => setShowHelp(false)}
            keymaps={getHelpInfo()}
          />
        )}
      </div>

      {/* 状态栏 */}
      <StatusBar 
        mode={mode} 
        commandBuffer={commandBuffer}
        keySequence={keySequence}
        filePath={filePath}
      />
    </div>
  )
}

export default App 