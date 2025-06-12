import React, { useState } from 'react';
import { DocumentOutline } from '@/types/document.types';

interface DocumentOutlineProps {
  outline: DocumentOutline[];
  onNavigate: (pageIndex: number) => void;
  currentPage?: number;
  className?: string;
}

interface OutlineItemProps {
  item: DocumentOutline;
  level: number;
  onNavigate: (pageIndex: number) => void;
  currentPage?: number;
}

const OutlineItem: React.FC<OutlineItemProps> = ({ 
  item, 
  level, 
  onNavigate, 
  currentPage 
}) => {
  const [isExpanded, setIsExpanded] = useState(level < 2); // 默认展开前两级
  const hasChildren = item.children && item.children.length > 0;
  const isCurrentPage = currentPage === item.pageIndex;

  const handleToggle = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleClick = () => {
    onNavigate(item.pageIndex);
  };

  const indentClass = `ml-${Math.min(level * 4, 16)}`;
  const levelColors = {
    1: 'text-blue-800 font-semibold',
    2: 'text-blue-600 font-medium',
    3: 'text-blue-500'
  };

  return (
    <div className="select-none">
      <div 
        className={`
          flex items-center py-1 px-2 rounded cursor-pointer transition-colors
          ${isCurrentPage ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}
          ${indentClass}
        `}
        onClick={handleClick}
      >
        {/* 展开/折叠图标 */}
        <div 
          className="w-4 h-4 mr-1 flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}
        >
          {hasChildren ? (
            isExpanded ? (
              <span className="text-gray-500">▼</span>
            ) : (
              <span className="text-gray-500">▶</span>
            )
          ) : (
            <div className="w-3 h-3" />
          )}
        </div>

        {/* 文档图标 */}
        <span className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0">📄</span>

        {/* 标题文本 */}
        <div className="flex-1 min-w-0">
          <div className={`
            text-sm truncate
            ${levelColors[item.level as keyof typeof levelColors] || 'text-gray-700'}
          `}>
            {item.title}
          </div>
          <div className="text-xs text-gray-500">
            第 {item.pageIndex + 1} 页
          </div>
        </div>
      </div>

      {/* 子项目 */}
      {hasChildren && isExpanded && (
        <div className="border-l border-gray-200 ml-2">
          {item.children!.map((child, index) => (
            <OutlineItem
              key={`${child.pageIndex}-${index}`}
              item={child}
              level={level + 1}
              onNavigate={onNavigate}
              currentPage={currentPage}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const DocumentOutlineComponent: React.FC<DocumentOutlineProps> = ({
  outline,
  onNavigate,
  currentPage,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // 过滤大纲项目
  const filteredOutline = searchTerm 
    ? filterOutline(outline, searchTerm.toLowerCase())
    : outline;

  return (
    <div className={`bg-white border-r border-gray-200 ${className}`}>
      {/* 标题 */}
      <div className="p-3 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">文档大纲</h2>
      </div>

      {/* 搜索框 */}
      <div className="p-3 border-b border-gray-200">
        <input
          type="text"
          placeholder="搜索大纲..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 大纲内容 */}
      <div className="overflow-y-auto flex-1">
        {filteredOutline.length > 0 ? (
          <div className="p-2">
            {filteredOutline.map((item, index) => (
              <OutlineItem
                key={`${item.pageIndex}-${index}`}
                item={item}
                level={0}
                onNavigate={onNavigate}
                currentPage={currentPage}
              />
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500">
            {searchTerm ? '未找到匹配的大纲项目' : '暂无大纲数据'}
          </div>
        )}
      </div>

      {/* 统计信息 */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600">
          共 {countOutlineItems(outline)} 个项目
        </div>
      </div>
    </div>
  );
};

// 辅助函数：过滤大纲
function filterOutline(outline: DocumentOutline[], searchTerm: string): DocumentOutline[] {
  const filtered: DocumentOutline[] = [];

  for (const item of outline) {
    const matchesTitle = item.title.toLowerCase().includes(searchTerm);
    const filteredChildren = item.children ? filterOutline(item.children, searchTerm) : [];
    
    if (matchesTitle || filteredChildren.length > 0) {
      filtered.push({
        ...item,
        children: filteredChildren.length > 0 ? filteredChildren : (item.children || [])
      });
    }
  }

  return filtered;
}

// 辅助函数：统计大纲项目数量
function countOutlineItems(outline: DocumentOutline[]): number {
  let count = outline.length;
  for (const item of outline) {
    if (item.children) {
      count += countOutlineItems(item.children);
    }
  }
  return count;
}

export default DocumentOutlineComponent; 