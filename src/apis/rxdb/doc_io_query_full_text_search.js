// doc_io_query.js
import { getMetaCollection, metaSchema } from './doc_meta.js';
import _ from 'lodash';








// 新增：全文搜索功能（基于指定字段）
export async function docFullTextSearch(fieldName, searchText, limit = Number.MAX_SAFE_INTEGER) {
  const metaCollection = await getMetaCollection();
  console.log(`Performing full text search on field: ${fieldName}, searchText: ${searchText}`);

  // 首先，获取所有文档
  const allDocs = await metaCollection.find().exec();
  console.log('All documents in collection:', allDocs);

  // 手动过滤文档
  const filteredDocs = allDocs.filter(doc => {
    const fieldValue = _.get(doc, fieldName);
    return fieldValue && fieldValue.includes(searchText);
  });

  console.log('Filtered documents:', filteredDocs);

  return filteredDocs.slice(0, limit);
}

// 新增：复合查询功能
export async function docComplexQuery(conditions, limit = Number.MAX_SAFE_INTEGER) {
  const metaCollection = await getMetaCollection();
  let query = metaCollection.find();

  for (const condition of conditions) {
    const { field, operator, value } = condition;
    switch (operator) {
      case 'eq':
        query = query.where(field).eq(value);
        break;
      case 'gt':
        query = query.where(field).gt(value);
        break;
      case 'lt':
        query = query.where(field).lt(value);
        break;
      // 可以根据需要添加更多操作符
    }
  }

  return query.limit(limit).exec();
}

// 新增：聚合查询功能
export async function docAggregateQuery(groupField, aggregateField, operation) {
  const metaCollection = await getMetaCollection();
  const results = await metaCollection.find().exec();

  return _.chain(results)
    .groupBy(doc => _.get(doc, groupField))
    .mapValues(group => {
      switch (operation) {
        case 'count':
          return group.length;
        case 'sum':
          return _.sumBy(group, doc => _.get(doc, aggregateField));
        case 'avg':
          return _.meanBy(group, doc => _.get(doc, aggregateField));
        // 可以添加更多聚合操作
      }
    })
    .value();
}


