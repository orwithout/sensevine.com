import fs from 'fs-extra';
import path from 'path';
import { pathToFileURL } from 'url';

function walkSync(dir, callback) {
    if (!fs.existsSync(dir)) {
        console.warn(`Warning: Directory "${dir}" does not exist.`);
        return;
    }

    fs.readdirSync(dir).forEach((file) => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            walkSync(filePath, callback);
        } else if (filePath.endsWith('.jsmake.js')) {
            callback(filePath);
        }
    });
}

function executeModule(filePath) {
    // 确保 filePath 是绝对路径
    const absolutePath = path.resolve(filePath);
    const moduleURL = pathToFileURL(absolutePath).href + '?t=' + Date.now();  // 添加查询字符串强制避免缓存

    import(moduleURL)
        .then(() => {
            console.log(`Executed ${filePath}`);
        })
        .catch(error => {
            console.error(`Error executing module: ${filePath}`, error);
        });
}


export default function(options = {}) {
    const moduleDir = options.moduleDir || './jsmake_modules';  // 默认模块目录

    return {
        name: 'jsmake-executor',
        configureServer(server) {
            // 首次启动时执行所有 .jsmake.js 文件
            walkSync(moduleDir, (filePath) => {
                executeModule(filePath);
            });

            // 设置文件监视器只针对 .jsmake.js 文件变动
            server.watcher.add(`${moduleDir}/**/*.jsmake.js`);

            // 只有当 .jsmake.js 文件发生变化时执行
            server.watcher.on('change', (changedPath) => {
                if (changedPath.endsWith('.jsmake.js')) {
                    console.log(`Detected change in ${changedPath}, re-executing...`);
                    executeModule(changedPath);
                }
            });
        },
    };
}
