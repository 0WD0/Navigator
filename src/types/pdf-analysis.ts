// PDF高级布局分析类型定义

// 基础几何类型
export type BoundingBox = [number, number, number, number]; // [x1, y1, x2, y2]

// 页面信息
export interface PageInfo {
  page_idx: number;           // 页码，从0开始
  page_size: [number, number]; // [宽度, 高度]
  layout_bboxes: LayoutBox[];  // 布局分割结果
  para_blocks: Block[];       // 段落块结果
  images: ImageBlock[];       // 图像块
  tables: TableBlock[];       // 表格块
  interline_equations: EquationBlock[]; // 行间公式
  discarded_blocks: Block[];  // 需要丢弃的块
  _analysis_metadata?: AnalysisMetadata;
}

// 分析元数据
export interface AnalysisMetadata {
  parse_type: 'ocr' | 'txt';
  version_name: string;
  language?: string;
  confidence_scores?: QualityMetrics;
}

// 布局分析
export interface LayoutBox {
  layout_bbox: BoundingBox;
  layout_label: 'V' | 'H';    // 垂直(V)或水平(H)布局方向
  sub_layout: LayoutBox[];    // 子布局
  confidence?: number;
}

// 块类型枚举
export enum BlockType {
  // 一级块类型
  TABLE = 'table',
  IMAGE = 'image',
  
  // 二级块类型
  IMAGE_BODY = 'image_body',           // 图像主体
  IMAGE_CAPTION = 'image_caption',     // 图像描述
  TABLE_BODY = 'table_body',           // 表格主体
  TABLE_CAPTION = 'table_caption',     // 表格描述
  TABLE_FOOTNOTE = 'table_footnote',   // 表格脚注
  TEXT = 'text',                       // 文本块
  TITLE = 'title',                     // 标题块
  INTERLINE_EQUATION = 'interline_equation' // 块级公式
}

// 片段类型枚举
export enum SpanType {
  TEXT = 'text',                       // 文本
  IMAGE = 'image',                     // 图像
  TABLE = 'table',                     // 表格
  INLINE_EQUATION = 'inline_equation', // 行内公式
  INTERLINE_EQUATION = 'interline_equation' // 块级公式
}

// 基础块接口
export interface BaseBlock {
  type: BlockType;
  bbox: BoundingBox;
  id?: string;
  confidence?: number;
}

// 一级块（容器块）
export interface FirstLevelBlock extends BaseBlock {
  type: BlockType.TABLE | BlockType.IMAGE;
  blocks: SecondLevelBlock[];
}

// 二级块（内容块）
export interface SecondLevelBlock extends BaseBlock {
  lines: Line[];
}

// 行结构
export interface Line {
  bbox: BoundingBox;
  spans: Span[];
}

// 片段结构
export interface Span {
  bbox: BoundingBox;
  type: SpanType;
  content?: string;    // 文本片段使用
  img_path?: string;   // 图表片段使用
  score?: number;      // 置信度分数
  style?: TextStyle;   // 文本样式信息
}

// 文本样式
export interface TextStyle {
  font_family?: string;
  font_size?: number;
  is_bold?: boolean;
  is_italic?: boolean;
  color?: string;
}

// 特殊块类型 - 继承BaseBlock并添加特殊属性
export interface ImageBlock extends BaseBlock {
  type: BlockType.IMAGE;
  image_path: string;
  alt_text?: string;
  caption?: string;
}

export interface TableBlock extends BaseBlock {
  type: BlockType.TABLE;
  rows: TableRow[];
  headers?: string[];
  caption?: string;
}

export interface TableRow {
  cells: TableCell[];
}

export interface TableCell {
  content: string;
  bbox: BoundingBox;
  colspan?: number;
  rowspan?: number;
}

export interface EquationBlock extends BaseBlock {
  type: BlockType.INTERLINE_EQUATION;
  latex?: string;
  mathml?: string;
  image_path?: string;
}

// 通用块类型 - 现在包含所有可能的块类型
export type Block = FirstLevelBlock | SecondLevelBlock | ImageBlock | TableBlock | EquationBlock;

// 文档结构树
export interface DocumentTree {
  root: TreeNode;
  metadata: DocumentMetadata;
}

export interface TreeNode {
  id: string;
  type: BlockType;
  title: string;
  bbox: BoundingBox;
  children: TreeNode[];
  parent?: TreeNode;
  level: number;
  block_ref?: Block;
}

export interface DocumentMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creation_date?: Date;
  modification_date?: Date;
  total_pages: number;
}

// 质量指标
export interface QualityMetrics {
  layout_accuracy: number;        // 布局检测准确率
  text_extraction_rate: number;   // 文本提取完整率
  structure_consistency: number;  // 结构一致性
  overall_confidence: number;     // 总体置信度
}

// 分析状态
export interface AnalysisState {
  status: 'idle' | 'processing' | 'completed' | 'error';
  progress: number; // 0-100
  currentPage?: number;
  totalPages?: number;
  error?: string;
  startTime?: Date;
  endTime?: Date;
}

// 用户标注
export interface UserAnnotation {
  id: string;
  block_id: string;
  annotation_type: 'correction' | 'enhancement' | 'comment';
  content: string;
  position?: BoundingBox;
  created_at: Date;
  user_id?: string;
}

// 块关系
export interface BlockRelation {
  id: string;
  source_block_id: string;
  target_block_id: string;
  relation_type: 'caption' | 'reference' | 'footnote' | 'continuation';
  confidence: number;
  created_at: Date;
}

// 分析配置
export interface AnalysisConfig {
  enable_ocr: boolean;
  enable_table_detection: boolean;
  enable_formula_detection: boolean;
  enable_image_analysis: boolean;
  language: string;
  quality_threshold: number;
  max_processing_time?: number; // 毫秒
}

// 处理器接口
export interface PDFAnalysisProcessor {
  analyze(file: File, config: AnalysisConfig): Promise<PageInfo[]>;
  analyzePages(pages: number[], config: AnalysisConfig): Promise<PageInfo[]>;
  getProgress(): AnalysisState;
  cancel(): void;
}

// 缓存接口
export interface AnalysisCache {
  get(fileHash: string): PageInfo[] | null;
  set(fileHash: string, result: PageInfo[]): void;
  delete(fileHash: string): void;
  clear(): void;
  size(): number;
}

// 导出配置
export interface ExportConfig {
  format: 'json' | 'xml' | 'markdown' | 'html';
  include_images: boolean;
  include_tables: boolean;
  include_formulas: boolean;
  include_metadata: boolean;
}

// 搜索配置
export interface SearchConfig {
  query: string;
  search_type: 'text' | 'structure' | 'semantic';
  block_types?: BlockType[];
  page_range?: [number, number];
  case_sensitive?: boolean;
  use_regex?: boolean;
}

// 搜索结果
export interface SearchResult {
  matches: SearchMatch[];
  total_count: number;
  query_time: number;
}

export interface SearchMatch {
  block: Block;
  page_index: number;
  match_text: string;
  match_position: BoundingBox;
  confidence: number;
  context?: string;
} 