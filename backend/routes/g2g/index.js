var express = require('express');
var app = express();

var contract = require('./contract');
var confirmLetter = require('./confirmLetter');
var shipment = require('./shipment');
var shipmentDetail = require('./shipmentDetail');
var billLoad = require('./billLoad');
var book = require('./book');
var invoice = require('./invoice');
var fee = require('./fee');
var feeDetail = require('./feeDetail');
var cheque = require('./cheque');
var payment = require('./payment');

app.use('/contract', contract);
app.use('/confirm', confirmLetter);
app.use('/shipment', shipment);
app.use('/shipment/detail', shipmentDetail);
app.use('/bl', billLoad);
app.use('/book', book);
app.use('/invoice', invoice);
app.use('/fee', fee);
app.use('/fee/detail', feeDetail);
app.use('/cheque', cheque);
app.use('/payment', payment);

module.exports = app;