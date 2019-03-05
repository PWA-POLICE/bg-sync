import '../lib/worker';

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