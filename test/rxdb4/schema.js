// test\rxdb4\schema.js
// import getRxdbCollection from './base_rxdb.js';
import AjvValidator from './base_ajv.js';


// JSON Schema definition
const docSchema = {
  title: "senseurl.x document store schema",
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
    tags: {type: 'array', items: {type: 'string'}, description: 'Additional tags or labels'},
    custom_classes: {type: 'string', maxLength: 255, description: 'Custom CSS classes'},
    // localId: {type: 'string',maxLength: 36},
    // localCid: {type: 'string',maxLength: 128},
    // localVersions: {type: 'array', maxItems: 4095, uniqueItems: true, items: {type: 'object', properties: {cid: { type: 'string', maxLength: 128 },published: {type: 'string',format: 'date-time',maxLength: 30}},required: ['cid','published']}},
    doc: {
      type: 'object', properties: {
        id: {type: 'string',maxLength: 36, description: 'UUID v4'},
        type: {type: 'string', maxLength: 64,description: 'Event or MIME Type: Like, Create, folder, text/bookmark, app/docx, link/docx, image/jpeg'},
        cid: {type: 'string',maxLength: 128, description: 'IPFS cid'}, 

        name: {type: 'string',maxLength: 64},
        preferredUsername: {type: 'string',maxLength: 64},   
        actor: {type: 'string',maxLength: 4095, description: 'like id'},
        attributedTo: {type: 'string',maxLength: 4095, description: 'like id'},
        profile: {type: 'string',maxLength: 4095, description: 'home page url'},
        publicKey: {type: 'string',maxLength: 1024, description: 'public key of the attributedTo'},
        accessKeys: {type: 'array', maxItems: 4095, uniqueItems: true,items: {type: 'object', properties: {id: { type: 'string', maxLength: 36 },encryptedKey: { type: 'string', maxLength: 1024 }},required: ['id', 'encryptedKey']}},
        signature: {type: 'string',maxLength: 1024, description: 'Private key signature'},

        size: {type: 'number',minimum: 0, maximum:10737418240, description: 'Bytes',multipleOf: 1},
        published: {type: 'string',format: 'date-time',maxLength: 30},
        updated: {type: 'string',format: 'date-time',maxLength: 30},
        deleted: {type: 'string',format: 'date-time',maxLength: 30},
        accessed: {type: 'string',format: 'date-time',maxLength: 30},
        icon: {type: 'array',maxItems: 4095,uniqueItems: true,items: {type: 'string',maxLength: 4095}, preprocess: 'strArray'},
        summary: {type: 'string',maxLength: 2048},
        commentsOn: {type: 'array', maxItems: 4095, uniqueItems: true,items: {type: 'object', properties: {id: { type:'string', maxLength: 36 },startIndex:{type:'integer',minimum:0},endIndex:{type:'integer',minimum:0}},required: ['id']}},
        liked: {type: 'array', maxItems: 4095, uniqueItems: true, items: {type: "object",properties: {id: { type: 'string', maxLength: 36 },signature: {type: 'string',maxLength: 1024},name: { type: 'string', maxLength: 64 },profile: { type: 'string', maxLength: 4095 }},required: ["id"]}},
        tags: {type: 'array', maxItems: 4095, uniqueItems: true, items: {type: "object",properties: {tag:{type:'string',maxLength:64}, id: { type: 'string', maxLength: 36 },signature: {type: 'string',maxLength: 1024},name: { type: 'string', maxLength: 64 },profile: { type: 'string', maxLength: 4095 }},required: ['tag']}},
        oldVersions: {type: 'array', maxItems: 4095, uniqueItems: true, items: {type: "object", properties: {cid: { type: 'string', maxLength: 128 },published: {type: 'string',format: 'date-time',maxLength: 30}},required: ['cid','published']}},

        content: {type: ["string", "number", "object", "array", "boolean", "null"], maxLength: 102400},
        object: {type: ["string", "number", "object", "array", "boolean", "null"], maxLength: 102400},
        source: {type: 'object', properties: {mediaType: { type: 'string', maxLength: 64 },content: { type: 'string', maxLength: 102400 }}, required: ['content']},

        to: {type: 'array', maxItems: 4095, uniqueItems: true, items: {type: "object",properties: {id: { type: 'string', maxLength: 36 },name: { type: 'string', maxLength: 64 },profile: { type: 'string', maxLength: 4095 }},required: ["id"]}},
        cc: {type: 'array', maxItems: 4095, uniqueItems: true, items: {type: "object",properties: {id: { type: 'string', maxLength: 36 },name: { type: 'string', maxLength: 64 },profile: { type: 'string', maxLength: 4095 }},required: ["id"]}},
        bcc: {type: 'array', maxItems: 4095, uniqueItems: true, items: {type: "object",properties: {id: { type: 'string', maxLength: 36 },name: { type: 'string', maxLength: 64 },profile: { type: 'string', maxLength: 4095 }},required: ["id"]}},
        inbox: {type: 'array', maxItems: 4095, uniqueItems: true, items: {type: "object",properties: {id: { type: 'string', maxLength: 36 },name: { type: 'string', maxLength: 64 },profile: { type: 'string', maxLength: 4095 }},required: ["id"]}},
        outbox: {type: 'array', maxItems: 4095, uniqueItems: true, items: {type: "object",properties: {id: { type: 'string', maxLength: 36 },name: { type: 'string', maxLength: 64 },profile: { type: 'string', maxLength: 4095 }},required: ["id"]}},
        following: {type: 'array', maxItems: 4095, uniqueItems: true, items: {type: "object",properties: {id: { type: 'string', maxLength: 36 },name: { type: 'string', maxLength: 64 },profile: { type: 'string', maxLength: 4095 }},required: ["id"]}},
        followers: {type: 'array', maxItems: 4095, uniqueItems: true, items: {type: "object",properties: {id: { type: 'string', maxLength: 36 },name: { type: 'string', maxLength: 64 },profile: { type: 'string', maxLength: 4095 }},required: ["id"]}},

      },required: ['id']
    }
  },
  required: ['id'],
  indexes: ['parent','doc.id','doc.type','doc.cid','doc.name','doc.actor','doc.profile','doc.size','doc.published','doc.updated','doc.accessed']
};


const migrationStrategies = {
  1: (oldDoc) => {
    // // 添加新字段
    // oldDoc.createdAt = new Date().toISOString();
    
    // // 修改字段名
    // oldDoc.userName = oldDoc.name;
    // delete oldDoc.name;
    
    // // 修改字段类型
    // oldDoc.age = parseInt(oldDoc.age, 10);
    
    // // 删除不再需要的字段
    // delete oldDoc.temporaryField;
    
    // // 处理嵌套数据
    // if (oldDoc.address) {
    //   oldDoc.formattedAddress = `${oldDoc.address.street}, ${oldDoc.address.city}`;
    // }
    
    return oldDoc;
  }
};


// 直接获取 RxDB 集合实例
// async function getCollection() {
//   return await getRxdbCollection('full_docs', docSchema, migrationStrategies);
// }


// 解构 docSchema，提取所需字段
const { version, primaryKey, indexes, required, ...ajvSchema } = docSchema;
console.log('ajvSchema:', ajvSchema);
const baseValidator = new AjvValidator(ajvSchema);
const validateFull = (data) => baseValidator.validateData({ ...ajvSchema, required }, data);
const validatePartial = (data) => baseValidator.validateData(ajvSchema, data);
const validateField = baseValidator.validateField.bind(baseValidator);



// 没有特色的名称, 以便统一风格的动态调用
export { validateFull, validatePartial, validateField, docSchema };
