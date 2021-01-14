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
        window.VueScooter.reload(url)
        break
      default:
        window.location.reload()
    }
  },
  // watcher: {
  //   options: null,
  //   on: ['add', 'addDir', 'change'],
  // },
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
