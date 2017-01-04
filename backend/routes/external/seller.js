var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');

var DataContext = require('../../class/DataContext.js');
var datacontext = new DataContext();

var Ajv = require('ajv');
var ajv = Ajv({ allErrors: true });
var schema = {
    //'type': 'object',
    "properties": {
        "id": {
            "type": "string"
        },
        "country_id": {
            "type": "string"
        },
        "seller_address_en": {
            "type": "string"
        },
        "seller_address_th": {
            "type": "string"
        },
        "seller_agent": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "agent_name": { "type": "string" },
                },
                "required": ["agent_name"]
            }
        },
        "seller_email": {
            "type": "string"
        },
        "seller_fax": {
            "type": "string"
        },
        "seller_name_en": {
            "type": "string"
        },
        "seller_name_th": {
            "type": "string"
        },
        "seller_phone": {
            "type": "string"
        },
        "seller_tax_id": {
            "type": "string"
        }
    },
    "required": ["country_id", "seller_address_en", "seller_address_th", "seller_agent", "seller_email", "seller_fax", "seller_name_en", "seller_name_th", "seller_phone", "seller_tax_id"]
};
var validate = ajv.compile(schema);

router.get(['/', '/list'], function (req, res, next) {
    db.query(function (conn) {
        r.db('external_f3').table("seller")
            .merge(function (row) {
                return { seller_id: row('id') }
            })
            .without('id')
            .eqJoin("country_id", r.db('common').table("country")).without({ right: ["id", "date_created", "date_updated"] }).zip()
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
router.get('/id/:seller_id', function (req, res, next) {
    db.query(function (conn) {
        r.db('external_f3').table("seller")
            .get(req.params.seller_id)
            .merge(
            { seller_id: r.row('id') },
            r.db('common').table("country").get(r.row("country_id"))
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
    //console.log(req.body);
    var valid = validate(req.body);
    var result = { result: false, message: null, id: null };
    if (valid) {
        //console.log(req.body);
        if (req.body.id == null) {
            datacontext.insert("external_f3", "seller", req.body, res);
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
        datacontext.update("external_f3", "seller", req.body, res);
    } else {
        result.message = ajv.errorsText(validate.errors);
        res.json(result);
    }
});
router.delete('/delete/id/:id', function (req, res, next) {
    datacontext.delete("external_f3", "seller", req.params.id, res);
});
module.exports = router;
