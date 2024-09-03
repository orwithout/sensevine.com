// todos.js
import getCollectionInstance from './db.js';

const schema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100  // 添加这一行
    },
    text: {
      type: 'string'
    },
    completed: {
      type: 'boolean'
    }
  },
  required: ['id', 'text', 'completed']
};

export default async function() {
  return await getCollectionInstance('todos', schema);
}