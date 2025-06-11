export interface AppConfig {
  // 应用基本信息
  name: string;
  version: string;
  description: string;
  
  // 主题设置
  theme: {
    mode: 'light' | 'dark' | 'system';
    colors: {
      primary: string;
      secondary: string;
      background: string;
      surface: string;
      text: string;
    };
  };
  
  // 键盘快捷键
  keyBindings: {
    [key: string]: string;
  };
  
  // PDF查看器设置
  pdf: {
    defaultZoom: number;
    maxZoom: number;
    minZoom: number;
    enableAnnotations: boolean;
    scrollSensitivity: number;
  };
  
  // 开发设置
  dev: {
    enableDevTools: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    hotReload: boolean;
  };
  
  // 窗口设置
  window: {
    defaultWidth: number;
    defaultHeight: number;
    minWidth: number;
    minHeight: number;
    rememberSize: boolean;
    rememberPosition: boolean;
  };
}

export const defaultConfig: AppConfig = {
  name: import.meta.env.VITE_APP_NAME || 'Navigator Demo',
  version: import.meta.env.VITE_APP_VERSION || '0.1.0',
  description: '引用导航器 - 以批注为核心的知识管理系统',
  
  theme: {
    mode: 'system',
    colors: {
      primary: '#2563eb',
      secondary: '#64748b',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#1e293b',
    },
  },
  
  keyBindings: {
    // 导航
    'j': 'navigate:next',
    'k': 'navigate:prev',
    'h': 'navigate:left',
    'l': 'navigate:right',
    'gg': 'navigate:first',
    'G': 'navigate:last',
    
    // 视图
    'z': 'zoom:in',
    'Z': 'zoom:out',
    '0': 'zoom:reset',
    'f': 'view:fullscreen',
    
    // 模式切换
    'i': 'mode:insert',
    'Escape': 'mode:normal',
    ':': 'mode:command',
    
    // 操作
    'Ctrl+o': 'file:open',
    'Ctrl+s': 'file:save',
    'Ctrl+q': 'app:quit',
    '?': 'help:toggle',
  },
  
  pdf: {
    defaultZoom: 1.0,
    maxZoom: 5.0,
    minZoom: 0.25,
    enableAnnotations: true,
    scrollSensitivity: 1.0,
  },
  
  dev: {
    enableDevTools: import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true',
    logLevel: (import.meta.env.VITE_LOG_LEVEL as AppConfig['dev']['logLevel']) || 'info',
    hotReload: true,
  },
  
  window: {
    defaultWidth: 1200,
    defaultHeight: 800,
    minWidth: 800,
    minHeight: 600,
    rememberSize: true,
    rememberPosition: true,
  },
}; 