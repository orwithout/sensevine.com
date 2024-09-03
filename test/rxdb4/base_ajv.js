// src\form\lib\rxdb\base_ajv.js
import Ajv from "ajv";
import addFormats from "ajv-formats";
import _ from 'lodash';

const preprocessors = {
  strArray: function(value) {
    
    console.log('strArrayxx preprocessor:', value)
    
    return _.isString(value) ? _(value).split(',').map(_.trim).filter(Boolean).value() : (_.isArray(value) ? value.filter(Boolean) : []); },
  description: function(value) { return _.isString(value) ? _.trim(value) : ''; },
  parent: function(value, data) {
    console.log('parent preprocessor:', value, data)
    if (!data.id) return ''; // 如果没有 id 字段，返回空字符串
    const parts = data.id.split('/');
    parts.pop(); // 移除最后一部分（当前节点的名称）
    return parts.join('/') || '#'; // 使用 '/' 重新组合父路径，如果是根节点，返回 '#'
  }
};

class AjvValidator {
  constructor(schema) {
    this.ajv = new Ajv({ allErrors: true, useDefaults: true, coerceTypes: true,  allowUnionTypes: true});
    addFormats(this.ajv);
    
    console.log('==========schema:', schema)
    this.ajv.addKeyword({
      keyword: "preprocess",
      modifying: true,
      schemaType: "string",
      compile: (preprocessKey, schema, parentSchema, dataPath, parentDataPath, rootData) => {
        console.log(`Compiling preprocess for key: ${preprocessKey}`);
        const preprocessFunc = preprocessors[preprocessKey];
        if (!preprocessFunc) {
          console.error(`No preprocessor function found for key: ${preprocessKey}`);
          return (data) => true; // Return true by default if no function found
        }
        return (dataValue, dataContext) => {
          dataContext.parentData[dataContext.parentDataProperty] = preprocessFunc(dataValue, dataContext.rootData);
          return true;
        };
      },
      errors: false
    });

    

    this.schema = schema;
    this.validate = this.ajv.compile(schema);
    this.fieldValidators = {}; // Storing field validators if needed
    this.compileFieldValidators(schema, ''); // Initialize validators
  }

  compileFieldValidators(schema, basePath) {
    _.forEach(schema.properties, (value, key) => {
      const path = basePath ? `${basePath}.${key}` : key;
      const fieldSchema = { type: "object", properties: { [key]: value }, required: [key] };
      this.fieldValidators[path] = this.ajv.compile(fieldSchema);
      if (value.properties) { this.compileFieldValidators(value, path); }
    });
  }
  
  validateData(data) {
    const valid = this.validate(data);
    return { valid, errors: this.validate.errors };
  }

  validateField(fieldPath, fieldValue) {
    const pathParts = fieldPath.split('.');
    let currentSchema = this.schema.properties;
    let currentPath = '';

    // 遍历嵌套路径
    for (let i = 0; i < pathParts.length; i++) {
      currentPath += (currentPath ? '.' : '') + pathParts[i];
      if (currentSchema[pathParts[i]]) {
        if (i === pathParts.length - 1) {
          // 最后一个部分，执行验证
          const fieldSchema = { type: "object", properties: { [pathParts[i]]: currentSchema[pathParts[i]] }, required: [pathParts[i]] };
          const validator = this.ajv.compile(fieldSchema);
          const valid = validator({ [pathParts[i]]: fieldValue });
          return { valid, errors: validator.errors, fieldValue: fieldValue };
        } else if (currentSchema[pathParts[i]].properties) {
          // 继续遍历嵌套对象
          currentSchema = currentSchema[pathParts[i]].properties;
        } else {
          // 路径无效
          return { valid: false, errors: [{ message: `Invalid field path: ${fieldPath}` }], fieldValue: fieldValue };
        }
      } else {
        // 字段不存在
        return { valid: false, errors: [{ message: `Field not found: ${fieldPath}` }], fieldValue: fieldValue };
      }
    }
  }
  
}

export default AjvValidator;
