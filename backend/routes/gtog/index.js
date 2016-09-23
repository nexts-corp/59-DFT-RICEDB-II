var express = require('express');
var app = express();

var contract = require('./contract');
var confirm = require('./confirm');
var shipment = require('./shipment');

app.use('/contract', contract);
app.use('/confirm', confirm);
app.use('/shipment', shipment);

module.exports = app;