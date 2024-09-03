// vite\plugin_handlebars.js
import fs from 'fs-extra';
import path from 'path';
import Handlebars from 'handlebars';

function walkSync(dir, callback) {
  if (!fs.existsSync(dir)) {
    console.warn(`Warning: Directory "${dir}" does not exist.`);
    return;
  }

  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walkSync(filePath, callback);
    } else {
      callback(filePath);
    }
  });
}

export default function (options = {}) {
  const dataDir = options.dataDir || './handlebars/data';
  const templateDir = options.templateDir || './handlebars';

  return {
    name: 'vite-plugin-handlebars',
    handleHotUpdate({ file, server }) {
      if (file.endsWith('.handlebars.js') || file.endsWith('.handlebars')) {
        server.ws.send({
          type: 'full-reload',
        });
      }
    },
    configureServer(server) {
      const dataModules = {};
      const templateFiles = [];

      const scanDataModules = () => {
        walkSync(dataDir, (filePath) => {
          if (filePath.endsWith('.handlebars.js')) {
            const moduleName = filePath.replace(dataDir + '/', '').replace('.handlebars.js', '');
            delete server.moduleGraph.fileToModulesMap[path.resolve(filePath)];
            dataModules[moduleName] = server.ssrLoadModule(filePath); // 使用 ssrLoadModule 替换 require
          }
        });
      };

      const scanTemplateFiles = () => {
        walkSync(templateDir, (filePath) => {
          if (filePath.endsWith('.handlebars')) {
            templateFiles.push(filePath);
          }
        });
      };

      const renderTemplates = async () => {
        await Promise.all(
          templateFiles.map(async (filePath) => {
            const templateName = path.basename(filePath, '.handlebars');
            const templateContent = await fs.readFile(filePath, 'utf-8');
      
            const outputPath = path.join(path.dirname(filePath), templateName);
            const dataModulePath = path.join(dataDir, `${templateName}.handlebars.js`);
      
            try {
              const dataModule = await server.ssrLoadModule(dataModulePath);
              const data = dataModule.default;
      
              // 创建一个自定义的 Handlebars runtime
              const handlebars = Handlebars.create();
      
              // 将数据对象中的函数注册为 helper 函数
              Object.keys(data).forEach((key) => {
                if (typeof data[key] === 'function') {
                  handlebars.registerHelper(key, data[key]);
                }
              });
      
              // 编译模板
              const template = handlebars.compile(templateContent);
      
              const renderedContent = template(data);
              await fs.writeFile(outputPath, renderedContent);
            } catch (error) {
              if (error.code === 'ERR_MODULE_NOT_FOUND') {
                console.warn(`Warning: Data module not found for template: ${templateName}`);
              } else {
                console.error(`Error loading data module: ${dataModulePath}`);
                console.error(error);
              }
            }
          })
        );
      };

      scanDataModules();
      scanTemplateFiles();
      renderTemplates();

      if (fs.existsSync(dataDir)) {
        fs.watch(dataDir, { recursive: true }, (eventType, fileName) => {
          if (fileName.endsWith('.handlebars.js')) {
            scanDataModules();
            renderTemplates();
          }
        });
      }

      if (fs.existsSync(templateDir)) {
        fs.watch(templateDir, { recursive: true }, (eventType, fileName) => {
          if (fileName.endsWith('.handlebars')) {
            scanTemplateFiles();
            renderTemplates();
          }
        });
      }
    },
  };
}