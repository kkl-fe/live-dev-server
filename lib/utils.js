const { CUSTOME_INJECT_CODE_MARK } = require('./config')

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
}
const Log = {
  error: function (...parm) {
    console.log(`${colors.red}[Error]`, ...parm, colors.reset)
  },
  log: function (...parm) {
    console.log(`[Log]`, ...parm)
  },
  warn: function (...parm) {
    console.log(`${colors.yellow}[Warning]`, ...parm, colors.reset)
  },
  info: function (...parm) {
    console.log(`${colors.green}[Info]`, ...parm, colors.reset)
  },
}

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
function generateWatchMessage(openURL, origin, filePath) {
  let { workspace } = options
  let { ext } = path.parse(filePath)

  let tmpPath = path.relative(workspace, filePath).split(path.sep).join('/')

  return generateMessage(origin, {
    url: openURL + path.resolve('/', tmpPath),
    host: openURL,
    path: tmpPath,
    ext,
  })
}

/**
 * merge inject code to res stream
 * @param {Object} res
 * @param {Stream} stream
 * @param {String} injectCode
 * @param {String} customInjectCode
 */
function mergeInjectCodeToRes(res, stream, injectCode, customInjectCode) {
  let injectCodeResult = injectCode
  // 判断是否是html, 决定是否注入
  let ctstr = res.getHeader('content-type')
  if (ctstr.indexOf('html') < 0) return

  // 注入的代码byte length
  let len = Buffer.byteLength(injectCode)
  let cisLen = Buffer.byteLength(customInjectCode)
  if (cisLen) {
    len += cisLen
    injectCodeResult = injectCodeResult.replace(
      CUSTOME_INJECT_CODE_MARK,
      customInjectCode + CUSTOME_INJECT_CODE_MARK
    )
  }

  // 计算最终的byte length
  len += res.getHeader('Content-Length')
  res.setHeader('Content-Length', len)

  stream.push(injectCodeResult)
}

function createNotFoundDirectoryListener() {
  return function notFound() {
    this.error(404)
  }
}

module.exports = {
  Log,
  assertFunc,
  generateMessage,
  generateWatchMessage,
  mergeInjectCodeToRes,
  createNotFoundDirectoryListener,
}
