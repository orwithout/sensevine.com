import { addRxPlugin } from 'rxdb';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
addRxPlugin(RxDBDevModePlugin);


import { createRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';

import { createRxDatabase, addRxPlugin } from 'rxdb';
import * as PouchDBAdapter from 'pouchdb-adapter-idb';

addRxPlugin(PouchDBAdapter);

const fileStoreSchema = {
    title: "file store schema",
    version: 0,
    type: "object",
    properties: {
        id: { type: "string", maxLength: 255 },
        type: { type: "string", enum: ["text/bookmark", "text/txt", "text/markdown", "text/html", "app/pdf", "app/docx"] },
        name: { type: "string", maxLength: 255 },
        content: { type: "string", maxLength: 102400 }
        // 其他字段定义...
    },
    required: ["id", "type", "name", "content"],
    additionalProperties: false
};

class RxDBFileStore {
    constructor(dbName = 'rxdb_filestore') {
        this.dbName = dbName;
        this.db = null;
    }

    async init() {
        this.db = await createRxDatabase({
            name: this.dbName,
            adapter: 'idb'
        });

        this.collection = await this.db.addCollections({
            files: {
                schema: fileStoreSchema
            }
        });
    }

    async addFile(fileData) {
        try {
            await this.collection.files.insert(fileData);
        } catch (error) {
            console.error('Failed to add file:', error);
        }
    }

    async findFiles(query) {
        const results = await this.collection.files.find(query).exec();
        return results;
    }

    // 其他需要的方法...
}

const rxdbFileStore = new RxDBFileStore();
export default rxdbFileStore;
