import React, { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { useNavigationStore } from '../store/navigation'

// 设置PDF.js worker - 使用CDN版本作为后备
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`
}

interface PDFViewerProps {
  filePath?: string
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ filePath }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { currentPage, setTotalPages, setCurrentPage } = useNavigationStore()

  useEffect(() => {
    if (filePath) {
      loadPDF(filePath)
    }
  }, [filePath])

  useEffect(() => {
    if (pdfDoc && canvasRef.current) {
      renderPage(currentPage)
    }
  }, [pdfDoc, currentPage])

  const loadPDF = async (path: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('尝试加载PDF:', path)
      
      // 首先检查文件是否存在
      const fileExists = await window.electronAPI.checkFileExists(path)
      if (!fileExists) {
        throw new Error('文件不存在或无法访问')
      }

      // 读取文件内容
      const arrayBuffer = await window.electronAPI.readPdfFile(path)
      console.log('文件读取成功，大小:', arrayBuffer.byteLength, 'bytes')
      
      // 配置PDF加载选项
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        useSystemFonts: true,
        isEvalSupported: false,
        disableAutoFetch: false,
        disableStream: false,
      })

      const pdf = await loadingTask.promise
      setPdfDoc(pdf)
      setTotalPages(pdf.numPages)
      setCurrentPage(1)
      console.log(`PDF加载成功，共 ${pdf.numPages} 页`)
    } catch (err: any) {
      console.error('PDF加载详细错误:', err)
      let errorMessage = '未知错误'
      
      if (err.name === 'InvalidPDFException') {
        errorMessage = 'PDF文件格式无效或已损坏'
      } else if (err.name === 'MissingPDFException') {
        errorMessage = '找不到PDF文件'
      } else if (err.name === 'UnexpectedResponseException') {
        errorMessage = '无法读取PDF文件'
      } else if (err.name === 'PasswordException') {
        errorMessage = 'PDF文件受密码保护，暂不支持'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(`加载PDF失败: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const renderPage = async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current) return

    try {
      const page = await pdfDoc.getPage(pageNum)
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')!

      // 获取容器尺寸
      const container = canvas.parentElement!
      const containerWidth = container.clientWidth - 32 // 减去padding

      // 计算合适的缩放比例
      const viewport = page.getViewport({ scale: 1 })
      const scale = Math.min(containerWidth / viewport.width, 2.0) // 最大2倍缩放
      const scaledViewport = page.getViewport({ scale })

      canvas.height = scaledViewport.height
      canvas.width = scaledViewport.width

      // 渲染页面
      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport,
      }

      await page.render(renderContext).promise
      console.log(`页面 ${pageNum} 渲染完成`)
    } catch (err) {
      setError(`渲染页面失败: ${err}`)
      console.error('页面渲染错误:', err)
    }
  }

  const handleRetry = () => {
    setError(null)
    if (filePath) {
      loadPDF(filePath)
    }
  }

  if (!filePath) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">没有打开的PDF文件</p>
          <p className="text-gray-400 text-sm">
            使用 <kbd className="bg-gray-200 px-2 py-1 rounded">Ctrl+O</kbd> 打开PDF文件
          </p>
          <p className="text-gray-400 text-xs mt-2">
            支持标准PDF格式文件
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载PDF...</p>
          <p className="text-gray-400 text-sm mt-2">{filePath?.split('/').pop()}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <p className="text-red-600 text-lg mb-2">🚫 加载失败</p>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <div className="bg-gray-100 p-3 rounded text-xs text-left mb-4">
            <p className="font-semibold mb-1">💡 可能的解决方案：</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>确保PDF文件没有损坏</li>
              <li>尝试用其他PDF查看器打开验证</li>
              <li>检查文件是否受密码保护</li>
              <li>尝试选择其他PDF文件</li>
            </ul>
          </div>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-100 p-4">
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          className="border border-gray-300 shadow-lg bg-white pdf-viewer rounded"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>
    </div>
  )
} 