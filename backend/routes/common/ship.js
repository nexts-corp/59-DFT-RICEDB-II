var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');


router.get(['/', '/list'], function (req, res, next) {
    db.query(function (conn) {
        r.db('common').table("ship")
            .merge(function (row) {
                return { ship_id: row('id') }
            })
            .without('id')
            .eqJoin("shipline_id", r.db('common').table("shipline")).without({ right: "id" }).zip()
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
router.get('/id/:ship_id', function (req, res, next) {
    db.query(function (conn) {
        r.db('common').table("ship")
            .get(req.params.ship_id)
            .merge(
            { ship_id: r.row('id') },
            r.db('common').table("shipline").get(r.row("shipline_id"))
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

module.exports = router;
