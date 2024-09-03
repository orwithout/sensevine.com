// 导入 RxDB 和 RxJS
import {
    createRxDatabase,
    addRxPlugin
  } from 'https://unpkg.com/rxdb@9.0.0/dist/rxdb.min.js';
  import {
    getRxStorageDexie
  } from 'https://unpkg.com/rxdb@9.0.0/plugins/storage-dexie/dist/rxdb.storage.dexie.min.js';
  import {
    map
  } from 'https://unpkg.com/rxjs@6.6.0/operators/map.js';
  
  // 添加 Dexie 适配器插件
  addRxPlugin(getRxStorageDexie());
  
  // 定义 RxDB 数据库模式
  const userSchema = {
    title: 'User Schema',
    description: 'User 集合的模式',
    version: 0,
    type: 'object',
    properties: {
      name: {
        type: 'string'
      },
      age: {
        type: 'number'
      }
    },
    required: ['name', 'age']
  };
  
  // 创建 RxDB 数据库
  const dbPromise = createRxDatabase({
    name: 'mydb',
    adapter: 'dexie'
  }).then(db => {
    console.log('数据库创建成功');
    return db;
  });
  
  // 创建 User 集合
  const userCollectionPromise = dbPromise.then(db => {
    return db.addCollections({
      users: {
        schema: userSchema
      }
    });
  }).then(collections => {
    return collections.users;
  });
  
  // 获取页面元素
  const nameInput = document.getElementById('name');
  const ageInput = document.getElementById('age');
  const addButton = document.getElementById('addButton');
  const userList = document.getElementById('userList');
  
  // 插入新用户
  addButton.addEventListener('click', async () => {
    const name = nameInput.value;
    const age = parseInt(ageInput.value, 10);
    
    const collection = await userCollectionPromise;
    await collection.insert({
      name: name,
      age: age
    });
    
    nameInput.value = '';
    ageInput.value = '';
  });
  
  // 查询用户列表并订阅变化
  userCollectionPromise.then(collection => {
    return collection.find().sort({name: 1}).$.pipe(
      map(users => users.map(user => `${user.name} - ${user.age}`))
    ).subscribe(userStrings => {
      userList.innerHTML = userStrings.map(str => `<li>${str}</li>`).join('');
    });
  });