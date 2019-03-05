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
/* harmony import */ var sw_loader_name_sw_js_sw_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1);
/* harmony import */ var sw_loader_name_sw_js_sw_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(sw_loader_name_sw_js_sw_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var file_loader_name_index_html_index_html__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2);
/* harmony import */ var file_loader_name_index_html_index_html__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(file_loader_name_index_html_index_html__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _lib_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(3);
/* harmony import */ var _lib_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_lib_fetch__WEBPACK_IMPORTED_MODULE_2__);





navigator.serviceWorker.register(sw_loader_name_sw_js_sw_js__WEBPACK_IMPORTED_MODULE_0___default.a);

window.test = (method) => {
  _lib_fetch__WEBPACK_IMPORTED_MODULE_2___default()('/bg-sync-test', {
    method: method ? method.toUpperCase() : 'GET'
  })
  .then(res => res.json()).then(res => {
    console.log('result', res);
  }, console.error);
};

window.test2 = () => {
  navigator.serviceWorker.controller.postMessage({ test: 213 });
}

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "sw.js";

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "index.html";

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

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

/***/ })
/******/ ]);