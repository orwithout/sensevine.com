// src/sw/sw_reg_preload.js
import { getBaseDocsStoreInstance } from '../form/lib/rxdb/docs_easy_io.js';

async function preloadModules() {
  const modules = import.meta.glob('../form/lib/rxdb/*_docs.js');
  const store = await getBaseDocsStoreInstance('base');

  for (const path in modules) {
    const module = await modules[path]();
    await store.add({
      id: Date.now().toString(), // 使用当前时间戳作为ID
      type: 'text/json', // 使用 'text/json' 作为类型
      size: JSON.stringify(module).length, // 计算JSON对象的大小
      name: path.replace('./', '').replace('_docs.js', ''),
      content: module, // 将模块内容作为 JSON 对象存储
      tags: ['sample', 'test']
    });
  }
}

export default preloadModules;
