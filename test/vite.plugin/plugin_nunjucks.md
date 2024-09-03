[`plubin_handebars.js`](https://github.com/handlebars-lang/handlebars.js)  
[`plubin_nunjucks.js`](https://github.com/mozilla/nunjucks)  
配置到 vite.config.js 以在每次编译或自动热更新时执行的方法：
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
    nunjucksScan({
      dataDir: './vite/plugin_nunjucks',
      templateDir: './vite/plugin_nunjucks',
    })
  ]
});
```