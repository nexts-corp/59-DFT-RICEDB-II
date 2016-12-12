var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');

var mqtt = require('mqtt');
var client  = mqtt.connect('mqtt://mqtt.codeunbug.com');

const _ = require('lodash');

client.on('connect', function () {
  client.subscribe('eu/quota/year');
  client.subscribe('eu/quota/create');

})

client.on('message', function (topic, message, data) {
  var ctrl = JSON.parse(message.toString());

  if(topic=="eu/quota/create" && ctrl.method=="req"){

      db.query(function (conn) {
        var data = _.omit(ctrl.payload,['code']);

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

              
            } else {
              console.log(err);
            }
        });
    });

  }else if(
     (topic=="eu/quota/year" && ctrl.method=="req") && 
     (typeof ctrl.clientId=="undefined" || ctrl.clientId==global.mqttId) 
  ){
    console.log(ctrl);
  }
  

  // if( 
  //   (topic=="eu/quota/create" && ctrl.method=="req") && 
  //   (typeof ctrl.clientId=="undefined" || ctrl.clientId==global.mqttId) 
  // ){

  //   client.publish('eu/quota',JSON.stringify({
  //     method:'res'
  //   }));
    
  

  // }else if(topic='eu/quota'){

  //   var data = JSON.parse(message.toString());
  //   if(data.method=='req'){

  //     client.publish('eu/quota',{
  //       method:'res',
  //       clientId:data.clientId,
  //       payload:'Data Broadcast'
  //     });

  //   }

  // }
  
})

module.exports = router;

