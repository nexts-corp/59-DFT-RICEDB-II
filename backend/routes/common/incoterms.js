var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');

router.get(['/', '/list'], function (req, res, next) {
    db.query(function (conn) {
        r.table("incoterms")
            .merge(function (row) {
                return { inct_id: row('id') }
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
router.get('/:inct_id', function (req, res, next) {
    db.query(function (conn) {
        r.table("incoterms")
            .get(req.params.inct_id)
            .merge({
                inct_id: r.row('id')
            })
            .without('id')
            .run(conn, function (err, cursor) {
                if (!err) {
                    res.json(cursor);
                } else {
                    res.json(null);
                }
            });
    });
});
module.exports = router;
