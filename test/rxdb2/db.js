// db.js
import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';

addRxPlugin(RxDBDevModePlugin);
addRxPlugin(RxDBQueryBuilderPlugin);

let _db;

async function getRxDb() {
  if (!_db) {
    _db = await createRxDatabase({
      name: 'mydb',
      storage: getRxStorageDexie()
    });
  }
  return _db;
}


// db.js
let _collections = {};

export default async function getCollectionInstance(name, schema) {
  const db = await getRxDb();
  
  // 检查集合是否已存在
  if (!db[name]) {
    await db.addCollections({
      [name]: {
        schema
      }
    });
    _collections[name] = db[name];
  } else if (!_collections[name]) {
    _collections[name] = db[name];
  }

  return _collections[name];
}
