import nanoid from 'nanoid';
import { get, set, keys, Store } from 'idb-keyval';
import PREFIX from './key';

const TAG_PREFIX = `${PREFIX}:`;
const STORE_NAME_PREFIX = `${PREFIX}:`;

const requestsStore = new Store(`${PREFIX}-db`, 'requests');
const syncTagsStore = new Store(`${PREFIX}-db`, 'tags');

const requestsMemCache = {};

self.addEventListener('fetch', e => {
  const isSync = e.request.headers.get(PREFIX);
  // Do not process if it isn't a bg-sync request
  if (!isSync) return;

  let id;

  try {
    // Web Crypto isn't available in Edge in workers yet
    id = nanoid();
  } catch (e) {
    id = Date.now() + (Math.random() + '').replace('.', '');
  }

  const tag = TAG_PREFIX + id + ':' + e.clientId;

  if (!registration.sync) {
    requestsMemCache[id] = e.request.clone();

    e.waitUntil(
      storeRequest(id, e.request).then(() => {
        return registerSyncTag(tag);
      }).then(() => {
        return doSyncRequest(tag);
      })
    );

    try {
      e.waitUntil(fetching);
    } catch (e) {
      console.error(e);
    }
  } else {
    requestsMemCache[id] = e.request.clone();

    e.waitUntil(
      storeRequest(id, e.request).then(() => {
        return registration.sync.register(tag);
      })
    );
  }

  e.respondWith(
    new Response(null, {
      status: 202,
      statusText: `Accepted ${PREFIX}`,
      headers: {
        [`${PREFIX}-id`]: id,
      },
    })
  );
});

self.addEventListener('sync', e => {
  if (e.tag.indexOf(TAG_PREFIX) !== 0) {
    return;
  }

  e.waitUntil(doSyncRequest(e.tag));
});

if (!registration.sync) {
  self.addEventListener('message', (e) => {
    if (!(e.data && e.data[PREFIX] && e.data.action === 'try')) {
      return;
    }

    const wait = keys(syncTagsStore).then(keys => {
      if (!keys.length) return;

      const all = keys.map(tag => {
        return doSyncRequest(tag);
      });

      return Promise.all(all);
    });

    e.waitUntil(wait);
  });

  self.postMessage({ [PREFIX]: true, action: 'try' });
}

function doSyncRequest(tag) {
  const [ _, id, clientId ] = tag.split(':');

  let synching = requestsMemCache[id] || retrieveRequest(id);

  synching = Promise.resolve(synching)
    .then(req => {
      if (!req) return;

      return fetch(req);
    })
    .then(res => {
      if (!res) return;

      return respondToClient(id, res, clientId);
    });

  return synching;
}

function registerSyncTag(tag) {
  return set(tag, {}, syncTagsStore);
}

function retrieveRequest(id) {
  return get(id, requestsStore).then(data => {
    if (!data) return;

    return replicateRequest(data);
  });
}

function storeRequest(id, request) {
  return serializeRequest(request).then(data => {
    return set(id, data, requestsStore);
  });
}

function serializeRequest(request) {
  const body = request.body && request.body.arrayBuffer();
  const headers = {};

  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const result = { headers };

  [
    'url',
    'method',
    'mode',
    'credentials',
    'cache',
    'redirect',
    'referrer',
    'integrity',
  ].forEach(prop => {
    result[prop] = request[prop];
  });

  return Promise.resolve(body).then(body => {
    result.body = body;
    return result;
  });
}

function replicateRequest(data) {
  const options = Object.keys(data).reduce((result, key) => {
    if (key !== 'url' && key !== 'headers') {
      result[key] = data[key];
    }

    return result;
  }, {});

  options.headers = Object.keys(data.headers).reduce((result, key) => {
    result.set(key, data.headers[key]);
    return result;
  }, new Headers());

  return new Request(data.url, options);
}

function respondToClient(id, response, clientId) {
  return clients.get(clientId)
    .then(client => {
      if (!client) return;

      return caches
        .open(STORE_NAME_PREFIX + 'responses')
        .then(cache => {
          return cache.put('/' + id, response);
        })
        .then(_ => client);
    })
    .then(client => {
      if (!client) return;

      client.postMessage({
        [PREFIX]: true,
        action: 'done',
        id: id,
      });
    })
    .catch(err => {
      console.error(err);
    });
}

export function onResponse() {

}