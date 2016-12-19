var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');

var DataContext = require('../../class/DataContext.js');
var datacontext = new DataContext();

var Ajv = require('ajv');
var ajv = Ajv({ allErrors: true });
var schema = {
    "properties": {
        "id": {
            "type": "string"
        },
        "notify_name": {
            "type": "string"
        },
        "notify_address": {
            "type": "string"
        },
        "notify_tel": {
            "type": "string"
        },
        "notify_fax": {
            "type": "string"
        },
        "buyer_id": {
            "type": "string"
        },
        "deli_port_id": {
            "type": "string"
        }
    },
    "required": ["notify_name", "notify_address", "notify_tel", "notify_fax", "buyer_id", "deli_port_id"]
};
var validate = ajv.compile(schema);

router.get(['/', '/list'], function (req, res, next) {
    db.query(function (conn) {
        r.db('common').table("notify_party")
            .merge(function (row) {
                return {
                    notify_id: row('id'),
                    date_created: row('date_created').split('T')(0),
                    date_updated: row('date_updated').split('T')(0)
                }
            })
            .without('id')
            .eqJoin("port_id", r.db('common').table("port")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
            .eqJoin("country_id", r.db('common').table("country")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
            .eqJoin("buyer_id", r.db('common').table("buyer")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
            .orderBy('country_code3', 'notify_party_name')
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
                    res.json(err);
                }
            });
    })
});
router.get('/id/:notify_id', function (req, res, next) {
    db.query(function (conn) {
        r.db('common').table("notify_party")
            .get(req.params.notify_id)
            .merge(
                {
                    notify_id: r.row('id'),
                    date_created: r.row('date_created').split('T')(0),
                    date_updated: r.row('date_updated').split('T')(0)
                },
                r.db('common').table("port").get(r.row("port_id")).without('id', 'date_created', 'date_updated', 'creater', 'updater'),
                r.db('common').table("country").get(r.row("country_id")).without('id', 'date_created', 'date_updated', 'creater', 'updater'),
                r.db('common').table("buyer").get(r.row("buyer_id")).without('id', 'date_created', 'date_updated', 'creater', 'updater')
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
router.post('/insert', function (req, res, next) {
    var valid = validate(req.body);
    var result = { result: false, message: null, id: null };
    if (valid) {
        if (req.body.id == null) {
            datacontext.insert("common", "notify_party", req.body, res);
        } else {
            result.message = 'field "id" must do not have data';
            res.json(result);
        }
    } else {
        result.message = ajv.errorsText(validate.errors);
        res.json(result);
    }
});
router.put('/update', function (req, res, next) {
    //console.log(req.body);
    var valid = validate(req.body);
    var result = { result: false, message: null, id: null };
    if (valid) {
        datacontext.update("common", "notify_party", req.body, res);
    } else {
        result.message = ajv.errorsText(validate.errors);
        res.json(result);
    }
});
router.delete('/delete/id/:id', function (req, res, next) {
    datacontext.delete("common", "notify_party", req.params.id, res);
});
module.exports = router;
