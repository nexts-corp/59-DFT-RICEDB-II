var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../db.js');


router.get('/list', function(req, res, next) {

  db.query(function(conn){

    r.table('contract').merge(function(row){
        return {rice:row('rice').map(function(rice){
            return rice.merge(function(rice2){
            return r.table('rice').get(rice2('rice_id')).without('id')
            });
        })}
    }).run(conn, function(err,cursor){
           if(!err){
               cursor.toArray(function(err,result){
                   if(!err){
                       console.log(JSON.stringify(result, null, 2));
                       res.json(result);
                   }
               });
           }
    });
    

  })

  
});

module.exports = router;
