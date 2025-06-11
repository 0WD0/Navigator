import React from 'react'
import { useNavigationStore } from '../store/navigation'

interface StatusBarProps {
  mode: 'normal' | 'insert' | 'command'
  commandBuffer: string
  keySequence?: string
  filePath?: string
}

export const StatusBar: React.FC<StatusBarProps> = ({ 
  mode, 
  commandBuffer, 
  keySequence = '',
  filePath 
}) => {
  const { currentPage, totalPages, currentView } = useNavigationStore()

  const getModeDisplay = () => {
    switch (mode) {
      case 'normal':
        return '-- NORMAL --'
      case 'insert':
        return '-- INSERT --'
      case 'command':
        return commandBuffer
      default:
        return '-- NORMAL --'
    }
  }

  const getViewDisplay = () => {
    switch (currentView) {
      case 'preview':
        return '预览'
      case 'outline':
        return '大纲'
      case 'text-only':
        return '文本'
      default:
        return '预览'
    }
  }

  const getFileName = () => {
    if (!filePath) return '未打开文件'
    const parts = filePath.split('/')
    return parts[parts.length - 1] || '未知文件'
  }

  return (
    <div className="h-6 bg-gray-800 text-white text-sm flex items-center justify-between px-2 font-mono">
      {/* 左侧：模式和按键序列 */}
      <div className="flex items-center space-x-4">
        <span className="text-green-400">{getModeDisplay()}</span>
        {keySequence && mode === 'normal' && (
          <span className="text-yellow-400 bg-gray-700 px-1 rounded">
            {keySequence}
          </span>
        )}
      </div>

      {/* 中间：文件信息 */}
      <div className="flex items-center space-x-2 text-gray-300">
        <span>{getFileName()}</span>
        {totalPages > 0 && (
          <>
            <span>|</span>
            <span>{getViewDisplay()}</span>
          </>
        )}
      </div>

      {/* 右侧：页面信息 */}
      <div className="flex items-center space-x-2">
        {totalPages > 0 ? (
          <span className="text-blue-400">
            {currentPage}/{totalPages}
          </span>
        ) : (
          <span className="text-gray-500">-/-</span>
        )}
      </div>
    </div>
  )
} 