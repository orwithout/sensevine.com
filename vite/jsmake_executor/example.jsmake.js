// vite\jsmake_executor\example.jsmake.js
import nunjucks from 'nunjucks';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// 通过 import.meta.url 获取当前文件的路径，然后转换为文件系统路径
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatePath = 'example.html.nunjucks';  // 模板文件相对路径
const outputPath = path.join(__dirname, 'example.html'); // 输出文件的完整路径，确保与模板在同一目录
const data = {
  title: 'Example Page',
  discount: 0.1,
  items: [
    { id: 1, name: 'Item 1', price: 10.99 },
    { id: 2, name: 'Item 2', price: 5.99 },
    { id: 3, name: 'Item 3', price: 20.928 },
  ],
  getMessage: function() {
    return `Welcome to ${this.title}!`;
  },
  formatPrice: function(price, discount) {
    const discountedPrice = price * (1 - discount);
    return `$${discountedPrice.toFixed(3)}`;
  },
};



// Setup Nunjucks environment
const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(__dirname), {  // 在当前目录下加载模板，并设置 空格处理规则
    autoescape: true,
    trimBlocks: true,
    lstripBlocks: true
});

// Render the template with the data
env.render(templatePath, data, (err, result) => {
  console.log('result:', result);
    if (err) {
        console.error('Error rendering template:', err);
        return;
    }

    // Write the rendered HTML to file
    fs.writeFile(outputPath, result, (err) => {
        if (err) {
            console.error('Error writing output file:', err);
            return;
        }
        console.log('Rendered HTML written to', outputPath);
    });
});
