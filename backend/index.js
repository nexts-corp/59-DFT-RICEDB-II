var express = require('express');
var public = express();
var bodyParser = require('body-parser');
var app = express();

var test = require('./routes/test');
var g2g = require('./routes/g2g');
var common = require('./routes/common');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))

// parse application/json
app.use(bodyParser.json())

app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.contentType('application/json');
  return next();
});
app.use(test);
app.use('/g2g', g2g);
app.use('/common', common);



public.use('/api', app);
public.listen(3000);