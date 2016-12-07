var express = require('express');
var app = express();

var transaction = require('./transaction');
var quota = require('./quota');

app.use('/transaction', transaction);
app.use('/quota', quota);


module.exports = app;