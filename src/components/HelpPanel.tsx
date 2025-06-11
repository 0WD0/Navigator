import React from 'react'

interface HelpPanelProps {
  onClose: () => void
  keymaps: Array<{ keys: string; description: string }>
}

export const HelpPanel: React.FC<HelpPanelProps> = ({ onClose, keymaps }) => {
  // 按类别组织快捷键
  const categorizedKeymaps = keymaps.reduce((acc, keymap) => {
    let category = '其他'
    
    if (keymap.keys.match(/^[hjklgG1-3]$/)) {
      category = '基础导航'
    } else if (keymap.keys.startsWith('n')) {
      category = '批注管理'
    } else if (keymap.keys.startsWith('s')) {
      category = '搜索功能'
    } else if (keymap.keys.match(/^[:i?]$/)) {
      category = '模式切换'
    }
    
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(keymap)
    
    return acc
  }, {} as Record<string, Array<{ keys: string; description: string }>>)

  const formatKeys = (keys: string) => {
    // 美化按键显示
    return keys.split('').map((key, idx) => (
      <kbd key={idx} className="bg-gray-200 text-gray-800 px-1 py-0.5 rounded text-xs mx-0.5">
        {key}
      </kbd>
    ))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[80vh] overflow-hidden">
        {/* 标题栏 */}
        <div className="bg-gray-800 text-white px-6 py-3 flex justify-between items-center">
          <h2 className="text-lg font-semibold">快捷键参考</h2>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-60px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(categorizedKeymaps).map(([category, shortcuts]) => (
              <div key={category} className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-1">
                  {category}
                </h3>
                <div className="space-y-2">
                  {shortcuts.map((shortcut, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center">
                        {formatKeys(shortcut.keys)}
                      </div>
                      <span className="text-sm text-gray-600 ml-4">
                        {shortcut.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* 额外说明 */}
            <div className="md:col-span-2 mt-6 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">使用说明</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• <strong>多键序列</strong>：某些操作需要连续按键，如 <kbd className="bg-gray-200 px-1 rounded">n</kbd><kbd className="bg-gray-200 px-1 rounded">c</kbd> 表示创建批注</p>
                <p>• <strong>超时机制</strong>：如果1秒内没有后续按键，会执行当前可用的动作或重置</p>
                <p>• <strong>模式切换</strong>：不同模式下快捷键行为不同，注意状态栏显示的当前模式</p>
                <p>• <strong>命令模式</strong>：按 <kbd className="bg-gray-200 px-1 rounded">:</kbd> 进入命令模式，可以输入页码跳转等</p>
                <p>• <strong>系统快捷键</strong>：<kbd className="bg-gray-200 px-1 rounded">Ctrl+O</kbd> 打开文件（系统级别）</p>
              </div>
            </div>
          </div>
        </div>

        {/* 底部 */}
        <div className="bg-gray-50 px-6 py-3 text-center">
          <p className="text-sm text-gray-500">
            按 <kbd className="bg-gray-200 px-1 rounded">?</kbd> 或 <kbd className="bg-gray-200 px-1 rounded">Esc</kbd> 关闭帮助
          </p>
        </div>
      </div>
    </div>
  )
} 