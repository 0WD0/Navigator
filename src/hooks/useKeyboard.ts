import { useEffect, useCallback, useState } from 'react'
import { useNavigationStore } from '../store/navigation'
import { keySequenceStateMachine, KeyAction } from '../utils/keymap'

type VimMode = 'normal' | 'insert' | 'command'

export const useKeyboard = () => {
  const [mode, setMode] = useState<VimMode>('normal')
  const [commandBuffer, setCommandBuffer] = useState('')
  const [keySequence, setKeySequence] = useState('')
  const [showHelp, setShowHelp] = useState(false)
  
  const {
    nextPage,
    previousPage,
    jumpToPage,
    setCurrentView,
    currentPage,
    totalPages
  } = useNavigationStore()

  // 设置动作执行器
  useEffect(() => {
    keySequenceStateMachine.setActionExecutor(executeAction)
  }, [])

  // 执行快捷键动作
  const executeAction = useCallback((action: KeyAction) => {
    console.log('执行动作:', action)
    
    switch (action.action) {
      // 导航动作
      case 'navigation.nextPage':
        nextPage()
        break
      case 'navigation.previousPage':
        previousPage()
        break
      case 'navigation.left':
        previousPage() // 临时映射到上一页
        break
      case 'navigation.right':
        nextPage() // 临时映射到下一页
        break
      case 'navigation.firstPage':
        jumpToPage(1)
        break
      case 'navigation.lastPage':
        jumpToPage(totalPages)
        break
      
      // 视图切换
      case 'view.preview':
        setCurrentView('preview')
        break
      case 'view.outline':
        setCurrentView('outline')
        break
      case 'view.textOnly':
        setCurrentView('text-only')
        break
      
      // 批注相关 (占位符实现)
      case 'annotation.create':
        console.log('创建批注 (功能开发中)')
        // TODO: 实现批注创建功能
        break
      case 'annotation.edit':
        console.log('编辑批注 (功能开发中)')
        // TODO: 实现批注编辑功能
        break
      case 'annotation.delete':
        console.log('删除批注 (功能开发中)')
        // TODO: 实现批注删除功能
        break
      case 'annotation.list':
        console.log('列出批注 (功能开发中)')
        // TODO: 实现批注列表功能
        break
      
      // 搜索相关 (占位符实现)
      case 'search.forward':
        console.log('向前搜索 (功能开发中)')
        // TODO: 实现搜索功能
        break
      case 'search.backward':
        console.log('向后搜索 (功能开发中)')
        // TODO: 实现搜索功能
        break
      
      // 模式切换
      case 'mode.command':
        setMode('command')
        setCommandBuffer(':')
        break
      case 'mode.insert':
        setMode('insert')
        break
      
      // 帮助系统
      case 'help.toggle':
        setShowHelp((prev: boolean) => !prev)
        break
      
      default:
        console.warn('未知动作:', action.action)
    }
  }, [nextPage, previousPage, jumpToPage, setCurrentView, totalPages])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // 根据模式处理按键
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
  }, [mode, commandBuffer])

  const handleNormalMode = (event: KeyboardEvent) => {
    // 特殊键处理
    if (event.key === 'Escape') {
      keySequenceStateMachine.reset()
      setKeySequence('')
      setMode('normal')
      return
    }

    // 阻止默认行为（除了一些特殊键）
    if (!['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].includes(event.key)) {
      event.preventDefault()
    }

    // 处理 Ctrl 键组合
    if (event.ctrlKey) {
      if (event.key === 'o' || event.key === 'O') {
        // Ctrl+O 打开文件
        window.electronAPI?.openPdfFile?.()
        return
      }
      // 其他 Ctrl 组合键不处理，让默认行为执行
      return
    }

    // 获取按键字符
    let key = event.key
    
    // 处理特殊键映射
    if (key === 'Shift') return // 忽略单独的 Shift 键
    
    // 处理大写字母（Shift + 字母）
    if (event.shiftKey && key.length === 1 && key.match(/[a-z]/)) {
      key = key.toUpperCase()
    }

    // 使用状态机处理按键
    const result = keySequenceStateMachine.processKey(key)
    
    // 更新显示的按键序列
    setKeySequence(keySequenceStateMachine.getCurrentSequence())
    
    // 如果有立即动作，执行它
    if (result.action) {
      executeAction(result.action)
      setKeySequence('') // 清空显示
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
      setCommandBuffer((prev: string) => prev.slice(0, -1))
      if (commandBuffer.length <= 1) {
        setMode('normal')
        setCommandBuffer('')
      }
    } else if (event.key.length === 1) {
      setCommandBuffer((prev: string) => prev + event.key)
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

  // 获取帮助信息
  const getHelpInfo = () => {
    return keySequenceStateMachine.getAllKeymaps()
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  // 组件卸载时重置状态机
  useEffect(() => {
    return () => {
      keySequenceStateMachine.reset()
    }
  }, [])

  return {
    mode,
    commandBuffer,
    keySequence,
    showHelp,
    setMode,
    setShowHelp,
    getHelpInfo
  }
} 