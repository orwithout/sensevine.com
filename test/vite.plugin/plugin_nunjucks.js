import fs from 'fs-extra';
import path from 'path';
import nunjucks from 'nunjucks';

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
  const dataDir = options.dataDir || './nunjucks/data';
  const templateDir = options.templateDir || './nunjucks';

  return {
    name: 'vite-plugin-nunjucks',
    handleHotUpdate({ file, server }) {
      if (file.endsWith('.nunjucks.js') || file.endsWith('.nunjucks')) {
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
          if (filePath.endsWith('.nunjucks.js')) {
            const moduleName = filePath.replace(dataDir + '/', '').replace('.nunjucks.js', '');
            delete server.moduleGraph.fileToModulesMap[path.resolve(filePath)];
            dataModules[moduleName] = server.ssrLoadModule(filePath);
          }
        });
      };

      const scanTemplateFiles = () => {
        walkSync(templateDir, (filePath) => {
          if (filePath.endsWith('.nunjucks')) {
            templateFiles.push(filePath);
          }
        });
      };


      // 设置 Nunjucks 环境
      const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(templateDir), {
        autoescape: true,
        trimBlocks: true,
        lstripBlocks: true
      });
      const renderTemplates = async () => {
        await Promise.all(
          templateFiles.map(async (filePath) => {
            const templateName = path.basename(filePath, '.nunjucks');
            const templateContent = await fs.readFile(filePath, 'utf-8');
      
            const outputPath = path.join(path.dirname(filePath), templateName);
            const dataModulePath = path.join(dataDir, `${templateName}.nunjucks.js`);
      
            try {
              const dataModule = await server.ssrLoadModule(dataModulePath);
              const data = dataModule.default;

              // 使用 Nunjucks 环境渲染模板
              const renderedContent = env.renderString(templateContent, data);
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
          if (fileName.endsWith('.nunjucks.js')) {
            scanDataModules();
            renderTemplates();
          }
        });
      }

      if (fs.existsSync(templateDir)) {
        fs.watch(templateDir, { recursive: true }, (eventType, fileName) => {
          if (fileName.endsWith('.nunjucks')) {
            scanTemplateFiles();
            renderTemplates();
          }
        });
      }
    },
  };
}
