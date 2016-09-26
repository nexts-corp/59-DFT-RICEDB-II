var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');


router.get(['/', '/list'], function (req, res, next) {
    db.query(function (conn) {
        r.table("port")
            .merge(function (row) {
                return { port_id: row('id') }
            })
            .without('id')
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
router.get('/:port_id', function (req, res, next) {
    db.query(function (conn) {
        r.table("port")
            .get(req.params.port_id.toUpperCase())
            .merge(
            { port_id: r.row('id') },
            r.table("country").get(r.row("country_id"))
            )
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
        r.table("port")
            .filter({ [req.params.field_name + "_id"]: req.params.value_id })
            .merge(
            {
                port_id: r.row('id')
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
