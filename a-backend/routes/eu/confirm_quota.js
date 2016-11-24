var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');


// router.get(['/year'], function (req, res, next) {
//     db.query(function (conn) {
//         var statement = r.db('eu').table('ex_export_quantity_eu').pluck('year').orderBy(r.desc('year'))('year').distinct();
//         statement.run(conn, function (err, cursor) {
//             if (!err) {
//                 res.json(cursor);
//             } else {
//                 res.json({ error: "error" });
//             }
//         });
//     });
// });

//รายการโควตาที่ยืนยันแล้ว
router.get(['/confirmed'], function (req, res, next) {
    var params = req.query;
    db.query(function (conn) {

        var statement = r.db('eu').table('confirm_quota').filter({
            quota_id: params.quota_id,
            type_rice_id: params.type_rice_id,
            ordinal_number: params.ordinal_number  
        });

        statement.run(conn, function (err, cursor) {
            if (!err) {
                res.json(cursor);
            } else {
                res.json({ error: "error" });
            }
        });
    });
});

//รายการโควตาที่ยังไม่ได้ยืนยัน
router.get(['/notconfirm'], function (req, res, next) {
    var params = req.query;
    db.query(function (conn) {

        var statement = r.db('eu').table('allocate_quota').filter({
            quota_id: params.quota_id,
            type_rice_id: params.type_rice_id,
            ordinal_number: params.ordinal_number
        }).without('spreadsheets').merge(function (row) {
            return {
                exporter: row('exporter').filter(function (row) {
                    return row.hasFields('confirm_quota_id').not()
                }).merge(function (exporter) {
                    return r.db('external_f3').table('exporter').filter({ id: exporter('exporter_id') })
                        .merge(function (exporter) { return { exporter_id: exporter('id') } })
                        .eqJoin('trader_id', r.db('external_f3').table('trader')).zip()
                        .eqJoin('seller_id', r.db('external_f3').table('seller')).zip()
                        .merge(function (seller) { return { id: seller('exporter_id') } }).pluck('id', 'seller_name_th', 'seller_tax_id')(0)
                        .without('id')

                })
            }
        }).coerceTo('array')(0);

        statement.run(conn, function (err, cursor) {
            if (!err) {
                res.json(cursor);
            } else {
                res.json({ error: "error" });
            }
        });
    });
});

//ยืนยันโค้วต้า
router.post(['/confirm'], function (req, res, next) {

    var params = req.body;
    db.query(function (conn) {
        statement = r.db('eu').table('confirm_quota').insert(params.data)('generated_keys')(0).do(function (generated_key) {

            return r.db('eu').table('allocate_quota').get(params.allocate_quota_id).update(function (row) {
                return {
                    exporter: row('exporter').filter(function (exporter) {
                        return exporter('exporter_id').ne(params.data.exporter_id)
                    })
                        .append(
                        row('exporter').filter({ exporter_id: params.data.exporter_id })(0).merge(function (row) {
                            return {
                                confirm_quota_id: generated_key
                            }
                        })
                        )
                }
            })

        });
        statement.run(conn, function (err, cursor) {
            if (!err) {
                res.json(cursor);
            } else {
                res.json({ error: "error" });
            }
        });
    });


});


module.exports = router;