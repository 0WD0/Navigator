import { useState } from 'react';
import { PageInfo } from '@/types/pdf-analysis';

export const useDocumentParser = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PageInfo[] | null>(null);

  const parseDocument = async (filePath: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: 实际的文档解析逻辑
      console.log('解析文档:', filePath);
      
      // 模拟解析延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 这里应该调用实际的解析服务
      setData([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析失败');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    data,
    parseDocument
  };
}; 