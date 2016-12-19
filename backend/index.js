var express = require('express');
var public = express();
var bodyParser = require('body-parser');
var app = express();


const cluster = require('cluster');

if (cluster.isMaster) {

  cluster.fork();

  cluster.on('exit', (worker, code, signal) => {
    console.log(`[worker] ${worker.process.pid} died (T_T)`);
    cluster.fork();
  });

  cluster.on('listening',(worker) => {
    console.log(`[worker] ${worker.process.pid} start (^.^)`);
  });

} else {


  var test = require('./routes/test');
  var g2g = require('./routes/g2g');
  var common = require('./routes/common');
  var ext_f3 = require('./routes/external');
  var eu = require('./routes/eu');

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
  app.use('/eu', eu);

  app.use(function (req, res, next) {
    res.status(404).send('Sorry cant find API that!')
  })

  public.use('/api', app);

  // var publicStatic = function(){
  //   console.log(global.public);
  //   if(typeof global.public == "undefined"){
  //     return "public";
  //   }else{
  //     return global.public;
  //   }
  // }
  var publicStatic = "public";
  public.use(express.static(publicStatic));

  public.use(function (req, res, next) {
    res.sendfile("./"+publicStatic+"/index.html");
  });
  
  public.listen(3000);

}
