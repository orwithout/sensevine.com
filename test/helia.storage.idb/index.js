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

});

