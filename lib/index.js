const http = require('http')
const path = require('path')
const fs = require('fs')
const connect = require('connect')
const chokidar = require('chokidar')
const parseUrl = require('parseurl')
const bodyParser = require('body-parser')
const send = require('send')
const WebSocket = require('ws')
const createProxy = require('./proxy')
const { Log } = require('./log')
const {
  assertFunc,
  createNotFoundDirectoryListener,
  generateWatchMessage,
  mergeInjectCodeToRes,
} = require('./utils')

const { options } = require('./config')
// const projectRoot = process.cwd()

const protocol = 'http'

module.exports = (customOptions) => {
  const { port, host, proxy, workspace } = Object.assign(options, customOptions)
  const openHost = host === '0.0.0.0' ? 'localhost' : host

  const app = connect()
  const onDirectory = createNotFoundDirectoryListener()

  const INJECT_SCRIPT_CODE = fs.readFileSync(
    path.join(__dirname, './inject.html'),
    {
      encoding: 'utf-8',
    }
  )

  const server = http.createServer(app)
  const wsIns = new WebSocket.Server({ server })
  const watcher = chokidar.watch(
    workspace,
    options.watcher && options.watcher.options
  )

  let openURL = ''
  let clients = []
  let customInjectCode = ''
  let handleInjectCode = function () {}

  app.use(bodyParser.urlencoded({ extended: false }))

  // 处理自定义inject片段
  assertFunc(options, 'inject', function () {
    customInjectCode = `;(${options.inject.toString()})(event);`
  })

  // 处理before钩子
  assertFunc(options, 'before', function () {
    options.before(app)
  })

  app.use(function (req, res, next) {
    var originalUrl = parseUrl.original(req)
    var reqPath = parseUrl(req).pathname

    // 处理代理
    if (proxy && createProxy(proxy, req, res, next)) return

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      // method not allowed
      res.statusCode = 405
      res.setHeader('Allow', 'GET, HEAD')
      res.setHeader('Content-Length', '0')
      res.end()
      return
    }

    // make sure redirect occurs at mount
    if (reqPath === '/' && originalUrl.pathname.substr(-1) !== '/') {
      reqPath = ''
    }

    // 如果是/demo/src/的时候，会指向到demo/src/index.html，这种情况需要注入inject片段
    // 所以这块判断出可能需注入
    let maybeNeedInjectCode =
      reqPath == '' ||
      reqPath.indexOf('.html') > -1 ||
      originalUrl.pathname.substr(-1) === '/'

    let sendOpts = Object.assign(
      {
        root: options.root,
      },
      options.send
    )

    if (maybeNeedInjectCode) {
      handleInjectCode = function (stream) {
        mergeInjectCodeToRes(res, stream, INJECT_SCRIPT_CODE, customInjectCode)
      }
    }

    // create send stream
    let sendStream = send(req, reqPath, sendOpts)
    // add directory handler
    sendStream.on('directory', onDirectory)
    // stream push inject code
    if (maybeNeedInjectCode) {
      // stream started
      sendStream.on('stream', handleInjectCode)
    }
    sendStream.pipe(res)
  })

  wsIns.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
      Log.log('received: %s', message)
    })

    clients.push(ws)

    ws.on('close', function (param) {
      clients = clients.filter((itm) => {
        return ws != itm
      })
    })
  })

  const { on: watcherListeners = ['change'] } = options.watcher || {}
  let listened = []

  watcherListeners.forEach((evtn) => {
    if (listened.includes(evtn)) return
    listened.push(evtn)

    watcher.on(evtn, (path) => {
      clients.forEach((ws) => {
        let raw = generateWatchMessage(
          options,
          openURL,
          `watcher-${evtn}`,
          path
        )
        ws.send(raw)
      })
    })
  })

  server.addListener('listening', function () {
    const address = server.address()
    // let serveHost = address.address === '0.0.0.0' ? '127.0.0.1' : address.address
    openURL = protocol + '://' + openHost + ':' + address.port

    Log.info(openURL)
  })

  server.listen(port)
}
