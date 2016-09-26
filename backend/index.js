var express = require('express');
var public = express();
var bodyParser = require('body-parser');
var app = express();

var test = require('./routes/test');
var gtog = require('./routes/gtog');
var common = require('./routes/common');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.contentType('application/json');
  return next();
});

app.use(test);
app.use('/gtog', gtog);
app.use('/common', common);


public.use('/api', app);
public.listen(3000);