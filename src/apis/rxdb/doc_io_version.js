// doc_io_version.js
import { getVersionsCollection, validateFullVersion } from './doc_versions.js';

const CONTENT_SIZE_THRESHOLD = 1024 * 1024; // 1MB threshold for inline content

export async function docStoreContent(content) {
  const contentBuffer = Buffer.from(content);
  const size = contentBuffer.length;

  if (size <= CONTENT_SIZE_THRESHOLD) {
    return { cid: null, size, content: contentBuffer.toString('base64') };
  } else {
    const cid = `cid_${Math.random().toString(36).slice(2, 11)}`;
    const versionsCollection = await getVersionsCollection();
    await versionsCollection.insert({
      cid,
      content: { contentRefType: 'cid', contentRefLocation: cid },
      size,
      published: new Date().toISOString()
    });
    return { cid, size };
  }
}

export async function docDeleteVersion(docId, versionCid) {
  const versionsCollection = await getVersionsCollection();
  return versionsCollection.findOne({ docId, cid: versionCid }).remove();
}

export async function docGetVersions(docId) {
  const versionsCollection = await getVersionsCollection();
  return versionsCollection.find({ docId }).exec();
}