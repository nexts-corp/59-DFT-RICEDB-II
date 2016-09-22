var express = require('express');
var app = express();

var test = require('./routes/test');
var contact = require('./routes/contact');
var contract = require('./routes/contract');
app.use('/', test);
app.use('/contact', contact);
app.use('/contract', contract);

app.listen(3000);