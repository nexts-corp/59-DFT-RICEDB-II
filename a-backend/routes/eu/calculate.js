var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');

var Ajv = require('ajv');
var ajv = Ajv({ allErrors: true, coerceTypes: 'array' });



router.get(['/year'], function (req, res, next) {
    db.query(function (conn) {
        var statement = r.db('eu').table('ex_export_quantity_eu').pluck('year').orderBy(r.desc('year'))('year').distinct();
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

