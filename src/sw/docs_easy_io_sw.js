// src/form/lib/rxdb/docs_easy_io_sw.js
import { getBaseDocsStoreInstance } from './docs_easy_io.js';

class BaseDocsStoreSW {
  constructor(moduleName = 'base') {
    this.moduleName = moduleName;
    this.collection = null;
    this.schema = null;
  }

  async init() {
    const moduleData = await this.loadModule(this.moduleName);
    this.schema = moduleData.base_docs_yup_schema;
    this.getCollectionFunc = moduleData.getCollection;
  }

  async loadModule(moduleName) {
    const collection = await this.getCollection();
    const doc = await collection.findOne({ moduleName }).exec();
    if (doc) {
      return doc.toJSON().moduleData;
    } else {
      throw new Error(`Module ${moduleName} not found in RxDB`);
    }
  }

  async getCollection() {
    if (!this.collection) {
      this.collection = await getBaseDocsStoreInstance('base').getCollection();
    }
    return this.collection;
  }

  async add(docData) {
    try {
      await this.schema.validate(docData, { abortEarly: true });
    } catch (error) {
      console.error('Validation failed:', error);
      throw error;
    }
    const collection = await this.getCollection();
    await collection.insert(docData);
  }

  async findById(id) {
    const collection = await this.getCollection();
    return await collection.findOne(id).exec();
  }

  async findByField(fieldName, value, limit = Number.MAX_SAFE_INTEGER) {
    const collection = await this.getCollection();
    return await collection.find().where(fieldName).eq(value).limit(limit).exec();
  }

  async queryStartsWith(fieldName, value, limit = 5) {
    const collection = await this.getCollection();
    
    if (fieldName === 'tags') {
      const results = await collection.find({
        selector: {
          tags: {
            $elemMatch: {
              $regex: `^${value}`,
              $options: 'i'
            }
          }
        }
      }).limit(limit).exec();
      
      return results.map(doc => doc.toJSON());
    } else {
      const results = await collection.find({
        selector: {
          [fieldName]: {
            $regex: `^${value}`,
            $options: 'i'
          }
        }
      }).limit(limit).exec();
      
      return results.map(doc => doc.toJSON());
    }
  }

  async validateField(fieldName, value) {
    try {
      await this.schema.validateAt(fieldName, { [fieldName]: value });
      return true;
    } catch (error) {
      return false;
    }
  }
}

let instanceSW = null;

export async function getBaseDocsStoreSWInstance(moduleName) {
  if (!instanceSW) {
    instanceSW = new BaseDocsStoreSW(moduleName);
    await instanceSW.init();
  }
  return instanceSW;
}

export default { getBaseDocsStoreSWInstance };
