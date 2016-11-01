var express = require('express');
var app = express();

var quota = require('./quota');
var type_rice = require('./type_rice');
var test = require('./test');
app.use('/quota', quota);
app.use('/type_rice', type_rice);
app.use('/test', test);
module.exports = app;