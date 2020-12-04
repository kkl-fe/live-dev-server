// 文件示例说明
if (msgData.indexOf('sign') < 0) return
let data = JSON.parse(msgData)
if (data.sign == 'reload') {
  window.location.reload()
}

if (data.sign == 'example') {
  console.log('---- -----')
}