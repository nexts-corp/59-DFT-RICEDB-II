var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');

var mqtt = require('mqtt');
var client  = mqtt.connect('mqtt://mqtt.codeunbug.com');

const _ = require('lodash');

router.post(['/'], function (req, res, next) {
    var params = req.body;
    var statement;

    console.log(params);

    db.query(function (conn) {
        statement = r.db('eu2').table('transaction').insert(_.omit(params,['code']));
        statement.run(conn, function (err, cursor) {
            if (!err) {
                //client.publish(params.code+'-'+global.mqttId, JSON.stringify(_.omit(params,['code'])));
                res.json(params);
            } else {
                res.status(500).send(err);
                res.json(err);
            }
        });
    });
});

module.exports = router;