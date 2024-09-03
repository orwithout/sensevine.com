// src\form\lib\rxdb\base_rxdb.js
import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';

addRxPlugin(RxDBMigrationSchemaPlugin);
addRxPlugin(RxDBDevModePlugin);
addRxPlugin(RxDBQueryBuilderPlugin);

let _db;

async function getRxDb() {
  if (!_db) {
    _db = await createRxDatabase({
      name: 'wjw_net',
      storage: getRxStorageDexie(),
      strictMode: true
    });
  }
  return _db;
}

let _collections = {};

// src\form\lib\rxdb\base_rxdb.js

async function getRxdbCollection(name, schema, migrationStrategies) {
  const db = await getRxDb();
  
  if (!db[name]) {
    await db.addCollections({
      [name]: {
        schema,
        migrationStrategies
      }
    });
    _collections[name] = db[name];
  } else if (!_collections[name]) {
    _collections[name] = db[name];
  }

  return _collections[name];
}

export default getRxdbCollection;
