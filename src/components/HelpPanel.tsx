import React from 'react'

interface HelpPanelProps {
  isVisible: boolean
  onClose: () => void
}

export const HelpPanel: React.FC<HelpPanelProps> = ({ isVisible, onClose }) => {
  if (!isVisible) return null

  const shortcuts = [
    { category: '基础导航', items: [
      { key: 'j', desc: '下一页' },
      { key: 'k', desc: '上一页' },
      { key: 'h', desc: '向左' },
      { key: 'l', desc: '向右' },
      { key: 'gg', desc: '第一页' },
      { key: 'G', desc: '最后一页' },
    ]},
    { category: '视图切换', items: [
      { key: '1', desc: '预览视图' },
      { key: '2', desc: '大纲视图' },
      { key: '3', desc: '纯文本视图' },
    ]},
    { category: '命令模式', items: [
      { key: ':', desc: '进入命令模式' },
      { key: ':q', desc: '退出应用' },
      { key: ':123', desc: '跳转到第123页' },
      { key: ':view outline', desc: '切换到大纲视图' },
    ]},
    { category: '其他', items: [
      { key: 'i', desc: '进入插入模式(批注)' },
      { key: 'Esc', desc: '返回普通模式' },
      { key: '?', desc: '显示/隐藏帮助' },
    ]},
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">键盘快捷键</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {shortcuts.map((category) => (
            <div key={category.category}>
              <h3 className="font-semibold mb-3 text-gray-800 border-b">
                {category.category}
              </h3>
              <div className="space-y-2">
                {category.items.map((item) => (
                  <div key={item.key} className="flex justify-between">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                      {item.key}
                    </code>
                    <span className="text-gray-600 ml-3">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t text-sm text-gray-500">
          <p>💡 提示: 这是一个vim-style的界面，所有操作都可以通过键盘完成</p>
        </div>
      </div>
    </div>
  )
} 