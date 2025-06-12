import React, { useState } from 'react';
import { useLayoutManager } from '@/hooks/useLayoutManager';
import { SimpleLayoutViewer } from './SimpleLayoutViewer';
import DocumentOutline from './DocumentOutline';
import { PDFViewerWithOverlay } from './PDFViewerWithOverlay';
import { PageInfo } from '@/types/pdf-analysis';

interface PDFViewerWithLayoutProps {
  className?: string;
  filePath?: string;
  mineruData?: PageInfo[] | null;
  onFileOpen?: () => void;
}

export const PDFViewerWithLayout: React.FC<PDFViewerWithLayoutProps> = ({ 
  className = '',
  filePath = '',
  mineruData,
  onFileOpen
}) => {
  const layoutManager = useLayoutManager();
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);

  // 处理侧边栏拖拽调整大小
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    const newWidth = Math.max(200, Math.min(600, e.clientX));
    setSidebarWidth(newWidth);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing]);

  return (
    <div className={`flex h-full bg-gray-100 ${className}`}>
      {/* 侧边栏 */}
      {(layoutManager.isLayoutViewVisible || layoutManager.isOutlineVisible) && (
        <>
          <div 
            className="bg-white border-r border-gray-200 flex flex-col"
            style={{ width: sidebarWidth }}
          >
            {/* 侧边栏标签页 */}
            <div className="flex border-b border-gray-200">
              {layoutManager.isLayoutViewVisible && (
                <button
                  onClick={() => {
                    if (!layoutManager.isLayoutViewVisible) {
                      layoutManager.toggleLayoutView();
                    }
                  }}
                  className={`px-4 py-2 text-sm font-medium border-b-2 ${
                    layoutManager.isLayoutViewVisible
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  布局视图
                </button>
              )}
              {layoutManager.isOutlineVisible && (
                <button
                  onClick={() => {
                    if (!layoutManager.isOutlineVisible) {
                      layoutManager.toggleOutline();
                    }
                  }}
                  className={`px-4 py-2 text-sm font-medium border-b-2 ${
                    layoutManager.isOutlineVisible
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  文档大纲
                </button>
              )}
            </div>

                         {/* 侧边栏内容 */}
             <div className="flex-1 overflow-hidden">
               {layoutManager.isLayoutViewVisible && (
                 <SimpleLayoutViewer 
                   modelData={layoutManager.files.modelData}
                   contentList={layoutManager.files.contentList}
                   selectedPage={layoutManager.selectedPage}
                   showLayoutBoxes={layoutManager.showLayoutBoxes}
                   showTextContent={layoutManager.showTextContent}
                   onPageChange={layoutManager.setSelectedPage}
                   onToggleLayoutBoxes={layoutManager.toggleLayoutBoxes}
                   onToggleTextContent={layoutManager.toggleTextContent}
                   className="h-full"
                 />
               )}
              {layoutManager.isOutlineVisible && layoutManager.analysis && (
                                 <DocumentOutline
                   outline={layoutManager.analysis.outline}
                   onNavigate={(pageIndex: number) => {
                     layoutManager.setSelectedPage(pageIndex);
                     // TODO: 同步到PDF查看器
                   }}
                   currentPage={layoutManager.selectedPage}
                   className="h-full"
                 />
              )}
            </div>
          </div>

          {/* 拖拽调整大小的分隔条 */}
          <div
            className="w-1 bg-gray-200 hover:bg-gray-300 cursor-col-resize"
            onMouseDown={handleMouseDown}
          />
        </>
      )}

      {/* 主要内容区域 */}
      <div className="flex-1 flex flex-col">
        {/* 工具栏 */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold text-gray-800">PDF 导航器</h1>
              
              {/* 快捷键提示 */}
              <div className="text-sm text-gray-500">
                <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">Ctrl+L</span>
                <span className="ml-1">加载布局文件</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* 布局控制按钮 */}
              <button
                onClick={layoutManager.toggleLayoutView}
                className={`px-3 py-1 text-sm rounded ${
                  layoutManager.isLayoutViewVisible
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                布局视图
              </button>
              
              <button
                onClick={layoutManager.toggleOutline}
                disabled={!layoutManager.analysis}
                className={`px-3 py-1 text-sm rounded ${
                  layoutManager.isOutlineVisible
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50'
                }`}
              >
                文档大纲
              </button>

              <button
                onClick={() => {
                  if (onFileOpen) {
                    onFileOpen()
                  }
                }}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                打开PDF
              </button>

              <button
                onClick={layoutManager.loadLayoutFiles}
                disabled={layoutManager.isLoading}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {layoutManager.isLoading ? '加载中...' : '加载布局'}
              </button>
            </div>
          </div>

          {/* 状态信息 */}
          {layoutManager.hasFiles && (
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
              <span>页面: {layoutManager.selectedPage + 1} / {layoutManager.totalPages}</span>
              {layoutManager.analysis && (
                <>
                  <span>大纲项目: {layoutManager.analysis.outline.length}</span>
                  <span>内容项目: {layoutManager.analysis.structuredContent.length}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* PDF 查看区域 */}
        <div className="flex-1 bg-gray-50 p-4">
          {!layoutManager.hasFiles ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">📄</div>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">
                  PDF 导航器 - 布局分析模式
                </h2>
                <p className="text-gray-500 mb-4">
                  {filePath ? 
                    "PDF已加载，请加载布局文件以查看分析结果" : 
                    "请先打开PDF文件，然后加载布局数据"
                  }
                </p>
                <div className="space-y-2">
                  {!filePath && (
                    <button
                      onClick={() => onFileOpen?.()}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 mr-2"
                    >
                      打开PDF文件
                    </button>
                  )}
                  <button
                    onClick={layoutManager.loadLayoutFiles}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    加载布局文件
                  </button>
                </div>
                <div className="mt-4 text-sm text-gray-400">
                  <div>快捷键: <kbd className="bg-gray-200 px-2 py-1 rounded text-xs">Ctrl+O</kbd> 打开PDF | <kbd className="bg-gray-200 px-2 py-1 rounded text-xs">Ctrl+L</kbd> 加载布局</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full bg-white rounded-lg shadow-sm border">
              {/* 集成PDF查看器并叠加布局框 */}
              {filePath ? (
                <PDFViewerWithOverlay 
                  filePath={filePath}
                  layoutData={layoutManager.files.modelData}
                  mineruData={mineruData || null}
                  selectedPage={layoutManager.selectedPage}
                  showLayoutBoxes={layoutManager.showLayoutBoxes}
                  showTextContent={layoutManager.showTextContent}
                  showImageRegions={true}
                  showTableRegions={true}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📄</div>
                    <div>请打开PDF文件以查看内容</div>
                    <div className="text-sm mt-1 text-gray-400">
                      使用 Ctrl+O 打开PDF文件
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 快捷键帮助浮层 */}
      <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-sm">
        <div className="font-medium mb-2">快捷键</div>
        <div className="space-y-1">
          <div><kbd className="bg-gray-700 px-1 rounded">Ctrl+L</kbd> 加载布局文件</div>
          <div><kbd className="bg-gray-700 px-1 rounded">Ctrl+O</kbd> 切换大纲</div>
          <div><kbd className="bg-gray-700 px-1 rounded">Ctrl+Shift+L</kbd> 切换布局视图</div>
        </div>
      </div>
    </div>
  );
};

export default PDFViewerWithLayout; 