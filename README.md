# live-dev-server

[![view on npm](http://img.shields.io/npm/v/live-dev-server.svg)](https://www.npmjs.com/package/live-dev-server)
[![npm module downloads per month](http://img.shields.io/npm/dm/live-dev-server.svg)](https://www.npmjs.org/package/live-dev-server)

> a small development server with live reload.

## Live Dev Server

1. watch files change, and reload the page。You can also execute custom code。
2. proxy use http-proxy, same as webpack devServer proxy

## Installation

need node.js and npm.

**install**
cd project dir

```bash
npm install live-dev-server
```
## invoking live dev server

options priority level:

1. incoming option
2. `lds.config.js`
3. default option

```js
const liveDevServer = require('live-dev-server')

const opts = {
  // options
}

liveDevServer(opts)
```

**add scripts**

```json
"scripts": {
  "serve": "live-dev-server",
},
```

**run server**

```bash
npm run serve
```

## configuration file

project dir create a configuration file： `lds.config.js`.such as:

```js
module.exports = {
  workspace: './example/',
  port: '3002',
  inject: function (event) {
    // ws message event
    let msgData = event.data
    if (msgData.indexOf('watcher') < 0) return
    let {
      data: { ext, url },
    } = JSON.parse(msgData)
    // console.log(ext, url)
    switch (ext) {
      case '.vue':
        // execute some code
        break
      default:
        window.location.reload()
    }
  },
  watcher: {
    options: null,
    on: ['add', 'addDir', 'change'],
  },
  proxy: {
    '/api': {
      target: 'https://api.github.com',
      ws: true,
      changeOrigin: true,
      pathRewrite: {
        '^/api': '',
      },
    },
  },
}
```

**watch more**

> https://github.com/paulmillr/chokidar#api

```js
{
  watcher: {
    options: null, // chokidar options
    on: ['add', 'addDir', 'change'], // chokidar on
  },
}
```
when config watcher,  In the `inject` code, you will receive `watcher-[name]`, and `isDir` can be used to determine whether it is a folder.

```bash
# change
{"origin":"watcher-change","data":{"url":"http://localhost:3002/index.html","host":"http://localhost:3002","path":"index.html","ext":".html","isDir":false}}

# add dir
{"origin":"watcher-addDir","data":{"url":"http://localhost:3002/addDir","host":"http://localhost:3002","path":"addDir","ext":"","isDir":true}}

# add file
{"origin":"watcher-add","data":{"url":"http://localhost:3002/addDir/file.txt","host":"http://localhost:3002","path":"addDir/file.txt","ext":".txt","isDir":false}}

# rename dir, will trigger add
{"origin":"watcher-addDir","data":{"url":"http://localhost:3002/renameFold","host":"http://localhost:3002","path":"renameFold","ext":"","isDir":true}}
{"origin":"watcher-add","data":{"url":"http://localhost:3002/renameFold/file.txt","host":"http://localhost:3002","path":"renameFold/file.txt","ext":".txt","isDir":false}}
```

## dependencies

- [body-parser](https://github.com/expressjs/body-parser)
- [chokidar](https://github.com/paulmillr/chokidar)
- [connect](https://github.com/senchalabs/connect)
- [http-proxy](https://github.com/http-party/node-http-proxy)
- [parseurl](https://github.com/pillarjs/parseurl)
- [send](https://github.com/pillarjs/send)
- [ws](https://github.com/websockets/ws)
