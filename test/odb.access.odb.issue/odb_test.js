// src\test\odb.example.access\odb_test.js
import { createLibp2p } from 'libp2p';
import { createHelia } from 'helia';
import { LevelBlockstore } from 'blockstore-level';
import { createOrbitDB, Identities, OrbitDBAccessController } from '@orbitdb/core';

// const blockstore = new LevelBlockstore('./ipfs')  //This line was not used in the original text
// const libp2p = await createLibp2p(Libp2pOptions)
// const ipfs = await createHelia({ libp2p })
const ipfs = await createHelia();

const orbitdb = await createOrbitDB({ ipfs });

const identities = await Identities({ ipfs });
const anotherIdentity = identities.createIdentity('userB');

const db = orbitdb.open('my-db', { AccessController: OrbitDBAccessController({ write: [orbitdb.identity.id, anotherIdentity.id]})}); // This line in the original text is missing a closing `}`

db.access.grant('write', anotherIdentity.id);
// db.access.revoke('write', anotherIdentity.id)
console.log('access.type:',db.access.type);
console.log('access.write',db.access.write);

//目前存在错误，请查看 issue: https://github.com/orbitdb/orbitdb/issues/1182