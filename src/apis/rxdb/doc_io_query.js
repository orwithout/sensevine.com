// src\apis\rxdb\doc_io_query.js
import { getMetaCollection, metaSchema } from './doc_meta.js';
import _ from 'lodash';

export class DocIoQuery {
  constructor() {
    this.metaCollection = null;
  }

  async init() {
    this.metaCollection = await getMetaCollection();
  }

  getSchemaProperties(fieldPath) {
    const pathParts = fieldPath.split('.');
    let currentSchema = _.get(metaSchema, 'properties');
    for (const part of pathParts) {
      if (_.get(currentSchema, [part, 'type']) === 'array') {
        return {
          isArray: true,
          itemProperties: _.get(currentSchema, [part, 'items', 'properties'])
        };
      }
      currentSchema = _.get(currentSchema, [part, 'properties']);
      if (!currentSchema) return { isArray: false, itemProperties: null };
    }
    return { isArray: false, itemProperties: currentSchema };
  }

  async queryStartsWith(fieldPath, value, limit = 5) {
    if (!this.metaCollection) await this.init();
    const { isArray, itemProperties } = this.getSchemaProperties(fieldPath);
    let selector;
    if (isArray) {
      if (itemProperties) {
        const searchableProperties = _.filter(_.keys(itemProperties), prop => 
          ['string', 'number'].includes(_.get(itemProperties, [prop, 'type']))
        );
        selector = {[fieldPath]: {$elemMatch: {$or: searchableProperties.map(prop => ({[prop]: { $regex: `^${_.escapeRegExp(value)}`, $options: 'i' }}))}}};
      } else {
        selector = {[fieldPath]: { $elemMatch: { $regex: `^${_.escapeRegExp(value)}`, $options: 'i' } }};
      }
    } else {
      selector = { [fieldPath]: { $regex: `^${_.escapeRegExp(value)}`, $options: 'i' } };
    }
      const results = await this.metaCollection.find({selector: {...selector,_deleted: { $eq: false }}}).limit(limit).exec();
      return results.map(doc => doc.toJSON());
  }

  async findByField(fieldName, value, limit = Number.MAX_SAFE_INTEGER) {
    if (!this.metaCollection) await this.init();

    const results = await this.metaCollection.find({
      selector: {
        [fieldName]: value,
        _deleted: { $eq: false }
      }
    }).limit(limit).exec();
    return results.map(doc => doc.toJSON());
  }

  async findInRange(fieldName, start, end, limit = Number.MAX_SAFE_INTEGER) {
    if (!this.metaCollection) await this.init();

    const results = await this.metaCollection.find({
      selector: {
        [fieldName]: {
          $gte: start,
          $lte: end
        },
        _deleted: { $eq: false }
      }
    }).limit(limit).exec();
    return results.map(doc => doc.toJSON());
  }
}

export default DocIoQuery;