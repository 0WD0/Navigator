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