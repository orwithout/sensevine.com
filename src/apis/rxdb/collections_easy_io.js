// src\apis\rxdb\collections_easy_io.js
import _ from 'lodash';

class DocsEasyIo {
  constructor(moduleName = 'doc_meta') {
    this.moduleName = moduleName;
    this.subscriptions = new WeakMap();
    this.debouncedUnsubscribe = _.debounce(this.unsubscribe.bind(this), 30000);
    this.orphanFolderId = 'orphan_-_folder';
  }

  async init() {
    const modules = import.meta.glob('./doc_*.js');
    const {getMetaCollection, validateFullMeta, validateMetaField, validatePartialMeta, metaSchema} = await modules[`./${this.moduleName}.js`]();
    Object.assign(this, {validateFullMeta, validateMetaField, validatePartialMeta, metaSchema});
    this.collection = await getMetaCollection();
  }
  
  getParentPath(id) {
    const parts = id.split('/');
    parts.pop(); // 移除最后一个部分
    return parts.join('/') || '#'; // 如果是根节点，返回 '#'
  }
  async add(docData) {
    const validationResult = await this.validateFullMeta(docData);
    if (!validationResult.valid) {
      console.error('Validation failed:', validationResult.errors);
      throw new Error('Validation failed');
    }

    // 计算 parent 字段并添加到 docData
    // const parent = this.getParentPath(docData.id);
    // const newDocData = { ...docData, parent };

    return this.collection.insert(docData);
  }

  async update(docId, updateData) {
    const doc = await this.collection.findOne(docId).exec();
    if (!doc) {
      throw new Error(`Document not found: ${docId}`);
    }

    const newData = { ...doc.toJSON(), ...updateData };
    const validationResult = await this.validateFullMeta(newData);
    if (!validationResult.valid) {
      console.error('Validation failed:', validationResult.errors);
      throw new Error('Validation failed');
    }

    // 如果 id 被更新，重新计算 parent 字段
    if (updateData.id && updateData.id !== docId) {
      newData.parent = this.getParentPath(updateData.id);
    }

    return this.collection.upsert(newData);
  }

  findById(id) {
    return this.collection.findOne(id).exec();
  }

  findByField(fieldName, value, limit = Number.MAX_SAFE_INTEGER) {
    return this.collection.find().where(fieldName).eq(value).limit(limit).exec();
  }

  getSchemaProperties(fieldPath) {
    const pathParts = fieldPath.split('.');
    let currentSchema = _.get(this.docSchema, 'properties');
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
  
    const results = await this.collection.find({ selector }).limit(limit).exec();
    return _.map(results, doc => doc.toJSON());
  }

  subscribeToChanges(query = {}, callback) {
    const key = {};
    const subscription = this.collection.find(query).$.subscribe(results => {
      callback(results);
      this.debouncedUnsubscribe.cancel();  // 取消之前的延迟取消
      this.debouncedUnsubscribe(key);  // 重新设置延迟取消
    });
  
    this.subscriptions.set(key, subscription);
  
    return key;
  }
  
  unsubscribe(key) {
    const subscription = this.subscriptions.get(key);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(key);
      console.log('订阅已取消');
    }
  }

  unsubscribeAll() {
    this.subscriptions.forEach((_, key) => this.unsubscribe(key));
    console.log('所有订阅已取消');
  }


  async findOrphanNodes() {
    const allDocs = await this.collection.find().exec();
    const allIds = new Set(allDocs.map(doc => doc.id));
    return allDocs.filter(doc => 
      doc.parent !== '#' && doc.parent !== '' && !allIds.has(doc.parent)
    );
  }

  async getJsTreeNodes(nodeId = '#') {
    console.log('Getting nodes for:', nodeId);

    let docs;
    if (nodeId === '#') {
      // 查询顶级节点和孤儿节点目录
      const query = { parent: { $in: ['#', ''] } };
      docs = await this.collection.find({ selector: query }).exec();
      const orphans = await this.findOrphanNodes();
      if (orphans.length > 0) {
        docs.push({
          id: this.orphanFolderId,
          parent: '#',
          doc: { name: '孤立的ORPHAN', type: 'folder' }
        });
      }
    } else if (nodeId === this.orphanFolderId) {
      // 如果是请求孤儿节点目录的内容
      docs = await this.findOrphanNodes();
    } else {
      // 正常查询子节点
      const query = { parent: nodeId };
      docs = await this.collection.find({ selector: query }).exec();
    }

    console.log(`Found ${docs.length} nodes`);

    // 转换为 jsTree 格式
    const nodes = await Promise.all(docs.map(async doc => ({
      id: doc.id,
      text: doc.doc.name || doc.id,
      icon: doc.doc.type === 'folder' ? 'jstree-folder' : 'jstree-file',
      type: doc.doc.type,
      children: await this.hasChildren(doc.id)
    })));

    console.log('Transformed nodes:', nodes);
    return nodes;
  }

  async hasChildren(nodeId) {
    if (nodeId === this.orphanFolderId) {
      const orphans = await this.findOrphanNodes();
      return orphans.length > 0;
    }
    const children = await this.collection.find({
      selector: { parent: nodeId },
      limit: 1
    }).exec();
    return children.length > 0;
  }



}

const instances = {};

export async function getDocsEasyIo(moduleName) {
  if (!instances[moduleName]) {
    instances[moduleName] = new DocsEasyIo(moduleName);
    await instances[moduleName].init();
  }
  return instances[moduleName];
}

export default getDocsEasyIo;
// Usage（使用方法）:
// import { getDocsEasyIo } from './collections_easy_io.js';
// const docsEasyIo = await getDocsEasyIo('collection_full');
// await docsEasyIo.add(sampleDoc);