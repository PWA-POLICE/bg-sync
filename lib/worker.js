"use strict";

var _nanoid = _interopRequireDefault(require("nanoid"));

var _idbKeyval = require("idb-keyval");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var PREFIX = 'X-bgsync';
var TAG_PREFIX = PREFIX + ":";
var STORE_NAME_PREFIX = PREFIX + ":";
var requestsStore = new _idbKeyval.Store(PREFIX + "-db", STORE_NAME_PREFIX + 'requests');
var requestsMemCache = {};
self.addEventListener('fetch', function (e) {
  var _headers;

  var isSync = e.request.headers.get(PREFIX); // Do not process if it isn't bg-sync request

  if (!isSync) return;
  var id;

  try {
    // Web Crypto isn't available in Edge in workers yet
    id = (0, _nanoid.default)();
  } catch (e) {
    id = Date.now() + (Math.random() + '').replace('.', '');
  }

  if (true || !registration.sync) {
    var fetching = new Promise(function (resolve) {
      return setTimeout(resolve, 10 * 1000);
    }) // .then(_ => serializeRequest(e.request))
    // .then(data => replicateRequest(data))
    .then(function (_) {
      return e.request;
    }).then(function (r) {
      return fetch(r);
    }).then(function (res) {
      return respondToClients(id, res);
    }).then(function (res) {
      return caches.open('test123').then(function (cache) {
        return cache.put('/test', new Response(id));
      });
    }).catch(function (err) {
      console.error(err);
      return caches.open('test123').then(function (cache) {
        return cache.put('/test', new Response('error'));
      });
    });
    e.respondWith(fetching);
    return;

    try {
      e.waitUntil(fetching);
    } catch (e) {
      console.error(e);
    }
  } else {
    requestsMemCache[id] = e.request.clone();
    e.waitUntil(storeRequest(id, e.request).then(function () {
      return registration.sync.register(TAG_PREFIX + id);
    }));
  }

  e.respondWith(new Response(null, {
    status: 202,
    statusText: "Accepted " + PREFIX,
    headers: (_headers = {}, _headers[PREFIX + "-id"] = id, _headers)
  }));
});
self.addEventListener('sync', function (e) {
  if (e.tag.indexOf(TAG_PREFIX) !== 0) {
    return;
  }

  var id = e.tag.slice(TAG_PREFIX.length);
  var synching = requestsMemCache[id] || retrieveRequest(id);
  synching = Promise.resolve(synching).then(function (req) {
    if (!req) return;
    return fetch(req);
  }).then(function (res) {
    if (!res) return;
    return respondToClients(id, res);
  });
  e.waitUntil(synching);
});

function retrieveRequest(id) {
  return (0, _idbKeyval.get)(id, requestsStore).then(function (data) {
    if (!data) return;
    return replicateRequest(data);
  });
}

function storeRequest(id, request) {
  return serializeRequest(request).then(function (data) {
    return (0, _idbKeyval.set)(id, data, requestsStore);
  });
}

function serializeRequest(request) {
  var body = request.body && request.body.arrayBuffer();
  var headers = {};
  request.headers.forEach(function (value, key) {
    headers[key] = value;
  });
  var result = {
    headers: headers
  };
  ['url', 'method', 'mode', 'credentials', 'cache', 'redirect', 'referrer', 'integrity'].forEach(function (prop) {
    result[prop] = request[prop];
  });
  return Promise.resolve(body).then(function (body) {
    result.body = body;
    return result;
  });
}

function replicateRequest(data) {
  console.log(data);
  var options = Object.keys(data).reduce(function (result, key) {
    if (key !== 'url' && key !== 'headers') {
      result[key] = data[key];
    }

    return result;
  }, {});
  options.headers = Object.keys(data.headers).reduce(function (result, key) {
    result.set(key, data.headers[key]);
    return result;
  }, new Headers());
  return new Request(data.url, options);
}

function respondToClients(id, response) {
  return clients.matchAll({
    includeUncontrolled: true
  }).then(function (clients) {
    if (!clients || !clients.length) return;
    return caches.open(STORE_NAME_PREFIX + 'responses').then(function (cache) {
      return cache.put('/' + id, response);
    }).then(function (_) {
      return clients;
    });
  }).then(function (clients) {
    if (!clients || !clients.length) return;
    clients.forEach(function (client) {
      var _client$postMessage;

      client.postMessage((_client$postMessage = {}, _client$postMessage[PREFIX] = true, _client$postMessage.action = 'done', _client$postMessage.id = id, _client$postMessage));
    });
  }).catch(function (err) {
    console.error(err);
  });
}