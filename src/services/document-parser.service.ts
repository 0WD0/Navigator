import {
  DocumentModelData,
  DocumentMiddleData,
  DocumentContentList,
  DocumentAnalysis,
  DocumentOutline,
  SearchResult,
  BoundingBox,
  ContentItem,
  TextBlock,
  LAYOUT_CATEGORIES
} from '@/types/document.types';

export class DocumentParserService {
  private static instance: DocumentParserService;
  
  static getInstance(): DocumentParserService {
    if (!DocumentParserService.instance) {
      DocumentParserService.instance = new DocumentParserService();
    }
    return DocumentParserService.instance;
  }

  /**
   * 解析完整的文档数据
   */
  public async parseDocument(
    modelData: DocumentModelData[],
    middleData: DocumentMiddleData,
    contentList: DocumentContentList
  ): Promise<DocumentAnalysis> {
    
    const outline = this.buildOutline(contentList);
    const searchIndex = this.buildSearchIndex(contentList);
    const pageTexts = this.extractPageTexts(contentList);
    
    return {
      totalPages: modelData.length,
      outline,
      searchIndex,
      pageTexts,
      structuredContent: contentList
    };
  }

  /**
   * 从内容列表构建文档大纲
   */
  private buildOutline(contentList: ContentItem[]): DocumentOutline[] {
    const outline: DocumentOutline[] = [];
    const stack: DocumentOutline[] = [];

    for (const item of contentList) {
      if (item.text_level && item.text_level <= 3) { // 标题级别1-3
        const outlineItem: DocumentOutline = {
          title: item.text.trim(),
          level: item.text_level,
          pageIndex: item.page_idx,
          children: []
        };

        // 处理层级关系
        while (stack.length > 0 && stack[stack.length - 1].level >= outlineItem.level) {
          stack.pop();
        }

        if (stack.length === 0) {
          outline.push(outlineItem);
        } else {
          const parent = stack[stack.length - 1];
          if (!parent.children) parent.children = [];
          parent.children.push(outlineItem);
        }

        stack.push(outlineItem);
      }
    }

    return outline;
  }

  /**
   * 构建搜索索引
   */
  private buildSearchIndex(contentList: ContentItem[]): Map<string, SearchResult[]> {
    const searchIndex = new Map<string, SearchResult[]>();

    for (const item of contentList) {
      const words = this.tokenizeText(item.text);
      
      for (const word of words) {
        const key = word.toLowerCase();
        if (!searchIndex.has(key)) {
          searchIndex.set(key, []);
        }

        const result: SearchResult = {
          text: word,
          pageIndex: item.page_idx,
          bbox: { x: 0, y: 0, width: 0, height: 0 }, // 需要从布局数据获取
          context: this.getContext(item.text, word),
          confidence: 1.0
        };

        searchIndex.get(key)!.push(result);
      }
    }

    return searchIndex;
  }

  /**
   * 提取每页文本
   */
  private extractPageTexts(contentList: ContentItem[]): Map<number, string> {
    const pageTexts = new Map<number, string>();

    for (const item of contentList) {
      const pageIndex = item.page_idx;
      if (!pageTexts.has(pageIndex)) {
        pageTexts.set(pageIndex, '');
      }
      
      const currentText = pageTexts.get(pageIndex)!;
      pageTexts.set(pageIndex, currentText + '\n' + item.text);
    }

    return pageTexts;
  }

  /**
   * 文本分词
   */
  private tokenizeText(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, ' ') // 保留中英文字符
      .split(/\s+/)
      .filter(word => word.length > 1);
  }

  /**
   * 获取搜索结果的上下文
   */
  private getContext(text: string, word: string, contextLength: number = 50): string {
    const index = text.toLowerCase().indexOf(word.toLowerCase());
    if (index === -1) return text.substring(0, contextLength);

    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + word.length + contextLength);
    
    return text.substring(start, end);
  }

  /**
   * 在文档中搜索
   */
  public search(
    analysis: DocumentAnalysis, 
    query: string, 
    options: {
      caseSensitive?: boolean;
      wholeWord?: boolean;
      maxResults?: number;
    } = {}
  ): SearchResult[] {
    const {
      caseSensitive = false,
      wholeWord = false,
      maxResults = 50
    } = options;

    const results: SearchResult[] = [];
    const searchTerm = caseSensitive ? query : query.toLowerCase();

    // 在搜索索引中查找
    if (analysis.searchIndex.has(searchTerm)) {
      results.push(...analysis.searchIndex.get(searchTerm)!);
    }

    // 如果索引中没有找到，在全文中搜索
    if (results.length === 0) {
      for (const [pageIndex, pageText] of analysis.pageTexts.entries()) {
        const text = caseSensitive ? pageText : pageText.toLowerCase();
        let index = 0;
        
        while ((index = text.indexOf(searchTerm, index)) !== -1) {
          if (wholeWord && !this.isWholeWord(text, index, searchTerm.length)) {
            index++;
            continue;
          }

          results.push({
            text: pageText.substring(index, index + query.length),
            pageIndex,
            bbox: { x: 0, y: 0, width: 0, height: 0 },
            context: this.getContext(pageText, query),
            confidence: 0.8
          });

          index++;
          if (results.length >= maxResults) break;
        }
        
        if (results.length >= maxResults) break;
      }
    }

    return results.slice(0, maxResults);
  }

  /**
   * 检查是否为完整单词
   */
  private isWholeWord(text: string, index: number, length: number): boolean {
    const before = index > 0 ? text[index - 1] : ' ';
    const after = index + length < text.length ? text[index + length] : ' ';
    
    return /\s/.test(before) && /\s/.test(after);
  }

  /**
   * 从布局数据获取边界框信息
   */
  public getBoundingBoxFromLayout(
    modelData: DocumentModelData[],
    pageIndex: number,
    textContent: string
  ): BoundingBox | null {
    if (pageIndex >= modelData.length) return null;

    const pageLayout = modelData[pageIndex];
    
    // 在布局检测结果中查找包含目标文本的区域
    for (const detection of pageLayout.layout_dets) {
      if (detection.text && detection.text.includes(textContent)) {
        // 将多边形坐标转换为边界框
        const [x1, y1, x2, y2] = detection.poly;
        return {
          x: Math.min(x1, x2),
          y: Math.min(y1, y2),
          width: Math.abs(x2 - x1),
          height: Math.abs(y2 - y1)
        };
      }
    }

    return null;
  }

  /**
   * 获取页面的文本块布局信息
   */
  public getPageLayout(modelData: DocumentModelData[], pageIndex: number) {
    if (pageIndex >= modelData.length) return null;

    const pageData = modelData[pageIndex];
    const blocks = pageData.layout_dets.map(detection => ({
      type: LAYOUT_CATEGORIES[detection.category_id as keyof typeof LAYOUT_CATEGORIES] || 'unknown',
      bbox: this.polyToBoundingBox(detection.poly),
      confidence: detection.score,
      text: detection.text || ''
    }));

    return {
      pageInfo: pageData.page_info,
      blocks
    };
  }

  /**
   * 将多边形坐标转换为边界框
   */
  private polyToBoundingBox(poly: number[]): BoundingBox {
    const [x1, y1, x2, y2] = poly;
    return {
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      width: Math.abs(x2 - x1),
      height: Math.abs(y2 - y1)
    };
  }

  /**
   * 导出文档分析结果
   */
  public exportAnalysis(analysis: DocumentAnalysis): string {
    const exportData = {
      totalPages: analysis.totalPages,
      outline: analysis.outline,
      structuredContentSummary: {
        totalItems: analysis.structuredContent.length,
        byType: this.getContentTypeStats(analysis.structuredContent),
        byPage: this.getContentPageStats(analysis.structuredContent)
      }
    };

    return JSON.stringify(exportData, null, 2);
  }

  private getContentTypeStats(content: ContentItem[]) {
    const stats: Record<string, number> = {};
    for (const item of content) {
      stats[item.type] = (stats[item.type] || 0) + 1;
    }
    return stats;
  }

  private getContentPageStats(content: ContentItem[]) {
    const stats: Record<number, number> = {};
    for (const item of content) {
      stats[item.page_idx] = (stats[item.page_idx] || 0) + 1;
    }
    return stats;
  }
} 