import swUrl from 'sw-loader?name=sw.js!./sw.js';
import 'file-loader?name=index.html!./index.html';

import bgFetch from '../lib/fetch';

navigator.serviceWorker.register(swUrl);

window.test = (method) => {
  bgFetch('/bg-sync-test', {
    method: method ? method.toUpperCase() : 'GET'
  })
  .then(res => res.json()).then(res => {
    console.log('result', res);
  }, console.error);
};

window.test2 = () => {
  navigator.serviceWorker.controller.postMessage({ test: 213 });
}