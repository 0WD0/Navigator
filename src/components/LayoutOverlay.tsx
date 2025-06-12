import React, { useState, useCallback, useMemo } from 'react';
import { PageInfo, Block, BlockType, BoundingBox, SpanType } from '../types/pdf-analysis';

interface LayoutOverlayProps {
  pageInfo: PageInfo | null;
  pageWidth: number;
  pageHeight: number;
  showLayoutBoxes: boolean;
  showTextBlocks: boolean;
  showImageRegions: boolean;
  showTableRegions: boolean;
  onBlockSelect?: (block: Block) => void;
  onSpanHover?: (span: any) => void;
  selectedBlockId?: string;
}

// 块类型颜色映射
const BLOCK_COLORS = {
  [BlockType.TEXT]: '#3B82F6',           // 蓝色
  [BlockType.TITLE]: '#10B981',          // 绿色
  [BlockType.IMAGE]: '#F59E0B',          // 橙色
  [BlockType.IMAGE_BODY]: '#F59E0B',     // 橙色
  [BlockType.IMAGE_CAPTION]: '#F97316',  // 深橙色
  [BlockType.TABLE]: '#EF4444',          // 红色
  [BlockType.TABLE_BODY]: '#EF4444',     // 红色
  [BlockType.TABLE_CAPTION]: '#DC2626',  // 深红色
  [BlockType.TABLE_FOOTNOTE]: '#B91C1C', // 更深红色
  [BlockType.INTERLINE_EQUATION]: '#8B5CF6', // 紫色
};

// 片段类型颜色映射
const SPAN_COLORS = {
  [SpanType.TEXT]: '#6B7280',              // 灰色
  [SpanType.IMAGE]: '#F59E0B',             // 橙色
  [SpanType.TABLE]: '#EF4444',             // 红色
  [SpanType.INLINE_EQUATION]: '#8B5CF6',   // 紫色
  [SpanType.INTERLINE_EQUATION]: '#7C3AED', // 深紫色
};

const LayoutOverlay: React.FC<LayoutOverlayProps> = ({
  pageInfo,
  pageWidth,
  pageHeight,
  showLayoutBoxes,
  showTextBlocks,
  showImageRegions,
  showTableRegions,
  onBlockSelect,
  onSpanHover,
  selectedBlockId,
}) => {
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);
  const [showSpans, setShowSpans] = useState(false);

  // 缩放比例计算
  const scale = useMemo(() => {
    if (!pageInfo) return 1;
    const scaleX = pageWidth / pageInfo.page_size[0];
    const scaleY = pageHeight / pageInfo.page_size[1];
    return Math.min(scaleX, scaleY);
  }, [pageInfo, pageWidth, pageHeight]);

  // 坐标转换函数
  const transformBBox = useCallback((bbox: BoundingBox): BoundingBox => {
    return [
      bbox[0] * scale,
      bbox[1] * scale,
      bbox[2] * scale,
      bbox[3] * scale
    ];
  }, [scale]);

  // 处理块点击
  const handleBlockClick = useCallback((block: Block, event: React.MouseEvent) => {
    event.stopPropagation();
    onBlockSelect?.(block);
  }, [onBlockSelect]);

  // 处理块悬停
  const handleBlockHover = useCallback((blockId: string | null) => {
    setHoveredBlock(blockId);
  }, []);

  // 渲染布局框
  const renderLayoutBoxes = () => {
    if (!showLayoutBoxes || !pageInfo) return null;

    return pageInfo.layout_bboxes.map((box, index) => {
      const [x1, y1, x2, y2] = transformBBox(box.layout_bbox);
      const width = x2 - x1;
      const height = y2 - y1;

      return (
        <div
          key={`layout-${index}`}
          className="absolute border-2 border-dashed border-green-500 bg-green-100 bg-opacity-20 pointer-events-none"
          style={{
            left: x1,
            top: y1,
            width: width,
            height: height,
          }}
        >
          <div className="absolute -top-6 left-0 bg-green-500 text-white text-xs px-1 rounded">
            Layout {index + 1} ({box.layout_label})
          </div>
        </div>
      );
    });
  };

  // 渲染文本块
  const renderTextBlocks = () => {
    if (!showTextBlocks || !pageInfo) return null;

    return pageInfo.para_blocks
      .filter(block => block.type === BlockType.TEXT || block.type === BlockType.TITLE)
      .map((block, index) => {
        const [x1, y1, x2, y2] = transformBBox(block.bbox);
        const width = x2 - x1;
        const height = y2 - y1;
        const isSelected = selectedBlockId === block.id;
        const isHovered = hoveredBlock === block.id;
        const color = BLOCK_COLORS[block.type] || '#6B7280';

        return (
          <div
            key={`text-${index}`}
            className={`absolute border-2 cursor-pointer transition-all duration-200 ${
              isSelected ? 'border-blue-600 bg-blue-100' : 
              isHovered ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-transparent'
            } hover:bg-opacity-30`}
            style={{
              left: x1,
              top: y1,
              width: width,
              height: height,
              borderColor: color,
              backgroundColor: isSelected || isHovered ? `${color}20` : 'transparent',
            }}
            onClick={(e) => handleBlockClick(block, e)}
            onMouseEnter={() => handleBlockHover(block.id || `text-${index}`)}
            onMouseLeave={() => handleBlockHover(null)}
          >
            <div 
              className="absolute -top-6 left-0 text-white text-xs px-1 rounded"
              style={{ backgroundColor: color }}
            >
              {block.type === BlockType.TITLE ? '标题' : '文本'} {index + 1}
            </div>
            
            {/* 显示置信度 */}
            {block.confidence && (
              <div className="absolute -top-6 right-0 bg-gray-600 text-white text-xs px-1 rounded">
                {Math.round(block.confidence * 100)}%
              </div>
            )}
          </div>
        );
      });
  };

  // 渲染图像区域
  const renderImageRegions = () => {
    if (!showImageRegions || !pageInfo) return null;

    return pageInfo.images.map((image, index) => {
      const [x1, y1, x2, y2] = transformBBox(image.bbox);
      const width = x2 - x1;
      const height = y2 - y1;
      const isSelected = selectedBlockId === image.id;
      const isHovered = hoveredBlock === image.id;

      return (
        <div
          key={`image-${index}`}
          className={`absolute border-2 cursor-pointer transition-all duration-200 ${
            isSelected ? 'border-orange-600 bg-orange-100' : 
            isHovered ? 'border-orange-400 bg-orange-50' : 'border-orange-300 bg-transparent'
          } hover:bg-opacity-30`}
          style={{
            left: x1,
            top: y1,
            width: width,
            height: height,
            borderColor: BLOCK_COLORS[BlockType.IMAGE],
            backgroundColor: isSelected || isHovered ? `${BLOCK_COLORS[BlockType.IMAGE]}20` : 'transparent',
          }}
          onClick={(e) => handleBlockClick(image, e)}
          onMouseEnter={() => handleBlockHover(image.id || `image-${index}`)}
          onMouseLeave={() => handleBlockHover(null)}
        >
          <div className="absolute -top-6 left-0 bg-orange-500 text-white text-xs px-1 rounded">
            图像 {index + 1}
          </div>
          
          {/* 显示图像描述 */}
          {image.caption && (
            <div className="absolute -bottom-6 left-0 bg-gray-600 text-white text-xs px-1 rounded max-w-full truncate">
              {image.caption}
            </div>
          )}
        </div>
      );
    });
  };

  // 渲染表格区域
  const renderTableRegions = () => {
    if (!showTableRegions || !pageInfo) return null;

    return pageInfo.tables.map((table, index) => {
      const [x1, y1, x2, y2] = transformBBox(table.bbox);
      const width = x2 - x1;
      const height = y2 - y1;
      const isSelected = selectedBlockId === table.id;
      const isHovered = hoveredBlock === table.id;

      return (
        <div
          key={`table-${index}`}
          className={`absolute border-2 cursor-pointer transition-all duration-200 ${
            isSelected ? 'border-red-600 bg-red-100' : 
            isHovered ? 'border-red-400 bg-red-50' : 'border-red-300 bg-transparent'
          } hover:bg-opacity-30`}
          style={{
            left: x1,
            top: y1,
            width: width,
            height: height,
            borderColor: BLOCK_COLORS[BlockType.TABLE],
            backgroundColor: isSelected || isHovered ? `${BLOCK_COLORS[BlockType.TABLE]}20` : 'transparent',
          }}
          onClick={(e) => handleBlockClick(table, e)}
          onMouseEnter={() => handleBlockHover(table.id || `table-${index}`)}
          onMouseLeave={() => handleBlockHover(null)}
        >
          <div className="absolute -top-6 left-0 bg-red-500 text-white text-xs px-1 rounded">
            表格 {index + 1}
          </div>
          
          {/* 显示表格行列信息 */}
          <div className="absolute -top-6 right-0 bg-gray-600 text-white text-xs px-1 rounded">
            {table.rows.length}行 × {table.rows[0]?.cells.length || 0}列
          </div>
          
          {/* 显示表格标题 */}
          {table.caption && (
            <div className="absolute -bottom-6 left-0 bg-gray-600 text-white text-xs px-1 rounded max-w-full truncate">
              {table.caption}
            </div>
          )}
        </div>
      );
    });
  };

  // 渲染片段（用于调试）
  const renderSpans = () => {
    if (!showSpans || !pageInfo) return null;

    const spans: any[] = [];
    
    pageInfo.para_blocks.forEach((block, blockIndex) => {
      if ('lines' in block) {
        block.lines.forEach((line, lineIndex) => {
          line.spans.forEach((span, spanIndex) => {
            spans.push({
              ...span,
              id: `span-${blockIndex}-${lineIndex}-${spanIndex}`,
              blockType: block.type
            });
          });
        });
      }
    });

           return spans.map((span) => {
       const [x1, y1, x2, y2] = transformBBox(span.bbox);
       const width = x2 - x1;
       const height = y2 - y1;
       const color = SPAN_COLORS[span.type as SpanType] || '#6B7280';

      return (
        <div
          key={span.id}
          className="absolute border border-dashed pointer-events-none"
          style={{
            left: x1,
            top: y1,
            width: width,
            height: height,
            borderColor: color,
            backgroundColor: `${color}10`,
          }}
          onMouseEnter={() => onSpanHover?.(span)}
        >
          {span.type !== SpanType.TEXT && (
            <div 
              className="absolute -top-4 left-0 text-white text-xs px-1 rounded"
              style={{ backgroundColor: color, fontSize: '10px' }}
            >
              {span.type}
            </div>
          )}
        </div>
      );
    });
  };

  if (!pageInfo) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* 允许子元素交互 */}
      <div className="absolute inset-0 pointer-events-auto">
        {renderLayoutBoxes()}
        {renderTextBlocks()}
        {renderImageRegions()}
        {renderTableRegions()}
        {renderSpans()}
      </div>
      
      {/* 控制面板 */}
      <div className="absolute top-4 right-4 bg-white border border-gray-300 rounded-lg p-2 shadow-lg pointer-events-auto">
        <div className="text-sm font-medium mb-2">布局分析</div>
        <div className="space-y-1">
          <label className="flex items-center space-x-2 text-xs">
            <input
              type="checkbox"
              checked={showSpans}
              onChange={(e) => setShowSpans(e.target.checked)}
              className="w-3 h-3"
            />
            <span>显示片段</span>
          </label>
        </div>
        
        {/* 统计信息 */}
        <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-600">
          <div>文本块: {pageInfo.para_blocks.filter(b => b.type === BlockType.TEXT).length}</div>
          <div>图像: {pageInfo.images.length}</div>
          <div>表格: {pageInfo.tables.length}</div>
          <div>公式: {pageInfo.interline_equations.length}</div>
        </div>
        
        {/* 质量指标 */}
        {pageInfo._analysis_metadata?.confidence_scores && (
          <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600">
            <div>总体置信度: {Math.round(pageInfo._analysis_metadata.confidence_scores.overall_confidence * 100)}%</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LayoutOverlay; 