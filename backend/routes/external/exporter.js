var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');


router.get(['/', '/list'], function (req, res, next) {
    var dd = new Date();
    var y = dd.getFullYear();
    var m = dd.getMonth();
    var d = dd.getDate();
    var d1y = (y - 1) + '-' + (m < 9 ? '0' : '') + (m + 1) + '-' + (d < 10 ? '0' : '') + d + "T00:00:00.000Z";
    db.query(function (conn) {
        r.db('external_f3').table("exporter")
            .merge(function (row) {
                return {
                    exporter_id: row('id'),
                   // exporter_status: r.ISO8601(d1y).toEpochTime(),
                    exporter_status: row('exporter_date_update').date().toEpochTime().lt(r.ISO8601(d1y).toEpochTime()),
                   // exporter_status3: r.now().sub(row('exporter_date_update').date())
                    // r.now().sub(row('exporter_date_update').date()).lt(60 * 60 * 24)
                    //r.now().sub(row('exporter_date_update')).lt(60 * 60 * 24 * 1000) //2016-10-06T10:18:46.335Z
                }
            })
            .without('id')
            .eqJoin("trader_id", r.db('external_f3').table("trader")).without({ right: "id" }).zip()
            .eqJoin("seller_id", r.db('external_f3').table("seller")).without({ right: "id" }).zip()
            .eqJoin("type_lic_id", r.db('external_f3').table("type_license")).without({ right: "id" }).zip()
            .eqJoin("country_id", r.table("country")).without({ right: "id" }).zip()
            .run(conn, function (err, cursor) {
                if (!err) {
                    cursor.toArray(function (err, result) {
                        if (!err) {
                            //console.log(JSON.stringify(result, null, 2));
                            res.json(result);
                        } else {
                            res.json(null);
                        }
                    });
                } else {
                    res.json(null);
                }
            });
    })
});
router.get('/:exporter_id', function (req, res, next) {
    db.query(function (conn) {
        r.db('external_f3').table("exporter")
            .get(req.params.exporter_id)
            .merge(
            { exporter_id: r.row('id') },
            r.db('external_f3').table("seller").get(r.row("seller_id")),
            r.db('external_f3').table("type_license").get(r.row("type_lic_id")),
            r.table("country").get(r.row("country_id"))
            )
            //  .merge(r.table("country").get(r.row("country_id")))
            .without('id')
            .run(conn, function (err, cursor) {
                console.log(err);
                if (!err) {
                    res.json(cursor);
                } else {
                    res.json(null);
                }
            });
    })
});

router.get('/:field_name/:value_id', function (req, res, next) {
    db.query(function (conn) {
        r.db('external_f3').table("exporter")
            .filter({ [req.params.field_name + "_id"]: req.params.value_id })
            .merge(
            {
                exporter_id: r.row('id')
            }
            , r.table(req.params.field_name).get(req.params.value_id)
            )
            .without('id')
            .run(conn, function (err, cursor) {
                if (!err) {
                    cursor.toArray(function (err, result) {
                        if (!err) {
                            console.log(JSON.stringify(result, null, 2));
                            res.json(result);
                        } else {
                            res.json(null);
                        }
                    });
                } else {
                    res.json(null);
                }
            });
    })
});


module.exports = router;



