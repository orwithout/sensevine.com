import { createHelia } from 'helia';
import { createEd25519PeerId } from '@libp2p/peer-id-factory';
import { strings } from '@helia/strings';

let helia;
let privateKey;

const generateKeyBtn = document.getElementById('generate-key-btn');
const initializeNodeBtn = document.getElementById('initialize-node-btn');
const addDocumentBtn = document.getElementById('add-document-btn');
const privateKeyTextarea = document.getElementById('private-key-textarea');
const documentTextarea = document.getElementById('document-textarea');
const outputDiv = document.getElementById('output');

generateKeyBtn.addEventListener('click', async () => {
  const peerId = await createEd25519PeerId();
  privateKey = peerId.privateKey;
  console.log('privateKey', privateKey);
  privateKeyTextarea.value = uint8ArrayToString(privateKey);
});

initializeNodeBtn.addEventListener('click', async () => {
  const privateKeyString = privateKeyTextarea.value;
  const privateKeyUint8Array = stringToUint8Array(privateKeyString);
  const peerId = await createEd25519PeerId(privateKeyUint8Array);

  helia = await createHelia({
    peerId,
    libp2p: {
      config: {
        transport: {
          WebSockets: true,
          WebTransport: true,
          WebRTCStar: true
        },
        bootstrap: [
          '/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ',
          '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
          '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb'
        ],
        relay: {
          enabled: true,
          hop: {
            enabled: true,
            active: true
          }
        }
      }
    }
  });

  outputDiv.innerHTML = 'Node initialized with private key: ' + privateKeyString;
});

addDocumentBtn.addEventListener('click', async () => {
  if (!helia) {
    outputDiv.innerHTML = 'Please initialize the node first.';
    return;
  }
  
  const documentContent = documentTextarea.value;
  const s = strings(helia);
  const cid = await s.add(documentContent);
  
  // Pin the added document using helia.store.put
  await helia.store.put(cid, { pin: true });
  
  outputDiv.innerHTML = 'Document added with CID: ' + cid + ' and pinned.';
});

function uint8ArrayToString(uint8Array) {
  return Array.from(uint8Array, byte => String.fromCharCode(byte)).join('');
}

function stringToUint8Array(string) {
  return new Uint8Array(string.split('').map(char => char.charCodeAt(0)));
}