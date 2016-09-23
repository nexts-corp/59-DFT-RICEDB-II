var express = require('express');
var app = express();
var prefix = '/api';

var test = require('./routes/test');
//g2g
var g2g_contract = require('./routes/gtog/contract');
var g2g_confirm = require('./routes/gtog/confirm');
var g2g_shipment = require('./routes/gtog/shipment');
//common
var typeRice = require('./routes/common/typeRice');
var package = require('./routes/common/package');
var country = require('./routes/common/country');
var port = require('./routes/common/port');
var carrier = require('./routes/common/carrier');
var ship = require('./routes/common/ship');
var buyer = require('./routes/common/buyer');
var seller = require('./routes/common/seller');

app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
  return next();
});

app.use(test);
//path g2g
app.use(prefix + '/gtog/contract', g2g_contract);
app.use(prefix + '/gtog/confirm', g2g_confirm);
app.use(prefix + '/gtog/shipment', g2g_shipment);
//path common
app.use(prefix + '/common/typeRice', typeRice);
app.use(prefix + '/common/package', package);
app.use(prefix + '/common/country', country);
app.use(prefix + '/common/port', port);
app.use(prefix + '/common/ship', ship);
app.use(prefix + '/common/carrier', carrier);
app.use(prefix + '/common/buyer', buyer);
app.use(prefix + '/common/seller', seller);

app.listen(3000);