var express = require('express');
var app = express();

var contract = require('./contract');
var confirmLetter = require('./confirmLetter');
var shipment = require('./shipment');
var shipmentDetail = require('./shipmentDetail');
app.use('/contract', contract);
app.use('/confirm', confirmLetter);
app.use('/shipment', shipment);
app.use('/shipment/detail', shipmentDetail);

module.exports = app;