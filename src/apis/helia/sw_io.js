// src\apis\helia\sw_io.js
import { instantiateHeliaNode } from './sw_instantiate.js';


self.addEventListener('activate', event => {
    event.waitUntil(
      clients.claim().then(() => {
        console.log('Service Worker now controls the clients immediately.');
      })
    );
});





self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (url.origin === self.location.origin) {
    if (url.pathname === '/src/helia/api/v0/start') {
      event.respondWith(handleStart());
    } else if (url.pathname === '/src/helia/api/v0/stop') {
      event.respondWith(handleStop());
    } else if (url.pathname === '/src/helia/api/v0/status') {
      event.respondWith(handleStatus());
    } else if (url.pathname === '/src/helia/api/v0/add-file') {
      event.respondWith(handleAddFile(event.request));
    } else if (url.pathname === '/src/helia/api/v0/get-file') {
      event.respondWith(handleGetFile(event.request));
    } else if (url.pathname === '/src/helia/api/v0/file-info') {
      event.respondWith(handleGetFileInfo(event.request));
    }
  }
});





async function handleStart() {
if (!self.helia) {
    self.helia = await instantiateHeliaNode();
}

return new Response(JSON.stringify({ status: 'Helia Node started' }), {
    headers: { 'Content-Type': 'application/json' }
});
}

async function handleStop() {
console.log('Stop request received'); // 调试输出
if (self.helia) {
    await self.helia.stop();
    self.helia = null;
}
return new Response(JSON.stringify({ status: 'Helia Node stopped' }), {
    headers: { 'Content-Type': 'application/json' }
});
}





async function handleStatus() {
  // Check if the Helia node is initialized
  const status = self.helia ? self.helia.libp2p.status : 'Helia Node not initialized';

  // Retrieve all peers from the peerStore
  const peers = await self.helia.libp2p.peerStore.all();


  // Build the response object with detailed node status
  const responseContent = {
      nodeStatus: status,  // Node initialization status
      totalPeers: peers.length,  // Total number of peers in the store
      connectedPeers: self.helia.libp2p.getPeers().length  // Number of currently connected peers
  };

  // Return the response with detailed information in JSON format
  return new Response(JSON.stringify(responseContent), {
      headers: { 'Content-Type': 'application/json' }
  });
}





async function handleAddFile(request) {
  if (!self.helia) {
    return new Response(JSON.stringify({ error: 'Helia node not initialized' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  
  if (!file) {
    return new Response(JSON.stringify({ error: 'No file provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const content = await file.arrayBuffer();
  const result = await self.helia.unixfs.addFile({ content });

  const stats = await self.helia.unixfs.stat(result.cid);

  return new Response(JSON.stringify({
    cid: result.cid.toString(),
    size: stats.size,
    cumulativeSize: stats.cumulativeSize,
    type: stats.type,
    mode: stats.mode,
    mtime: stats.mtime ? stats.mtime.toISOString() : null
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}





// 处理文件获取请求
async function handleGetFile(request) {
  if (!self.helia) {
    return new Response(JSON.stringify({ error: 'Helia node not initialized' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const url = new URL(request.url);
  const cid = url.searchParams.get('cid');

  if (!cid) {
    return new Response(JSON.stringify({ error: 'No CID provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const content = await self.helia.unixfs.cat(cid);
    return new Response(content, {
      headers: { 'Content-Type': 'application/octet-stream' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'File not found or error retrieving file' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}





// 处理文件元信息获取请求
async function handleGetFileInfo(request) {
  if (!self.helia) {
    return new Response(JSON.stringify({ error: 'Helia node not initialized' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const url = new URL(request.url);
  const cid = url.searchParams.get('cid');

  if (!cid) {
    return new Response(JSON.stringify({ error: 'No CID provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const stats = await self.helia.unixfs.stat(cid);
    return new Response(JSON.stringify({
      size: stats.size,
      cumulativeSize: stats.cumulativeSize,
      type: stats.type,
      mode: stats.mode,
      mtime: stats.mtime ? stats.mtime.toISOString() : null
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'File not found or error retrieving file info' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
