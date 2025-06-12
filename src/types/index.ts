// 基础类型定义
export interface Annotation {
  id: string
  content: string
  type: 'highlight' | 'note' | 'link'
  position: {
    pageNumber: number
    x: number
    y: number
    width: number
    height: number
  }
  createdAt: Date
}

export interface ViewMode {
  type: 'preview' | 'outline' | 'text-only'
  label: string
}

export interface NavigationState {
  currentPage: number
  totalPages: number
  currentView: ViewMode['type']
  filePath?: string
}

export interface KeyCommand {
  keys: string
  description: string
  action: () => void
}

// Electron API 类型
declare global {
  interface Window {
    electronAPI: {
      openPdfFile: () => Promise<string | null>
      readPdfFile: (filePath: string) => Promise<ArrayBuffer>
      checkFileExists: (filePath: string) => Promise<boolean>
      getAppVersion: () => Promise<string>
      onMenuAction: (callback: (event: any, action: string) => void) => () => void
      openFileDialog: (options: {
        title?: string;
        filters?: Array<{ name: string; extensions: string[] }>;
        properties?: string[];
      }) => Promise<string | null>
      readFileAsText: (filePath: string) => Promise<string>
    }
  }
} 