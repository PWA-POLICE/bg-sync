import nanoid from 'nanoid';
import { get, set, Store } from 'idb-keyval';

const PREFIX = 'X-bgsync';
const TAG_PREFIX = `${PREFIX}:`;
const STORE_NAME_PREFIX = `${PREFIX}:`;

const requestsStore = new Store(`${PREFIX}-db`, STORE_NAME_PREFIX + 'requests');

const requestsMemCache = {};

self.addEventListener('fetch', e => {
  const isSync = e.request.headers.get(PREFIX);

  if (isSync) return;

  const id = nanoid();

  if (!registration.sync) {
    e.request.headers.set(`${PREFIX}-id`, id);

    const fetching = fetch(e.request).then(
      res => {
        return respondToClients(id, res);
      },
      err => {
        return respondToClients(id, Response.error());
      }
    );

    try {
      e.waitUntil(fetching);
    } catch (e) {}
  } else {
    requestsMemCache[id] = e.request.clone();

    e.waitUntil(
      storeRequest(id, e.request).then(() => {
        return registration.sync(TAG_PREFIX + id);
      })
    );
  }

  e.respondWith(
    new Response(103, {
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

  const id = e.tag.slice(TAG_PREFIX.length);
  let synching = requestsMemCache[id] || retrieveRequest(id);

  synching = Promise.resolve(synching)
    .then(req => {
      if (!req) return;

      return fetch(req);
    })
    .then(res => {
      if (!res) return;

      return respondToClients(id, res);
    });

  e.waitUntil(synching);
});

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

  options.headers = data.headers.reduce((result, pair) => {
    result.set(pair[0], pair[1]);
    return result;
  }, new Headers());

  return new Request(data.url, options);
}

function respondToClients(id, response) {
  clients
    .matchAll({ includeUncontrolled: true })
    .then(clients => {
      if (!clients.length) return;

      return caches.open(STORE_NAME_PREFIX + 'responses').then(cache => {
        return cache.put('/' + id, response);
      });
    })
    .then(clients => {
      if (!clients.length) return;

      clients.forEach(client => {
        client.postMessage({
          [PREFIX]: true,
          action: 'done',
          id: id,
        });
      });
    });
}
