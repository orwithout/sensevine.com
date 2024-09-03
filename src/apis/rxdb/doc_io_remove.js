// doc_io_crud.js
import {v4 as uuidv4 } from 'uuid';
import { getMetaCollection, validateFullMeta} from './doc_meta.js';
import {getVersionsCollection} from './doc_versions.js';

const CONTENT_SIZE_THRESHOLD = 1024 * 1024; // 1MB threshold for inline content

async function storeContent(docId, content, options = {}) {
  const { forceExternal = false, type = 'content' } = options;
  const contentBuffer = Buffer.from(JSON.stringify(content));
  const size = contentBuffer.length;
  const cid = `cid_${uuidv4()}`;

  if (!forceExternal && size <= CONTENT_SIZE_THRESHOLD) {
    return {
      cid,
      size,
      content: contentBuffer.toString('base64'),
      contentRefType: 'inline',
      contentRefLocation: null
    };
  } else {
    const versionsCollection = await getVersionsCollection();
    const versionDoc = {
      cid,
      docId,
      type,
      size,
      published: new Date().toISOString(),
      content
    };

    await versionsCollection.insert(versionDoc);
    return {
      cid,
      size,
      contentRefType: 'rxdb',
      contentRefLocation: `./doc_versions/${cid}`
    };
  }
}

function updateTimestamps(docData, isNew = false) {
  const now = new Date().toISOString();
  if (isNew) {
    docData.doc.published = now;
  }
  docData.doc.updated = now;
  return docData;
}

export async function docAdd(data) {
  let newDoc = {
    id: data.id || uuidv4(),
    parent: data.parent || '#',
    doc: {
      id: data.doc?.id || uuidv4(),
      type: data.doc?.type || 'text/plain',
      name: data.doc?.name || 'Untitled',
      ...data.doc
    },
    ...data
  };

  newDoc = updateTimestamps(newDoc, true);

  if (newDoc.doc.content) {
    const { cid, size, content, contentRefType, contentRefLocation } = await storeContent(newDoc.id, newDoc.doc.content);
    newDoc.cid = cid;
    newDoc.doc.size = size;
    
    if (contentRefType === 'inline') {
      newDoc.doc.content = content;
    } else {
      newDoc.doc.content = { contentRefType, contentRefLocation };
    }
  }

  const validationResult = validateFullMeta(newDoc);
  if (!validationResult.valid) {
    console.error('Metadata validation failed:', validationResult.errors);
    throw new Error('Metadata validation failed');
  }

  const metaCollection = await getMetaCollection();
  return metaCollection.insert(newDoc);
}


function calculateDocSize(doc) {
  // 这个函数计算 doc 对象的实际大小
  // 注意：这是一个简化的实现，可能需要根据具体需求进行调整
  return Buffer.from(JSON.stringify(doc)).length;
}

// function calculateDocSize(obj, seen = new WeakSet()) {
//   let size = 0;

//   // 处理循环引用
//   if (seen.has(obj)) return 0;
//   seen.add(obj);

//   if (typeof obj === 'string') {
//     size += obj.length * 2; // UTF-16 编码
//   } else if (typeof obj === 'number') {
//     size += 8; // 假设是 64 位浮点数
//   } else if (typeof obj === 'boolean') {
//     size += 4; // 假设布尔值占用 4 字节
//   } else if (obj === null) {
//     size += 4; // null 通常被视为指针大小
//   } else if (typeof obj === 'object') {
//     if (Array.isArray(obj)) {
//       size += 4; // 数组长度
//       for (const item of obj) {
//         size += calculateDocSize(item, seen);
//       }
//     } else if (obj instanceof Date) {
//       size += 8; // 日期通常存储为时间戳（8字节）
//     } else {
//       for (const [key, value] of Object.entries(obj)) {
//         size += key.length * 2; // 键名
//         size += calculateDocSize(value, seen); // 递归计算值的大小
//       }
//     }
//   }

//   return size;
// }



export async function docUpdate(updateData) {
  if (!updateData.id) {
    throw new Error('Document ID is required for update');
  }

  const metaCollection = await getMetaCollection();
  const existingDoc = await metaCollection.findOne(updateData.id).exec();
  if (!existingDoc) {
    throw new Error(`Document not found: ${updateData.id}`);
  }

  const oldData = existingDoc.toJSON();

  // 检查 forbidden 字段
  if (updateData.id !== oldData.id || (updateData.doc && updateData.doc.id !== oldData.doc.id)) {
    throw new Error('Updating id or doc.id is not allowed');
  }

  let newData = _.merge({}, oldData, updateData);
  newData = updateTimestamps(newData, false);

  // 处理内容更新
  const contentFields = ['content', 'object', 'source'];
  for (const field of contentFields) {
    if (newData.doc && newData.doc[field] !== undefined && !_.isEqual(newData.doc[field], oldData.doc[field])) {
      const { cid, size, contentRefType, contentRefLocation } = await storeContent(newData.id, newData.doc[field], { type: field });
      
      if (contentRefType === 'inline') {
        newData.doc[field] = newData.doc[field];
      } else {
        newData.doc[field] = { contentRefType, contentRefLocation };
      }
    }
  }


  // 计算 doc 的实际大小
  newData.doc.size = calculateDocSize(newData.doc);

  // 检查 doc 是否有变化，如果有则存储新的历史版本
  if (!_.isEqual(oldData.doc, newData.doc)) {
    const { cid, contentRefType, contentRefLocation } = await storeContent(newData.id, newData.doc, { forceExternal: true, type: 'version' });
    newData.versions = [
      ...(newData.versions || []),
      { 
        cid,
        docId: newData.id,
        contentRefType,
        contentRefLocation,
        published: newData.doc.updated
      }
    ];
  }

  const validationResult = validateFullMeta(newData);
  if (!validationResult.valid) {
    console.error('Validation failed:', validationResult.errors);
    throw new Error('Validation failed');
  }

  return metaCollection.upsert(newData);
}