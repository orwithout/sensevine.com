// baseDocsStoreCommon.js
export class BaseDocsStoreCommon {
    constructor(moduleName = 'base') {
      this.moduleName = moduleName;
      this.collection = null;
      this.schema = null;
      this.getCollectionFunc = null;
    }
  
    async init(loadModule) {
      const module = await loadModule(this.moduleName);
      this.schema = module.base_docs_yup_schema;
      this.getCollectionFunc = module.getCollection;
    }
  
    async getCollection() {
      if (!this.collection) {
        this.collection = await this.getCollectionFunc();
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
  