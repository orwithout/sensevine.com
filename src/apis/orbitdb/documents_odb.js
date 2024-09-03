// src\orbitdb\documents_db.js
import { createHelia } from 'helia';
import { IDBBlockstore } from 'blockstore-idb';
import { IDBDatastore } from 'datastore-idb';
import { createOrbitDB , Documents, Identities, KeyStore, IPFSAccessController, IPFSBlockStorage } from '@orbitdb/core';
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { identify } from "@libp2p/identify";
import * as yup from 'yup';


import { webRTCDirect } from '@libp2p/webrtc';
import { toString as uint8ArrayToString } from 'uint8arrays/to-string';
import { multiaddr } from '@multiformats/multiaddr';
import OrbitDBAddress, { isValidAddress, parseAddress } from '@orbitdb/core/src/address.js';
import * as Block from 'multiformats/block';
import * as dagCbor from '@ipld/dag-cbor';
import { sha256 } from 'multiformats/hashes/sha2';
import { base58btc } from 'multiformats/bases/base58';
import { CID } from 'multiformats/cid';
import { yamux } from '@chainsafe/libp2p-yamux'
import { mplex } from '@libp2p/mplex'
import { noise } from '@chainsafe/libp2p-noise'




const stringArray = yup.array().of(yup.string().trim().max(255)).max(4095).transform((value, originalValue) => {  // 每个元素是一个字符串，最大长度为255 数组的最大长度为4096
    if (typeof originalValue === 'string') {  // 过滤掉空字符串 // 如果原始值是字符串，按逗号分割并去除空白
        const values = originalValue.split(',').map(item => item.trim()); 
        return values.filter(Boolean);
    }
    return value; // 如果已经是数组或其他情况，直接返回原值
});

const fileStoreSchema = yup.object({  // 定义yup验证模式
    id: yup.string().required().max(255),
    type: yup.string().oneOf(["text/bookmark", "text/txt", "text/markdown", "text/html", "app/pdf", "app/docx"]).required(),
    // cid: yup.string().required().max(255),
    name: yup.string().required().max(255), // 增加最大长度验证
    content: yup.string().required().max(102400),

    // cidPath: yup.string().optional().max(4095),
    size: yup.number().positive().optional(), // 确保是正数
    timestamp: yup.date().optional(), // 使用date类型进行验证
    actor: yup.string().optional().max(255),
    decryptionKeys: stringArray.optional(),

    attributedTo: yup.string().optional().max(4095),
    newVersionInbox: stringArray.optional(),
    newVersionOutbox: stringArray.optional(),

    following: stringArray.optional(),
    followers: stringArray.optional(),
    liked: stringArray.optional(),
    tags: stringArray.optional(),

    icon: yup.string().optional().max(4095),
    description: yup.string().optional().max(1024), // 增加最大长度验证
    history: stringArray.optional(),
}).noUnknown(true, "This field is not allowed");


class DocumentStore {
  constructor(dbAddress = '/orbitdb/zdpuApme4kVzfbyyCJVcr6iYzUJ7kdwZsFRHoA9ctHGrLDkGK') {
    this.dbAddress = ''; // 数据库地址
    this.schema = fileStoreSchema; // 将其作为实例属性
    this.init();
  };

  async init() {
    this.datastore = new IDBDatastore('/datastore');
    this.blockstore = new IDBBlockstore('/blockstore');
    await this.datastore.open();
    await this.blockstore.open();
    this.helia = await createHelia({
      libp2p: {
        streamMuxers: [
          yamux(),
          mplex()
        ],
        connectionEncryption: [noise()],
        services: {
          pubsub: gossipsub({allowPublishToZeroTopicPeers: true}),
          identify: identify()
        }
      },
      keychain: {pass: 'very-strong-password'},
      datastore: this.datastore,
      blockstore: this.blockstore,
      start: true
    });

    
    console.log('Helia ID:', this.helia.libp2p.peerId.toString());
    setInterval(async () => {  // 添加 async 关键字
        const peers = await this.helia.libp2p.peerStore.all(); // 获取所有peers的数组
        console.log(`Total number of store peers: ${peers.length}`); // 打印peers的数量
        console.log('Connected peers count:', this.helia.libp2p.getPeers().length);
    }, 23000);





    const keystore = await KeyStore({ path:'asdfesdfef' })
    const identities = await Identities({ ipfs: this.helia , keystore})
    const identity = await identities.createIdentity({ id: 'me' })
    
    const idCid = CID.parse(identity.hash, base58btc)
    
    // Extract the hash from the full db path.
    const idBytes = await this.helia.blockstore.get(idCid)
    

    
    // Retrieve the block data, decoding it to human-readable JSON text.
    const { value:idValue } = await Block.decode({ bytes: idBytes, codec: dagCbor, hasher: sha256 })
    
    console.log('identity', idValue)






    const entryStorage = await IPFSBlockStorage({ ipfs: this.helia, pin: true });
    const headsStorage = await IPFSBlockStorage({ ipfs: this.helia, pin: true });
    const indexStorage = await IPFSBlockStorage({ ipfs: this.helia, pin: true });


    this.orbitdb = await createOrbitDB({ ipfs: this.helia });
    this.db = await  this.orbitdb.open(`${this.dbAddress || 'documents-db'}`, {
        create: true,
        type: 'documents',
        directory: './orbitdbx',
        Database: Documents({ indexBy: 'id'} ),
        AccessController: IPFSAccessController({ write: ['*'] }),
        entryStorage,
        headsStorage,
        indexStorage
    });



    console.log('odb.address:', this.db.address);
    // Extract the hash from the full db path.
    // Assuming `this.helia.block.get` is correctly implemented
    const addr = OrbitDBAddress(this.db.address)
    const cid = CID.parse(addr.hash, base58btc)
    const bytes = await this.helia.blockstore.get(cid);
    const codec = dagCbor;
    const hasher = sha256;
    const { value } = await Block.decode({ bytes, codec, hasher });
    console.log('Manifest:', value);

    console.log('access.type:',this.db.access.type);
    console.log('access.write',this.db.access.write);
  }

  async add(doc) {
    const validData = await this.schema.validate(doc, { abortEarly: false });
    return await this.db.put(validData);
  }

  async searchId(ids) {
    return await this.db.query(doc => ids.includes(doc.id));
  }

  async queryStartsWith(field, queryStr, limit = 5) {
    const lowerQueryStr = queryStr.toLowerCase();

    const results = await this.db.query((doc) =>
        doc[field] && doc[field].toString().toLowerCase().startsWith(lowerQueryStr)
    );
    // Further filtering for arrays like 'tags'
    if (field === 'tags') {
        return results
            .map(doc => ({
                ...doc,
                tags: doc.tags.filter(tag => tag.toLowerCase().startsWith(lowerQueryStr))
            }))
            .filter(doc => doc.tags.length > 0)
            .slice(0, limit);  // Apply limit after filtering
    }
    return results.slice(0, limit);
  }

  async delete(_id) { return await this.db.del(_id); }
}

const documentStore = new DocumentStore();
export default documentStore;
