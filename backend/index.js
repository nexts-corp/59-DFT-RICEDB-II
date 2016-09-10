var express = require('express');
var app = express();

var test = require('./routes/test');

app.use('/', test);

app.listen(3000);