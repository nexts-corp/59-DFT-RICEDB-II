var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');

var mqtt = require('mqtt')
var client  = mqtt.connect('mqtt://mqtt.codeunbug.com')

router.put(['/'], function (req, res, next) {
    var params = req.body;
    var statement;

    db.query(function (conn) {
        console.log(params);
        statement = r.db('eu2').table('transaction').insert(params);
        statement.run(conn, function (err, cursor) {
            if (!err) {
                client.publish(params.code+'-'+global.mqttId, JSON.stringify(params));
                res.json(cursor);
            } else {
                res.status(500).send(err);
                res.json(err);
            }
        });
    });
});

module.exports = router;