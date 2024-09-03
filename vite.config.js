// vite.config.js
import { defineConfig } from 'vite';
import { sync as globSync } from 'glob';
import path from 'path';
import jsmakeExecutor from './vite/jsmake_executor.js';


const projectRootDir = path.resolve(__dirname); // 确定项目根目录
const input = globSync('src/**/*.html', { cwd: projectRootDir }).reduce((entries, filePath) => {
  const key = filePath.replace(/\.html$/, ''); // 移除.html后缀
  entries[key] = path.resolve(projectRootDir, filePath); // 生成绝对路径
  return entries;
}, {});
input.main = path.resolve(projectRootDir, 'index.html'); // 确保根目录的 index.html 也被包含


export default defineConfig({
  resolve: {
    alias: {'events': path.resolve(__dirname, 'node_modules/events/events.js')}
  },
  base: '/',
  build: {
    rollupOptions: {input}
  },
  optimizeDeps: {
    include: ['jquery', 'jstree']
  },
  plugins: [
    jsmakeExecutor({ moduleDir: './vite' }),
  ],

});


