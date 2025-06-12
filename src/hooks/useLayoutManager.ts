import { useState, useCallback, useMemo } from 'react';
import { DocumentModelData, DocumentMiddleData, DocumentContentList } from '@/types/document.types';
import { DocumentParserService } from '@/services/document-parser.service';

interface LoadedFiles {
  modelData: DocumentModelData[] | null;
  middleData: DocumentMiddleData | null;
  contentList: DocumentContentList | null;
}

export const useLayoutManager = () => {
  const [files, setFiles] = useState<LoadedFiles>({
    modelData: null,
    middleData: null,
    contentList: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState(0);
  const [showLayoutBoxes, setShowLayoutBoxes] = useState(true);
  const [showTextContent, setShowTextContent] = useState(false);
  const [showImageRegions, setShowImageRegions] = useState(false);
  const [showTableRegions, setShowTableRegions] = useState(false);
  const [isLayoutViewVisible, setIsLayoutViewVisible] = useState(false);
  const [isOutlineVisible, setIsOutlineVisible] = useState(false);

  // 创建文件选择器
  const createFileSelector = useCallback((accept: string): Promise<File | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        resolve(file || null);
      };
      input.click();
    });
  }, []);

  const loadFiles = async (
    modelFile: File,
    middleFile: File,
    contentFile: File
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const readFile = (file: File): Promise<any> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const content = JSON.parse(e.target?.result as string);
              resolve(content);
            } catch {
              reject(new Error(`解析文件 ${file.name} 失败`));
            }
          };
          reader.onerror = () => reject(new Error(`读取文件 ${file.name} 失败`));
          reader.readAsText(file);
        });
      };

      const [modelData, middleData, contentList] = await Promise.all([
        readFile(modelFile),
        readFile(middleFile),
        readFile(contentFile)
      ]);

      setFiles({ modelData, middleData, contentList });
      setSelectedPage(0); // 重置到第一页
      setIsLayoutViewVisible(true); // 自动显示布局视图
    } catch (err) {
      const _errorMessage = err instanceof Error ? err.message : '加载文件时发生未知错误';
      setError(_errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 加载布局文件（通过文件选择器）
  const loadLayoutFiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('开始选择布局文件...');
      
      // 依次选择三个文件
      console.log('请选择 model.json 文件...');
      const modelFile = await createFileSelector('.json');
      if (!modelFile) {
        console.log('用户取消选择 model.json');
        return;
      }

      console.log('请选择 middle.json 文件...');
      const middleFile = await createFileSelector('.json');
      if (!middleFile) {
        console.log('用户取消选择 middle.json');
        return;
      }

      console.log('请选择 content_list.json 文件...');
      const contentFile = await createFileSelector('.json');
      if (!contentFile) {
        console.log('用户取消选择 content_list.json');
        return;
      }

      // 使用loadFiles函数加载
      await loadFiles(modelFile, middleFile, contentFile);
      
      console.log('文件加载成功！');
    } catch (err) {
      const _errorMessage = err instanceof Error ? err.message : '加载文件时发生未知错误';
      setError(_errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [createFileSelector]);

  // 切换布局视图
  const toggleLayoutView = useCallback(() => {
    setIsLayoutViewVisible(prev => !prev);
  }, []);

  // 切换大纲视图
  const toggleOutline = useCallback(() => {
    setIsOutlineVisible(prev => !prev);
  }, []);

  // 切换布局框显示
  const toggleLayoutBoxes = useCallback(() => {
    setShowLayoutBoxes(prev => !prev);
  }, []);

  // 切换文本内容显示
  const toggleTextContent = useCallback(() => {
    setShowTextContent(prev => !prev);
  }, []);

  const clearFiles = () => {
    setFiles({
      modelData: null,
      middleData: null,
      contentList: null
    });
    setSelectedPage(0);
    setError(null);
    setIsLayoutViewVisible(false);
    setIsOutlineVisible(false);
  };

  // 获取当前页面的布局信息
  const getCurrentPageLayout = useCallback(() => {
    if (!files.modelData || selectedPage >= files.modelData.length) {
      return null;
    }
    return files.modelData[selectedPage];
  }, [files.modelData, selectedPage]);

  // 获取当前页面的内容
  const getCurrentPageContent = useCallback(() => {
    if (!files.contentList) return [];
    return files.contentList.filter(item => item.page_idx === selectedPage);
  }, [files.contentList, selectedPage]);

  // 处理快捷键动作
  const handleKeyAction = useCallback((action: string) => {
    switch (action) {
      case 'layout.loadFiles':
        loadLayoutFiles();
        break;
      case 'layout.toggleView':
        toggleLayoutView();
        break;
      case 'layout.toggleOutline':
        toggleOutline();
        break;
      case 'layout.toggleLayoutBoxes':
        toggleLayoutBoxes();
        break;
      case 'layout.toggleTextContent':
        toggleTextContent();
        break;
      default:
        console.log('未处理的布局动作:', action);
    }
  }, [loadLayoutFiles, toggleLayoutView, toggleOutline, toggleLayoutBoxes, toggleTextContent]);

  return {
    // 状态
    files,
    isLoading,
    error,
    selectedPage,
    showLayoutBoxes,
    showTextContent,
    showImageRegions,
    showTableRegions,
    isLayoutViewVisible,
    isOutlineVisible,
    
    // 动作函数
    setSelectedPage,
    setShowLayoutBoxes,
    setShowTextContent,
    setShowImageRegions,
    setShowTableRegions,
    loadFiles,
    loadLayoutFiles,
    toggleLayoutView,
    toggleOutline,
    toggleLayoutBoxes,
    toggleTextContent,
    clearFiles,
    handleKeyAction,
    
    // 计算属性
    getCurrentPageLayout,
    getCurrentPageContent,
    
    // 状态检查
    hasFiles: !!(files.modelData && files.middleData && files.contentList),
    totalPages: files.modelData?.length || 0,
    
    // 分析数据
    analysis: useMemo(() => {
      if (!files.modelData || !files.middleData || !files.contentList) {
        return null;
      }

      const parser = DocumentParserService.getInstance();
      
      // 解析文档大纲
      try {
        const outline = parser.buildOutline(files.contentList);
        return {
          totalPages: files.modelData.length,
          outline,
          searchIndex: new Map(),
          pageTexts: new Map(),
          structuredContent: files.contentList
        };
      } catch (error) {
        console.error('解析文档时出错:', error);
        return null;
      }
    }, [files.modelData, files.middleData, files.contentList])
  };
}; 
