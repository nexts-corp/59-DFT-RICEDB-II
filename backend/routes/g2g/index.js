var express = require('express');
var app = express();

var contract = require('./contract');
var confirmLetter = require('./confirmLetter');
var shipment = require('./shipment');
var shipmentDetail = require('./shipmentDetail');
var billLoad = require('./billLoad');

app.use('/contract', contract);
app.use('/confirm', confirmLetter);
app.use('/shipment', shipment);
app.use('/shipment/detail', shipmentDetail);
app.use('/bl', billLoad);

module.exports = app;