const http = require('http');
const path = require('path');
const fs = require('fs');
const connect = require('connect');
const chokidar = require('chokidar');
const httpProxy = require('http-proxy');
const ws = require('ws');
const parseUrl = require('parseurl');
const bodyParser = require('body-parser');
const send = require('send');
const es = require('event-stream');
const { PassThrough, Stream } = require('stream')

const opts = {
  port: '3002',
  proxy: {},
  before: null,
  server: {
    root: path.join(__dirname, './'),
  },
};

const app = connect();

const { port } = opts;
const INJECT_SCRIPT = fs.readFileSync('./inject.html', { encoding: 'utf-8' });

app.use(bodyParser.urlencoded({ extended: false }));

const onDirectory = createNotFoundDirectoryListener();

app.use(function (req, res, next) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    // method not allowed
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    res.setHeader('Content-Length', '0');
    res.end();
    return;
  }
  console.log('req.url', req.url);

  var originalUrl = parseUrl.original(req);
  var reqPath = parseUrl(req).pathname;

  // make sure redirect occurs at mount
  if (reqPath === '/' && originalUrl.pathname.substr(-1) !== '/') {
    reqPath = '';
  }

  console.log(reqPath);
  let sendOpts = opts.server;

  var handleInject = function (stream) {

  }
  if (reqPath.indexOf('.html') > -1) {
    console.log('inject ws code');
    handleInject = function (stream) {
      var len = INJECT_SCRIPT.length + res.getHeader('Content-Length');
      res.setHeader('Content-Length', len);

      var originalPipe = stream.pipe;
      var bufferStream = new PassThrough();

      //将Buffer写入
      bufferStream.end(Buffer.from(INJECT_SCRIPT));
      bufferStream.pipe(process.stdout)

      stream.pipe = function (resq) {
        // TODO review
        // originalPipe.call(stream, bufferStream).pipe(resq)
        originalPipe.call(stream, es.replace(new RegExp('</html>', 'i'), INJECT_SCRIPT + '</html>')).pipe(resq)
      }
    };
  }

  // create send stream
  const sendStream = send(req, reqPath, sendOpts);

  // add directory handler
  sendStream.on('directory', onDirectory);

  // pipe
  sendStream
    .on('stream', handleInject).pipe(res);
});


const server = http.createServer(app).listen(port);

console.log(server.address());

function createNotFoundDirectoryListener() {
  return function notFound() {
    this.error(404);
  };
}
