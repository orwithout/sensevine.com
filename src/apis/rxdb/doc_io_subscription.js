// doc_io_subscription.js
import { getMetaCollection } from './doc_meta.js';
import _ from 'lodash';

const subscriptions = new WeakMap();
const debouncedUnsubscribe = _.debounce(unsubscribe, 30000);

export async function docSubscribeToChanges(query = {}, callback) {
  const metaCollection = await getMetaCollection();
  const key = {};
  const subscription = metaCollection.find(query).$.subscribe(results => {
    callback(results);
    debouncedUnsubscribe.cancel();
    debouncedUnsubscribe(key);
  });

  subscriptions.set(key, subscription);
  return key;
}

export function docUnsubscribe(key) {
  const subscription = subscriptions.get(key);
  if (subscription) {
    subscription.unsubscribe();
    subscriptions.delete(key);
    console.log('Subscription cancelled');
  }
}

export function docUnsubscribeAll() {
  subscriptions.forEach((_, key) => unsubscribe(key));
  console.log('All subscriptions cancelled');
}