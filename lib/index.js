const http = require('http')
const path = require('path')
const fs = require('fs')
const connect = require('connect')
const chokidar = require('chokidar')
const send = require('send')
const WebSocket = require('ws')
const bodyParser = require('body-parser')
const createProxy = require('./proxy')
const { Log } = require('./log')
const {
  assertFunc,
  getBodyParser,
  getQueryParser,
  generateWatchMessage,
  mergeInjectCodeToRes,
  createNotFoundDirectoryListener,
} = require('./utils')

const { options, mergeConfig } = require('./config')
// const projectRoot = process.cwd()

const protocol = 'http'

module.exports = (customOptions) => {
  if (customOptions) {
    mergeConfig(customOptions)
  }
  const { port, host, proxy, workspace } = options
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

  // 处理自定义inject片段
  assertFunc(options, 'inject', function () {
    customInjectCode = `;(${options.inject.toString()})(event);`
  })

  // init
  assertFunc(options, 'init', function () {
    options.init(app, options)
  })

  // parser
  app.use(getBodyParser(bodyParser))
  app.use(getQueryParser())

  // before
  assertFunc(options, 'before', function () {
    options.before(app, options)
  })

  app.use(function (req, res, next) {
    var reqPath = req._parsedUrl.pathname

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
    if (reqPath === '/' && reqPath.substr(-1) !== '/') {
      reqPath = ''
    }

    // 如果是/demo/src/的时候，会指向到demo/src/index.html，这种情况需要注入inject片段
    // 所以这块判断出可能需注入
    let needInjectCode =
      reqPath == '' ||
      reqPath.indexOf('.html') > -1 ||
      reqPath.substr(-1) === '/'

    let sendOpts = Object.assign(
      {
        root: options.root,
      },
      options.send
    )

    // create send stream
    let sendStream = send(req, reqPath, sendOpts)
    // add directory handler
    sendStream.on('directory', onDirectory)
    // stream push inject code
    if (needInjectCode) {
      mergeInjectCodeToRes(
        res,
        reqPath,
        options.root,
        INJECT_SCRIPT_CODE,
        customInjectCode
      )
      next()
      return
    }
    sendStream.pipe(res)
  })

  // after
  assertFunc(options, 'after', function () {
    options.after(app, {
      server,
      ws: wsIns,
      options,
      watcher,
    })
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
  return server
}
