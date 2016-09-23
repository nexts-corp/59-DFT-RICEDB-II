var express = require('express');
var app = express();
var prefix = '/api';

var test = require('./routes/test');
//g2g
var g2g_contract = require('./routes/gtog/contract');
var g2g_confirm = require('./routes/gtog/confirm');

//common
var typeRice = require('./routes/typeRice');
var package = require('./routes/package');
var country = require('./routes/country');
var port = require('./routes/port');
var carrier = require('./routes/carrier');
var ship = require('./routes/ship');

app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
  return next();
});

app.use(test);
//path g2g
app.use(prefix+'/gtog/contract', g2g_contract);
app.use(prefix+'/gtog/confirm', g2g_confirm);
//path common
app.use(prefix+'/common/typeRice', typeRice);
app.use(prefix+'/common/package', package);
app.use(prefix+'/common/country', country);
app.use(prefix+'/common/port', port);
app.use(prefix+'/common/ship', ship);
app.use(prefix+'/common/carrier', carrier);

app.listen(3000);