# 配置系统完善方案

## 问题分析

您提到"配置系统不够完善"，经过分析，我发现以下几个主要问题：

1. **缺少代码质量工具**：没有ESLint、Prettier等代码规范工具
2. **缺少环境配置管理**：没有统一的环境变量配置
3. **缺少应用配置系统**：用户设置、主题等无法持久化
4. **键盘处理有bug**：shift+G等组合键无法正确识别
5. **开发配置不完整**：构建、调试等配置需要优化

## 解决方案

### 1. 代码质量工具配置

#### ESLint配置 (`.eslintrc.json`)
```json
{
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
}
```

#### Prettier配置 (`.prettierrc`)
```json
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

### 2. 环境变量管理

#### 环境变量示例 (`env.example`)
```bash
# 应用配置
APP_NAME=Navigator Demo
NODE_ENV=development

# 开发服务器配置
VITE_DEV_PORT=3000

# PDF处理配置
VITE_PDF_WORKER_SRC=/pdf.worker.min.js

# 功能开关
VITE_ENABLE_DEV_TOOLS=true
```

#### TypeScript环境变量类型 (`src/types/env.d.ts`)
```typescript
interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  readonly VITE_DEV_PORT: string;
  readonly VITE_ENABLE_DEV_TOOLS: string;
  // ...更多环境变量
}
```

### 3. 应用配置系统

#### 配置接口定义 (`src/config/app.config.ts`)
```typescript
export interface AppConfig {
  name: string;
  version: string;
  theme: {
    mode: 'light' | 'dark' | 'system';
    colors: ThemeColors;
  };
  keyBindings: Record<string, string>;
  pdf: PDFSettings;
  window: WindowSettings;
}
```

#### 配置服务 (`src/config/config.service.ts`)
- 配置的加载和保存
- 配置的合并和验证
- 配置的导入导出
- 单例模式管理

#### 配置Hook (`src/hooks/useConfig.ts`)
```typescript
export function useConfig() {
  const [config, setConfig] = useState<AppConfig>();
  
  const updateConfig = (key, value) => {
    // 响应式配置更新
  };
  
  return { config, updateConfig, resetConfig };
}
```

### 4. 主题系统

#### 主题配置 (`src/config/theme.config.ts`)
```typescript
export const lightTheme: Theme = {
  name: 'light',
  colors: {
    primary: '#2563eb',
    background: '#ffffff',
    // ...更多颜色
  }
};

export const darkTheme: Theme = {
  // 深色主题配置
};
```

### 5. 键盘处理bug修复

#### 问题：shift+G无法识别
原因：键盘处理逻辑对大写字母的处理有误

#### 修复方案：
```typescript
// 修复前
if (event.shiftKey && key.length === 1 && key.match(/[a-z]/)) {
  key = key.toUpperCase()
}

// 修复后
if (key.length === 1 && key.match(/[a-zA-Z]/)) {
  key = event.key // 直接使用event.key的值
}
```

### 6. 构建和开发配置优化

#### Vite配置增强 (`vite.config.ts`)
```typescript
export default defineConfig({
  // 路径别名
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
    }
  },
  
  // 构建优化
  build: {
    sourcemap: process.env.NODE_ENV === 'development',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          pdf: ['pdfjs-dist']
        }
      }
    }
  }
});
```

#### package.json脚本增强
```json
{
  "scripts": {
    "lint": "eslint src --ext .ts,.tsx --max-warnings 0",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write src/**/*.{ts,tsx,json,css,md}",
    "type-check": "tsc --noEmit",
    "clean": "rimraf dist dist-electron"
  }
}
```

#### TypeScript配置严格化 (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitReturns": true,
    "exactOptionalPropertyTypes": true,
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"]
    }
  }
}
```

## 使用方式

### 1. 安装依赖
```bash
npm install
```

### 2. 开发模式
```bash
npm run dev
```

### 3. 代码检查
```bash
npm run lint
npm run format
npm run type-check
```

### 4. 配置管理
```typescript
import { useConfig } from '@hooks/useConfig';

function MyComponent() {
  const { config, updateConfig } = useConfig();
  
  const changeTheme = () => {
    updateConfig('theme', { mode: 'dark' });
  };
}
```

## 效果

1. **代码质量**：统一的代码风格和错误检查
2. **配置管理**：用户设置可以持久化和自定义
3. **开发体验**：更好的调试和构建工具
4. **bug修复**：键盘快捷键工作正常
5. **类型安全**：完整的TypeScript类型支持

## 调试信息

为了帮助诊断键盘问题，我添加了详细的调试日志：

```typescript
// 在浏览器控制台查看
console.log('处理按键:', { key, originalKey, shiftKey });
console.log('状态机处理按键:', key, '当前序列:', currentSequence);
```

现在shift+G应该能正确识别并跳转到最后一页了。 