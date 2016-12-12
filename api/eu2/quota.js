var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');

var mqtt = require('mqtt');
var client  = mqtt.connect('mqtt://mqtt.codeunbug.com');

const _ = require('lodash');




// db.query(function (conn) {
//       var data = JSON.parse(message.toString());

//       var statement = r.db('eu2').table('quota').filter({
//         type_rice_id:data.type_rice_id,
//         id:data.year
//       }).coerceTo('array').do(function(result){
//         return r.branch(
//           result.count().eq(0),
//           r.db('eu2').table('quota').insert(r.expr(data).merge(function(row){
//             return {id:row('year')}
//           }).without('year')),
//           r.db('eu2').table('quota').get(result(0)('id')).update(r.expr(data).without('year','id'))
//         )
//       })

//       ;

//       statement.run(conn, function (err, cursor) {
//           if (!err) {
//             console.log(cursor);
//             client.publish('eu-quota-updated',JSON.stringify(cursor));        
//           } else {
//             console.log(err);
//           }
//       });
// });

module.exports = router;

