var express = require('express');
var app = express();

var quota = require('./quota');
var type_rice = require('./type_rice');
var calculate = require('./calculate');
var allocate = require('./allocate');
var confirm_quota = require('./confirm_quota');

var test = require('./test');


app.use('/quota', quota);
app.use('/calculate', calculate);
app.use('/allocate', allocate);

app.use('/type_rice', type_rice);
app.use('/test', test);

app.use('/confirm_quota', confirm_quota);

module.exports = app;