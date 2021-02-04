const path = require('path')
const fs = require('fs')
const { CUSTOME_INJECT_CODE_MARK } = require('./config')
const { Log } = require('./log')

/**
 *
 * @param {Object} option
 * @param {*} propName 判断的属性名
 * @param {*} fn 校验成功后执行的方法
 * @param {*} isNotOption 是否是配置对象
 */
function assertFunc(option, propName, fn, isNotOption) {
  if (option[propName] instanceof Function) {
    fn instanceof Function && fn()
  } else {
    Log.warn(`${isNotOption ? '' : '[OPTION]'}${propName} must be a method`)
  }
}

/**
 * generate send message
 * @param {String} origin ws send from
 * @param {Object} data send data
 */
function generateMessage(origin, data) {
  return JSON.stringify({
    origin,
    data,
  })
}

/**
 * watch file change, generate send message
 * @param {String} origin type
 * @param {String} path file path
 */
function generateWatchMessage(options, openURL, origin, filePath) {
  let { workspace } = options
  let stat = fs.lstatSync(filePath)
  let { ext } = path.parse(filePath)
  let isDir = stat.isDirectory()

  let tmpPath = path.relative(workspace, filePath).split(path.sep).join('/')

  return generateMessage(origin, {
    url: openURL + path.resolve('/', tmpPath),
    host: openURL,
    path: tmpPath,
    ext,
    isDir,
  })
}

/**
 * merge inject code to res stream
 * @param {Object} res
 * @param {Stream} stream
 * @param {String} injectCode
 * @param {String} customInjectCode
 */
function mergeInjectCodeToRes(
  res,
  reqPath,
  root,
  injectCode,
  customInjectCode,
) {
  let injectCodeResult = injectCode

  injectCodeResult = injectCodeResult.replace(
    CUSTOME_INJECT_CODE_MARK,
    customInjectCode + CUSTOME_INJECT_CODE_MARK
  )
  let filePath = reqPath
  if (filePath != '') {
    filePath = filePath.slice(1)
  }
  if (filePath === '' || filePath.substr(-1) === '/') {
    filePath += 'index.html'
  }
  filePath = path.resolve(root, filePath)
  if (!fs.existsSync(filePath)) {
    return
  }
  let htmlFile = fs.readFileSync(filePath)
  res.write(htmlFile + injectCodeResult)
  res.end()
}

function createNotFoundDirectoryListener() {
  return function notFound() {
    this.error(404)
  }
}

module.exports = {
  assertFunc,
  generateMessage,
  generateWatchMessage,
  mergeInjectCodeToRes,
  createNotFoundDirectoryListener,
}
