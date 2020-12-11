# live-dev-server
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
```bash
  body-parser
  chokidar
  connect
  execa
  http-proxy
  parseurl
  send
  ws
```