var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');

var dd = new Date();
var y = dd.getFullYear();
var m = dd.getMonth();
var d = dd.getDate();
var d1y = (y - 1) + '-' + (m < 9 ? '0' : '') + (m + 1) + '-' + (d < 10 ? '0' : '') + d + "T00:00:00.000Z";

router.get(['/', '/list'], function (req, res, next) {
    db.query(function (conn) {
        r.db('external_f3').table("exporter")
            .merge(function (row) {
                return { 
                    exporter_id: row('id'),
                    exporter_active:r.ISO8601(d1y).toEpochTime().lt(r.ISO8601(row('exporter_date_update')).toEpochTime()),
                    exporter_date_approve:row('exporter_date_approve').split('T')(0),
                    exporter_date_create:row('exporter_date_create').split('T')(0),
                    exporter_date_update:row('exporter_date_update').split('T')(0) 
                }
            })
            .without('id')
            .eqJoin("trader_id", r.db('external_f3').table("trader"))
            .without({ right: "id" }).zip()
            .merge(function(r){
                return {
                    trader_date_approve:r('trader_date_approve').split('T')(0),
                    trader_date_expire:r('trader_date_expire').split('T')(0)
                }
            })
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
router.get('/active', function (req, res, next) {
    db.query(function (conn) {
        r.db('external_f3').table("exporter")
            .filter(function(row){
                return r.ISO8601(row('exporter_date_update')).toEpochTime().gt(r.ISO8601(d1y).toEpochTime())
            })
            .merge(function (row) {
                return { 
                    exporter_id: row('id'),
                    exporter_active:r.ISO8601(d1y).toEpochTime().lt(r.ISO8601(row('exporter_date_update')).toEpochTime()),
                    exporter_date_approve:row('exporter_date_approve').split('T')(0),
                    exporter_date_create:row('exporter_date_create').split('T')(0),
                    exporter_date_update:row('exporter_date_update').split('T')(0) 
                }
            })
            .without('id')
            .eqJoin("trader_id", r.db('external_f3').table("trader"))
            .without({ right: "id" }).zip()
            .merge(function(r){
                return {
                    trader_date_approve:r('trader_date_approve').split('T')(0),
                    trader_date_expire:r('trader_date_expire').split('T')(0)
                }
            })
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
router.get('/unactive', function (req, res, next) {
    db.query(function (conn) {
        r.db('external_f3').table("exporter")
            .filter(function(row){
                return r.ISO8601(row('exporter_date_update')).toEpochTime().lt(r.ISO8601(d1y).toEpochTime())
            })
            .merge(function (row) {
                return { 
                    exporter_id: row('id'),
                    exporter_active:r.ISO8601(d1y).toEpochTime().lt(r.ISO8601(row('exporter_date_update')).toEpochTime()),
                    exporter_date_approve:row('exporter_date_approve').split('T')(0),
                    exporter_date_create:row('exporter_date_create').split('T')(0),
                    exporter_date_update:row('exporter_date_update').split('T')(0) 
                }
            })
            .without('id')
            .eqJoin("trader_id", r.db('external_f3').table("trader"))
            .without({ right: "id" }).zip()
            .merge(function(r){
                return {
                    trader_date_approve:r('trader_date_approve').split('T')(0),
                    trader_date_expire:r('trader_date_expire').split('T')(0)
                }
            })
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
            .merge({ 
                exporter_id: r.row('id'),
                exporter_active:r.ISO8601(d1y).toEpochTime().lt(r.ISO8601(r.row('exporter_date_update')).toEpochTime()),
                exporter_date_approve:r.row('exporter_date_approve').split('T')(0),
                exporter_date_create:r.row('exporter_date_create').split('T')(0),
                exporter_date_update:r.row('exporter_date_update').split('T')(0)  
            },
            r.db('external_f3').table("trader").get(r.row("trader_id"))
            .merge(function(r){
                return {
                    trader_date_approve:r('trader_date_approve').split('T')(0),
                    trader_date_expire:r('trader_date_expire').split('T')(0)
                }
            }),
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
router.get('/seller/name/:seller_name', function (req, res, next) {
    // res.json(req.params.seller_name);
    db.query(function (conn) {
        r.db('external_f3').table("exporter")
            .eqJoin("trader_id", r.db('external_f3').table("trader")).without({ right: "id" }).zip()
            .merge(function(r){
                return {
                    trader_date_approve:r('trader_date_approve').split('T')(0),
                    trader_date_expire:r('trader_date_expire').split('T')(0)
                }
            })
            .eqJoin("seller_id", r.db('external_f3').table("seller")).without({ right: "id" }).zip()
            .filter(
                r.row('seller_name_th').match(req.params.seller_name)
            )
            .without(
                "id","country_id","exporter_date_approve","exporter_date_create","exporter_date_update",
                "exporter_no","seller_address_en","seller_agent","seller_phone","trader_date_approve",
                "trader_date_expire","trader_distric","trader_office","trader_province","type_lic_id"
            )
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



module.exports = router;



