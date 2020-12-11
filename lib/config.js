const path = require('path')

const defaultWorkspace = `./src`
const projectRoot = process.cwd()
const { Log } = require('./utils')

const defaultOptions = {
  host: '0.0.0.0',
  port: '8080',
  proxy: null,
  before: function () {},
  workspace: defaultWorkspace,
  root: defaultWorkspace,
  send: {},
  inject: function (event) {
    // 自定义处理socket onmessage方法
    let edata = event.data
    if (edata.indexOf('origin') < 0) return
    let data = JSON.parse(edata)
    if (data.origin == 'watcher') {
      window.location.reload()
    }
  },
}

const options = Object.assign({}, defaultOptions)
let customConfig = {}
// 读取配置文件
try {
  customConfig = require(path.join(projectRoot, `./lds.config.js`))
  Object.assign(options, customConfig, {
    // 优先级lds配置里的root->配置里的workspace->默认的root
    root: customConfig.root || customConfig.workspace || options.root,
  })
} catch (error) {
  config = options
  Log.info('没有lds.config.js配置文件')
}
let { workspace, root, ...restConfig } = options

let extra = {
  workspace: path.join(projectRoot, workspace),
  root: path.join(projectRoot, root),
}
// TODO deep merge？
Object.assign(options, restConfig, extra)

module.exports = {
  options,
  projectRoot,
}
