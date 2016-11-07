var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');


router.get(['/'], function (req, res, next) {
    db.query(function (conn) {
        var statement = r.db('eu').table('type_rice').coerceTo('array');
        statement.run(conn, function (err, cursor) {
            if (!err) {
                res.json(cursor);
            } else {
                res.json({error:"error"});
            }
        });
    });
});

module.exports = router;

