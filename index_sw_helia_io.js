// index_sw_helia_io.js
import { instantiateHeliaNode } from '/src/apis/helia/sw_instantiate.js';
import { CID } from 'multiformats/cid'

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
    if (url.pathname === '/index_sw_helia_io/v0/start') {
      event.respondWith(handleStart());
    } else if (url.pathname === '/index_sw_helia_io/v0/stop') {
      event.respondWith(handleStop());
    } else if (url.pathname === '/index_sw_helia_io/v0/status') {
      event.respondWith(handleStatus());
    } else if (url.pathname === '/index_sw_helia_io/v0/add-file') {
      event.respondWith(handleAddFile(event.request));
    } else if (url.pathname === '/index_sw_helia_io/v0/get-file') {
      event.respondWith(handleGetFile(event.request));
    } else if (url.pathname === '/index_sw_helia_io/v0/file-info') {
      event.respondWith(handleGetFileInfo(event.request));
    } else if (url.pathname === '/index_sw_helia_io/v0/list-files') {
      event.respondWith(handleListFiles(event.request));
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
  console.log('Stop request received');
  if (self.helia) {
      await self.helia.stop();
      self.helia = null;
  }
  return new Response(JSON.stringify({ status: 'Helia Node stopped' }), {
      headers: { 'Content-Type': 'application/json' }
  });
}

async function handleStatus() {
  const status = self.helia ? self.helia.libp2p.status : 'Helia Node not initialized';
  // Retrieve all peers from the peerStore
  const peers = await self.helia.libp2p.peerStore.all();
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
    return new Response(JSON.stringify({ error: 'Helia 节点未初始化' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) {
      return new Response(JSON.stringify({ error: '未提供文件' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    console.log('接收到文件:', file.name, '大小:', file.size);
    const content = await file.arrayBuffer();
    console.log('文件已转换为ArrayBuffer');
    
    const cid = await self.helia.unixfs.addBytes(new Uint8Array(content), {
      rawLeaves: true
    });
    
    console.log('文件已添加到Helia:', cid.toString());
    
    // 固定文件，并添加元数据
    const metadata = {
      addedAt: new Date().toISOString(),
      fileName: file.name,
      fileSize: file.size  // 存储准确的文件大小
    };
    for await (const pinnedCid of self.helia.pins.add(cid, { metadata })) {
      console.log('文件已固定:', pinnedCid.toString());
    }
    
    // 检查文件是否被固定
    const isPinned = await self.helia.pins.isPinned(cid);
    console.log('文件是否被固定:', isPinned);

    // 获取 pin 信息
    let pinInfo;
    for await (const pin of self.helia.pins.ls({ cid })) {
      pinInfo = pin;
      break;
    }

    return new Response(JSON.stringify({
      cid: cid.toString(),
      size: file.size,
      pinned: isPinned,
      pinDepth: pinInfo ? pinInfo.depth : undefined,
      pinMetadata: pinInfo ? pinInfo.metadata : undefined
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('handleAddFile中的错误:', error);
    return new Response(JSON.stringify({ error: '添加文件时出错', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleGetFile(request) {
  if (!self.helia) {
    return new Response(JSON.stringify({ error: 'Helia 节点未初始化' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  const url = new URL(request.url);
  const cid = url.searchParams.get('cid');
  if (!cid) {
    return new Response(JSON.stringify({ error: '未提供 CID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  try {
    const chunks = [];
    for await (const chunk of self.helia.unixfs.cat(cid)) {
      chunks.push(chunk);
    }
    const content = new Uint8Array(chunks.reduce((acc, val) => acc.concat(Array.from(val)), []));
    return new Response(content, {
      headers: { 'Content-Type': 'application/octet-stream' }
    });
  } catch (error) {
    console.error('Error in handleGetFile:', error);
    return new Response(JSON.stringify({ error: '获取文件时出错', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleGetFileInfo(request) {
  if (!self.helia) {
    return new Response(JSON.stringify({ error: 'Helia 节点未初始化' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  const url = new URL(request.url);
  const cidString = url.searchParams.get('cid');
  if (!cidString) {
    return new Response(JSON.stringify({ error: '未提供 CID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  try {
    const fileDetails = await getFileDetails(cidString);
    if (!fileDetails) {
      return new Response(JSON.stringify({ error: '获取文件信息失败' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify(fileDetails), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in handleGetFileInfo:', error);
    return new Response(JSON.stringify({ error: '获取文件信息时出错', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleListFiles(request) {
  if (!self.helia) {
    return new Response(JSON.stringify({ error: 'Helia节点未初始化' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const offset = parseInt(url.searchParams.get('offset')) || 0;

    console.log('尝试列出文件，限制数量:', limit, '偏移量:', offset);

    const files = [];
    let count = 0;
    for await (const pin of self.helia.pins.ls()) {
      if (count >= offset + limit) break;
      if (count >= offset) {
        try {
          const fileDetails = await getFileDetails(pin.cid);
          if (fileDetails) {
            files.push(fileDetails);
          }
        } catch (error) {
          console.warn('获取文件信息时出错:', pin.cid.toString(), error);
        }
      }
      count++;
    }

    if (files.length === 0) {
      console.log('没有找到文件');
      return new Response(JSON.stringify({ message: '没有找到文件' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('文件列表成功:', files);
    return new Response(JSON.stringify({
      files: files,
      total: count,
      limit: limit,
      offset: offset
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('handleListFiles中的错误:', error);
    return new Response(JSON.stringify({ error: '列出文件时出错', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}


async function getFileDetails(cid) {
  try {
    let cidObj;
    if (typeof cid === 'string') {
      cidObj = CID.parse(cid);
    } else if (cid instanceof CID) {
      cidObj = cid;
    } else if (typeof cid === 'object' && cid.toString) {
      // 假设这是 Helia 返回的 CID 对象
      cidObj = CID.parse(cid.toString());
    } else {
      throw new Error('Invalid CID format');
    }

    // 获取文件状态
    const stat = await self.helia.unixfs.stat(cidObj);

    // 检查文件是否被固定
    const isPinned = await self.helia.pins.isPinned(cidObj);

    // 获取 pin 信息
    let pinInfo = null;
    if (isPinned) {
      for await (const pin of self.helia.pins.ls({ cid: cidObj })) {
        pinInfo = pin;
        break;  // 我们只需要第一个匹配的 pin
      }
    }

    // 获取块信息
    const block = await self.helia.blockstore.get(cidObj);

    // 构建文件详情对象
    let fileSize = 0;
  if (pinInfo && pinInfo.metadata && pinInfo.metadata.fileSize) {
    fileSize = pinInfo.metadata.fileSize;
  } else {
    // 如果元数据中没有文件大小，则使用之前的方法计算
    if (stat.type === 'file') {
      for await (const chunk of self.helia.unixfs.cat(cidObj)) {
        fileSize += chunk.length;
      }
    } else {
      fileSize = stat.size;
    }
  }

  const fileDetails = {
    cid: cidObj.toString(),
    size: fileSize,
    type: stat.type,
    blocks: stat.blocks,
    pinned: isPinned,
    pinDepth: pinInfo ? pinInfo.depth : undefined,
    pinMetadata: pinInfo ? pinInfo.metadata : undefined
  };

    console.log('File details:', fileDetails);
    return fileDetails;

  } catch (error) {
    console.error('Error getting file details:', error);
    return null;
  }
}