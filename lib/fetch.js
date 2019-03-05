"use strict";

exports.__esModule = true;
exports.default = fetch;
var pendingsMap = {};
var KEY = 'X-bgsync';

function fetch(url, options) {
  if (!options) {
    options = {};
  }

  if (!options.headers) {
    options.headers = {};
  }

  options.headers[KEY] = 'true';
  var resolveResult;
  window.fetch(url, options).then(function (res) {
    // 202 Accepted
    var id = res.status === 202 && res.headers.get(KEY + '-id');
    console.log('response', res);

    if (id) {
      pendingsMap[id] = resolveResult;
      return;
    }

    resolveResult(res);
  }, function (err) {
    resolveResult(Promise.reject(err));
  });
  return new Promise(function (resolve) {
    return resolveResult = resolve;
  });
}

if (navigator.serviceWorker) {
  navigator.serviceWorker.addEventListener('message', function (e) {
    console.log('message', e.data);
    var data = e.data;

    if (data && data[KEY] && data.action === 'done' && data.id) {
      var callback = pendingsMap[data.id];
      if (!callback) return;
      caches.match('/' + data.id, {
        cacheName: KEY + ':responses'
      }).catch(function () {}).then(function (res) {
        if (!res) return;
        callback(res);
      });
    }
  });
}