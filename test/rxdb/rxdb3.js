import { addRxPlugin } from 'rxdb';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
addRxPlugin(RxDBDevModePlugin);


import { createRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';

const myDatabase = await createRxDatabase({
  name: 'mydatabase',
  storage: getRxStorageDexie()
});


const todoSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
      id: {
          type: 'string',
          maxLength: 100 // <- the primary key must have set maxLength
      },
      name: {
          type: 'string'
      },
      done: {
          type: 'boolean'
      },
      timestamp: {
          type: 'string',
          format: 'date-time'
      }
  },
  required: ['id', 'name', 'done', 'timestamp']
}


await myDatabase.addCollections({
  todos: {
    schema: todoSchema
  }
});

const myDocument = await myDatabase.todos.insert({
  id: 'todo1',
  name: 'Learn RxDB',
  done: false,
  timestamp: new Date().toISOString()
});


await myDocument.patch({
  done: true
});


await myDocument.modify(docData => {
  docData.done = true;
  return docData;
});