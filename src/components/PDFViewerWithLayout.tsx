import React, { useState, useCallback } from 'react';
import { PDFViewerWithOverlay } from './PDFViewerWithOverlay';
import { MineruLayoutViewer } from './MineruLayoutViewer';
import { DocumentOutlineComponent as DocumentOutline } from './DocumentOutline';
import { useLayoutManager } from '@/hooks/useLayoutManager';

interface PDFViewerWithLayoutProps {
  filePath?: string;
  onFileOpen?: () => void;
  className?: string;
}

export const PDFViewerWithLayout: React.FC<PDFViewerWithLayoutProps> = ({
  filePath,
  onFileOpen,
  className = ''
}) => {
  const layoutManager = useLayoutManager();
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [activeTab, setActiveTab] = useState<'layout' | 'outline'>('layout');

  // 拖拽调整侧边栏宽度
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = startWidth + (e.clientX - startX);
      setSidebarWidth(Math.max(250, Math.min(600, newWidth)));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [sidebarWidth]);

  // 确定是否显示侧边栏
  const showSidebar = layoutManager.hasFiles && (layoutManager.isLayoutViewVisible || layoutManager.isOutlineVisible);

  return (
    <div className={`flex h-full bg-gray-50 ${className}`}>
      {/* 侧边栏 */}
      {showSidebar && (
        <>
          <div 
            className="bg-white border-r border-gray-200 flex flex-col shadow-sm"
            style={{ width: sidebarWidth }}
          >
            {/* 侧边栏标签页 */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              {layoutManager.isLayoutViewVisible && (
                <button
                  onClick={() => setActiveTab('layout')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'layout'
                      ? 'bg-white text-blue-600 border-b-2 border-blue-500'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  📊 布局分析
                </button>
              )}
              {layoutManager.isOutlineVisible && layoutManager.analysis && (
                <button
                  onClick={() => setActiveTab('outline')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'outline'
                      ? 'bg-white text-blue-600 border-b-2 border-blue-500'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  📋 文档大纲
                </button>
              )}
            </div>

            {/* 侧边栏内容 */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'layout' && layoutManager.isLayoutViewVisible && (
                <MineruLayoutViewer 
                  mineruData={layoutManager.files.mineruData}
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
              {activeTab === 'outline' && layoutManager.isOutlineVisible && layoutManager.analysis && (
                <DocumentOutline
                  outline={layoutManager.analysis.outline}
                  onNavigate={(pageIndex: number) => {
                    layoutManager.setSelectedPage(pageIndex);
                  }}
                  currentPage={layoutManager.selectedPage}
                  className="h-full"
                />
              )}
            </div>
          </div>

          {/* 拖拽调整大小的分隔条 */}
          <div
            className="w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors"
            onMouseDown={handleMouseDown}
          />
        </>
      )}

      {/* 主要内容区域 */}
      <div className="flex-1 flex flex-col">
        {/* 简化的工具栏 */}
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            {/* 左侧：标题和状态 */}
            <div className="flex items-center gap-6">
              <h1 className="text-lg font-semibold text-gray-800">Navigator</h1>
              
              {layoutManager.hasFiles && (
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>第 {layoutManager.selectedPage + 1} 页 / 共 {layoutManager.totalPages} 页</span>
                  {layoutManager.analysis && (
                    <span>• {layoutManager.analysis.outline.length} 个大纲项目</span>
                  )}
                </div>
              )}
            </div>

            {/* 右侧：主要操作按钮 */}
            <div className="flex items-center gap-3">
              {/* 视图切换 */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={layoutManager.toggleLayoutView}
                  className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                    layoutManager.isLayoutViewVisible
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  布局
                </button>
                
                <button
                  onClick={layoutManager.toggleOutline}
                  disabled={!layoutManager.analysis}
                  className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                    layoutManager.isOutlineVisible
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  大纲
                </button>
              </div>

              {/* 主要操作 */}
              {!filePath && (
                <button
                  onClick={onFileOpen}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  📄 打开PDF
                </button>
              )}
              
              <button
                onClick={layoutManager.loadMineruFile}
                disabled={layoutManager.isLoading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                {layoutManager.isLoading ? '⏳ 加载中...' : '📊 加载 MinerU'}
              </button>
            </div>
          </div>
        </div>

        {/* PDF 查看区域 */}
        <div className="flex-1 p-4">
          {!layoutManager.hasFiles && !filePath ? (
            // 欢迎界面
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="text-6xl mb-6">📚</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                  欢迎使用 Navigator
                </h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  智能PDF文档分析工具，支持布局识别、大纲提取和结构化导航
                </p>
                
                <div className="space-y-3">
                  {!filePath && (
                    <button
                      onClick={onFileOpen}
                      className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      📄 打开PDF文件
                    </button>
                  )}
                  <button
                    onClick={layoutManager.loadMineruFile}
                    className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    📊 加载 MinerU 数据
                  </button>
                </div>
                
                <div className="mt-8 text-sm text-gray-500">
                  <div className="mb-2">快捷键提示：</div>
                  <div className="flex justify-center gap-4">
                    <span><kbd className="bg-gray-200 px-2 py-1 rounded text-xs">Ctrl+O</kbd> 打开PDF</span>
                    <span><kbd className="bg-gray-200 px-2 py-1 rounded text-xs">Ctrl+L</kbd> 加载数据</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // PDF内容区域
            <div className="h-full bg-white rounded-lg shadow-sm border overflow-hidden">
              {filePath ? (
                <PDFViewerWithOverlay 
                  filePath={filePath}
                  layoutData={null}
                  mineruData={layoutManager.files.mineruData || null}
                  selectedPage={layoutManager.selectedPage}
                  showLayoutBoxes={layoutManager.showLayoutBoxes}
                  showTextContent={layoutManager.showTextContent}
                  showImageRegions={true}
                  showTableRegions={true}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📄</div>
                    <div className="text-lg font-medium mb-2">数据已加载</div>
                    <div className="text-sm">请打开PDF文件以查看叠加效果</div>
                    <button
                      onClick={onFileOpen}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      打开PDF文件
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 错误提示 */}
      {layoutManager.error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <div>
              <div className="font-medium">加载失败</div>
              <div className="text-sm opacity-90">{layoutManager.error}</div>
            </div>
            <button
              onClick={() => layoutManager.clearFiles()}
              className="ml-2 text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFViewerWithLayout; 