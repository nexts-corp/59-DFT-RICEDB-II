var express = require('express');
var app = express();

var typeRice = require('./typeRice');
var package = require('./package');
var country = require('./country');
var carrier = require('./carrier');
var port = require('./port');
var shipline = require('./shipline');
var ship = require('./ship');
var buyer = require('./buyer');
var surveyor = require('./surveyor');
var incoterms = require('./incoterms');

app.use('/typeRice', typeRice);
app.use('/package', package);
app.use('/country', country);
app.use('/carrier', carrier);
app.use('/port', port);
app.use('/ship', ship);
app.use('/shipline', shipline);
app.use('/buyer', buyer);
app.use('/surveyor', surveyor);
app.use('/incoterms', incoterms);

module.exports = app;