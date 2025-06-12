import React from 'react';
import { PageInfo } from '@/types/pdf-analysis';
import { DocumentContentList } from '@/types/document.types';
import { useNavigationStore } from '@/store/navigation';

interface MineruLayoutViewerProps {
  mineruData: PageInfo[] | null;
  contentList: DocumentContentList | null;
  selectedPage: number;
  showLayoutBoxes: boolean;
  showTextContent: boolean;
  onPageChange: (page: number) => void;
  onToggleLayoutBoxes: () => void;
  onToggleTextContent: () => void;
  className?: string;
}

export const MineruLayoutViewer: React.FC<MineruLayoutViewerProps> = ({
  mineruData,
  contentList,
  selectedPage,
  showLayoutBoxes,
  showTextContent,
  onPageChange,
  onToggleLayoutBoxes,
  onToggleTextContent,
  className = ''
}) => {
  // 使用 navigation store 来同步 PDF 页面
  const { setCurrentPage } = useNavigationStore();

  // 处理页面变化，同时更新本地状态和 navigation store
  const handlePageChange = (page: number) => {
    onPageChange(page); // 更新本地状态
    setCurrentPage(page + 1); // 更新 navigation store (store 使用 1-based，这里是 0-based)
  };
  // 获取当前页面的MinerU数据
  const getCurrentPageData = () => {
    if (!mineruData || selectedPage >= mineruData.length) {
      return null;
    }
    return mineruData[selectedPage];
  };

  // 获取当前页面的内容
  const getCurrentPageContent = () => {
    if (!contentList) return [];
    return contentList.filter(item => item.page_idx === selectedPage);
  };

  const currentPageData = getCurrentPageData();
  const currentContent = getCurrentPageContent();

  // 获取块类型的颜色
  const getBlockColor = (blockType: string) => {
    const colors = {
      title: '#3b82f6',      // 蓝色
      text: '#10b981',       // 绿色
      list: '#f59e0b',       // 黄色
      table: '#ef4444',      // 红色
      figure: '#8b5cf6',     // 紫色
      image: '#f97316',      // 橙色
      equation: '#ec4899',   // 粉色
      unknown: '#6b7280'     // 灰色
    };
    return colors[blockType as keyof typeof colors] || colors.unknown;
  };

  // 获取块类型的显示名称
  const getBlockTypeName = (blockType: string) => {
    const names = {
      title: '标题',
      text: '正文',
      list: '列表',
      table: '表格',
      figure: '图片',
      image: '图像',
      equation: '公式',
      unknown: '未知'
    };
    return names[blockType as keyof typeof names] || '未知';
  };

  if (!mineruData) {
    return (
      <div className={`bg-white border rounded-lg shadow-sm p-8 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="text-lg mb-2">📄</div>
          <div>请先加载 MinerU 数据文件</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border rounded-lg shadow-sm ${className}`}>
      {/* 控制面板 */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">MinerU 布局查看器</h3>
        </div>

        <div className="flex items-center gap-4">
          {/* 页面选择 */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">页面:</label>
            <select
              value={selectedPage}
              onChange={(e) => handlePageChange(Number(e.target.value))}
              className="px-2 py-1 border rounded text-sm"
            >
              {mineruData.map((_, index) => (
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
        {currentPageData ? (
          <div className="space-y-4">
            {/* 页面信息 */}
            <div className="bg-purple-50 p-3 rounded">
              <h4 className="font-medium text-purple-800 mb-2">页面信息</h4>
              <div className="text-sm text-purple-700 grid grid-cols-2 gap-2">
                <div>页面: {currentPageData.page_idx + 1}</div>
                <div>尺寸: {currentPageData.page_size[0]} × {currentPageData.page_size[1]}</div>
                <div>文本块: {currentPageData.para_blocks.length}</div>
                <div>图像: {currentPageData.images.length}</div>
                <div>表格: {currentPageData.tables.length}</div>
                <div>公式: {currentPageData.interline_equations.length}</div>
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
                  viewBox={`0 0 ${currentPageData.page_size[0]} ${currentPageData.page_size[1]}`}
                  className="absolute inset-0"
                >
                  {/* 渲染文本块 */}
                  {showLayoutBoxes && currentPageData.para_blocks.map((block: any, index) => {
                    if (!block.bbox) return null;
                    
                    const [x1, y1, x2, y2] = block.bbox;
                    const color = getBlockColor(block.type || 'text');
                    const typeName = getBlockTypeName(block.type || 'text');

                    return (
                      <g key={`para-${index}`}>
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
                          {typeName} {index + 1}
                        </text>
                        
                        {/* 文本内容 */}
                        {showTextContent && block.lines && (
                          <text
                            x={Math.min(x1, x2) + 5}
                            y={Math.min(y1, y2) + 35}
                            fontSize="10"
                            fill="#374151"
                            className="font-mono"
                          >
                            {block.lines.slice(0, 2).map((line: any) => 
                              line.spans?.filter((span: any) => span.type === 'text')
                                .map((span: any) => span.content)
                                .join(' ')
                            ).join(' ').substring(0, 50)}...
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* 渲染图像 */}
                  {currentPageData.images.map((image: any, index) => {
                    if (!image.bbox) return null;
                    
                    const [x1, y1, x2, y2] = image.bbox;
                    const color = getBlockColor('image');

                    return (
                      <g key={`image-${index}`}>
                        <rect
                          x={Math.min(x1, x2)}
                          y={Math.min(y1, y2)}
                          width={Math.abs(x2 - x1)}
                          height={Math.abs(y2 - y1)}
                          fill={color}
                          fillOpacity={0.1}
                          stroke={color}
                          strokeWidth={2}
                          strokeDasharray="5,5"
                          className="hover:fill-opacity-20 cursor-pointer"
                        />
                        <text
                          x={Math.min(x1, x2) + 5}
                          y={Math.min(y1, y2) + 15}
                          fontSize="12"
                          fill={color}
                          className="font-medium"
                        >
                          图像 {index + 1}
                        </text>
                      </g>
                    );
                  })}

                  {/* 渲染表格 */}
                  {currentPageData.tables.map((table: any, index) => {
                    if (!table.bbox) return null;
                    
                    const [x1, y1, x2, y2] = table.bbox;
                    const color = getBlockColor('table');

                    return (
                      <g key={`table-${index}`}>
                        <rect
                          x={Math.min(x1, x2)}
                          y={Math.min(y1, y2)}
                          width={Math.abs(x2 - x1)}
                          height={Math.abs(y2 - y1)}
                          fill={color}
                          fillOpacity={0.1}
                          stroke={color}
                          strokeWidth={2}
                          strokeDasharray="10,5"
                          className="hover:fill-opacity-20 cursor-pointer"
                        />
                        <text
                          x={Math.min(x1, x2) + 5}
                          y={Math.min(y1, y2) + 15}
                          fontSize="12"
                          fill={color}
                          className="font-medium"
                        >
                          表格 {index + 1}
                        </text>
                      </g>
                    );
                  })}

                  {/* 渲染公式 */}
                  {currentPageData.interline_equations.map((equation: any, index) => {
                    if (!equation.bbox) return null;
                    
                    const [x1, y1, x2, y2] = equation.bbox;
                    const color = getBlockColor('equation');

                    return (
                      <g key={`equation-${index}`}>
                        <rect
                          x={Math.min(x1, x2)}
                          y={Math.min(y1, y2)}
                          width={Math.abs(x2 - x1)}
                          height={Math.abs(y2 - y1)}
                          fill={color}
                          fillOpacity={0.1}
                          stroke={color}
                          strokeWidth={2}
                          strokeDasharray="3,3"
                          className="hover:fill-opacity-20 cursor-pointer"
                        />
                        <text
                          x={Math.min(x1, x2) + 5}
                          y={Math.min(y1, y2) + 15}
                          fontSize="12"
                          fill={color}
                          className="font-medium"
                        >
                          公式 {index + 1}
                        </text>
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
                      <span className="inline-block w-12 text-xs bg-gray-200 px-1 rounded mr-2">
                        {item.type}
                      </span>
                      <span className="text-gray-700">
                        {item.text.length > 100 ? item.text.substring(0, 100) + '...' : item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 统计信息 */}
            <div className="bg-green-50 p-3 rounded">
              <h4 className="font-medium text-green-800 mb-2">统计信息</h4>
              <div className="grid grid-cols-3 gap-4 text-sm text-green-700">
                <div>
                  <div className="font-medium">内容块</div>
                  <div>{currentPageData.para_blocks.length}</div>
                </div>
                <div>
                  <div className="font-medium">多媒体</div>
                  <div>{currentPageData.images.length + currentPageData.tables.length}</div>
                </div>
                <div>
                  <div className="font-medium">公式</div>
                  <div>{currentPageData.interline_equations.length}</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <div className="text-lg mb-2">📄</div>
            <div>当前页面没有数据</div>
          </div>
        )}
      </div>
    </div>
  );
}; 