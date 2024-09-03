// src/service-worker.js
import { getBaseDocsStoreSWInstance } from './form/lib/rxdb/docs_easy_io_sw.js';

self.addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      const store = await getBaseDocsStoreSWInstance('base');
      // 使用store进行操作
      // 例如，可以添加以下代码来处理请求
      // const doc = await store.findById('some-id');
      // return new Response(JSON.stringify(doc), { headers: { 'Content-Type': 'application/json' } });
    })()
  );
});
