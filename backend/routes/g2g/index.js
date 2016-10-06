var express = require('express');
var app = express();

var contract = require('./contract');
var confirmLetter = require('./confirmLetter');
var shipment = require('./shipment');

app.use('/contract', contract);
app.use('/confirm', confirmLetter);
app.use('/shipment', shipment);

module.exports = app;