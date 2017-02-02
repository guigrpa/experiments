var _t = require('mady');
var locales = require('../locales/es');

_t.setLocales(locales);

console.log(_t('hello_there'));
console.log(_t("hello_there's something wrong"));
