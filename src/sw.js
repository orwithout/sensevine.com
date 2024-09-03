// sw.js
import { getBaseDocsStoreInstance } from './docs_easy_io.js';

self.addEventListener('install', event => {
  self.skipWaiting();
  console.log('Service Worker installed');
});

self.addEventListener('activate', event => {
  self.clients.claim();
  console.log('Service Worker activated');
});

self.addEventListener('message', async event => {
  const { action } = event.data;
  if (action === 'addSampleDoc') {
    try {
      const baseDocsStore = await getBaseDocsStoreInstance('base');
      const sampleDoc = {
        id: Date.now().toString(),
        type: 'text/txt',
        size: 1235,
        name: 'Sample Document',
        content: 'This is a sample document.',
        tags: ['sample', 'test'],
      };
      await baseDocsStore.add(sampleDoc);

      const clients = await self.clients.matchAll();
      for (const client of clients) {
        client.postMessage({ message: 'Sample document added', sampleDoc });
      }
    } catch (error) {
      const clients = await self.clients.matchAll();
      for (const client of clients) {
        client.postMessage({ error: error.message });
      }
    }
  }
});
