// src\form\lib\rxdb\base_ajv.js
import Ajv from "ajv";
import addFormats from "ajv-formats"; // 如果你需要支持更多的数据格式


const preprocessors = {
  tags: function (value) {
    console.log('Original value:', value);  // 显示原始值
    if (typeof value === 'string') {
      const result = value.split(',').map(s => s.trim()).filter(Boolean);
      console.log('Processed value:', result);  // 显示处理后的结果
      return result;
    } else {
      console.error('Expected value to be a string, received:', value);
      return [];
    }
  },
  description: function (value) {
      return typeof value === 'string' ? value.trim() : '';
  }
};




class AjvValidator {
  constructor(schema) {
    this.ajv = new Ajv({ allErrors: true, useDefaults: true });
    addFormats(this.ajv);

    // 注册自定义预处理关键字
    this.ajv.addKeyword({
      keyword: "preprocess",
      modifying: true,
      schemaType: "string",
      compile: (preprocessKey,schema,parentSchema,dataPath,parentDataPath,rootData) => {
        console.log(`Compiling preprocess for key: ${preprocessKey}`);
        const preprocessFunc = preprocessors[preprocessKey];
        return (dataValue, dataContext) => {
          console.log("Preprocessing data for key:",dataContext.parentDataProperty);
          if (dataContext.parentData && dataContext.parentDataProperty in dataContext.parentData) {
            dataContext.parentData[dataContext.parentDataProperty] = preprocessFunc(dataValue);
            console.log("Data after preprocessing:",dataContext.parentData[dataContext.parentDataProperty]);
          }
          return true;
        };
      },
      errors: false,
    });

    this.schema = schema;
    this.validate = this.ajv.compile(schema);
  }

  validateData(data) {
    const valid = this.validate(data);
    return { valid, errors: this.validate.errors };
  }


  // 新增方法：验证单个字段
  validateField(fieldName, fieldValue) {
    if (!this.schema.properties[fieldName]) {
      return {
        valid: false,
        errors: [{ message: "Field not found in schema" }],
      };
    }

    // 构造一个临时 schema 来验证单个字段
    const fieldSchema = {
      type: "object",
      properties: {[fieldName]: this.schema.properties[fieldName]},
      required: [fieldName],
    };

    const validateField = this.ajv.compile(fieldSchema);
    const valid = validateField({ [fieldName]: fieldValue });
    return { valid, errors: validateField.errors };
  }
}

export default AjvValidator ;
