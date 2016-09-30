var express = require('express');
var app = express();

var contract = require('./contract');
var confirm = require('./confirm');
var shipment = require('./shipment');
var shipmentDetail = require('./shipmentDetail');
app.use('/contract', contract);
app.use('/confirm', confirm);
app.use('/shipment', shipment);
app.use('/shipment/detail', shipmentDetail);

module.exports = app;