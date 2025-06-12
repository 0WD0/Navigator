# 大纲提取功能使用指南

## 概述

Navigator 的大纲提取功能基于 `text_level` 字段自动构建文档的层次结构。该功能支持1-3级标题，并能自动处理层级关系。

## 基本用法

### 1. 使用 DocumentParserService

```typescript
import { DocumentParserService } from '@/services/document-parser.service';
import { ContentItem } from '@/types/document.types';

// 获取解析器实例
const parser = DocumentParserService.getInstance();

// 准备内容数据（包含 text_level 字段）
const contentList: ContentItem[] = [
  {
    type: 'title',
    text: '第一章 引言',
    text_level: 1,
    page_idx: 0
  },
  {
    type: 'title',
    text: '1.1 背景',
    text_level: 2,
    page_idx: 0
  },
  {
    type: 'title',
    text: '1.2 目标',
    text_level: 2,
    page_idx: 1
  },
  {
    type: 'title',
    text: '第二章 方法论',
    text_level: 1,
    page_idx: 2
  }
];

// 提取大纲
const outline = parser.buildOutline(contentList);
console.log('文档大纲:', outline);
```

### 2. 在组件中使用

```typescript
import { useLayoutManager } from '@/hooks/useLayoutManager';
import { DocumentOutlineComponent } from '@/components/DocumentOutline';

function PDFViewer() {
  const { analysis, isLoading } = useLayoutManager();

  if (isLoading) return <div>加载中...</div>;
  
  if (!analysis) return <div>请先加载文档</div>;

  return (
    <div className="flex h-screen">
      {/* 大纲侧边栏 */}
      <DocumentOutlineComponent
        outline={analysis.outline}
        onNavigate={(pageIndex) => {
          console.log('跳转到页面:', pageIndex + 1);
        }}
        currentPage={0}
        className="w-80"
      />
      
      {/* PDF 内容区域 */}
      <div className="flex-1">
        {/* 你的 PDF 查看器 */}
      </div>
    </div>
  );
}
```

## 高级功能

### 1. 大纲统计

```typescript
const stats = parser.getOutlineStats(outline);
console.log('大纲统计:', {
  totalItems: stats.totalItems,        // 总项目数
  levelCounts: stats.levelCounts,      // 各级别数量 {1: 2, 2: 4, 3: 1}
  maxDepth: stats.maxDepth,            // 最大深度
  pageSpan: stats.pageSpan             // 页面范围 {start: 0, end: 5}
});
```

### 2. 大纲搜索

```typescript
// 搜索包含特定关键词的标题
const searchResults = parser.searchOutline(outline, '方法');
console.log('搜索结果:', searchResults);

// 搜索结果包含完整的大纲项目信息
searchResults.forEach(item => {
  console.log(`找到: ${item.title} (第${item.pageIndex + 1}页, ${item.level}级标题)`);
});
```

### 3. 获取页面大纲

```typescript
// 获取特定页面的所有大纲项目
const pageItems = parser.getOutlineItemsForPage(outline, 2);
console.log('第3页的标题:', pageItems);
```

### 4. 扁平化大纲

```typescript
// 将层次结构转换为扁平列表（用于导出或显示）
const flattened = parser.flattenOutline(outline);
flattened.forEach(item => {
  const indent = '  '.repeat(item.depth);
  console.log(`${indent}${item.path} ${item.title} (第${item.pageIndex + 1}页)`);
});

// 输出示例:
// 1 第一章 引言 (第1页)
//   1.1 1.1 背景 (第1页)
//   1.2 1.2 目标 (第2页)
// 2 第二章 方法论 (第3页)
```

### 5. 大纲验证

```typescript
// 验证大纲结构的完整性
const validation = parser.validateOutline(outline);

if (validation.isValid) {
  console.log('大纲结构正确');
} else {
  console.log('发现问题:');
  validation.issues.forEach(issue => {
    console.log(`- ${issue}`);
  });
}
```

## 数据格式要求

### ContentItem 结构

```typescript
interface ContentItem {
  type: 'text' | 'title' | 'list' | 'table';
  text: string;           // 文本内容
  text_level?: number;    // 标题级别 (1-3)，只有标题需要
  page_idx: number;       // 页面索引（从0开始）
}
```

### 重要说明

1. **text_level 字段**：只有包含 `text_level` 字段且值在 1-3 之间的项目才会被识别为标题
2. **层级处理**：系统会自动处理层级关系，确保子标题正确归属于父标题
3. **页面索引**：`page_idx` 从 0 开始，表示文档的页面位置

## 输出格式

### DocumentOutline 结构

```typescript
interface DocumentOutline {
  title: string;              // 标题文本
  level: number;              // 标题级别 (1-3)
  pageIndex: number;          // 页面索引
  bbox?: BoundingBox;         // 可选的边界框信息
  children?: DocumentOutline[]; // 子标题数组
}
```

### 示例输出

```json
[
  {
    "title": "第一章 引言",
    "level": 1,
    "pageIndex": 0,
    "children": [
      {
        "title": "1.1 背景",
        "level": 2,
        "pageIndex": 0,
        "children": []
      },
      {
        "title": "1.2 目标",
        "level": 2,
        "pageIndex": 1,
        "children": []
      }
    ]
  },
  {
    "title": "第二章 方法论",
    "level": 1,
    "pageIndex": 2,
    "children": []
  }
]
```

## 最佳实践

### 1. 数据预处理

```typescript
// 确保数据质量
const cleanContentList = contentList.filter(item => {
  // 过滤掉空标题
  if (item.text_level && !item.text.trim()) {
    return false;
  }
  return true;
});

const outline = parser.buildOutline(cleanContentList);
```

### 2. 错误处理

```typescript
try {
  const outline = parser.buildOutline(contentList);
  const validation = parser.validateOutline(outline);
  
  if (!validation.isValid) {
    console.warn('大纲结构存在问题:', validation.issues);
    // 可以选择继续使用或进行修复
  }
  
  return outline;
} catch (error) {
  console.error('大纲提取失败:', error);
  return [];
}
```

### 3. 性能优化

```typescript
// 对于大型文档，可以使用 useMemo 缓存结果
const outline = useMemo(() => {
  if (!contentList || contentList.length === 0) return [];
  return parser.buildOutline(contentList);
}, [contentList]);
```

## 集成示例

### 完整的 PDF 查看器集成

```typescript
import React from 'react';
import { useLayoutManager } from '@/hooks/useLayoutManager';
import { DocumentOutlineComponent } from '@/components/DocumentOutline';

export function PDFNavigator() {
  const {
    analysis,
    isLoading,
    error,
    selectedPage,
    setSelectedPage,
    loadLayoutFiles
  } = useLayoutManager();

  const handleOutlineNavigation = (pageIndex: number) => {
    setSelectedPage(pageIndex);
    // 可以添加平滑滚动或其他导航效果
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">
      <div>正在解析文档...</div>
    </div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-500">
      <div>错误: {error}</div>
    </div>;
  }

  if (!analysis) {
    return <div className="flex items-center justify-center h-screen">
      <button 
        onClick={loadLayoutFiles}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        加载文档
      </button>
    </div>;
  }

  return (
    <div className="flex h-screen">
      {/* 大纲侧边栏 */}
      <div className="w-80 border-r border-gray-200 bg-gray-50">
        <DocumentOutlineComponent
          outline={analysis.outline}
          onNavigate={handleOutlineNavigation}
          currentPage={selectedPage}
          className="h-full"
        />
      </div>
      
      {/* PDF 内容区域 */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">
            第 {selectedPage + 1} 页 / 共 {analysis.totalPages} 页
          </h2>
          
          {/* 显示当前页面的大纲项目 */}
          {analysis.outline && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">本页标题:</h3>
              {parser.getOutlineItemsForPage(analysis.outline, selectedPage).map((item, index) => (
                <div key={index} className="text-sm text-gray-600">
                  {'  '.repeat(item.level - 1)}• {item.title}
                </div>
              ))}
            </div>
          )}
          
          {/* 这里放置你的 PDF 渲染组件 */}
          <div className="border border-gray-300 bg-white min-h-96">
            PDF 内容区域
          </div>
        </div>
      </div>
    </div>
  );
}
```

这个大纲提取功能现在已经完全实现，支持基于 `text_level` 字段的智能大纲构建，并提供了丰富的辅助功能来处理和展示文档结构。 