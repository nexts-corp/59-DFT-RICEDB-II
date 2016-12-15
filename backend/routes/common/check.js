var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');

router.get('/duplicate', function (req, res, next) {
    var q = {};
    var tb = req.query['table'];
    q[req.query['field']] = req.query['value'];
    db.query(function (conn) {
        r.db('common').table(tb)
            .filter(q)
            .count()
            .run(conn, function (err, cursor) {
                if (!err) {
                    res.json(cursor)
                } else {
                    res.json(null);
                }
            });
    })
});

module.exports = router;
