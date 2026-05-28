import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages 项目站点需要仓库名作为 base，例如 /book-mg/。
  // 本地开发不设置 VITE_BASE_PATH 时仍然使用根路径 /。
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react()],
  server: {
    port: 5173,
  },
});
