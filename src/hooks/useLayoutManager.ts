import { useState, useCallback, useMemo } from 'react';
import { DocumentContentList } from '@/types/document.types';
import { PageInfo } from '@/types/pdf-analysis';
import { DocumentParserService } from '@/services/document-parser.service';

interface LoadedFiles {
  mineruData: PageInfo[] | null;
  contentList: DocumentContentList | null;
}

export const useLayoutManager = () => {
  const [files, setFiles] = useState<LoadedFiles>({
    mineruData: null,
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
  const createFileSelector = useCallback((accept: string = '.json'): Promise<File | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        resolve(file || null);
      };
      input.oncancel = () => resolve(null);
      input.click();
    });
  }, []);

  // 加载MinerU文件
  const loadMineruFile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('请选择 MinerU 数据文件...');
      
      const mineruFile = await createFileSelector('.json');
      if (!mineruFile) {
        console.log('用户取消选择 MinerU 文件');
        return;
      }

      // 读取MinerU文件
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

      const mineruData = await readFile(mineruFile);
      
      // 检查是否是MinerU格式
      if (mineruData.pdf_info && Array.isArray(mineruData.pdf_info)) {
        // 提取内容列表用于大纲生成
        const contentList: DocumentContentList = [];
        
        mineruData.pdf_info.forEach((pageInfo: PageInfo, pageIndex: number) => {
          if (pageInfo.para_blocks) {
            pageInfo.para_blocks.forEach((block: any) => {
              if (block.lines && block.lines.length > 0) {
                // 提取文本内容
                const text = block.lines
                  .map((line: any) => 
                    line.spans
                      ?.filter((span: any) => span.type === 'text' && span.content)
                      .map((span: any) => span.content)
                      .join(' ')
                  )
                  .filter(Boolean)
                  .join(' ');

                                 if (text.trim()) {
                   const contentItem: any = {
                     type: block.type || 'text',
                     text: text.trim(),
                     page_idx: pageIndex
                   };

                   // 根据块类型确定text_level
                   if (block.type === 'title') {
                     contentItem.text_level = 1; // 默认为1级标题
                   }

                   contentList.push(contentItem);
                 }
              }
            });
          }
        });

        setFiles({ 
          mineruData: mineruData.pdf_info,
          contentList 
        });
        setSelectedPage(0);
        setIsLayoutViewVisible(true);
        
        console.log('MinerU 文件加载成功！');
        console.log('页数:', mineruData.pdf_info.length);
        console.log('内容项目:', contentList.length);
      } else {
        throw new Error('不是有效的 MinerU 格式文件');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载文件时发生未知错误';
      setError(errorMessage);
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
      mineruData: null,
      contentList: null
    });
    setSelectedPage(0);
    setError(null);
    setIsLayoutViewVisible(false);
    setIsOutlineVisible(false);
  };

  // 获取当前页面的MinerU数据
  const getCurrentPageLayout = useCallback(() => {
    if (!files.mineruData || selectedPage >= files.mineruData.length) {
      return null;
    }
    return files.mineruData[selectedPage];
  }, [files.mineruData, selectedPage]);

  // 获取当前页面的内容
  const getCurrentPageContent = useCallback(() => {
    if (!files.contentList) return [];
    return files.contentList.filter(item => item.page_idx === selectedPage);
  }, [files.contentList, selectedPage]);

  // 处理快捷键动作
  const handleKeyAction = useCallback((action: string) => {
    switch (action) {
      case 'layout.loadFiles':
        loadMineruFile();
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
  }, [loadMineruFile, toggleLayoutView, toggleOutline, toggleLayoutBoxes, toggleTextContent]);

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
    loadMineruFile,
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
    hasFiles: !!(files.mineruData && files.contentList),
    totalPages: files.mineruData?.length || 0,
    
    // 分析数据
    analysis: useMemo(() => {
      if (!files.mineruData || !files.contentList) {
        return null;
      }

      const parser = DocumentParserService.getInstance();
      
      // 解析文档大纲
      try {
        const outline = parser.buildOutline(files.contentList);
        return {
          totalPages: files.mineruData.length,
          outline,
          searchIndex: new Map(),
          pageTexts: new Map(),
          structuredContent: files.contentList
        };
      } catch (error) {
        console.error('解析文档时出错:', error);
        return null;
      }
    }, [files.mineruData, files.contentList])
  };
}; 
