var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');

var mqtt = require('mqtt')
var client  = mqtt.connect('mqtt://mqtt.codeunbug.com')

client.on('connect', function () {
    client.subscribe('eu-transaction-'+global.mqttId);
});

router.post(['/'], function (req, res, next) {
    var params = req.body;
    var statement;

    db.query(function (conn) {
        statement = r.db('eu').table('transaction_quota').insert(params);
        statement.run(conn, function (err, cursor) {
            if (!err) {
                res.json(cursor);
            } else {
                res.json({ error: "error" });
            }
        });
    });
    //res.json({ error: params });
});


// db.query(function (conn) {
//     r.db('eu').table('transaction_quota').changes()
//         .run(conn, function (err, cursor) {
//             if (!err) {
//                 cursor.each(function (err, ob) {
//                     //console.log('ob');
//                     if (ob.old_val == null && ob.new_val != null) {
//                         var new_val = ob.new_val;

//                         //** เริ่มคำสั่งหลังจากเพิ่ม Transaction
//                         statement = r.db('eu').table('balance_quota')
//                             .filter({ year: new_val.year, type_rice_id: new_val.type_rice_id }).coerceTo('array')
//                             .do(function (result) {

//                                 return r.branch(
//                                     result.count().eq(0)
//                                     ,
//                                     //** ถ้า balance_quota ไม่มีมาก่อน
//                                     r.db('eu').table('balance_quota')
//                                         .insert({ year: new_val.year, type_rice_id: new_val.type_rice_id })
//                                         ('generated_keys')(0)
//                                     ,
//                                     result(0)('id')
//                                 ).do(function (balance_quota_id) {
//                                     //** หลังจากตรวจสอบ balance_quota แล้ว

//                                     return r.branch(
//                                         //** ตรวจสอบสถานะของ transaction
//                                         r.expr(new_val.code).eq('push')
//                                         ,
//                                         //** หากสถานะเป็น push
//                                         r.db('eu').table('balance_exporter_quota').filter({
//                                             balance_quota_id: balance_quota_id,
//                                             exporter_id: new_val.exporter_id
//                                         }).coerceTo('array')
//                                             .do(function (q_balance_exporter_quota) {

//                                                 return r.branch(
//                                                     q_balance_exporter_quota.count().eq(0)
//                                                     ,
//                                                     //** ถ้า q_balance_exporter_quota ไม่เคยมีมาก่อน
//                                                     r.db('eu').table('balance_exporter_quota').insert({
//                                                         exporter_id: new_val.exporter_id,
//                                                         balance_quota_id: balance_quota_id,
//                                                         quantity_allocate: new_val.quantity,
//                                                         amount_allocate: r.expr(new_val.quantity).sum('quantity')
//                                                     })
//                                                     ,
//                                                     //** ถ้า q_balance_exporter_quota มีมาก่อนแล้ว
                                            
//                                                     r.db('eu').table('balance_exporter_quota').get(q_balance_exporter_quota(0)('id'))('quantity_allocate')
//                                                     .union(
//                                                         r.expr(new_val.quantity)
//                                                     ).group('peroid').ungroup().map(function (row) {
//                                                         return {
//                                                             peroid: row('group'),
//                                                             quantity: r.branch(
//                                                                 row('reduction').count().eq(2),
//                                                                 row('reduction')(0)('quantity').add(row('reduction')(1)('quantity'))
//                                                                 ,
//                                                                 row('reduction')(0)('quantity')
//                                                             )
//                                                         }
//                                                     }).do(function (result) {
//                                                         return r.db('eu').table('balance_exporter_quota').get(q_balance_exporter_quota(0)('id')).update({
//                                                             quantity_allocate: result
//                                                         })
//                                                     })
//                                                 )
//                                             })
//                                             .do(function () {
//                                                 return r.branch(
//                                                     r.db('eu').table('balance_quota').get(balance_quota_id).hasFields('quantity_allocate').not()
//                                                     ,
//                                                     r.db('eu').table('balance_quota').get(balance_quota_id)
//                                                         .update({ quantity_allocate: r.expr(new_val.quantity) })
//                                                     ,



//                                                     r.db('eu').table('balance_quota').get(balance_quota_id)('quantity_allocate').union(
//                                                         r.expr(new_val.quantity)
//                                                     ).group('peroid').ungroup().map(function (row) {
//                                                         return {
//                                                             peroid: row('group'),
//                                                             quantity: r.branch(
//                                                                 row('reduction').count().eq(2),
//                                                                 row('reduction')(0)('quantity').add(row('reduction')(1)('quantity'))
//                                                                 ,
//                                                                 row('reduction')(0)('quantity')
//                                                             )
//                                                         }
//                                                     })
//                                                     .do(function (result) {
//                                                         return r.db('eu').table('balance_quota').get(balance_quota_id).update({
//                                                             quantity_allocate: result
//                                                         })
//                                                     })

//                                                 )

//                                             })

//                                         ,
//                                         null
//                                     )

//                                 })
//                             });

//                         statement.run(conn, function (err, cursor) {
//                             if (!err) {
//                                 console.log('ok')
//                             } else {
//                                 console.log('err')
//                             }
//                         });



//                     }
//                 });

//             } else {
//                 res.json({ error: "error" });
//             }
//         });

// });


module.exports = router;