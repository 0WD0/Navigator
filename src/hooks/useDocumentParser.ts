import { useState, useEffect, useCallback } from 'react';
import { DocumentParserService } from '@/services/document-parser.service';
import {
  DocumentModelData,
  DocumentMiddleData, 
  DocumentContentList,
  DocumentAnalysis,
  SearchResult
} from '@/types/document.types';

interface UseDocumentParserReturn {
  analysis: DocumentAnalysis | null;
  isLoading: boolean;
  error: string | null;
  loadDocument: (
    modelData: DocumentModelData[],
    middleData: DocumentMiddleData,
    contentList: DocumentContentList
  ) => Promise<void>;
  search: (query: string, options?: {
    caseSensitive?: boolean;
    wholeWord?: boolean;
    maxResults?: number;
  }) => SearchResult[];
  exportAnalysis: () => string | null;
}

export function useDocumentParser(): UseDocumentParserReturn {
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parser = DocumentParserService.getInstance();

  const loadDocument = useCallback(async (
    modelData: DocumentModelData[],
    middleData: DocumentMiddleData,
    contentList: DocumentContentList
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await parser.parseDocument(modelData, middleData, contentList);
      setAnalysis(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : '文档解析失败';
      setError(message);
      console.error('Document parsing error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [parser]);

  const search = useCallback((
    query: string,
    options?: {
      caseSensitive?: boolean;
      wholeWord?: boolean;
      maxResults?: number;
    }
  ): SearchResult[] => {
    if (!analysis) return [];
    
    try {
      return parser.search(analysis, query, options);
    } catch (err) {
      console.error('Search error:', err);
      return [];
    }
  }, [analysis, parser]);

  const exportAnalysis = useCallback((): string | null => {
    if (!analysis) return null;
    
    try {
      return parser.exportAnalysis(analysis);
    } catch (err) {
      console.error('Export error:', err);
      return null;
    }
  }, [analysis, parser]);

  return {
    analysis,
    isLoading,
    error,
    loadDocument,
    search,
    exportAnalysis
  };
} 