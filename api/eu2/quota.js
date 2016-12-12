var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');

var mqtt = require('mqtt');
var client  = mqtt.connect('mqtt://mqtt.codeunbug.com');

const _ = require('lodash');

client.on('connect', function () {
  client.subscribe('eu-quotaPut-'+global.mqttId);
  client.subscribe('eu/quota/req');

  setTimeout(function(){
    client.publish('eu/quota','data form server');
  },3000);
})

client.on('message', function (topic, message, data) {
  
  if(topic=="eu-quotaPut-"+global.mqttId){
    
    db.query(function (conn) {
      var data = JSON.parse(message.toString());

      var statement = r.db('eu2').table('quota').filter({
        type_rice_id:data.type_rice_id,
        id:data.year
      }).coerceTo('array').do(function(result){
        return r.branch(
          result.count().eq(0),
          r.db('eu2').table('quota').insert(r.expr(data).merge(function(row){
            return {id:row('year')}
          }).without('year')),
          r.db('eu2').table('quota').get(result(0)('id')).update(r.expr(data).without('year','id'))
        )
      })

      ;

      statement.run(conn, function (err, cursor) {
          if (!err) {
            console.log(cursor);
            client.publish('eu-quota-updated',JSON.stringify(cursor));
            // setInterval(function(){
            //   client.publish('eu-quota-updated',JSON.stringify(cursor));
            // },1000);
            
          } else {
            console.log(err);
          }
      });
    });
  }else if(topic='eu/quota/req'){
    console.log(data);
  }
  //client.publish('testzz','123456');
  //setInterval(()=>{ client.publish('testzz','testzz'); }, 1000);
  //client.end();
  
})

module.exports = router;

