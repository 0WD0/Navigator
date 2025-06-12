# 布局查看器使用指南

## 概述

布局查看器是一个强大的工具，可以加载和显示OCR和布局分析数据，为PDF文档提供智能导航和分析功能。

## 功能特性

### 🎯 核心功能
- **智能文件加载** - 支持model.json、middle.json、content_list.json三种格式
- **可视化布局** - 在SVG画布上显示布局检测结果
- **文档大纲** - 自动生成层次化的文档结构
- **快捷键操作** - 支持vim风格的键盘导航

### 📊 支持的数据格式

#### 1. Model Data (model.json)
```json
[
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
]
```

#### 2. Middle Data (middle.json)
```json
{
  "pdf_info": [
    {
      "preproc_blocks": [
        {
          "type": "title",
          "bbox": [148, 88, 445, 118],
          "lines": [...]
        }
      ]
    }
  ]
}
```

#### 3. Content List (content_list.json)
```json
[
  {
    "type": "title",
    "text": "LICENCE AGREEMENT",
    "page_idx": 0,
    "text_level": 1
  }
]
```

## 快捷键

| 快捷键 | 功能 | 描述 |
|--------|------|------|
| `Ctrl+L` | 加载布局文件 | 依次选择三个JSON文件 |
| `Ctrl+O` | 切换文档大纲 | 显示/隐藏文档结构树 |
| `Ctrl+Shift+L` | 切换布局视图 | 显示/隐藏布局可视化 |

## 使用步骤

### 1. 准备数据文件
确保你有以下三个JSON文件：
- `*_model.json` - 布局检测结果
- `*_middle.json` - 结构化文本数据
- `*_content_list.json` - 内容列表

### 2. 加载文件
- 按 `Ctrl+L` 或点击"选择文件"按钮
- 依次选择三个JSON文件（按提示顺序）
- 系统会自动解析和加载数据

### 3. 查看布局
- 布局视图会自动显示
- 不同类型的区域用不同颜色标识：
  - 🔵 标题 (title) - 蓝色
  - 🟢 文本 (text) - 绿色  
  - 🟡 列表 (list) - 黄色
  - 🔴 表格 (table) - 红色
  - 🟣 图片 (figure) - 紫色

### 4. 导航操作
- 使用页面选择器切换页面
- 点击大纲项目快速跳转
- 使用复选框控制显示选项

## 组件集成

### 在React应用中使用

```tsx
import { PDFViewerWithLayout } from '@/components/PDFViewerWithLayout';
import { useKeyboard } from '@/hooks/useKeyboard';

function App() {
  // 启用键盘支持
  useKeyboard();
  
  return (
    <div className="h-screen">
      <PDFViewerWithLayout />
    </div>
  );
}
```

### 单独使用布局查看器

```tsx
import { LayoutViewer } from '@/components/LayoutViewer';

function MyComponent() {
  return (
    <LayoutViewer className="w-full h-96" />
  );
}
```

### 使用布局管理器Hook

```tsx
import { useLayoutManager } from '@/hooks/useLayoutManager';

function MyComponent() {
  const layoutManager = useLayoutManager();
  
  const handleLoadFiles = async () => {
    await layoutManager.loadLayoutFiles();
  };
  
  return (
    <div>
      <button onClick={handleLoadFiles}>
        加载文件
      </button>
      {layoutManager.hasFiles && (
        <div>已加载 {layoutManager.totalPages} 页</div>
      )}
    </div>
  );
}
```

## 高级功能

### 1. 搜索功能
```tsx
const { analysis, search } = useDocumentParser();

// 搜索文本
const results = search('licence agreement', {
  caseSensitive: false,
  wholeWord: true,
  maxResults: 10
});
```

### 2. 导出分析结果
```tsx
const { exportAnalysis } = useDocumentParser();

// 导出为JSON
const analysisData = exportAnalysis();
if (analysisData) {
  // 保存或处理分析结果
  console.log(JSON.parse(analysisData));
}
```

### 3. 自定义布局类型
```tsx
// 在 document.types.ts 中扩展
export const LAYOUT_CATEGORIES = {
  0: 'text',
  1: 'title', 
  2: 'list',
  3: 'table',
  4: 'figure',
  // 添加自定义类型
  5: 'custom_type'
} as const;
```

## 故障排除

### 常见问题

1. **文件加载失败**
   - 检查JSON文件格式是否正确
   - 确保文件编码为UTF-8
   - 验证数据结构是否符合预期

2. **布局显示异常**
   - 检查坐标数据是否正确
   - 确认页面尺寸信息
   - 验证边界框数据格式

3. **快捷键不响应**
   - 确保已调用 `useKeyboard()` Hook
   - 检查是否有其他组件拦截键盘事件
   - 验证焦点是否在正确的元素上

### 调试技巧

1. **启用调试日志**
```tsx
// 在开发环境中查看控制台输出
console.log('布局数据:', layoutManager.files);
console.log('分析结果:', layoutManager.analysis);
```

2. **检查数据结构**
```tsx
// 验证加载的数据
const currentLayout = layoutManager.getCurrentPageLayout();
const currentContent = layoutManager.getCurrentPageContent();
```

## 性能优化

### 大文件处理
- 对于大型文档，考虑分页加载
- 使用虚拟滚动优化长列表
- 延迟加载非关键数据

### 内存管理
- 及时清理不需要的数据
- 使用 React.memo 优化组件渲染
- 避免在渲染函数中创建大对象

## 扩展开发

### 添加新的布局类型
1. 更新 `LAYOUT_CATEGORIES` 常量
2. 在 `LayoutViewer` 中添加对应的颜色和样式
3. 更新类型定义

### 集成PDF查看器
1. 在 `PDFViewerWithLayout` 中替换占位符区域
2. 同步页面导航状态
3. 实现布局覆盖显示

### 自定义主题
1. 扩展颜色配置
2. 添加主题切换功能
3. 支持用户自定义样式

## 更新日志

### v1.0.0
- 初始版本发布
- 支持基本的布局查看功能
- 实现快捷键操作
- 添加文档大纲功能 