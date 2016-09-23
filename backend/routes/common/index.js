var express = require('express');
var app = express();

var typeRice = require('./typeRice');
var package = require('./package');
var country = require('./country');
var port = require('./port');
var carrier = require('./carrier');
var ship = require('./ship');
var buyer = require('./buyer');
var seller = require('./seller');

app.use('/typeRice', typeRice);
app.use('/package', package);
app.use('/country', country);
app.use('/port', port);
app.use('/ship', ship);
app.use('/carrier', carrier);
app.use('/buyer', buyer);
app.use('/seller', seller);

module.exports = app;