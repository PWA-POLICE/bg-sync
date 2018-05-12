"use strict";

exports.__esModule = true;
exports.default = fetch;
var syncIds = [];

function fetch(url, options) {
  if (!options) {
    options = {};
  }

  if (!options.headers) {
    options.headers = {};
  }

  options.headers['X-bgsync'] = 'true';
  var resolveResult;
  window.fetch(url, options).then(function (res) {
    // 103 Early Hints
    var id = res.status === 103 && res.headers.get('X-bgsync-id');

    if (id) {
      syncIds.push(id);
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

window.addEventListener('message', function (e) {
  console.log(e);
});