// sw_docs_easy_io.js
import { BaseDocsStoreCommon } from './docs_easy_io.js';
import { initDatabase } from './initDatabase.js';

class SwDocsEasyIO extends BaseDocsStoreCommon {
  constructor(moduleName = 'base') {
    super(moduleName);
  }

  async loadModuleFromRxDB(db, moduleUrl) {
    const moduleDoc = await db.modules.findOne({ selector: { url: moduleUrl } }).exec();
    if (!moduleDoc) {
      throw new Error('Module not found in RxDB');
    }
    const moduleText = moduleDoc.content;
    const moduleBlob = new Blob([moduleText], { type: 'application/javascript' });
    const moduleBlobUrl = URL.createObjectURL(moduleBlob);
    const module = await import(moduleBlobUrl);
    URL.revokeObjectURL(moduleBlobUrl);
    return module;
  }

  async loadModule(moduleName) {
    const db = await initDatabase();
    return this.loadModuleFromRxDB(db, `./${moduleName}_docs.js`);
  }
}

let instance = null;

export async function getSwBaseDocsStoreInstance(moduleName) {
  if (!instance) {
    instance = new SwDocsEasyIO(moduleName);
    await instance.init(instance.loadModule.bind(instance));
  }
  return instance;
}

export default { getSwBaseDocsStoreInstance };
