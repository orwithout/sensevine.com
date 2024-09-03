// file_store.js
// import Dexie from 'https://cdn.skypack.dev/dexie';
// import * as yup from 'https://esm.run/yup';
import Dexie from 'dexie';
import * as yup from 'yup';

const stringArray = yup.array().of(yup.string().trim().max(255)).max(4095).transform((value, originalValue) => {  // 每个元素是一个字符串，最大长度为255 数组的最大长度为4096
    if (typeof originalValue === 'string') {  // 过滤掉空字符串 // 如果原始值是字符串，按逗号分割并去除空白
        const values = originalValue.split(',').map(item => item.trim()); 
        return values.filter(Boolean);
    }
    return value; // 如果已经是数组或其他情况，直接返回原值
  });

const fileStoreSchema = yup.object({  // 定义yup验证模式
    id: yup.string().required().max(255),
    type: yup.string().oneOf(["text/bookmark", "text/txt", "text/markdown", "text/html", "app/pdf", "app/docx"]).required(),
    // cid: yup.string().required().max(255),
    name: yup.string().required().max(255), // 增加最大长度验证
    content: yup.string().required().max(102400),

    // cidPath: yup.string().optional().max(4095),
    size: yup.number().positive().optional(), // 确保是正数
    timestamp: yup.date().optional(), // 使用date类型进行验证
    actor: yup.string().optional().max(255),
    decryptionKeys: stringArray.optional(),

    attributedTo: yup.string().optional().max(4095),
    newVersionInbox: stringArray.optional(),
    newVersionOutbox: stringArray.optional(),

    following: stringArray.optional(),
    followers: stringArray.optional(),
    liked: stringArray.optional(),
    tags: stringArray.optional(),

    icon: yup.string().optional().max(4095),
    description: yup.string().optional().max(1024), // 增加最大长度验证
    history: stringArray.optional(),
}).noUnknown(true, "This field is not allowed");

const fileStoreIndex = 'id, type, cid, name, cidPath, size, timestamp, cidActor, decryptionKeys.nickName, attributedTo, *tags'; // 移除重复的id索引
const fileStoreName = "files"; // 绑定的对象存储名称
const idbName = 'senseurl_iDB'; // 数据库名称

class FileStore {
    constructor() {
        this.idb = idbName; // 数据库名称
        this.store = fileStoreName; // 绑定的对象存储名称
        this.schema = fileStoreSchema; // 将其作为实例属性
        this.index = fileStoreIndex; // 将其作为实例属性
        this.init();
    }

    async init() {
        this.db = new Dexie(this.idb);
        this.db.version(1).stores({ [this.store]: this.index, }); // 初始化时，只创建绑定的对象存储
        await this.db.open(); // 尝试打开数据库
    }

    async add(data) {
        const validData = await this.schema.validate(data, { abortEarly: false }); // 验证数据
        await this.db[this.store].add(validData); // 向绑定的对象存储中添加数据
    }

    async searchId(query) {
        const results = await this.db[this.store].where('id').anyOf(query).toArray(); // 从绑定的对象存储中搜索数据
        return results;
    }

    async queryStartsWith(field, queryStr, limit=5) {
        let results = await this.db[this.store].where(field).startsWithIgnoreCase(queryStr).limit(limit).toArray();  // 首先，执行查询以找到包含任何符合条件的tags数组的记录
        if(field === 'tags') {
            results = results.map(item => {  // 然后，进一步过滤每个记录中的tags数组，只保留符合条件的标签
                if (item[field] && Array.isArray(item[field])) {
                    item[field] = item[field].filter(tag => tag.toLowerCase().startsWith(queryStr.toLowerCase()));  // 只保留那些以queryStr开头的标签
                    return item;
                }
                return null;
            }).filter(item => item && item[field].length > 0); // 移除tags数组为空的记录
        }
        return results;
    }
    
    // 其他方法...
}


const fileStore = new FileStore();  // 使用时，将schema、索引和对象存储名作为参数传入
export default fileStore;