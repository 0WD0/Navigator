import React, { useState, useRef, useEffect } from 'react';
import { PDFViewer } from './PDFViewer';
import { DocumentModelData, LAYOUT_CATEGORIES } from '@/types/document.types';
import { PageInfo, BlockType, SpanType } from '@/types/pdf-analysis';
import { useNavigationStore } from '@/store/navigation';

interface PDFViewerWithOverlayProps {
  filePath: string;
  layoutData?: DocumentModelData[] | null;
  mineruData?: PageInfo[] | null; // 新增MinerU数据支持
  selectedPage?: number;
  showLayoutBoxes?: boolean;
  showTextContent?: boolean;
  showImageRegions?: boolean;
  showTableRegions?: boolean;
  className?: string;
}

export const PDFViewerWithOverlay: React.FC<PDFViewerWithOverlayProps> = ({
  filePath,
  layoutData,
  mineruData,
  selectedPage = 0,
  showLayoutBoxes = true,
  showTextContent = false,
  showImageRegions = false,
  showTableRegions = false,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [overlayDimensions, setOverlayDimensions] = useState({ width: 0, height: 0, offsetX: 0, offsetY: 0 });
  
  // 使用PDF查看器的当前页面状态
  const { currentPage } = useNavigationStore();
  
  // 获取当前页面的布局数据 - 使用PDF查看器的页面状态
  const getCurrentPageLayout = () => {
    if (layoutData && currentPage - 1 >= 0 && currentPage - 1 < layoutData.length) {
      return layoutData[currentPage - 1]; // PDF页面从1开始，数组从0开始
    }
    return null;
  };

  // 获取当前页面的MinerU数据
  const getCurrentPageMinerU = () => {
    if (mineruData && currentPage - 1 >= 0 && currentPage - 1 < mineruData.length) {
      return mineruData[currentPage - 1];
    }
    return null;
  };

  const currentLayout = getCurrentPageLayout();
  const currentMinerU = getCurrentPageMinerU();

  // 更新叠加层尺寸和位置
  const updateOverlayDimensions = () => {
    if (!containerRef.current || !currentLayout) return;

    const pdfCanvas = containerRef.current.querySelector('canvas.pdf-viewer') as HTMLCanvasElement;
    if (!pdfCanvas) return;

    const canvasRect = pdfCanvas.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    setOverlayDimensions({
      width: canvasRect.width,
      height: canvasRect.height,
      offsetX: canvasRect.left - containerRect.left,
      offsetY: canvasRect.top - containerRect.top
    });
  };

  // 监听PDF加载和页面变化
  useEffect(() => {
    // 延迟更新，确保PDF已经渲染
    const timeoutId = setTimeout(updateOverlayDimensions, 300);
    
    return () => clearTimeout(timeoutId);
  }, [currentPage, filePath, currentLayout]);

  // 监听窗口大小变化和DOM变化
  useEffect(() => {
    const handleResize = () => {
      updateOverlayDimensions();
    };

    window.addEventListener('resize', handleResize);
    
    // 使用 MutationObserver 监听 DOM 变化
    const observer = new MutationObserver(() => {
      setTimeout(updateOverlayDimensions, 100);
    });
    
    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'width', 'height']
      });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, []);

  // 将布局坐标转换为显示坐标 - 支持传统格式和MinerU格式
  const convertCoordinates = (layoutBox: number[]) => {
    if (overlayDimensions.width === 0) return null;

    let pageWidth: number, pageHeight: number;
    
    // 优先使用MinerU数据的页面信息
    if (currentMinerU) {
      [pageWidth, pageHeight] = currentMinerU.page_size;
    } else if (currentLayout) {
      ({ width: pageWidth, height: pageHeight } = currentLayout.page_info);
    } else {
      return null;
    }

    const [x1, y1, x2, y2] = layoutBox;
    
    // 计算缩放比例
    const scaleX = overlayDimensions.width / pageWidth;
    const scaleY = overlayDimensions.height / pageHeight;
    const scale = Math.min(scaleX, scaleY);
    
    // 计算实际渲染尺寸
    const renderWidth = pageWidth * scale;
    const renderHeight = pageHeight * scale;
    
    // 计算居中偏移
    const centerOffsetX = (overlayDimensions.width - renderWidth) / 2;
    const centerOffsetY = (overlayDimensions.height - renderHeight) / 2;
    
    return {
      left: Math.min(x1, x2) * scale + overlayDimensions.offsetX + centerOffsetX,
      top: Math.min(y1, y2) * scale + overlayDimensions.offsetY + centerOffsetY,
      width: Math.abs(x2 - x1) * scale,
      height: Math.abs(y2 - y1) * scale
    };
  };

  // 获取布局类型颜色 - 传统格式
  const getLayoutColor = (categoryId: number) => {
    const categoryType = LAYOUT_CATEGORIES[categoryId as keyof typeof LAYOUT_CATEGORIES] || 'unknown';
    const colors = {
      title: '#3b82f6',      // 蓝色
      text: '#10b981',       // 绿色
      list: '#f59e0b',       // 黄色
      table: '#ef4444',      // 红色
      figure: '#8b5cf6',     // 紫色
      text_line: '#6b7280',  // 灰色
      unknown: '#9ca3af'     // 默认灰色
    };
    return colors[categoryType as keyof typeof colors] || colors.unknown;
  };

  // 获取MinerU块类型颜色
  const getMinerUBlockColor = (blockType: BlockType) => {
    const colors = {
      [BlockType.TEXT]: '#10b981',          // 绿色
      [BlockType.TITLE]: '#3b82f6',         // 蓝色
      [BlockType.IMAGE]: '#f59e0b',         // 橙色
      [BlockType.IMAGE_BODY]: '#f59e0b',    // 橙色
      [BlockType.IMAGE_CAPTION]: '#f97316', // 深橙色
      [BlockType.TABLE]: '#ef4444',         // 红色
      [BlockType.TABLE_BODY]: '#ef4444',    // 红色
      [BlockType.TABLE_CAPTION]: '#dc2626', // 深红色
      [BlockType.TABLE_FOOTNOTE]: '#b91c1c', // 更深红色
      [BlockType.INTERLINE_EQUATION]: '#8b5cf6', // 紫色
    };
    return colors[blockType] || '#9ca3af';
  };

  // 获取中文显示名称
  const getBlockTypeDisplayName = (blockType: BlockType) => {
    const names = {
      [BlockType.TEXT]: '文本',
      [BlockType.TITLE]: '标题',
      [BlockType.IMAGE]: '图像',
      [BlockType.IMAGE_BODY]: '图像主体',
      [BlockType.IMAGE_CAPTION]: '图像说明',
      [BlockType.TABLE]: '表格',
      [BlockType.TABLE_BODY]: '表格主体',
      [BlockType.TABLE_CAPTION]: '表格说明',
      [BlockType.TABLE_FOOTNOTE]: '表格脚注',
      [BlockType.INTERLINE_EQUATION]: '公式',
    };
    return names[blockType] || '未知';
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* PDF查看器 */}
      <PDFViewer filePath={filePath} />
      
      {/* 布局框叠加层 */}
      {overlayDimensions.width > 0 && (currentLayout || currentMinerU) && (
        <div 
          className="absolute pointer-events-none"
          style={{
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 10
          }}
        >
          {/* 渲染MinerU数据 */}
          {currentMinerU && (
            <>
              {/* 文本块 */}
              {showLayoutBoxes && currentMinerU.para_blocks.map((block, index) => {
                if (!('lines' in block)) return null;
                const coords = convertCoordinates(block.bbox);
                if (!coords) return null;

                const color = getMinerUBlockColor(block.type);
                const displayName = getBlockTypeDisplayName(block.type);

                return (
                  <div key={`mineru-block-${index}`}>
                    <div
                      className="absolute border-2 pointer-events-auto cursor-pointer transition-all duration-200 hover:shadow-md hover:opacity-80"
                      style={{
                        left: coords.left,
                        top: coords.top,
                        width: coords.width,
                        height: coords.height,
                        borderColor: color,
                        backgroundColor: `${color}25`,
                        borderStyle: 'solid',
                        borderWidth: '2px'
                      }}
                      title={`${displayName} (置信度: ${block.confidence ? (block.confidence * 100).toFixed(1) : 'N/A'}%)`}
                    />
                    <div
                      className="absolute text-xs font-bold px-1.5 py-0.5 rounded pointer-events-none shadow-sm"
                      style={{
                        left: coords.left + 2,
                        top: coords.top - 18,
                        backgroundColor: color,
                        color: 'white',
                        fontSize: '10px',
                        lineHeight: '12px',
                        minWidth: '30px',
                        textAlign: 'center'
                      }}
                    >
                      {displayName}
                    </div>
                  </div>
                );
              })}

              {/* 图像区域 */}
              {showImageRegions && currentMinerU.images.map((image, index) => {
                const coords = convertCoordinates(image.bbox);
                if (!coords) return null;

                const color = getMinerUBlockColor(BlockType.IMAGE);

                return (
                  <div key={`mineru-image-${index}`}>
                    <div
                      className="absolute border-2 pointer-events-auto cursor-pointer transition-all duration-200 hover:shadow-md hover:opacity-80"
                      style={{
                        left: coords.left,
                        top: coords.top,
                        width: coords.width,
                        height: coords.height,
                        borderColor: color,
                        backgroundColor: `${color}25`,
                        borderStyle: 'dashed',
                        borderWidth: '2px'
                      }}
                      title={`图像 (置信度: ${image.confidence ? (image.confidence * 100).toFixed(1) : 'N/A'}%)`}
                    />
                    <div
                      className="absolute text-xs font-bold px-1.5 py-0.5 rounded pointer-events-none shadow-sm"
                      style={{
                        left: coords.left + 2,
                        top: coords.top - 18,
                        backgroundColor: color,
                        color: 'white',
                        fontSize: '10px',
                        lineHeight: '12px'
                      }}
                    >
                      图像 {index + 1}
                    </div>
                  </div>
                );
              })}

              {/* 表格区域 */}
              {showTableRegions && currentMinerU.tables.map((table, index) => {
                const coords = convertCoordinates(table.bbox);
                if (!coords) return null;

                const color = getMinerUBlockColor(BlockType.TABLE);

                return (
                  <div key={`mineru-table-${index}`}>
                    <div
                      className="absolute border-2 pointer-events-auto cursor-pointer transition-all duration-200 hover:shadow-md hover:opacity-80"
                      style={{
                        left: coords.left,
                        top: coords.top,
                        width: coords.width,
                        height: coords.height,
                        borderColor: color,
                        backgroundColor: `${color}25`,
                        borderStyle: 'dashed',
                        borderWidth: '2px'
                      }}
                      title={`表格 (置信度: ${table.confidence ? (table.confidence * 100).toFixed(1) : 'N/A'}%)`}
                    />
                    <div
                      className="absolute text-xs font-bold px-1.5 py-0.5 rounded pointer-events-none shadow-sm"
                      style={{
                        left: coords.left + 2,
                        top: coords.top - 18,
                        backgroundColor: color,
                        color: 'white',
                        fontSize: '10px',
                        lineHeight: '12px'
                      }}
                    >
                      表格 {index + 1}
                    </div>
                  </div>
                );
              })}

              {/* 公式区域 */}
              {showLayoutBoxes && currentMinerU.interline_equations.map((equation, index) => {
                const coords = convertCoordinates(equation.bbox);
                if (!coords) return null;

                const color = getMinerUBlockColor(BlockType.INTERLINE_EQUATION);

                return (
                  <div key={`mineru-equation-${index}`}>
                    <div
                      className="absolute border-2 pointer-events-auto cursor-pointer transition-all duration-200 hover:shadow-md hover:opacity-80"
                      style={{
                        left: coords.left,
                        top: coords.top,
                        width: coords.width,
                        height: coords.height,
                        borderColor: color,
                        backgroundColor: `${color}25`,
                        borderStyle: 'dotted',
                        borderWidth: '2px'
                      }}
                      title={`公式 (置信度: ${equation.confidence ? (equation.confidence * 100).toFixed(1) : 'N/A'}%)`}
                    />
                    <div
                      className="absolute text-xs font-bold px-1.5 py-0.5 rounded pointer-events-none shadow-sm"
                      style={{
                        left: coords.left + 2,
                        top: coords.top - 18,
                        backgroundColor: color,
                        color: 'white',
                        fontSize: '10px',
                        lineHeight: '12px'
                      }}
                    >
                      公式 {index + 1}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* 渲染传统布局数据 */}
          {!currentMinerU && currentLayout && showLayoutBoxes && currentLayout.layout_dets.map((detection, index) => {
            const coords = convertCoordinates(detection.poly);
            if (!coords) return null;

            const color = getLayoutColor(detection.category_id);
            const categoryType = LAYOUT_CATEGORIES[detection.category_id as keyof typeof LAYOUT_CATEGORIES] || 'unknown';

            return (
              <div key={`legacy-${currentPage}-${index}`}>
                <div
                  className="absolute border-2 pointer-events-auto cursor-pointer transition-all duration-200 hover:shadow-md hover:opacity-80"
                  style={{
                    left: coords.left,
                    top: coords.top,
                    width: coords.width,
                    height: coords.height,
                    borderColor: color,
                    backgroundColor: `${color}25`,
                    borderStyle: 'solid',
                    borderWidth: '2px'
                  }}
                  title={`${categoryType} (置信度: ${(detection.score * 100).toFixed(1)}%)`}
                />
                <div
                  className="absolute text-xs font-bold px-1.5 py-0.5 rounded pointer-events-none shadow-sm"
                  style={{
                    left: coords.left + 2,
                    top: coords.top - 18,
                    backgroundColor: color,
                    color: 'white',
                    fontSize: '10px',
                    lineHeight: '12px',
                    minWidth: '30px',
                    textAlign: 'center'
                  }}
                >
                  {categoryType}
                </div>
                {showTextContent && detection.text && (
                  <div
                    className="absolute text-xs bg-black bg-opacity-75 text-white p-1.5 rounded pointer-events-none max-w-xs"
                    style={{
                      left: coords.left + 2,
                      top: coords.top + coords.height + 2,
                      fontSize: '9px',
                      lineHeight: '11px'
                    }}
                  >
                    {detection.text.length > 50 
                      ? detection.text.substring(0, 50) + '...'
                      : detection.text
                    }
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {/* 控制面板 */}
      {(layoutData || mineruData) && (
        <div className="absolute top-4 right-4 bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow-lg p-3 border max-w-xs">
          <div className="text-sm font-medium text-gray-700 mb-2">
            {currentMinerU ? 'MinerU 布局分析' : '传统布局检测'}
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded ${showLayoutBoxes ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
              <span>{currentMinerU ? '文本/标题块' : '布局框'}</span>
            </div>
            
            {currentMinerU && (
              <>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded ${showImageRegions ? 'bg-orange-500' : 'bg-gray-300'}`}></span>
                  <span>图像区域</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded ${showTableRegions ? 'bg-red-500' : 'bg-gray-300'}`}></span>
                  <span>表格区域</span>
                </div>
              </>
            )}
            
            {!currentMinerU && (
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded ${showTextContent ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                <span>文本内容</span>
              </div>
            )}
          </div>
          
          {/* 统计信息 */}
          <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600">
            {currentMinerU ? (
              <>
                <div>页面: {currentPage} / {mineruData!.length}</div>
                <div>文本块: {currentMinerU.para_blocks.length}</div>
                <div>图像: {currentMinerU.images.length}</div>
                <div>表格: {currentMinerU.tables.length}</div>
                <div>公式: {currentMinerU.interline_equations.length}</div>
                <div className="text-xs text-blue-600 mt-1">
                  页面尺寸: {currentMinerU.page_size[0]} × {currentMinerU.page_size[1]}
                </div>
                {/* 质量指标 */}
                {currentMinerU._analysis_metadata?.confidence_scores && (
                  <div className="mt-1 pt-1 border-t border-gray-200">
                    <div className="text-xs text-green-600">
                      总体置信度: {Math.round(currentMinerU._analysis_metadata.confidence_scores.overall_confidence * 100)}%
                    </div>
                  </div>
                )}
              </>
            ) : currentLayout ? (
              <>
                <div>页面: {currentPage} / {layoutData!.length}</div>
                <div>检测: {currentLayout.layout_dets.length} 个区域</div>
                <div className="text-xs text-blue-600 mt-1">
                  尺寸: {currentLayout.page_info.width} × {currentLayout.page_info.height}
                </div>
              </>
            ) : null}
          </div>
          
          {/* 数据类型指示器 */}
          <div className="mt-2 pt-2 border-t border-gray-200 text-xs">
            <div className={`inline-block px-2 py-1 rounded text-white ${
              currentMinerU ? 'bg-purple-500' : 'bg-blue-500'
            }`}>
              {currentMinerU ? 'MinerU' : 'Legacy'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFViewerWithOverlay; 