var express = require('express');
var app = express();

var test = require('./routes/test');
var contract = require('./routes/contact');

app.use('/', test);
app.use('/contract', contract);

app.listen(3000);