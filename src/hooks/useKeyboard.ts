import { useEffect, useCallback, useState } from 'react'
import { useNavigationStore } from '../store/navigation'

type VimMode = 'normal' | 'insert' | 'command'

export const useKeyboard = () => {
  const [mode, setMode] = useState<VimMode>('normal')
  const [commandBuffer, setCommandBuffer] = useState('')
  
  const {
    nextPage,
    previousPage,
    jumpToPage,
    setCurrentView,
    currentPage,
    totalPages
  } = useNavigationStore()

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // 阻止默认行为
    if (mode === 'normal') {
      event.preventDefault()
    }

    switch (mode) {
      case 'normal':
        handleNormalMode(event)
        break
      case 'command':
        handleCommandMode(event)
        break
      case 'insert':
        handleInsertMode(event)
        break
    }
  }, [mode, commandBuffer, currentPage, totalPages])

  const handleNormalMode = (event: KeyboardEvent) => {
    switch (event.key.toLowerCase()) {
      // 基础导航
      case 'j':
        nextPage()
        break
      case 'k':
        previousPage()
        break
      case 'h':
        // 向左导航 (暂时映射到上一页)
        previousPage()
        break
      case 'l':
        // 向右导航 (暂时映射到下一页)
        nextPage()
        break
      
      // 跳转
      case 'g':
        if (event.shiftKey) {
          // G - 跳转到最后一页
          jumpToPage(totalPages)
        } else {
          // TODO: 处理 gg (跳转到第一页)
          jumpToPage(1)
        }
        break
      
      // 视图切换
      case '1':
        setCurrentView('preview')
        break
      case '2':
        setCurrentView('outline')
        break
      case '3':
        setCurrentView('text-only')
        break
      
      // 进入命令模式
      case ':':
        setMode('command')
        setCommandBuffer(':')
        break
      
      // 进入插入模式 (用于批注)
      case 'i':
        setMode('insert')
        break
        
      case 'escape':
        setMode('normal')
        setCommandBuffer('')
        break
    }
  }

  const handleCommandMode = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      executeCommand(commandBuffer)
      setMode('normal')
      setCommandBuffer('')
    } else if (event.key === 'Escape') {
      setMode('normal')
      setCommandBuffer('')
    } else if (event.key === 'Backspace') {
      setCommandBuffer(prev => prev.slice(0, -1))
      if (commandBuffer.length <= 1) {
        setMode('normal')
        setCommandBuffer('')
      }
    } else if (event.key.length === 1) {
      setCommandBuffer(prev => prev + event.key)
    }
  }

  const handleInsertMode = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setMode('normal')
    }
    // 在插入模式下允许正常的文本输入
  }

  const executeCommand = (command: string) => {
    const cmd = command.slice(1) // 去掉开头的 ':'
    
    // 解析命令
    if (cmd.match(/^\d+$/)) {
      // 纯数字 - 跳转到页面
      const pageNum = parseInt(cmd)
      jumpToPage(pageNum)
    } else if (cmd === 'q') {
      // 退出 (在Electron中关闭窗口)
      window.close?.()
    } else if (cmd.startsWith('view ')) {
      // 切换视图
      const viewType = cmd.split(' ')[1]
      if (['preview', 'outline', 'text-only'].includes(viewType)) {
        setCurrentView(viewType as any)
      }
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  return {
    mode,
    commandBuffer,
    setMode
  }
} 