var express = require('express');
var router = express.Router();

var fs = require('fs');
var path = require('path');
var multiparty = require('multiparty');
var stream = require('stream');


var r = require('rethinkdb');
var db = require('../../db.js');

router.get(['/download/:key'], function (req, res, next) {

    db.query(function (conn) {
        r.db('files').table('files').get(req.params.key)
            .run(conn, function (err, cursor) {
                if (!err) {
                    res.writeHead(200, {
                        'Content-Type': cursor.type,
                        'Content-Length': cursor.contents.length,
                        //'Content-Disposition':'filename='+cursor.name
                        'Content-Disposition': 'attachment; filename=' + cursor.name
                    });
                    //cursor.contents.pipe(res);
                    //res.end(cursor.contents);
                    // var buffer = new Buffer( cursor.contents );
                    var bufferStream = new stream.PassThrough();
                    bufferStream.end(cursor.contents);
                    bufferStream.pipe(res);


                } else {
                    res.json({ error: "error" });
                }
            });

    });

});

db.query(function (conn) {
    r.db('eu').table('transaction_quota').changes()
        .run(conn, function (err, cursor) {
            if (!err) {
                cursor.each(function (err, ob) {
                    //console.log(ob);
                    if (ob.old_val == null && ob.new_val != null) {
                        var new_val = ob.new_val;



                        statement = r.db('eu').table('balance_quota')
                            .filter({ year: new_val.year, type_rice_id: new_val.type_rice_id }).coerceTo('array')
                            .do(function (result) {
                                return r.branch(result.count().eq(0)
                                    ,
                                    r.db('eu').table('balance_quota')
                                        .insert({ year: new_val.year, type_rice_id: new_val.type_rice_id, quantity: [0, 0, 0] })
                                        ('generated_keys')(0)
                                    ,
                                    result(0)('id')
                                ).do(function (balance_quota_id) {

                                    return r.branch(
                                        r.expr(new_val.code).eq('push')
                                        ,
                                        r.db('eu').table('balance_exporter_quota').filter({
                                            balance_quota_id: balance_quota_id,
                                            exporter_id: new_val.exporter_id
                                        })
                                            .coerceTo('array').do(function (q_balance_exporter_quota) {

                                                return r.branch(
                                                    q_balance_exporter_quota.count().eq(0)
                                                    ,
                                                    r.db('eu').table('balance_exporter_quota').insert({
                                                        exporter_id: new_val.exporter_id,
                                                        balance_quota_id: balance_quota_id,
                                                        quantity: new_val.quantity,
                                                        amount: r.expr(new_val.quantity).sum('quantity')
                                                    })
                                                    ,

                                                    r.db('eu').table('balance_exporter_quota').get(q_balance_exporter_quota(0)('id')).replace(function (row_replace) {

                                                        return row_replace.merge(function (row) {
                                                            return {
                                                                quantity: row('quantity')
                                                                    .merge(function (row_quantity) {
                                                                        return {
                                                                            quantity: row_quantity('quantity').add(

                                                                                r.expr(new_val.quantity).filter({ peroid: row_quantity('peroid') })
                                                                                    .do(function (result) {
                                                                                        return r.branch(result.count().eq(0), 0, result(0)('quantity'))
                                                                                    })

                                                                            )
                                                                        }
                                                                    })
                                                            }
                                                        })
                                                            .merge(function (row) {
                                                                return { amount: row('quantity').sum('quantity') }
                                                            })


                                                    })


                                                )
                                            })
                                        ,
                                        null
                                    )

                                })
                            });

                        statement.run(conn, function (err, cursor) {
                            if (!err) {
                                console.log('ok')
                            } else {
                                console.log('err')
                            }
                        });



                    }
                });

            } else {
                res.json({ error: "error" });
            }
        });

});


module.exports = router;