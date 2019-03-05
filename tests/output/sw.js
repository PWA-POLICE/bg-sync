/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _lib_worker__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1);
/* harmony import */ var _lib_worker__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_lib_worker__WEBPACK_IMPORTED_MODULE_0__);


addEventListener('message', (e) => {
  if (e.data && e.data.test) {
    e.waitUntil(new Promise(resolve => {
      setTimeout(resolve, 5000);
    }).then(() => {
      console.log('123');
      return caches.open('test123').then(cache => {
        return cache.put('/test', new Response('something'));
      });
    }));
  }
});

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _nanoid = _interopRequireDefault(__webpack_require__(2));

var _idbKeyval = __webpack_require__(4);

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

  if (true) {
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
  } else {}

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

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

var random = __webpack_require__(3)

var url = '_~0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

/**
 * Generate secure URL-friendly unique ID.
 *
 * By default, ID will have 21 symbols to have a collision probability similar
 * to UUID v4.
 *
 * @param {number} [size=21] The number of symbols in ID.
 *
 * @return {string} Random string.
 *
 * @example
 * var nanoid = require('nanoid')
 * model.id = nanoid() //=> "Uakgb_J5m9g~0JDMbcJqL"
 *
 * @name nanoid
 */
module.exports = function (size) {
  size = size || 21
  var id = ''
  var bytes = random(size)
  while (0 < size--) {
    id += url[bytes[size] & 63]
  }
  return id
}


/***/ }),
/* 3 */
/***/ (function(module, exports) {

var crypto = self.crypto || self.msCrypto

module.exports = function (bytes) {
  return crypto.getRandomValues(new Uint8Array(bytes))
}


/***/ }),
/* 4 */
/***/ (function(__webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Store", function() { return Store; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "get", function() { return get; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "set", function() { return set; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "del", function() { return del; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "clear", function() { return clear; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "keys", function() { return keys; });
class Store {
    constructor(dbName = 'keyval-store', storeName = 'keyval') {
        this.storeName = storeName;
        this._dbp = new Promise((resolve, reject) => {
            const openreq = indexedDB.open(dbName, 1);
            openreq.onerror = () => reject(openreq.error);
            openreq.onsuccess = () => resolve(openreq.result);
            // First time setup: create an empty object store
            openreq.onupgradeneeded = () => {
                openreq.result.createObjectStore(storeName);
            };
        });
    }
    _withIDBStore(type, callback) {
        return this._dbp.then(db => new Promise((resolve, reject) => {
            const transaction = db.transaction(this.storeName, type);
            transaction.oncomplete = () => resolve();
            transaction.onabort = transaction.onerror = () => reject(transaction.error);
            callback(transaction.objectStore(this.storeName));
        }));
    }
}
let store;
function getDefaultStore() {
    if (!store)
        store = new Store();
    return store;
}
function get(key, store = getDefaultStore()) {
    let req;
    return store._withIDBStore('readonly', store => {
        req = store.get(key);
    }).then(() => req.result);
}
function set(key, value, store = getDefaultStore()) {
    return store._withIDBStore('readwrite', store => {
        store.put(value, key);
    });
}
function del(key, store = getDefaultStore()) {
    return store._withIDBStore('readwrite', store => {
        store.delete(key);
    });
}
function clear(store = getDefaultStore()) {
    return store._withIDBStore('readwrite', store => {
        store.clear();
    });
}
function keys(store = getDefaultStore()) {
    const keys = [];
    return store._withIDBStore('readonly', store => {
        // This would be store.getAllKeys(), but it isn't supported by Edge or Safari.
        // And openKeyCursor isn't supported by Safari.
        (store.openKeyCursor || store.openCursor).call(store).onsuccess = function () {
            if (!this.result)
                return;
            keys.push(this.result.key);
            this.result.continue();
        };
    }).then(() => keys);
}




/***/ })
/******/ ]);