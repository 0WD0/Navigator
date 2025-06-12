import { useState, useCallback, useRef } from 'react';
import { DocumentModelData, DocumentMiddleData, DocumentContentList } from '@/types/document.types';
import { useDocumentParser } from './useDocumentParser';

interface LoadedFiles {
  modelData: DocumentModelData[] | null;
  middleData: DocumentMiddleData | null;
  contentList: DocumentContentList | null;
}

interface LayoutManagerState {
  files: LoadedFiles;
  isLayoutViewVisible: boolean;
  isOutlineVisible: boolean;
  selectedPage: number;
  showLayoutBoxes: boolean;
  showTextContent: boolean;
  isLoading: boolean;
}

export function useLayoutManager() {
  const [state, setState] = useState<LayoutManagerState>({
    files: {
      modelData: null,
      middleData: null,
      contentList: null
    },
    isLayoutViewVisible: false,
    isOutlineVisible: false,
    selectedPage: 0,
    showLayoutBoxes: true,
    showTextContent: true,
    isLoading: false
  });

  const { analysis, loadDocument } = useDocumentParser();

  // 文件选择器引用
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // 读取文件内容
  const readFileContent = useCallback((file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = JSON.parse(e.target?.result as string);
          resolve(content);
        } catch (error) {
          reject(new Error(`文件解析失败: ${error}`));
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  }, []);

  // 加载布局文件
  const loadLayoutFiles = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
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

      // 并行读取文件内容
      console.log('正在读取文件内容...');
      const [modelData, middleData, contentList] = await Promise.all([
        readFileContent(modelFile),
        readFileContent(middleFile),
        readFileContent(contentFile)
      ]);

      // 验证文件格式
      if (!Array.isArray(modelData)) {
        throw new Error('model.json 格式不正确，应该是数组');
      }
      if (!middleData || typeof middleData !== 'object') {
        throw new Error('middle.json 格式不正确');
      }
      if (!Array.isArray(contentList)) {
        throw new Error('content_list.json 格式不正确，应该是数组');
      }

      // 更新状态
      const newFiles = { modelData, middleData, contentList };
      setState(prev => ({
        ...prev,
        files: newFiles,
        isLayoutViewVisible: true, // 自动显示布局视图
        selectedPage: 0
      }));

      // 解析文档
      console.log('正在解析文档...');
      await loadDocument(modelData, middleData, contentList);

      console.log('文件加载成功！');
      
      // 显示成功提示
      if (typeof window !== 'undefined' && (window as any).electron) {
        (window as any).electron.showNotification('布局文件加载成功', '已成功加载并解析文档布局数据');
      }

    } catch (error) {
      console.error('文件加载失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      
      // 显示错误提示
      if (typeof window !== 'undefined' && (window as any).electron) {
        (window as any).electron.showErrorDialog('文件加载失败', errorMessage);
      } else {
        alert(`文件加载失败: ${errorMessage}`);
      }
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [createFileSelector, readFileContent, loadDocument]);

  // 切换布局视图
  const toggleLayoutView = useCallback(() => {
    setState(prev => ({
      ...prev,
      isLayoutViewVisible: !prev.isLayoutViewVisible
    }));
  }, []);

  // 切换大纲视图
  const toggleOutline = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOutlineVisible: !prev.isOutlineVisible
    }));
  }, []);

  // 设置选中页面
  const setSelectedPage = useCallback((page: number) => {
    setState(prev => ({
      ...prev,
      selectedPage: Math.max(0, Math.min(page, (prev.files.modelData?.length || 1) - 1))
    }));
  }, []);

  // 切换布局框显示
  const toggleLayoutBoxes = useCallback(() => {
    setState(prev => ({
      ...prev,
      showLayoutBoxes: !prev.showLayoutBoxes
    }));
  }, []);

  // 切换文本内容显示
  const toggleTextContent = useCallback(() => {
    setState(prev => ({
      ...prev,
      showTextContent: !prev.showTextContent
    }));
  }, []);

  // 获取当前页面的布局信息
  const getCurrentPageLayout = useCallback(() => {
    if (!state.files.modelData || state.selectedPage >= state.files.modelData.length) {
      return null;
    }
    return state.files.modelData[state.selectedPage];
  }, [state.files.modelData, state.selectedPage]);

  // 获取当前页面的内容
  const getCurrentPageContent = useCallback(() => {
    if (!state.files.contentList) return [];
    return state.files.contentList.filter(item => item.page_idx === state.selectedPage);
  }, [state.files.contentList, state.selectedPage]);

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
      default:
        console.log('未处理的布局动作:', action);
    }
  }, [loadLayoutFiles, toggleLayoutView, toggleOutline]);

  return {
    // 状态
    ...state,
    analysis,
    
    // 动作
    loadLayoutFiles,
    toggleLayoutView,
    toggleOutline,
    setSelectedPage,
    toggleLayoutBoxes,
    toggleTextContent,
    handleKeyAction,
    
    // 计算属性
    getCurrentPageLayout,
    getCurrentPageContent,
    
    // 状态检查
    hasFiles: !!(state.files.modelData && state.files.middleData && state.files.contentList),
    totalPages: state.files.modelData?.length || 0
  };
} 