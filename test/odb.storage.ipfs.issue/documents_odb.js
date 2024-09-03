// src\orbitdb\documents_db.js
import { createHelia } from 'helia';
import { IDBBlockstore } from 'blockstore-idb';
import { IDBDatastore } from 'datastore-idb';
import { createOrbitDB , Documents, IPFSBlockStorage, IPFSAccessController } from '@orbitdb/core';
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { identify } from "@libp2p/identify";

class DocumentStore {
  constructor() { this.init(); };
  async init() {
    this.datastore = new IDBDatastore('/datastore');
    this.blockstore = new IDBBlockstore('/blockstore');
    await this.datastore.open();
    await this.blockstore.open();
    this.helia = await createHelia({
      libp2p: {
        services: {
          pubsub: gossipsub({allowPublishToZeroTopicPeers: true}),
          identify: identify()
        }
      },
      keychain: {
        pass: 'very-strong-password'
      },
      datastore: this.datastore,
      blockstore: this.blockstore,
      start: true
    });

    console.log('Helia ID:', this.helia.libp2p.peerId.toString());
    setInterval(async () => {
        const peers = await this.helia.libp2p.peerStore.all();
        console.log(`Total number of store peers: ${peers.length}`);
        console.log('Connected peers count:', this.helia.libp2p.getPeers().length);
    }, 5000);


    this.orbitdb = await createOrbitDB({ ipfs: this.helia, directory: '/my_odb'});
    this.db = await  this.orbitdb.open(`${'my_documents_db'}`, {
        create: true,
        type: 'documents',
        Database: Documents({ indexBy: 'id'} ),
        AccessController: IPFSAccessController({ write: ['*'] }),
        entryStorage: await IPFSBlockStorage({ ipfs: this.helia, pin: true }),
        headsStorage: await IPFSBlockStorage({ ipfs: this.helia, pin: true }),
        indexStorage: await IPFSBlockStorage({ ipfs: this.helia, pin: true })
    });
    console.log('odb.address:', this.db.address);
  }

  async add(doc) { return await this.db.put(doc); }
  async searchId(ids) { return await this.db.query(doc => ids.includes(doc.id)); }
  async delete(_id) { return await this.db.del(_id); }
}

const documentStore = new DocumentStore();
export default documentStore;


// IPFSBlockStorage 存储 目前存在问题，请查看 issue: https://github.com/orbitdb/orbitdb/issues/1180