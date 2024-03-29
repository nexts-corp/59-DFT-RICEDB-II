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
        "buyer_address": {
            "type": "string"
        },
        "buyer_email": {
            "type": "string",
            "format": "email"
        },
        "buyer_fax": {
            "type": "string"
        },
        "buyer_name": {
            "type": "string"
        },
        "buyer_masks": {
            "type": "string"
        },
        "buyer_tel": {
            "type": "string"
        },
        "country_id": {
            "type": "string"
        }
    },
    "required": ["buyer_address", "buyer_email", "buyer_name", "buyer_masks", "buyer_tel", "buyer_fax", "country_id"]
};
var validate = ajv.compile(schema);

router.get(['/', '/list'], function (req, res, next) {
    db.query(function (conn) {
        r.db('common').table("buyer")
            .merge(function (row) {
                return {
                    buyer_id: row('id'),
                    date_created: row('date_created').split('T')(0),
                    date_updated: row('date_updated').split('T')(0)
                }
            })
            .without('id')
            .eqJoin("country_id", r.db('common').table("country")).without({ right: ["id", "date_created", "date_updated","creater","updater"] }).zip()
            .orderBy('country_code3', 'buyer_name')
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
router.get('/id/:buyer_id', function (req, res, next) {
    db.query(function (conn) {
        r.db('common').table("buyer")
            .get(req.params.buyer_id)
            .merge(
            {
                buyer_id: r.row('id'),
                date_created: r.row('date_created').split('T')(0),
                date_updated: r.row('date_updated').split('T')(0)
            },
            r.db('common').table("country").get(r.row("country_id")).without('id', 'date_created', 'date_updated', 'creater', 'updater')
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
            datacontext.insert("common", "buyer", req.body, res);
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
        datacontext.update("common", "buyer", req.body, res);
    } else {
        result.message = ajv.errorsText(validate.errors);
        res.json(result);
    }
});
router.delete('/delete/id/:id', function (req, res, next) {
    datacontext.delete("common", "buyer", req.params.id, res);
});
module.exports = router;
