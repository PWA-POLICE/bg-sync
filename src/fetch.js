import KEY from './key';

const pendingsMap = {};

export default function fetch(url, options) {
  if (!options) {
    options = {};
  }

  if (!options.headers) {
    options.headers = {};
  }

  options.headers[KEY] = 'true';

  let resolveResult;

  window.fetch(url, options).then(
    res => {
      // 202 Accepted
      const id = res.status === 202 && res.headers.get(KEY + '-id');

      if (id) {
        pendingsMap[id] = resolveResult;
        scheduleInterval();
        return;
      }

      resolveResult(res);
    },
    err => {
      resolveResult(Promise.reject(err));
    }
  );

  return new Promise(resolve => (resolveResult = resolve));
}

if (navigator.serviceWorker) {
  navigator.serviceWorker.addEventListener('message', e => {
    const data = e.data;

    if (!(data && data[KEY] && data.action === 'done' && data.id)) {
      return;
    }

    const callback = pendingsMap[data.id];
    delete pendingsMap[data.id];

    if (!callback) return;

    caches.match('/' + data.id, {
      cacheName: KEY + ':responses'
    }).catch(() => {}).then(res => {
      if (!res) return;

      callback(res);
    });
  });
}

function scheduleInterval() {
  if (interval) return;

  if (!('SyncManager' in window && navigator.serviceWorker.controller)) {
    return;
  }

  interval = setInterval(() => {
    if (Object.keys(pendingsMap).length) {
      navigator.serviceWorker.controller.postMessage({
        [KEY]: true,
        action: 'try'
      });
    }
  }, 60 * 1000);
}

function cancelInterval() {

}