var express = require('express');
var app = express();

var test = require('./routes/test');
var g2g_contract = require('./routes/gtog/contract');
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
app.use('/gtog/contract', g2g_contract);
app.use('/typeRice', typeRice);
app.use('/package', package);
app.use('/country', country);
app.use('/port', port);
app.use('/ship', ship);
app.use('/carrier', carrier);

app.listen(3000);