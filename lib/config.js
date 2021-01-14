const path = require('path')
const fs = require('fs')

const defaultWorkspace = `./src`
const projectRoot = process.cwd()
const CUSTOME_INJECT_CODE_MARK = `//////`

const defaultWatcherConfig = {
  options: {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
  },
  on: ['change'],
}

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
  watcher: defaultWatcherConfig, // 'add', 'addDir' and 'change'
}

let options = Object.assign({}, defaultOptions)

// 读取配置文件
let customConfig = readConfigFile()
if (customConfig) {
  Object.assign(options, customConfig, {
    // 优先级lds配置里的root->配置里的workspace->默认的root
    root: customConfig.root || customConfig.workspace || options.root,
  })
}

let { workspace, root, ...restConfig } = options
let extra = {
  workspace: path.join(projectRoot, workspace),
  root: path.join(projectRoot, root),
}

// TODO deep merge？
Object.assign(options, restConfig, extra)

function readConfigFile() {
  let oldConfigPath = path.join(projectRoot, `./lds.config.js`)
  let configPath = path.join(projectRoot, `./live.config.js`)
  let isExists = isExsistsSync(configPath)

  if (!isExists) {
    configPath = oldConfigPath
    isExists = isExsistsSync(oldConfigPath)
  }
  if (isExists) return require(configPath)
  return null
}

function isExsistsSync(filePath) {
  return fs.existsSync(filePath)
}

module.exports = {
  options,
  projectRoot,
  CUSTOME_INJECT_CODE_MARK,
}
