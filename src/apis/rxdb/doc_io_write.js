import { v4 as uuidv4 } from 'uuid';
import { getMetaCollection, validateFullMeta } from './doc_meta.js';
import { getVersionsCollection } from './doc_versions.js';
import _ from 'lodash';

// DocIoWrite.add  DocIoWrite.update
class DocIoWrite {
  constructor() {
    this.CONTENT_SIZE_THRESHOLD = 1024 * 1024; // 1MB threshold for inline content
    this.metaCollection = null;
    this.versionsCollection = null;
  }

  async init() {
    this.metaCollection = await getMetaCollection();
    this.versionsCollection = await getVersionsCollection();
  }

  async storeContent(docId, content, options = {}) {
    const { forceExternal = false, type = 'content' } = options;
    const encoder = new TextEncoder();
    const contentBuffer = encoder.encode(JSON.stringify(content));
    const size = contentBuffer.length;
    const cid = `cid_${uuidv4()}`;

    if (!forceExternal && size <= this.CONTENT_SIZE_THRESHOLD) {
      return {
        cid,
        size,
        content: btoa(String.fromCharCode.apply(null, contentBuffer)),
        contentRefType: 'inline',
        contentRefLocation: null
      };
    } else {
      const versionDoc = {
        cid,
        docId,
        type,
        size,
        published: new Date().toISOString(),
        content
      };

      await this.versionsCollection.insert(versionDoc);
      return {
        cid,
        size,
        contentRefType: 'rxdb',
        contentRefLocation: `./doc_versions/${cid}`
      };
    }
  }

  updateTimestamps(docData, isNew = false) {
    const now = new Date().toISOString();
    if (isNew) {
      docData.doc.published = now;
    }
    docData.doc.updated = now;
    return docData;
  }

  async docAdd(data) {
    if (!this.metaCollection) await this.init();

    let newDoc = {
      id: data.id || uuidv4(),
      parent: data.parent || '#',
      doc: {
        id: data.doc?.id || uuidv4(),
        cid: data.doc?.cid || `cid_${uuidv4()}`,
        type: data.doc?.type || 'text/plain',
        name: data.doc?.name || 'Untitled',
        ...data.doc
      },
      ...data
    };

    newDoc = this.updateTimestamps(newDoc, true);

    if (newDoc.doc.content) {
      const { cid, size, content, contentRefType, contentRefLocation } = await this.storeContent(newDoc.id, newDoc.doc.content);
      newDoc.doc.cid = cid;
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

    return this.metaCollection.insert(newDoc);
  }

  calculateDocSize(doc) {
    // This is a placeholder implementation. Replace with actual size calculation logic.
    return 102400;
  }

  async docUpdate(updateData) {
    if (!this.metaCollection) await this.init();

    if (!updateData.id) {
      throw new Error('Document ID is required for update');
    }

    const existingDoc = await this.metaCollection.findOne(updateData.id).exec();
    if (!existingDoc) {
      throw new Error(`Document not found: ${updateData.id}`);
    }

    const oldData = existingDoc.toJSON();

    if (updateData.id !== oldData.id || (updateData.doc.id && updateData.doc.id !== oldData.doc.id)) {
      throw new Error('Updating id or doc.id is not allowed');
    }

    let newData = _.merge({}, oldData, updateData);
    newData = this.updateTimestamps(newData, false);

    const contentFields = ['content', 'object', 'source'];
    for (const field of contentFields) {
      if (newData.doc && newData.doc[field] !== undefined && !_.isEqual(newData.doc[field], oldData.doc[field])) {
        const { cid, size, contentRefType, contentRefLocation } = await this.storeContent(newData.id, newData.doc[field], { type: field });
        
        if (contentRefType === 'inline') {
          newData.doc[field] = newData.doc[field];
        } else {
          newData.doc[field] = { contentRefType, contentRefLocation };
        }
      }
    }

    newData.doc.size = this.calculateDocSize(newData.doc);

    if (!_.isEqual(oldData.doc, newData.doc)) {
      const { cid, contentRefType, contentRefLocation } = await this.storeContent(newData.id, newData.doc, { forceExternal: true, type: 'version' });
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

    return this.metaCollection.upsert(newData);
  }
}

export default DocIoWrite;