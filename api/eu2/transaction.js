var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');

const _ = require('lodash');

router.put(['/'], function (req, res, next) {
    var params = req.body;
    var statement;

    db.query(function (conn) {
        statement = r.db('eu2').table('transaction').insert(_.omit(params,['code']));
        statement.run(conn, function (err, cursor) {
            if (!err) {
                res.json(cursor);
            } else {
                res.status(500).send(err);
                res.json(err);
            }
        });
    });
});

module.exports = router;