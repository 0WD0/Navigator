import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  
  // 路径解析
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@store': resolve(__dirname, 'src/store'),
      '@types': resolve(__dirname, 'src/types'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@config': resolve(__dirname, 'src/config'),
    },
  },
  
  // 构建配置
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV === 'development',
    minify: 'esbuild',
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          pdf: ['pdfjs-dist'],
          store: ['zustand'],
        },
      },
    },
  },
  
  // 开发服务器配置
  server: {
    port: parseInt(process.env.VITE_DEV_PORT || '3000'),
    host: '127.0.0.1',
    strictPort: true,
    open: false, // Electron会自己打开窗口
  },
  
  // 预览服务器配置
  preview: {
    port: parseInt(process.env.VITE_PREVIEW_PORT || '4173'),
    host: '127.0.0.1',
    strictPort: true,
  },
  
  // 依赖优化
  optimizeDeps: {
    exclude: ['electron'],
    include: ['react', 'react-dom', 'zustand'],
  },
  
  // 环境变量
  envPrefix: 'VITE_',
  
  // CSS配置
  css: {
    devSourcemap: true,
  },
  
  // 定义全局常量
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
}) 