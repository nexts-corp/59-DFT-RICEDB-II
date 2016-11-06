var express = require('express');
var app = express();

var contract = require('./contract');
var confirmLetter = require('./confirmLetter');
var shipment = require('./shipment');
var shipmentDetail = require('./shipmentDetail');
var billLoad = require('./billLoad');
var invoice = require('./invoice');
var payment = require('./payment');

app.use('/contract', contract);
app.use('/confirm', confirmLetter);
app.use('/shipment', shipment);
app.use('/shipment/detail', shipmentDetail);
app.use('/bl', billLoad);
app.use('/invoice', invoice);
app.use('/payment', payment);

module.exports = app;