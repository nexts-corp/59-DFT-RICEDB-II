var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');


router.get(['/', '/list'], function (req, res, next) {
    db.query(function (conn) {
        r.db('external_f3').table("trader")
            .merge(function (row) {
                return {
                    trader_id: row('id'),
                    trader_date_approve: row('trader_date_approve').split('T')(0),
                    trader_date_expire: row('trader_date_expire').split('T')(0)
                }
            })
            .without('id')
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
router.get('/id/:trader_id', function (req, res, next) {
    db.query(function (conn) {
        r.db('external_f3').table("trader")
            .get(req.params.trader_id)
            .merge({
                trader_id: r.row('id'),
                trader_date_approve: r.row('trader_date_approve').split('T')(0),
                trader_date_expire: r.row('trader_date_expire').split('T')(0)
            },
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
        r.db('external_f3').table("trader")
            .filter({ [req.params.field_name + "_id"]: req.params.value_id })
            .merge(
            {
                trader_id: r.row('id')
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



