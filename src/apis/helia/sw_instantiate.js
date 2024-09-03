// src\apis\helia\sw_instantiate.js
import { IDBBlockstore } from 'blockstore-idb';
import { IDBDatastore } from 'datastore-idb';
import { createHelia } from 'helia';
import { yamux } from '@chainsafe/libp2p-yamux'
import { mplex } from '@libp2p/mplex'
import { noise } from '@chainsafe/libp2p-noise'
import { unixfs } from '@helia/unixfs'

export const instantiateHeliaNode = async () => {
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

  heliaInstance.unixfs = unixfs(heliaInstance)

  return heliaInstance;
};