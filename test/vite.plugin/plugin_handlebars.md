[`plubin_handebars.js`](https://github.com/handlebars-lang/handlebars.js)  配置到 vite.config.js 以在每次编译或自动热更新时执行的方法：
```javascript
// vite.config.js
import handlebarsScan from './vite/plugin_handlebars.js';
import nunjucksScan from './vite/plugin_nunjucks.js';


export default defineConfig({
// ……
  plugins: [
    handlebarsScan({
      dataDir: './vite/plugin_handlebars',
      templateDir: './vite/plugin_handlebars',
    }),
    // 可以配置多个以监控多个目录
    handlebarsScan({
      dataDir: './vite/plugin_handlebars',
      templateDir: './vite/plugin_handlebars',
    }),
  ]
});
```
