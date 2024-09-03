// src\apis\rxdb\doc_store_schema_fill.js
class DocIndexesFill {
    static id() {
      return 'id-' + Math.random().toString(36).slice(2, 11);
    }
  
    static cid() {
      return 'cid-' + Math.random().toString(36).slice(2, 11);
    }
  
    static cidActor() {
      return 'actor-' + Math.random().toString(36).slice(2, 11);
    }
  
    // 可以添加其他静态方法
  }
  
  export default DocIndexesFill;
  