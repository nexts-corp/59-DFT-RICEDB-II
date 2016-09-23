var express = require('express');
var app = express();

var test = require('./routes/test');
var g2g_contract = require('./routes/gtog/contract');

app.use(function(req, res, next) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
  return next();
});

app.use(test);
app.use('/gtog/contract', g2g_contract);

app.listen(3000);