var express = require('express');
var app = express();

var typeLicense = require('./typeLicense');
var seller = require('./seller')
var trader = require('./trader');
var exporter = require('./exporter');

app.use('/typeLicense', typeLicense);
app.use('/seller', seller);
app.use('/trader', trader);
app.use('/exporter', exporter);
module.exports = app;