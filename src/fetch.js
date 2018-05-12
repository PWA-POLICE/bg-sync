const syncIds = [];

export default function fetch(url, options) {
  if (!options) {
    options = {};
  }

  if (!options.headers) {
    options.headers = {};
  }

  options.headers['X-bgsync'] = 'true';

  let resolveResult;

  window.fetch(url, options).then(
    res => {
      // 103 Early Hints
      const id = res.status === 103 && res.headers.get('X-bgsync-id');

      if (id) {
        syncIds.push(id);
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

window.addEventListener('message', e => {
  console.log(e);
});
