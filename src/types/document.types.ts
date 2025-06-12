// Document layout and OCR types
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutDetection {
  category_id: number;
  poly: number[]; // [x1, y1, x2, y2, x3, y3, x4, y4]
  score: number;
  text?: string;
}

export interface PageInfo {
  page_no: number;
  width: number;
  height: number;
}

export interface DocumentModelData {
  layout_dets: LayoutDetection[];
  page_info: PageInfo;
}

export interface TextSpan {
  bbox: number[];
  score: number;
  content: string;
  type: 'text';
}

export interface TextLine {
  bbox: number[];
  spans: TextSpan[];
  index?: number;
}

export interface VirtualLine {
  bbox: number[];
  spans: TextSpan[];
  index: number;
}

export interface TextBlock {
  type: 'title' | 'text' | 'list' | 'table' | 'image';
  bbox: number[];
  lines: TextLine[];
  index: number;
  virtual_lines?: VirtualLine[];
}

export interface DocumentMiddleData {
  pdf_info: Array<{
    preproc_blocks: TextBlock[];
  }>;
}

export interface ContentItem {
  type: 'text' | 'title' | 'list' | 'table';
  text: string;
  text_level?: number; // 1=title, 2=heading, 3=subheading, etc.
  page_idx: number;
}

export type DocumentContentList = ContentItem[];

// Layout categories mapping
export const LAYOUT_CATEGORIES = {
  0: 'title',
  1: 'text',
  2: 'list',
  3: 'table',
  4: 'figure',
  15: 'text_line' // OCR text line
} as const;

// Document parsing and navigation types
export interface DocumentOutline {
  title: string;
  level: number;
  pageIndex: number;
  bbox?: BoundingBox;
  children?: DocumentOutline[];
}

export interface SearchResult {
  text: string;
  pageIndex: number;
  bbox: BoundingBox;
  context: string;
  confidence: number;
}

export interface DocumentAnalysis {
  totalPages: number;
  outline: DocumentOutline[];
  searchIndex: Map<string, SearchResult[]>;
  pageTexts: Map<number, string>;
  structuredContent: ContentItem[];
} 