import { IDBBlockstore } from 'blockstore-idb';
import { IDBDatastore } from 'datastore-idb';
import { createHelia } from 'helia';
import { yamux } from '@chainsafe/libp2p-yamux'
import { mplex } from '@libp2p/mplex'
import { noise } from '@chainsafe/libp2p-noise'
import { dagJson } from '@helia/dag-json'


const instantiateHeliaNode = async () => {
  const datastore = new IDBDatastore('/datastore2');
  const blockstore = new IDBBlockstore('/blockstore2');
  await datastore.open();
  await blockstore.open();
  const heliaInstance = await createHelia({
    libp2p: {
      streamMuxers: [
        yamux(),
        mplex()
      ],
      connectionEncryption: [
        noise()
      ],
      connectionManager: {
        maxConnections: 200,
        minConnections: 4,
        maxIncomingPendingConnections: 100,
        inboundConnectionThreshold: 100
      }
    },
    peerStore: {
      persistence: false,
      threshold: 5
    },
    keychain: {
      pass: 'very-strong-password',
      dek: {
        hash: 'sha2-512',
        salt: 'at-least-16-char-long-random-salt',
        iterationCount: 2000,
        keyLength: 64
      }
    },
    datastore: datastore,
    blockstore: blockstore
  });

  return heliaInstance;
};



document.addEventListener("DOMContentLoaded", async () => {
  const helia = window.helia = await instantiateHeliaNode();
  // window.helia.stop()
  // window.helia.stop()

  // helia.libp2p.addEventListener("peer:discovery", (evt) => {
  //   const { id, multiaddrs } = evt.detail
  //   console.log(`发现了新的对等节点: ${id.toString()}`)
  //   console.log(`地址: ${multiaddrs.map(addr => addr.toString()).join(', ')}`)
  // });

  // helia.libp2p.addEventListener("peer:connect", (evt) => {
  //   console.log(`Connected to ${evt.detail.toString()}`);
  // });

  // helia.libp2p.addEventListener("peer:disconnect", (evt) => {
  //   console.log(`Disconnected from ${evt.detail.toString()}`);
  // });

  // setInterval(async () => {  // 添加 async 关键字
  //     // console.log('Helia node status:', helia.libp2p.status);
  //     // console.log('Helia node ID:', helia.libp2p.peerId.toString());
  //     // const peers = await helia.libp2p.peerStore.all(); // 获取所有peers的数组
  //     // console.log(`Total number of store peers: ${peers.length}`); // 打印peers的数量
  //     // console.log('Connected peers ID:', helia.libp2p.getPeers());
  //     // console.log('Connected peers count:', helia.libp2p.getPeers().length);

  //     // const key = '/peers/bafzaajaiaejcbwv4y7gs3aarq4tfkklawlqdyr45463bcjyjtay7p7w65p4ybn3o'
  //     // await printPeerInfo(helia.datastore, key)

  //     // const maxAge = 24 * 60 * 60 * 1000 // 24 小时
  //     // await cleanupPeerStore(helia.datastore, maxAge)
  // }, 5000);


  // const d = dagJson(helia);

  // const object1 = { hello: 'world234fsadferererereawfasdf' };
  // const myImmutableAddress1 = await d.add(object1);
  // console.log(myImmutableAddress1.toString());

  // console.log(await d.get(myImmutableAddress1));
  // const object2 = { link: myImmutableAddress1 };
  // const myImmutableAddress2 = await d.add(object2);
  
  // const retrievedObject = await d.get(myImmutableAddress2);
  // console.log(retrievedObject);
  // // { link: CID(baguqeerasor...) }
  
  // console.log(await d.get(retrievedObject.link));

});





// 使用示例



// for await (const provider of window.helia.libp2p.contentRouting.findProviders('QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN')) {
//   console.log(provider.id, provider.multiaddrs);
// }

