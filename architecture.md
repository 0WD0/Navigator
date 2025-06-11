# Navigator - 引用导航器技术架构设计

## 核心理念
以引用为根基的信息收集系统，通过广义批注建立知识网络，实现多媒体信息的统一导航和管理。

## 整体架构

### 1. 分层架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    用户界面层 (UI Layer)                      │
├─────────────────────────────────────────────────────────────┤
│                    视图控制层 (View Layer)                    │
├─────────────────────────────────────────────────────────────┤
│                   导航服务层 (Navigation Layer)               │
├─────────────────────────────────────────────────────────────┤
│                    批注引擎层 (Annotation Engine)             │
├─────────────────────────────────────────────────────────────┤
│                    媒体处理层 (Media Processing Layer)        │
├─────────────────────────────────────────────────────────────┤
│                    数据存储层 (Data Storage Layer)            │
└─────────────────────────────────────────────────────────────┘
```

### 2. 核心组件设计

#### 2.1 用户界面层 (UI Layer)
**技术栈**: Electron + React/Vue + CSS
**职责**: 
- vim-friendly 键盘控制系统
- 多视图切换界面
- 实时预览和编辑界面

```typescript
// 键盘控制系统
interface KeyboardController {
  registerCommand(keys: string, action: Action): void;
  enterMode(mode: 'normal' | 'insert' | 'visual'): void;
  handleKeySequence(sequence: string): void;
}

// 视图管理器
interface ViewManager {
  switchView(type: ViewType): void;
  getCurrentView(): ViewInstance;
  registerView(view: ViewPlugin): void;
}
```

#### 2.2 视图控制层 (View Layer)
**核心视图类型**:
- **PreviewView**: PDF 原生显示，支持空间方位跳转
- **OutlineView**: 文档大纲结构树
- **TextOnlyView**: 纯文本模式，支持句级跳转
- **GraphView**: 引用关系图谱
- **AnnotationView**: 批注管理视图

```typescript
interface ViewPlugin {
  type: ViewType;
  render(content: MediaContent): ViewElement;
  getNavigationOptions(): NavigationOption[];
  handleJump(target: JumpTarget): void;
}

interface NavigationOption {
  type: 'spatial' | 'semantic' | 'structural';
  granularity: 'page' | 'paragraph' | 'sentence' | 'word';
  direction: string[];
}
```

#### 2.3 导航服务层 (Navigation Layer)
**功能**:
- 跳转路径规划和执行
- 上下文关系维护
- 历史记录管理

```typescript
interface NavigationService {
  jump(from: Reference, to: Reference): Promise<void>;
  findPath(source: Reference, target: Reference): Path[];
  getContext(reference: Reference): Context;
  buildRelationGraph(): RelationGraph;
}

interface Reference {
  id: string;
  source: MediaSource;
  location: Location;
  type: 'direct' | 'causal' | 'semantic';
}
```

#### 2.4 批注引擎层 (Annotation Engine)
**功能**:
- 批注创建、编辑、删除
- 引用关系建立
- 因果关系推理

```typescript
interface AnnotationEngine {
  createAnnotation(target: Target, content: string, type: AnnotationType): Annotation;
  linkReferences(source: Reference, target: Reference, relation: RelationType): void;
  inferCausalRelations(annotations: Annotation[]): CausalChain[];
  extractKnowledge(): KnowledgeGraph;
}

interface Annotation {
  id: string;
  target: Target;
  content: string;
  type: 'highlight' | 'note' | 'link' | 'causal';
  metadata: AnnotationMetadata;
  relations: Reference[];
}
```

#### 2.5 媒体处理层 (Media Processing Layer)
**PDF 处理引擎**:
- **PDF.js**: PDF 渲染和文本提取
- **Layout Detection**: 页面布局分析
- **OCR Engine** (可选): 扫描文档处理

```typescript
interface MediaProcessor {
  loadMedia(source: string): Promise<MediaContent>;
  extractText(media: MediaContent): Promise<TextContent>;
  detectLayout(page: PageContent): Promise<LayoutRegion[]>;
  extractStructure(media: MediaContent): Promise<DocumentStructure>;
}

interface LayoutRegion {
  id: string;
  bounds: Rectangle;
  type: 'text' | 'image' | 'table' | 'header';
  content: string;
  neighbors: SpatialRelation[];
}
```

#### 2.6 数据存储层 (Data Storage Layer)
**存储方案**:
- **SQLite**: 本地结构化数据存储
- **File System**: 媒体文件和缓存
- **Graph Database** (可选): 复杂关系存储

```sql
-- 核心数据模型
CREATE TABLE media_sources (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    path TEXT NOT NULL,
    metadata JSON
);

CREATE TABLE annotations (
    id TEXT PRIMARY KEY,
    source_id TEXT REFERENCES media_sources(id),
    target_location JSON NOT NULL,
    content TEXT,
    type TEXT,
    created_at TIMESTAMP
);

CREATE TABLE references (
    id TEXT PRIMARY KEY,
    source_annotation_id TEXT REFERENCES annotations(id),
    target_annotation_id TEXT REFERENCES annotations(id),
    relation_type TEXT,
    strength REAL
);
```

### 3. 技术栈选择

#### 前端技术栈
- **框架**: Electron (跨平台桌面应用)
- **UI 框架**: React 18 + TypeScript
- **状态管理**: Zustand 或 Redux Toolkit
- **样式**: Tailwind CSS + CSS Modules
- **PDF 渲染**: PDF.js
- **图表**: D3.js (关系图谱)

#### 后端技术栈
- **运行时**: Node.js
- **数据库**: SQLite + Better-SQLite3
- **文件处理**: 
  - PDF: PDF-lib, PDF2pic
  - 文本处理: Natural.js
  - OCR: Tesseract.js (可选)

#### 开发工具
- **构建工具**: Vite + Electron Builder
- **代码质量**: ESLint + Prettier + Husky
- **测试**: Vitest + Testing Library
- **文档**: TypeDoc

### 4. 关键技术实现

#### 4.1 Vim-friendly 键盘控制
```typescript
class VimController {
  private mode: 'normal' | 'insert' | 'visual' = 'normal';
  private commandBuffer: string = '';
  
  // 核心快捷键映射
  private keyMaps = {
    normal: {
      'h': () => this.navigate('left'),
      'j': () => this.navigate('down'), 
      'k': () => this.navigate('up'),
      'l': () => this.navigate('right'),
      'gg': () => this.jumpToStart(),
      'G': () => this.jumpToEnd(),
      '/': () => this.enterSearchMode(),
      ':': () => this.enterCommandMode(),
      'gd': () => this.jumpToDefinition(),
      'gr': () => this.jumpToReferences(),
    }
  };
}
```

#### 4.2 智能跳转系统
```typescript
class SmartNavigation {
  async jump(context: NavigationContext): Promise<void> {
    const currentView = this.viewManager.getCurrentView();
    const jumpStrategy = this.getJumpStrategy(currentView.type, context);
    
    switch (jumpStrategy.type) {
      case 'spatial':
        return this.spatialJump(context);
      case 'semantic':
        return this.semanticJump(context);
      case 'structural':
        return this.structuralJump(context);
    }
  }
  
  private spatialJump(context: NavigationContext): void {
    // 基于布局检测的空间跳转
    const regions = this.layoutDetector.getRegions(context.page);
    const targetRegion = this.findNearestRegion(context.direction, regions);
    this.viewManager.focusRegion(targetRegion);
  }
}
```

### 5. 项目结构

```
navigator/
├── src/
│   ├── main/                 # Electron 主进程
│   ├── renderer/             # 渲染进程 (React UI)
│   │   ├── components/       # UI 组件
│   │   ├── views/           # 视图实现
│   │   ├── services/        # 业务服务
│   │   └── utils/           # 工具函数
│   ├── shared/              # 共享代码
│   │   ├── types/           # TypeScript 类型定义
│   │   ├── models/          # 数据模型
│   │   └── interfaces/      # 接口定义
│   └── plugins/             # 插件系统
├── resources/               # 静态资源
├── docs/                   # 文档
├── tests/                  # 测试
└── scripts/                # 构建脚本
```

### 6. 实施路线图

#### Phase 1: MVP (最小可行产品)
- [ ] 基础 PDF 查看器
- [ ] 简单批注功能
- [ ] 基础键盘导航
- [ ] 数据持久化

#### Phase 2: 核心功能
- [ ] 多视图支持
- [ ] 智能跳转系统
- [ ] 引用关系管理
- [ ] 搜索功能

#### Phase 3: 高级功能
- [ ] 关系图谱可视化
- [ ] 插件系统
- [ ] 多媒体支持扩展
- [ ] 知识导出功能

### 7. 性能考虑

- **懒加载**: 大文档分页加载
- **缓存策略**: 智能缓存常用内容
- **索引优化**: 全文搜索索引
- **内存管理**: 及时释放未使用资源

这个架构设计充分体现了您的理念，将引用和批注作为核心，实现了多视图、智能跳转和 vim-friendly 的交互体验。 
