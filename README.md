# live-dev-server
[![view on npm](http://img.shields.io/npm/v/live-dev-server.svg)](https://www.npmjs.com/package/live-dev-server)
[![npm module downloads per month](http://img.shields.io/npm/dm/live-dev-server.svg)](https://www.npmjs.org/package/live-dev-server)

> a little development server width live reload.

## Live Dev Server
1. watch files change, and reload the page。You can also execute custom code。
2. proxy use http-proxy, same as webpack devServer proxy

## Installation
need node.js and npm.

**install**
cd project dir

```bash
npm install -D live-dev-server
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
  inject: function(event) {
    // ws message event
    let msgData = event.data
    if (msgData.indexOf('watcher') < 0) return
    let { data: { ext, url } } = JSON.parse(msgData)
    // console.log(ext, url)
    switch(ext) {
      case '.vue':
        // execute some code
        break
      default:
        window.location.reload()
    }
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

## dependencies
- [body-parser](https://github.com/expressjs/body-parser)
- [chokidar](https://github.com/paulmillr/chokidar)
- [connect](https://github.com/senchalabs/connect)
- [execa](https://github.com/sindresorhus/execa)
- [http-proxy](https://github.com/http-party/node-http-proxy)
- [parseurl](https://github.com/pillarjs/parseurl)
- [send](https://github.com/pillarjs/send)
- [ws](https://github.com/websockets/ws)