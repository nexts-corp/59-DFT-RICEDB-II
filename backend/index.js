var express = require('express');
var public = express();
var app = express();

var test = require('./routes/test');
var gtog = require('./routes/gtog');
var common = require('./routes/common');


app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
  return next();
});

app.use(test);
app.use('/gtog',gtog);
app.use('/common',common);


public.use('/api',app);
public.listen(3000);