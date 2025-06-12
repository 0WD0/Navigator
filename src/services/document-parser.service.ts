import {
  DocumentModelData,
  DocumentMiddleData,
  DocumentContentList,
  DocumentAnalysis,
  DocumentOutline,
  SearchResult,
  BoundingBox,
  ContentItem,
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
    _middleData: DocumentMiddleData,
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
   * 从内容列表构建文档大纲（仅基于text_level字段）
   */
  public buildOutline(contentList: ContentItem[]): DocumentOutline[] {
    const outline: DocumentOutline[] = [];
    const stack: DocumentOutline[] = [];

    for (const item of contentList) {
      // 只处理有text_level字段且级别在1-3之间的项目
      if (item.text_level && item.text_level >= 1 && item.text_level <= 3) {
        const outlineItem: DocumentOutline = {
          title: item.text.trim(),
          level: item.text_level,
          pageIndex: item.page_idx,
          children: []
        };

        // 处理层级关系：移除所有级别大于等于当前级别的项目
        while (stack.length > 0 && stack[stack.length - 1].level >= outlineItem.level) {
          stack.pop();
        }

        // 如果栈为空，说明这是顶级项目
        if (stack.length === 0) {
          outline.push(outlineItem);
        } else {
          // 否则作为栈顶项目的子项
          const parent = stack[stack.length - 1];
          if (!parent.children) parent.children = [];
          parent.children.push(outlineItem);
        }

        // 将当前项目推入栈中
        stack.push(outlineItem);
      }
    }

    return outline;
  }

  /**
   * 获取大纲统计信息
   */
  public getOutlineStats(outline: DocumentOutline[]): {
    totalItems: number;
    levelCounts: Record<number, number>;
    maxDepth: number;
    pageSpan: { start: number; end: number };
  } {
    let totalItems = 0;
    const levelCounts: Record<number, number> = {};
    let maxDepth = 0;
    let minPage = Infinity;
    let maxPage = -1;

    const traverse = (items: DocumentOutline[], depth: number = 0) => {
      maxDepth = Math.max(maxDepth, depth);
      
      for (const item of items) {
        totalItems++;
        levelCounts[item.level] = (levelCounts[item.level] || 0) + 1;
        minPage = Math.min(minPage, item.pageIndex);
        maxPage = Math.max(maxPage, item.pageIndex);
        
        if (item.children && item.children.length > 0) {
          traverse(item.children, depth + 1);
        }
      }
    };

    traverse(outline);

    return {
      totalItems,
      levelCounts,
      maxDepth,
      pageSpan: {
        start: minPage === Infinity ? 0 : minPage,
        end: maxPage === -1 ? 0 : maxPage
      }
    };
  }

  /**
   * 在大纲中搜索标题
   */
  public searchOutline(outline: DocumentOutline[], query: string): DocumentOutline[] {
    const results: DocumentOutline[] = [];
    const searchTerm = query.toLowerCase().trim();

    if (!searchTerm) return [];

    const search = (items: DocumentOutline[]) => {
      for (const item of items) {
        if (item.title.toLowerCase().includes(searchTerm)) {
          results.push(item);
        }
        
        if (item.children && item.children.length > 0) {
          search(item.children);
        }
      }
    };

    search(outline);
    return results;
  }

  /**
   * 获取指定页面的大纲项目
   */
  public getOutlineItemsForPage(outline: DocumentOutline[], pageIndex: number): DocumentOutline[] {
    const results: DocumentOutline[] = [];

    const search = (items: DocumentOutline[]) => {
      for (const item of items) {
        if (item.pageIndex === pageIndex) {
          results.push(item);
        }
        
        if (item.children && item.children.length > 0) {
          search(item.children);
        }
      }
    };

    search(outline);
    return results;
  }

  /**
   * 扁平化大纲结构（用于导出或搜索）
   */
  public flattenOutline(outline: DocumentOutline[]): Array<DocumentOutline & { depth: number; path: string }> {
    const flattened: Array<DocumentOutline & { depth: number; path: string }> = [];

    const flatten = (items: DocumentOutline[], depth: number = 0, parentPath: string = '') => {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const currentPath = parentPath ? `${parentPath}.${i + 1}` : `${i + 1}`;
        
        flattened.push({
          ...item,
          depth,
          path: currentPath
        });

        if (item.children && item.children.length > 0) {
          flatten(item.children, depth + 1, currentPath);
        }
      }
    };

    flatten(outline);
    return flattened;
  }

  /**
   * 验证大纲结构的完整性
   */
  public validateOutline(outline: DocumentOutline[]): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    const validate = (items: DocumentOutline[], parentLevel: number = 0) => {
      for (const item of items) {
        // 检查标题是否为空
        if (!item.title || item.title.trim().length === 0) {
          issues.push(`发现空标题项目（页面 ${item.pageIndex + 1}）`);
        }

        // 检查级别是否合理
        if (item.level < 1 || item.level > 3) {
          issues.push(`标题级别超出范围 (${item.level})：${item.title}`);
        }

        // 检查级别跳跃是否过大
        if (parentLevel > 0 && item.level > parentLevel + 1) {
          issues.push(`标题级别跳跃过大：从 ${parentLevel} 级跳到 ${item.level} 级 - ${item.title}`);
        }

        // 检查页面索引是否有效
        if (item.pageIndex < 0) {
          issues.push(`无效的页面索引 (${item.pageIndex})：${item.title}`);
        }

        // 递归检查子项目
        if (item.children && item.children.length > 0) {
          validate(item.children, item.level);
        }
      }
    };

    validate(outline);

    return {
      isValid: issues.length === 0,
      issues
    };
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