import React from 'react';
import { DocumentModelData, DocumentContentList, LAYOUT_CATEGORIES } from '@/types/document.types';

interface SimpleLayoutViewerProps {
  modelData: DocumentModelData[] | null;
  contentList: DocumentContentList | null;
  selectedPage: number;
  showLayoutBoxes: boolean;
  showTextContent: boolean;
  onPageChange: (page: number) => void;
  onToggleLayoutBoxes: () => void;
  onToggleTextContent: () => void;
  className?: string;
}

export const SimpleLayoutViewer: React.FC<SimpleLayoutViewerProps> = ({
  modelData,
  contentList,
  selectedPage,
  showLayoutBoxes,
  showTextContent,
  onPageChange,
  onToggleLayoutBoxes,
  onToggleTextContent,
  className = ''
}) => {
  // 获取当前页面的布局信息
  const getCurrentPageLayout = () => {
    if (!modelData || selectedPage >= modelData.length) {
      return null;
    }
    return modelData[selectedPage];
  };

  // 获取当前页面的内容
  const getCurrentPageContent = () => {
    if (!contentList) return [];
    return contentList.filter(item => item.page_idx === selectedPage);
  };

  const currentLayout = getCurrentPageLayout();
  const currentContent = getCurrentPageContent();

  if (!modelData) {
    return (
      <div className={`bg-white border rounded-lg shadow-sm p-8 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="text-lg mb-2">📄</div>
          <div>请先加载布局文件</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border rounded-lg shadow-sm ${className}`}>
      {/* 控制面板 */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">布局查看器</h3>
        </div>

        <div className="flex items-center gap-4">
          {/* 页面选择 */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">页面:</label>
            <select
              value={selectedPage}
              onChange={(e) => onPageChange(Number(e.target.value))}
              className="px-2 py-1 border rounded text-sm"
            >
              {modelData.map((_, index) => (
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
                onChange={onToggleLayoutBoxes}
              />
              显示布局框
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={showTextContent}
                onChange={onToggleTextContent}
              />
              显示文本内容
            </label>
          </div>
        </div>
      </div>

      {/* 布局显示区域 */}
      <div className="p-4">
        {currentLayout ? (
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
                          className="hover:fill-opacity-20 cursor-pointer"
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
    </div>
  );
};

export default SimpleLayoutViewer; 