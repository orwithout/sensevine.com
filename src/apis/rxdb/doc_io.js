// src/apis/rxdb/doc_io.js
import _ from 'lodash';
import {
  getMetaCollection,
  validateFullMeta,
  validatePartialMeta,
  validateMetaField,
  metaSchema
} from './doc_meta.js';
import {
  getVersionsCollection,
  validateFullVersion,
  validatePartialVersion,
  validateVersionField,
  versionSchema
} from './doc_versions.js';

const CONTENT_SIZE_THRESHOLD = 1024 * 1024; // 1MB threshold for inline content

class DocIO {
  constructor() {
    this.subscriptions = new WeakMap();
    this.debouncedUnsubscribe = _.debounce(this.unsubscribe.bind(this), 30000);
  }

  async init() {
    this.metaCollection = await getMetaCollection();
    this.versionsCollection = await getVersionsCollection();
  }

  async storeContent(content) {
    const contentBuffer = Buffer.from(content);
    const size = contentBuffer.length;

    if (size <= CONTENT_SIZE_THRESHOLD) {
      return { cid: null, size, content: contentBuffer.toString('base64') };
    } else {
      // Here you would typically use IPFS to store the content and get a CID
      // For this example, we'll just generate a random CID
      const cid = `cid_${Math.random().toString(36).slice(2, 11)}`;
      await this.versionsCollection.insert({
        cid,
        content: { contentRefType: 'cid', contentRefLocation: cid },
        size,
        published: new Date().toISOString()
      });
      return { cid, size };
    }
  }
  
  async add(docData, content) {
    const validationResult = validateFullMeta(docData);
    if (!validationResult.valid) {
      console.error('Validation failed:', validationResult.errors);
      throw new Error('Validation failed');
    }

    const newDoc = { ...docData };
    if (content) {
      const { cid, size } = await this.storeContent(content);
      newDoc.doc = newDoc.doc || {};
      newDoc.doc.cid = cid;
      newDoc.doc.size = size;
      newDoc.doc.versions = [{ cid, published: new Date().toISOString() }];
    }

    return this.metaCollection.insert(newDoc);
  }

  async update(docId, updateData, content) {
    const doc = await this.metaCollection.findOne(docId).exec();
    if (!doc) {
      throw new Error(`Document not found: ${docId}`);
    }

    const newData = { ...doc.toJSON(), ...updateData };
    const validationResult = validateFullMeta(newData);
    if (!validationResult.valid) {
      console.error('Validation failed:', validationResult.errors);
      throw new Error('Validation failed');
    }

    if (content) {
      const { cid, size } = await this.storeContent(content);
      newData.doc = newData.doc || {};
      newData.doc.cid = cid;
      newData.doc.size = size;
      newData.doc.versions = [...(newData.doc.versions || []), { cid, published: new Date().toISOString() }];
    }

    return this.metaCollection.upsert(newData);
  }

  findById(id) {
    return this.metaCollection.findOne(id).exec();
  }

  findByField(fieldName, value, limit = Number.MAX_SAFE_INTEGER) {
    return this.metaCollection.find().where(fieldName).eq(value).limit(limit).exec();
  }

  getSchemaProperties(fieldPath) {
    const pathParts = fieldPath.split('.');
    let currentSchema = _.get(metaSchema, 'properties');
    for (const part of pathParts) {
      if (_.get(currentSchema, [part, 'type']) === 'array') {
        return {
          isArray: true,
          itemProperties: _.get(currentSchema, [part, 'items', 'properties'])
        };
      }
      currentSchema = _.get(currentSchema, [part, 'properties']);
      if (!currentSchema) return { isArray: false, itemProperties: null };
    }
    return { isArray: false, itemProperties: currentSchema };
  }

  async queryStartsWith(fieldPath, value, limit = 5) {
    const { isArray, itemProperties } = this.getSchemaProperties(fieldPath);
  
    let selector;
    if (isArray) {
      if (itemProperties) {
        const searchableProperties = _.filter(_.keys(itemProperties), prop => 
          ['string', 'number'].includes(_.get(itemProperties, [prop, 'type']))
        );
        selector = {[fieldPath]: {$elemMatch: {$or: searchableProperties.map(prop => ({[prop]: { $regex: `^${value}`, $options: 'i' }}))}}};
      } else {
        selector = {[fieldPath]: { $elemMatch: { $regex: `^${value}`, $options: 'i' } }};
      }
    } else {
      selector = { [fieldPath]: { $regex: `^${value}`, $options: 'i' } };
    }
  
    const results = await this.metaCollection.find({ selector }).limit(limit).exec();
    return _.map(results, doc => doc.toJSON());
  }

  subscribeToChanges(query = {}, callback) {
    const key = {};
    const subscription = this.metaCollection.find(query).$.subscribe(results => {
      callback(results);
      this.debouncedUnsubscribe.cancel();
      this.debouncedUnsubscribe(key);
    });
  
    this.subscriptions.set(key, subscription);
    return key;
  }
  
  unsubscribe(key) {
    const subscription = this.subscriptions.get(key);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(key);
      console.log('Subscription cancelled');
    }
  }

  unsubscribeAll() {
    this.subscriptions.forEach((_, key) => this.unsubscribe(key));
    console.log('All subscriptions cancelled');
  }
}

let instance;

export async function getDocIO() {
  if (!instance) {
    instance = new DocIO();
    await instance.init();
  }
  return instance;
}

export default getDocIO;