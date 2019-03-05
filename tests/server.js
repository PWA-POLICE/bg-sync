var path = require('path');

var express = require('express');
var app = express();

var WWW_FOLDER = path.join(__dirname, './output');

var PORT = process.env.PORT || 9999;

var reqNum = 0;

app.get('/', serveIndex);

app.get('/sw.js', serveServiceWorker);
app.use(express.static(WWW_FOLDER));

app.listen(PORT);

app.all('/bg-sync-test', (req, res) => {
  console.log('/bg-sync-test [' + (++reqNum) + ']', {
    method: req.method,
    headers: req.headers
  });

  setTimeout(() => {
    res.send(JSON.stringify({
      method: req.method,
      headers: req.headers
    }));
  }, 0);
});

function serveServiceWorker(req, res) {
  res.sendFile(path.join(WWW_FOLDER, 'sw.js'), {
    cacheControl: false,
    acceptRanges: false,
    headers: {
      'Cache-Control': 'no-cache'
    }
  });
}

function serveIndex(req, res) {
  res.sendFile(path.join(WWW_FOLDER, 'index.html'), {
    cacheControl: false,
    acceptRanges: false,
    headers: {
      'Cache-Control': 'no-cache'
    }
  });
}

console.log('http://127.0.0.1:' + PORT);