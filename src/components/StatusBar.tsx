import React from 'react'
import { useNavigationStore } from '../store/navigation'

interface StatusBarProps {
  mode: 'normal' | 'insert' | 'command'
  commandBuffer: string
}

export const StatusBar: React.FC<StatusBarProps> = ({ mode, commandBuffer }) => {
  const { currentPage, totalPages, currentView, filePath } = useNavigationStore()

  const getModeDisplay = () => {
    switch (mode) {
      case 'normal':
        return '-- NORMAL --'
      case 'insert':
        return '-- INSERT --'
      case 'command':
        return commandBuffer
      default:
        return ''
    }
  }

  const getViewDisplay = () => {
    switch (currentView) {
      case 'preview':
        return '预览'
      case 'outline':
        return '大纲'
      case 'text-only':
        return '纯文本'
      default:
        return '未知'
    }
  }

  return (
    <div className="bg-gray-800 text-white px-4 py-2 flex justify-between items-center text-sm">
      <div className="flex items-center space-x-4">
        <span className="font-mono">{getModeDisplay()}</span>
        {filePath && (
          <span className="text-gray-300">
            {filePath.split('/').pop() || filePath}
          </span>
        )}
      </div>
      
      <div className="flex items-center space-x-4">
        <span>视图: {getViewDisplay()}</span>
        {totalPages > 0 && (
          <span>
            页面: {currentPage} / {totalPages}
          </span>
        )}
      </div>
    </div>
  )
} 