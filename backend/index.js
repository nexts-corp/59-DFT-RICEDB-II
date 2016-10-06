var express = require('express');
var public = express();
var bodyParser = require('body-parser');
var app = express();

var test = require('./routes/test');
var g2g = require('./routes/g2g');
var common = require('./routes/common');
var ext_f3 = require('./routes/external');
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))

// parse application/json
app.use(bodyParser.json())

app.use(function (req, res, next) {
  // Website you wish to allow to connect 
  // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
  // res.setHeader('Access-Control-Allow-Headers', 'content-Type,x-requested-with');
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS,PUT,DELETE");
  return next();
});
app.use(test);
app.use('/g2g', g2g);
app.use('/common', common);
app.use('/external', ext_f3);


public.use('/api', app);
public.listen(3000);