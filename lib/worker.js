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

  var isSync = e.request.headers.get(PREFIX);
  if (isSync) return;
  var id = (0, _nanoid.default)();

  if (!registration.sync) {
    e.request.headers.set(PREFIX + "-id", id);
    var fetching = fetch(e.request).then(function (res) {
      return respondToClients(id, res);
    }, function (err) {
      return respondToClients(id, Response.error());
    });

    try {
      e.waitUntil(fetching);
    } catch (e) {}
  } else {
    requestsMemCache[id] = e.request.clone();
    e.waitUntil(storeRequest(id, e.request).then(function () {
      return registration.sync(TAG_PREFIX + id);
    }));
  }

  e.respondWith(new Response(103, {
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
  var options = Object.keys(data).reduce(function (result, key) {
    if (key !== 'url' && key !== 'headers') {
      result[key] = data[key];
    }

    return result;
  }, {});
  options.headers = data.headers.reduce(function (result, pair) {
    result.set(pair[0], pair[1]);
    return result;
  }, new Headers());
  return new Request(data.url, options);
}

function respondToClients(id, response) {
  clients.matchAll({
    includeUncontrolled: true
  }).then(function (clients) {
    if (!clients.length) return;
    return caches.open(STORE_NAME_PREFIX + 'responses').then(function (cache) {
      return cache.put('/' + id, response);
    });
  }).then(function (clients) {
    if (!clients.length) return;
    clients.forEach(function (client) {
      var _client$postMessage;

      client.postMessage((_client$postMessage = {}, _client$postMessage[PREFIX] = true, _client$postMessage.action = 'done', _client$postMessage.id = id, _client$postMessage));
    });
  });
}