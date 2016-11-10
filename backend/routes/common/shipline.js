var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');


router.get(['/', '/list'], function (req, res, next) {
    db.query(function (conn) {
        r.db('common').table("shipline")
            .merge(function (row) {
                return { shipline_id: row('id') }
            })
            .without('id')
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
router.get('/id/:shipline_id', function (req, res, next) {
    db.query(function (conn) {
        r.db('common').table("shipline")
            .get(req.params.shipline_id)
            .merge(
            { shipline_id: r.row('id') }
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
router.get('/ship', function (req, res, next) {
    db.query(function (conn) {
        r.db('common').table("shipline")
            .merge(function (row) {
                return { shipline_id: row('id') }
            })
            .map(function (m) {
                return m.merge(function (me) {
                    return {
                        ship: r.db('common').table('ship')
                            .filter({ shipline_id: me('shipline_id') })
                            .merge(function (p) {
                                return {
                                    ship_id: p('id')
                                }
                            })
                            .without('id')
                            .coerceTo('array')
                    }
                })
            })
            .without('id')
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
