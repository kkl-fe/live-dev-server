const httpProxy = require('http-proxy')
const parseUrl = require('parseurl')

/**
 * create proxy
 * @param {Object} proxy
 * @param {Arguments} rest req,res,next
 */
module.exports = (proxy, ...rest) => {
  let proxyServer = null
  let [req, res, next] = rest

  let originalUrl = parseUrl.original(req)
  let reqPath = parseUrl(req).pathname

  for (const p in proxy) {
    if (reqPath.slice(0, p.length) == p) {
      proxyServer = httpProxy.createProxyServer({})

      let proxyItemOpts = JSON.parse(JSON.stringify(proxy[p]))
      let { target, pathRewrite } = proxyItemOpts

      // 处理pathRewrite
      let resultReqPath = reqPath
      for (let pr in pathRewrite) {
        resultReqPath = resultReqPath.replace(new RegExp(pr), pathRewrite[pr])
      }
      delete proxyItemOpts.pathRewrite

      req.url = resultReqPath + originalUrl.search
      target && proxyServer.web(req, res, proxyItemOpts)
      return true
    }
  }
}