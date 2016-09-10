var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../db.js');


router.get('/test', function(req, res, next) {

  db.query(function(conn){
      r.table('contract').run(conn, function(err,cursor){
          if(!err){
              cursor.toArray(function(err,result){
                  if(!err){
                      //console.log(JSON.stringify(result, null, 2));
                      res.json(result);
                  }
              });
          }
      });
  })

  
});

module.exports = router;
