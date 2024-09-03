// src/apis/rxdb/collection_jstree.js
import getRxdbCollection from './base_rxdb.js';
import AjvValidator from './base_ajv.js';
import { getCollection as getFullCollection } from './collection_full.js';

const docSchema = {
  title: "wjw.net schema",
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {type: 'string',maxLength: 4095, description: 'file path'},
    parent: {type: 'string',maxLength: 4095, preprocess:'parent', description: 'parent file path'},
    state: {type: 'object',properties: {opened: {type: 'boolean'},disabled: {type: 'boolean'},selected: {type: 'boolean'}}},
    children: {anyOf: [{type: 'boolean'},{type: 'array', items: {type: 'object'}}],description: 'Preloaded children or flag for lazy loading'},
    li_attr: {type: 'object', description: 'Attributes for li element'},
    a_attr: {type: 'object', description: 'Attributes for a element'},
    tooltip: {type: 'string', maxLength: 1000, description: 'Hover tooltip text'},
    order: {type: 'number', description: 'Custom sort order'},
    checkbox: {type: 'object', description: 'Checkbox plugin options'},
    draggable: {type: 'boolean', description: 'Whether the node is draggable'},
    custom_classes: {type: 'string', maxLength: 255, description: 'Custom CSS classes'},
    doc: {
      type: 'object', properties: {
        id: {type: 'string',maxLength: 36, description: 'UUID v4'},
        type: {type: 'string', maxLength: 64,description: 'Event or MIME Type: Like, Create, folder, text/bookmark, app/docx, link/docx, image/jpeg'},
        name: {type: 'string',maxLength: 64},
        icon: {type: 'array',maxItems: 4095,uniqueItems: true,items: {type: 'string',maxLength: 4095}, preprocess: 'strArray'},
      },required: ['id']
    }
  },
  required: ['id'],
  indexes: ['parent','doc.id','doc.type','doc.name']
};

const migrationStrategies = {
  1: (oldDoc) => oldDoc
};

let jstreeCollection = null;
async function getCollection() {
  if (!jstreeCollection) {
    jstreeCollection = await getRxdbCollection('jstree_docs', docSchema, migrationStrategies);
    
    // 在这里执行初始同步
    try {
      await syncFromFullCollection();
      console.log('Initial synchronization completed successfully.');
    } catch (error) {
      console.error('Error during initial synchronization:', error);
      // 可以选择是否在这里抛出错误，取决于你的错误处理策略
      // throw error;
    }
  }
  return jstreeCollection;
};

const { version, primaryKey, indexes, required, ...ajvSchema } = docSchema;
const fullValidator = new AjvValidator({...ajvSchema, required});
const partialValidator = new AjvValidator(ajvSchema);
const validateFull = (data) => fullValidator.validate(data);
const validatePartial = (data) => partialValidator.validate(data);
const validateField = partialValidator.validateField.bind(partialValidator);

// Function to sync data from collection_full to collection_jstree
async function syncFromFullCollection() {
  const fullCollection = await getFullCollection();
  
  if (!jstreeCollection) {
    throw new Error('jstreeCollection not initialized. Call getCollection() first.');
  }

  const fullDocs = await fullCollection.find().exec();

  for (const fullDoc of fullDocs) {
    const jstreeDoc = {
      id: fullDoc.id,
      parent: fullDoc.parent,
      state: fullDoc.state,
      children: fullDoc.children,
      li_attr: fullDoc.li_attr,
      a_attr: fullDoc.a_attr,
      tooltip: fullDoc.tooltip,
      order: fullDoc.order,
      checkbox: fullDoc.checkbox,
      draggable: fullDoc.draggable,
      custom_classes: fullDoc.custom_classes,
      doc: {
        id: fullDoc.doc.id,
        type: fullDoc.doc.type,
        name: fullDoc.doc.name,
        icon: fullDoc.doc.icon
      }
    };

    try {
      await jstreeCollection.upsert(jstreeDoc);
    } catch (error) {
      console.error(`Error upserting document ${jstreeDoc.id}:`, error);
    }
  }
}

export { getCollection, validateFull, validatePartial, validateField, docSchema, syncFromFullCollection };