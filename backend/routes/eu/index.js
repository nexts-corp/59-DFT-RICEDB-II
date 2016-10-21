var express = require('express');
var app = express();

var quota = require('./quota');
app.use('/quota', quota);

module.exports = app;