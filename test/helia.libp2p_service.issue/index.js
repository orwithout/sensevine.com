// src\test\helia.service\index.js
import { IDBBlockstore } from 'blockstore-idb';
import { IDBDatastore } from 'datastore-idb';
import { createHelia } from 'helia';


const instantiateHeliaNode = async () => {
  const datastore = new IDBDatastore('/datastore2');
  const blockstore = new IDBBlockstore('/blockstore2');
  await datastore.open();
  await blockstore.open();
  const heliaInstance = await createHelia({
    libp2p: {
      services: {}
    },
    peerStore: {
      persistence: false,
      threshold: 5
    },
    keychain: {
      pass: 'very-strong-password'
    },
    datastore: datastore,
    blockstore: blockstore
  });

  return heliaInstance;
};


document.addEventListener("DOMContentLoaded", async () => {
  const helia = window.helia = await instantiateHeliaNode();

  // monitor
  console.log('Helia node created with ID:', helia.libp2p.peerId.toString())
  setInterval(async () => {
      const peers = await helia.libp2p.peerStore.all();
      console.log(`Total number of store peers: ${peers.length}`);
      console.log('Connected peers count:', helia.libp2p.getPeers().length);
  }, 3000);

});

