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

module.exports = {
  colors,
  Log,
}