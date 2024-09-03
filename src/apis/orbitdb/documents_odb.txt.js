import { createHelia } from 'helia';
import { IDBBlockstore } from 'blockstore-idb';
import { IDBDatastore } from 'datastore-idb';
import { createOrbitDB } from '@orbitdb/core';
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { identify } from "@libp2p/identify";


// export interface HeliaInit<T extends Libp2p = Libp2p> {
//   libp2p?: T | Omit<Libp2pOptions, 'start'>;  // 可以是一个已配置的 libp2p 实例或 libp2p 配置对象（不包括 start 参数）
//   start?: boolean;                           // 控制是否在创建时启动 Helia 节点，默认为 true，设置为 false 则不自动启动
//   keychain?: KeychainInit;                   // 配置用于存储节点 PeerId 的 libp2p keystore，包括加密等选项
//   datastore?: Datastore;                     // 数据存储接口，用于存储键值对数据，默认使用内存存储
//   blockstore?: Blockstore;                   // 块存储接口，用于存储网络数据块，默认使用内存块存储
//   blockBrokers?: Array<any>;                 // 数据块交换协议实现，例如 bitswap 和 trustlessGateway
//   routers?: Array<any>;                      // 网络路由器配置，用于节点发现和网络组织，例如使用 libp2pRouting
//   dns?: any;                                 // DNS 配置，用于 libp2p 节点的 DNS 解析
// }


const heliaOptions = {
  libp2p: {
    services: {
      pubsub: gossipsub({
        allowPublishToZeroPeers: true // neccessary to run a single peer
      }),
      identify: identify()
    }
  },
  keychain: {
    pass: 'very-strong-password',  // 强密码
    dek: {
      hash: 'sha2-512',            // 使用SHA-512哈希算法
      salt: 'at-least-16-char-long-random-salt', // 至少16字符长的随机盐值
      iterationCount: 2000,       // 推荐的迭代次数，适中以保证性能与安全之间的平衡
      keyLength: 64                // 密钥长度为64字节（512位）
    }
  },
  datastore: new IDBDatastore('/datastore'),
  blockstore: new IDBBlockstore('/blockstore'),
  start: true
};

const helia = await createHelia(heliaOptions);
const orbitdb = await createOrbitDB({ helia });
await orbitdb.open('my-db', { type: 'documents' });

