const http = require('http')
const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')
const connect = require('connect')
const chokidar = require('chokidar')
const httpProxy = require('http-proxy')
const WebSocket = require('faye-websocket')
const parseUrl = require('parseurl')
const bodyParser = require('body-parser')
const send = require('send')
const es = require('event-stream')
const { PassThrough, Stream, Readable } = require('stream')

const opts = {
  host: '0.0.0.0',
  port: '3002',
  proxy: {},
  before: null,
  server: {
    root: path.join(__dirname, './src'),
    wsInjectScript: './extra.inject.js',
  },
}

const app = connect()

const { port, host } = opts
const INJECT_SCRIPT = fs.readFileSync('./inject.html', { encoding: 'utf-8' })
let customInjectScript = ''

try {
  customInjectScript = fs.readFileSync(
    path.join(process.cwd(), opts.server.wsInjectScript),
    { encoding: 'utf-8' }
  )
} catch (error) {
  console.error(error)
  console.log('没有找到自定义的inject文件')
}

const INJECT_TAG = '</body>'
const CUSTOME_INJECT_POSITION = `//////`

app.use(bodyParser.urlencoded({ extended: false }))

const onDirectory = createNotFoundDirectoryListener()

app.use(function (req, res, next) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    // method not allowed
    res.statusCode = 405
    res.setHeader('Allow', 'GET, HEAD')
    res.setHeader('Content-Length', '0')
    res.end()
    return
  }

  
  var originalUrl = parseUrl.original(req)
  var reqPath = parseUrl(req).pathname
  
  // make sure redirect occurs at mount
  if (reqPath === '/' && originalUrl.pathname.substr(-1) !== '/') {
    reqPath = ''
  }
  
  let sendOpts = opts.server
  
  var handleInject = function () {}
  if (reqPath == '/' || reqPath.indexOf('.html') > -1) {
    handleInject = function (stream) {
      var len = INJECT_SCRIPT.length
      if (customInjectScript.length) {
        len += customInjectScript.length
      }
      len += res.getHeader('Content-Length')

      res.setHeader('Content-Length', len)

      var originalPipe = stream.pipe

      stream.pipe = function (resq) {
        let tmpStream = originalPipe.call(
          stream,
          es.replace(new RegExp(INJECT_TAG, 'i'), INJECT_SCRIPT + INJECT_TAG)
        )
        // ws message, inject custom scripts
        let tmpPipe = tmpStream.pipe
        tmpPipe
          .call(
            tmpStream,
            es.replace(
              new RegExp(CUSTOME_INJECT_POSITION, 'i'),
              customInjectScript + CUSTOME_INJECT_POSITION
            )
          )
          .pipe(resq)
      }
    }
  }

  // create send stream
  const sendStream = send(req, reqPath, sendOpts)

  // add directory handler
  sendStream.on('directory', onDirectory)

  // pipe
  sendStream.on('stream', handleInject).pipe(res)
})

var clients = []
const server = http.createServer(app)

const watcher = chokidar.watch('./src', {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
})
watcher.on('change', (path) => {
  clients.forEach((ws) => {
    ws.send(generateWatchMessage('reload', path))
  })
})

server.addListener('listening', function () {
  const protocol = 'http'
  const address = server.address()
  var openHost = host === '0.0.0.0' ? 'localhost' : host
  let serveHost = address.address === '0.0.0.0' ? '127.0.0.1' : address.address
  var openURL = protocol + '://' + openHost + ':' + address.port

  console.log(openURL)
})

server.addListener('upgrade', function (request, socket, head) {
  let ws = new WebSocket(request, socket, head)
  ws.onopen = () => ws.send('connected')

  clients.push(ws)

  ws.onclose = () => {
    // refresh page, remove match ws
    clients = clients.filter((itm) => {
      return ws != itm
    })
  }
})

server.listen(port)

function createNotFoundDirectoryListener() {
  return function notFound() {
    this.error(404)
  }
}

/**
 * generate send message
 * @param {String} sign ws send type, reload...
 * @param {Object} data send data
 */
function generateMessage(sign, data) {
  return JSON.stringify({
    sign,
    data,
  })
}

/**
 * watch file change, generate send message
 * @param {String} sign type
 * @param {String} path file path
 */
function generateWatchMessage(sign, path) {
  return generateMessage(sign, { path })
}
