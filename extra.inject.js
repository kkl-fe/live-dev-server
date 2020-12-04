// example inject code
if (msgData.indexOf('sign') < 0) return;
let data = JSON.parse(msgData);
if (data.sign == 'reload') {
  window.location.reload();
}
