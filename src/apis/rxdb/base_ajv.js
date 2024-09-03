// src\apis\rxdb\base_ajv.js
import Ajv from "ajv";
import addFormats from "ajv-formats";
import _ from 'lodash';

const preprocessors = {
  strArray: (value) => _.isString(value) ? _(value).split(',').map(_.trim).filter(Boolean).value() : (_.isArray(value) ? value.filter(Boolean) : []),
  description: (value) => _.isString(value) ? _.trim(value) : ''
  // parent: (value, data) => {
  //   if (value !== undefined && value !== null && value !== '') {
  //     return value;
  //   }
  //   if (!data.id) return '';
  //   const parts = data.id.split('/');
  //   parts.pop();
  //   return parts.join('/') || '#';
  // }
};

class AjvValidator {
  constructor(schema) {
    this.ajv = new Ajv({ allErrors: true, useDefaults: true, coerceTypes: true,  allowUnionTypes: true});
    addFormats(this.ajv);
    
    this.ajv.addKeyword({
      keyword: "preprocess",
      modifying: true,
      schemaType: "string",
      compile: (preprocessKey) => {
        const preprocessFunc = preprocessors[preprocessKey];
        if (!preprocessFunc) {
          console.error(`No preprocessor function found for key: ${preprocessKey}`);
          return () => true;
        }
        return (dataValue, dataContext) => {
          dataContext.parentData[dataContext.parentDataProperty] = preprocessFunc(dataValue, dataContext.rootData);
          return true;
        };
      },
      errors: false
    });

    this.schema = schema;
    this.validate = (data) => {
      const valid = this.ajv.validate(schema, data);
      return { valid, errors: this.ajv.errors };
    };
  }

  validateField(fieldPath, fieldValue) {
    const pathParts = fieldPath.split('.');
    let currentSchema = this.schema.properties;
    let currentPath = '';

    for (let i = 0; i < pathParts.length; i++) {
      currentPath += (currentPath ? '.' : '') + pathParts[i];
      if (currentSchema[pathParts[i]]) {
        if (i === pathParts.length - 1) {
          const fieldSchema = { 
            type: "object", 
            properties: { [pathParts[i]]: currentSchema[pathParts[i]] }, 
            required: [pathParts[i]] 
          };
          const validator = this.ajv.compile(fieldSchema);
          const valid = validator({ [pathParts[i]]: fieldValue });
          return { valid, errors: validator.errors, fieldValue };
        } else if (currentSchema[pathParts[i]].properties) {
          currentSchema = currentSchema[pathParts[i]].properties;
        } else {
          return { valid: false, errors: [{ message: `Invalid field path: ${fieldPath}` }], fieldValue };
        }
      } else {
        return { valid: false, errors: [{ message: `Field not found: ${fieldPath}` }], fieldValue };
      }
    }
  }
}

export default AjvValidator;