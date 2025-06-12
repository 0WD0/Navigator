# 智能文档解析系统使用指南

## 概述

基于你提供的OCR和布局分析数据，我们已经为PDF导航器创建了一个完整的**智能文档解析和导航系统**。

## 数据格式支持

### 1. Model Data (模型数据)
```json
{
  "layout_dets": [
    {
      "category_id": 1,
      "poly": [195, 410, 1464, 410, 1464, 579, 195, 579],
      "score": 0.966,
      "text": "LICENCE AGREEMENT"
    }
  ],
  "page_info": {
    "page_no": 0,
    "width": 1654,
    "height": 2339
  }
}
```

### 2. Middle Data (中间数据)
```json
{
  "pdf_info": [
    {
      "preproc_blocks": [
        {
          "type": "title",
          "bbox": [148, 88, 445, 118],
          "lines": [
            {
              "bbox": [149, 92, 444, 117],
              "spans": [
                {
                  "bbox": [149, 92, 444, 117],
                  "score": 1.0,
                  "content": "LICENCE AGREEMENT",
                  "type": "text"
                }
              ]
            }
          ],
          "index": 1
        }
      ]
    }
  ]
}
```

### 3. Content List (内容列表)
```json
[
  {
    "type": "text",
    "text": "LICENCE AGREEMENT",
    "text_level": 1,
    "page_idx": 0
  },
  {
    "type": "text", 
    "text": "This Software Licence Agreement...",
    "page_idx": 0
  }
]
```

## 功能特性

### ✨ 智能文档大纲
- 自动识别标题层级（1-3级）
- 生成可折叠的树形结构
- 支持搜索和过滤
- 点击直接跳转到相应页面

### 🔍 全文搜索
- 基于索引的快速搜索
- 支持大小写敏感/不敏感
- 支持整词匹配
- 提供搜索结果上下文

### 📍 精确定位
- 基于布局数据的边界框定位
- 支持页面内容区域高亮
- 文本块类型识别（标题、正文、列表、表格）

### 📊 文档分析
- 统计文档结构信息
- 内容类型分布分析
- 页面内容统计

## 使用示例

### 基础用法

```typescript
import { useDocumentParser } from '@/hooks/useDocumentParser';
import DocumentOutlineComponent from '@/components/DocumentOutline';

function PDFViewer() {
  const { 
    analysis, 
    isLoading, 
    error, 
    loadDocument, 
    search 
  } = useDocumentParser();

  // 加载文档数据
  useEffect(() => {
    const loadData = async () => {
      const modelData = await fetch('/api/model-data').then(r => r.json());
      const middleData = await fetch('/api/middle-data').then(r => r.json());
      const contentList = await fetch('/api/content-list').then(r => r.json());
      
      await loadDocument(modelData, middleData, contentList);
    };
    
    loadData();
  }, []);

  // 搜索功能
  const handleSearch = (query: string) => {
    const results = search(query, {
      caseSensitive: false,
      maxResults: 20
    });
    console.log('搜索结果:', results);
  };

  if (isLoading) return <div>解析中...</div>;
  if (error) return <div>错误: {error}</div>;

  return (
    <div className="flex h-screen">
      {/* 文档大纲侧边栏 */}
      {analysis && (
        <DocumentOutlineComponent
          outline={analysis.outline}
          onNavigate={(pageIndex) => {
            // 跳转到指定页面
            console.log('跳转到页面:', pageIndex);
          }}
          currentPage={0}
          className="w-80"
        />
      )}
      
      {/* PDF查看器主体 */}
      <div className="flex-1">
        {/* 你的PDF查看器组件 */}
      </div>
    </div>
  );
}
```

### 高级搜索

```typescript
// 搜索特定内容
const searchResults = search('licence agreement', {
  caseSensitive: false,
  wholeWord: true,
  maxResults: 10
});

// 处理搜索结果
searchResults.forEach(result => {
  console.log(`页面 ${result.pageIndex + 1}: ${result.context}`);
});
```

### 获取页面布局

```typescript
import { DocumentParserService } from '@/services/document-parser.service';

const parser = DocumentParserService.getInstance();

// 获取第一页的布局信息
const pageLayout = parser.getPageLayout(modelData, 0);
if (pageLayout) {
  console.log('页面信息:', pageLayout.pageInfo);
  console.log('文本块:', pageLayout.blocks);
}
```

### 导出分析结果

```typescript
// 导出文档分析结果
const analysisJson = exportAnalysis();
if (analysisJson) {
  // 保存到文件或发送到服务器
  console.log('分析结果:', analysisJson);
}
```

## 数据处理流程

1. **布局检测数据** → 识别文本区域和类型
2. **结构化数据** → 提取文本内容和层次
3. **内容列表** → 构建最终的文档结构
4. **智能分析** → 生成大纲、索引和导航

## 集成到现有系统

### 1. 添加到PDF查看器

```typescript
// 在现有的PDF组件中集成
function PDFNavigator() {
  const { analysis } = useDocumentParser();
  
  return (
    <div className="pdf-container">
      {/* 现有的PDF查看器 */}
      <PDFViewer />
      
      {/* 新增的智能导航 */}
      {analysis && (
        <SmartNavigation 
          analysis={analysis}
          onNavigate={handlePageNavigation}
        />
      )}
    </div>
  );
}
```

### 2. 快捷键集成

```typescript
// 集成到现有的键盘导航系统
const keyBindings = {
  'ctrl+f': () => {
    // 打开智能搜索
    setSearchMode(true);
  },
  'ctrl+o': () => {
    // 切换大纲显示
    setShowOutline(!showOutline);
  }
};
```

## 优势

1. **智能化**: 自动识别文档结构，无需手动配置
2. **高效**: 基于索引的快速搜索和导航
3. **精确**: 基于布局数据的精确定位
4. **灵活**: 支持多种数据格式和自定义配置
5. **可扩展**: 模块化设计，易于集成和扩展

## 性能优化

- 搜索索引预构建
- 大纲数据懒加载
- 页面布局按需计算
- 支持虚拟滚动（大文档）

这个系统充分利用了你提供的OCR和布局分析数据，为PDF导航器添加了强大的智能导航和搜索功能！ 