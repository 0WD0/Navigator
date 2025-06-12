import React, { useState, useRef } from 'react';
import { DocumentModelData, DocumentMiddleData, DocumentContentList, LAYOUT_CATEGORIES } from '@/types/document.types';
import { useDocumentParser } from '@/hooks/useDocumentParser';

interface LayoutViewerProps {
  className?: string;
}

interface LoadedFiles {
  modelData: DocumentModelData[] | null;
  middleData: DocumentMiddleData | null;
  contentList: DocumentContentList | null;
}

interface LayoutViewerPropsWithData extends LayoutViewerProps {
  files?: LoadedFiles;
  selectedPage?: number;
  showLayoutBoxes?: boolean;
  showTextContent?: boolean;
  onPageChange?: (page: number) => void;
  onToggleLayoutBoxes?: () => void;
  onToggleTextContent?: () => void;
  onLoadFiles?: () => void;
  isLoading?: boolean;
  analysis?: any;
}

export const LayoutViewer: React.FC<LayoutViewerPropsWithData> = ({ 
  className = '',
  files: externalFiles,
  selectedPage: externalSelectedPage = 0,
  showLayoutBoxes: externalShowLayoutBoxes = true,
  showTextContent: externalShowTextContent = true,
  onPageChange,
  onToggleLayoutBoxes,
  onToggleTextContent,
  onLoadFiles,
  isLoading: externalIsLoading = false,
  analysis: externalAnalysis
}) => {
  // 内部状态（当没有外部状态时使用）
  const [internalFiles, setInternalFiles] = useState<LoadedFiles>({
    modelData: null,
    middleData: null,
    contentList: null
  });
  const [internalSelectedPage, setInternalSelectedPage] = useState(0);
  const [internalShowLayoutBoxes, setInternalShowLayoutBoxes] = useState(true);
  const [internalShowTextContent, setInternalShowTextContent] = useState(true);
  const [internalIsLoading, setInternalIsLoading] = useState(false);

  const { analysis: internalAnalysis, loadDocument } = useDocumentParser();

  // 使用外部状态或内部状态
  const files = externalFiles || internalFiles;
  const selectedPage = externalSelectedPage;
  const showLayoutBoxes = externalShowLayoutBoxes;
  const showTextContent = externalShowTextContent;
  const isLoading = externalIsLoading || internalIsLoading;
  const analysis = externalAnalysis || internalAnalysis;
  
  const modelFileRef = useRef<HTMLInputElement>(null);
  const middleFileRef = useRef<HTMLInputElement>(null);
  const contentFileRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileSelect = async () => {
    if (onLoadFiles) {
      onLoadFiles();
      return;
    }
    setInternalIsLoading(true);
    try {
      // 创建文件选择器
      const selectFile = (accept: string): Promise<File | null> => {
        return new Promise((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = accept;
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            resolve(file || null);
          };
          input.click();
        });
      };

      // 依次选择三个文件
      console.log('请选择 model.json 文件...');
      const modelFile = await selectFile('.json');
      if (!modelFile) return;

      console.log('请选择 middle.json 文件...');
      const middleFile = await selectFile('.json');
      if (!middleFile) return;

      console.log('请选择 content_list.json 文件...');
      const contentFile = await selectFile('.json');
      if (!contentFile) return;

      // 读取文件内容
      const readFile = (file: File): Promise<any> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const content = JSON.parse(e.target?.result as string);
              resolve(content);
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = reject;
          reader.readAsText(file);
        });
      };

      const [modelData, middleData, contentList] = await Promise.all([
        readFile(modelFile),
        readFile(middleFile),
        readFile(contentFile)
      ]);

      // 更新状态
      const newFiles = { modelData, middleData, contentList };
      setInternalFiles(newFiles);

      // 解析文档
      await loadDocument(modelData, middleData, contentList);

      console.log('文件加载成功！');
    } catch (error) {
      console.error('文件加载失败:', error);
      alert('文件加载失败，请检查文件格式');
    } finally {
      setInternalIsLoading(false);
    }
  };

  // 获取当前页面的布局信息
  const getCurrentPageLayout = () => {
    if (!files.modelData || selectedPage >= files.modelData.length) {
      return null;
    }
    return files.modelData[selectedPage];
  };

  // 获取当前页面的内容
  const getCurrentPageContent = () => {
    if (!files.contentList) return [];
    return files.contentList.filter(item => item.page_idx === selectedPage);
  };

  const currentLayout = getCurrentPageLayout();
  const currentContent = getCurrentPageContent();

  return (
    <div className={`bg-white border rounded-lg shadow-sm ${className}`}>
      {/* 控制面板 */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">布局查看器</h3>
          <button
            onClick={handleFileSelect}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? '加载中...' : '选择JSON文件 (Ctrl+L)'}
          </button>
        </div>

        {files.modelData && (
          <div className="flex items-center gap-4">
            {/* 页面选择 */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">页面:</label>
              <select
                value={selectedPage}
                onChange={(e) => {
                  const newPage = Number(e.target.value);
                  if (onPageChange) {
                    onPageChange(newPage);
                  } else {
                    setInternalSelectedPage(newPage);
                  }
                }}
                className="px-2 py-1 border rounded text-sm"
              >
                {files.modelData.map((_, index) => (
                  <option key={index} value={index}>
                    第 {index + 1} 页
                  </option>
                ))}
              </select>
            </div>

            {/* 显示选项 */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={showLayoutBoxes}
                  onChange={(e) => setShowLayoutBoxes(e.target.checked)}
                />
                显示布局框
              </label>
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={showTextContent}
                  onChange={(e) => setShowTextContent(e.target.checked)}
                />
                显示文本内容
              </label>
            </div>
          </div>
        )}
      </div>

      {/* 布局显示区域 */}
      <div className="p-4">
        {!files.modelData ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-lg mb-2">📄</div>
            <div>请选择JSON文件以查看布局</div>
            <div className="text-sm mt-1">快捷键: Ctrl+L</div>
          </div>
        ) : currentLayout ? (
          <div className="space-y-4">
            {/* 页面信息 */}
            <div className="bg-blue-50 p-3 rounded">
              <h4 className="font-medium text-blue-800 mb-2">页面信息</h4>
              <div className="text-sm text-blue-700">
                <div>页面: {currentLayout.page_info.page_no + 1}</div>
                <div>尺寸: {currentLayout.page_info.width} × {currentLayout.page_info.height}</div>
                <div>检测到 {currentLayout.layout_dets.length} 个布局区域</div>
              </div>
            </div>

            {/* 布局可视化 */}
            <div className="border rounded overflow-hidden">
              <div 
                className="relative bg-white"
                style={{
                  width: '100%',
                  height: '600px',
                  backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}
              >
                <svg
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${currentLayout.page_info.width} ${currentLayout.page_info.height}`}
                  className="absolute inset-0"
                >
                  {showLayoutBoxes && currentLayout.layout_dets.map((detection, index) => {
                    const [x1, y1, x2, y2] = detection.poly;
                    const categoryType = LAYOUT_CATEGORIES[detection.category_id as keyof typeof LAYOUT_CATEGORIES] || 'unknown';
                    
                    // 不同类型使用不同颜色
                    const colors = {
                      title: '#3b82f6',
                      text: '#10b981',
                      list: '#f59e0b',
                      table: '#ef4444',
                      figure: '#8b5cf6',
                      text_line: '#6b7280',
                      unknown: '#9ca3af'
                    };
                    
                    const color = colors[categoryType as keyof typeof colors] || colors.unknown;

                    return (
                      <g key={index}>
                        {/* 布局框 */}
                        <rect
                          x={Math.min(x1, x2)}
                          y={Math.min(y1, y2)}
                          width={Math.abs(x2 - x1)}
                          height={Math.abs(y2 - y1)}
                          fill={color}
                          fillOpacity={0.1}
                          stroke={color}
                          strokeWidth={2}
                          className="hover:fillOpacity-20 cursor-pointer"
                        />
                        
                        {/* 类型标签 */}
                        <text
                          x={Math.min(x1, x2) + 5}
                          y={Math.min(y1, y2) + 15}
                          fontSize="12"
                          fill={color}
                          className="font-medium"
                        >
                          {categoryType} ({detection.score.toFixed(2)})
                        </text>
                        
                        {/* 文本内容 */}
                        {showTextContent && detection.text && (
                          <text
                            x={Math.min(x1, x2) + 5}
                            y={Math.min(y1, y2) + 35}
                            fontSize="10"
                            fill="#374151"
                            className="font-mono"
                          >
                            {detection.text.length > 50 
                              ? detection.text.substring(0, 50) + '...'
                              : detection.text
                            }
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* 内容列表 */}
            {currentContent.length > 0 && (
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="font-medium text-gray-800 mb-2">页面内容</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {currentContent.map((item, index) => (
                    <div key={index} className="text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`
                          px-2 py-1 rounded text-xs font-medium
                          ${item.text_level === 1 ? 'bg-blue-100 text-blue-800' :
                            item.text_level === 2 ? 'bg-green-100 text-green-800' :
                            item.text_level === 3 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'}
                        `}>
                          {item.type}
                          {item.text_level && ` L${item.text_level}`}
                        </span>
                        <span className="text-gray-600 truncate">
                          {item.text.length > 100 
                            ? item.text.substring(0, 100) + '...'
                            : item.text
                          }
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            当前页面无布局数据
          </div>
        )}
      </div>

      {/* 统计信息 */}
      {analysis && (
        <div className="p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            <div className="flex justify-between">
              <span>总页数: {analysis.totalPages}</span>
              <span>大纲项目: {analysis.outline.length}</span>
              <span>内容项目: {analysis.structuredContent.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LayoutViewer; 