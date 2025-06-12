import { useState } from 'react'
import { PDFViewer } from './components/PDFViewer'
import { PDFViewerWithLayout } from './components/PDFViewerWithLayout'
import { StatusBar } from './components/StatusBar'
import { HelpPanel } from './components/HelpPanel'
import { useKeyboard } from './hooks/useKeyboard'
import { PageInfo } from './types/pdf-analysis'

function App() {
  const [filePath, setFilePath] = useState<string>('')
  const [showLayoutViewer, setShowLayoutViewer] = useState<boolean>(false)
  const [mineruData, setMineruData] = useState<PageInfo[] | null>(null)
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

  const handleMineruDataLoad = async () => {
    try {
      // 使用Electron的文件对话框选择MinerU数据文件
      const selectedPath = await window.electronAPI.openFileDialog({
        title: '选择MinerU数据文件',
        filters: [
          { name: 'MinerU数据文件', extensions: ['json'] },
          { name: '所有文件', extensions: ['*'] }
        ],
        properties: ['openFile']
      });

      if (!selectedPath) {
        console.log('用户取消了文件选择')
        return
      }

      console.log('选择的文件:', selectedPath)

      // 读取文件内容
      const fileContent = await window.electronAPI.readFileAsText(selectedPath)
      
      if (!fileContent) {
        alert('无法读取文件内容')
        return
      }

      // 解析JSON数据
      const data = JSON.parse(fileContent)
      
      // 检查是否是MinerU格式 (有pdf_info字段)
      if (data.pdf_info && Array.isArray(data.pdf_info)) {
        setMineruData(data.pdf_info)
        console.log('已加载MinerU数据:', data.pdf_info.length, '页')
        alert(`已成功加载MinerU数据\n文件: ${selectedPath.split('/').pop()}\n页数: ${data.pdf_info.length}`)
      } else {
        console.error('不是有效的MinerU数据格式')
        alert('所选文件不是有效的MinerU格式\n请选择包含pdf_info字段的*_middle.json文件')
      }
    } catch (error) {
      console.error('加载MinerU数据失败:', error)
      if (error instanceof SyntaxError) {
        alert('文件格式错误：无法解析JSON文件\n请确保选择的是有效的JSON文件')
      } else {
        alert('加载MinerU数据失败: ' + error)
      }
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* 工具栏 */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-white">Navigator</h1>
            <div className="text-sm text-gray-400">
              引用导向的知识管理系统
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLayoutViewer(!showLayoutViewer)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                showLayoutViewer
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {showLayoutViewer ? '文档视图' : '布局视图'}
            </button>
            <button
              onClick={handleMineruDataLoad}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                mineruData
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              MinerU数据
            </button>
            <button
              onClick={handleFileOpen}
              className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              打开文件
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 relative">
        {showLayoutViewer ? (
          <PDFViewerWithLayout 
            filePath={filePath} 
            mineruData={mineruData}
            onFileOpen={handleFileOpen}
          />
        ) : (
          <PDFViewer filePath={filePath} />
        )}
        
        {/* 文件打开按钮（当没有文件且在文档视图时显示） */}
        {!filePath && !showLayoutViewer && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">
                PDF 文档查看器
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
                按 ? 查看所有快捷键 | 点击右上角 "布局视图" 体验高级功能
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
