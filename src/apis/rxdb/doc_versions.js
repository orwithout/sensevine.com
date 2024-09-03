// src\apis\rxdb\doc_versions.js
import getRxdbCollection from './base_rxdb.js';
import AjvValidator from './base_ajv.js';


// JSON Schema definition
const docSchema = {
  title:"wjw.net schema",
  version:1,
  primaryKey:'cid',
  type:'object',
  properties:{
    cid:{type:'string',maxLength:128,description:'IPFS cid'},
    docId:{type:'string',maxLength:36,description:'UUID v4'},
    type:{type:'string',maxLength:64,description:'Like,Create,folder,text/bookmark,app/docx,link/docx,image/jpeg'},
    name:{type:'string',maxLength:64},
    attributedTo:{type:'string',maxLength:4095,description:'like id'},
    size:{type:'number',minimum:0,maximum:10737418240,description:'Bytes',multipleOf:1},
    published:{type:'string',format:'date-time',maxLength:30},
    content:{oneOf:[{type:["string","number","boolean","null"]},{type:"object",properties:{contentRefType:{type:"string",enum:["rxdb","http","cid"]},contentRefLocation:{type:"string",maxLength:4095}},required:["contentRefType","contentRefLocation"]}]}
  },
  required:['cid'],
  indexes: ['docId','type','name','attributedTo','size','published']
};


const migrationStrategies = {
  1:(oldDoc) => {  
    return oldDoc;
  }
};


// 直接获取 RxDB 集合实例
async function getCollection() {
  return await getRxdbCollection('doc_versions',docSchema,migrationStrategies);
}


// 解构 docSchema，提取所需字段
const {version,primaryKey,indexes,required,...ajvSchema} = docSchema;
const fullValidator = new AjvValidator({...ajvSchema,required});
const partialValidator = new AjvValidator(ajvSchema);
const validateFull = (data) => fullValidator.validate(data);
const validatePartial = (data) => partialValidator.validate(data);
const validateField = partialValidator.validateField.bind(partialValidator);


// 没有特色的名称,以便统一风格的动态调用
export {
  getCollection as getVersionsCollection,
  validateFull as validateFullVersion,
  validatePartial as validatePartialVersion,
  validateField as validateVersionField,
  docSchema as versionSchema
};