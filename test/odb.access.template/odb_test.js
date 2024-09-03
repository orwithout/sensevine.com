import { createHelia } from 'helia'
import { LevelBlockstore } from 'blockstore-level'
import * as Block from 'multiformats/block'
import { Identities } from '@orbitdb/core'
import * as dagCbor from '@ipld/dag-cbor'
import { sha256 } from 'multiformats/hashes/sha2'
import { base58btc } from 'multiformats/bases/base58'
import { CID } from 'multiformats/cid'


const blockstore = new LevelBlockstore('./ipfs')
const ipfs = await createHelia({
    blockstore
})

const identities = await Identities({ ipfs })
const identity = await identities.createIdentity({ id: 'me' })

const cid = CID.parse(identity.hash, base58btc)

// Extract the hash from the full db path.
const bytes = await ipfs.blockstore.get(cid)

// Defines how we serialize/hash the data.
const codec = dagCbor
const hasher = sha256

// Retrieve the block data, decoding it to human-readable JSON text.
const { value } = await Block.decode({ bytes, codec, hasher })

console.log('identity', value)