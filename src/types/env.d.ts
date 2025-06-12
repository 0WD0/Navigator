/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_DEV_PORT: string;
  readonly VITE_PREVIEW_PORT: string;
  readonly VITE_PDF_WORKER_SRC: string;
  readonly VITE_PDF_CMAP_URL: string;
  readonly VITE_PDF_STANDARD_FONT_DATA_URL: string;
  readonly VITE_LOG_LEVEL: string;
  readonly VITE_ENABLE_DEV_TOOLS: string;
  readonly VITE_ENABLE_AUTO_UPDATE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Electron API类型定义
interface ElectronAPI {
  openPdfFile: () => Promise<string | null>;
  readPdfFile: (_filePath: string) => Promise<ArrayBuffer>;
  checkFileExists: (_filePath: string) => Promise<boolean>;
  getAppVersion: () => Promise<string>;
  onMenuAction: (_callback: (_event: any, _action: string) => void) => () => void;
  
  // 新增的API
  openFileDialog: (_options: {
    title?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
    properties?: string[];
  }) => Promise<string | null>;
  readFileAsText: (_filePath: string) => Promise<string>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
} 