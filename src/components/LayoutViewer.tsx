import React, { useState } from 'react';
import { DocumentModelData, DocumentMiddleData, DocumentContentList } from '@/types/document.types';

interface LayoutViewerProps {
  _layoutData?: DocumentModelData[] | null;
  selectedPage?: number;
  showLayoutBoxes?: boolean;
  showTextContent?: boolean;
  _showImageRegions?: boolean;
  _showTableRegions?: boolean;
  _onToggleLayoutBoxes?: () => void;
  _onToggleTextContent?: () => void;
  className?: string;
}

interface LoadedFiles {
  modelData: DocumentModelData[] | null;
  middleData: DocumentMiddleData | null;
  contentList: DocumentContentList | null;
}

interface LayoutViewerPropsWithData extends LayoutViewerProps {
  files?: LoadedFiles;
  onPageChange?: (page: number) => void;
  onLoadFiles?: () => void;
  isLoading?: boolean;
  analysis?: any;
}

export const LayoutViewer: React.FC<LayoutViewerPropsWithData> = ({ 
  className = '',
  files: externalFiles,
  onPageChange,
  onLoadFiles,
  isLoading: externalIsLoading = false
}) => {
  const [_internalSelectedPage] = useState(0);
  const [_internalShowLayoutBoxes, _setInternalShowLayoutBoxes] = useState(true);
  const [_internalShowTextContent, _setInternalShowTextContent] = useState(false);
  const [internalFiles, setInternalFiles] = useState<LoadedFiles>({
    modelData: null,
    middleData: null,
    contentList: null
  });
  const [internalIsLoading, setInternalIsLoading] = useState(false);

  // 使用外部状态或内部状态
  const files = externalFiles || internalFiles;
  const showLayoutBoxes = _internalShowLayoutBoxes;
  const showTextContent = _internalShowTextContent;
  const isLoading = externalIsLoading || internalIsLoading;
    const selectedPage = _internalSelectedPage;

  // 处理文件选择
  const handleFileSelect = async () => {
    if (onLoadFiles) {
      onLoadFiles();
      return;
    }
    setInternalIsLoading(true);
    try {
      // 创建文件选择器
      const selectFile = (accept: string): Promise<File | null> => {
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
      };

      // 依次选择三个文件
      console.log('请选择 model.json 文件...');
      const modelFile = await selectFile('.json');
      if (!modelFile) return;

      console.log('请选择 middle.json 文件...');
      const middleFile = await selectFile('.json');
      if (!middleFile) return;

      console.log('请选择 content_list.json 文件...');
      const contentFile = await selectFile('.json');
      if (!contentFile) return;

      // 读取文件内容
      const readFile = (file: File): Promise<any> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const content = JSON.parse(e.target?.result as string);
              resolve(content);
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = reject;
          reader.readAsText(file);
        });
      };

      const [modelData, middleData, contentList] = await Promise.all([
        readFile(modelFile),
        readFile(middleFile),
        readFile(contentFile)
      ]);

      // 更新状态
      const newFiles = { modelData, middleData, contentList };
      setInternalFiles(newFiles);

      console.log('文件加载成功！');
    } catch (error) {
      console.error('文件加载失败:', error);
      alert('文件加载失败，请检查文件格式');
    } finally {
      setInternalIsLoading(false);
    }
  };

  // 获取当前页面的布局信息
  const getCurrentPageLayout = () => {
    if (!files.modelData || selectedPage >= files.modelData.length) {
      return null;
    }
    return files.modelData[selectedPage];
  };

  // 获取当前页面的内容
  const getCurrentPageContent = () => {
    if (!files.contentList) return [];
    return files.contentList.filter(item => item.page_idx === selectedPage);
  };

  const currentLayout = getCurrentPageLayout();
  const currentContent = getCurrentPageContent();

  return (
    <div className={`bg-white border rounded-lg shadow-sm ${className}`}>
      {/* 控制面板 */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">布局查看器</h3>
          <button
            onClick={handleFileSelect}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? '加载中...' : '选择JSON文件 (Ctrl+L)'}
          </button>
        </div>

        {files.modelData && (
          <div className="flex items-center gap-4">
            {/* 页面选择 */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">页面:</label>
              <select
                value={selectedPage}
                onChange={(e) => {
                  const newPage = Number(e.target.value);
                  if (onPageChange) {
                    onPageChange(newPage);
                  }
                }}
                className="px-2 py-1 border rounded text-sm"
              >
                {files.modelData.map((_, index) => (
                  <option key={index} value={index}>
                    第 {index + 1} 页
                  </option>
                ))}
              </select>
            </div>

            {/* 显示选项 */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={showLayoutBoxes}
                  onChange={(e) => _setInternalShowLayoutBoxes(e.target.checked)}
                />
                显示布局框
              </label>
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={showTextContent}
                  onChange={(e) => _setInternalShowTextContent(e.target.checked)}
                />
                显示文本内容
              </label>
            </div>
          </div>
        )}
      </div>

      {/* 布局显示区域 */}
      <div className="p-4">
        {!files.modelData ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-lg mb-2">📄</div>
            <div>请选择JSON文件以查看布局</div>
            <div className="text-sm mt-2">支持 model.json, middle.json, content_list.json</div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 页面信息 */}
            <div className="text-sm text-gray-600">
              页面 {selectedPage + 1} / {files.modelData.length}
              {currentLayout && (
                <span className="ml-4">
                  尺寸: {currentLayout.page_info.width} × {currentLayout.page_info.height}
                </span>
              )}
            </div>

            {/* 布局内容 */}
            {currentLayout && (
              <div className="border rounded p-4 bg-gray-50">
                <h4 className="font-medium mb-2">布局信息</h4>
                <div className="text-sm space-y-1">
                  <div>布局块数量: {currentLayout.layout_dets.length}</div>
                  <div>内容项数量: {currentContent.length}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LayoutViewer; 