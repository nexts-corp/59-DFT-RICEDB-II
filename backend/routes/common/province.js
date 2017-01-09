var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');
var Ajv = require('ajv');
var ajv = Ajv({ allErrors: true });

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
        "province_name_en": {
            "type": "string"
        },
        "province_name_th": {
            "type": "string"
        }
    },
    "required": ["id", "province_name_en", "province_name_th"]
};
var validate = ajv.compile(schema);


router.get(['/', '/list'], function (req, res, next) {
    db.query(function (conn) {
        r.db('common').table("province")
            .merge(function (row) {
                return {
                    province_id: row('id'),
                    date_created: row('date_created').split('T')(0),
                    date_updated: row('date_updated').split('T')(0)
                }
            })
            .without('id')
            .orderBy('province_name_th')
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
router.get('/id/:province_id', function (req, res, next) {
    db.query(function (conn) {
        r.db('common').table("province")
            .get(req.params.province_id.toUpperCase())
            .merge({
                province_id: r.row('id'),
                date_created: r.row('date_created').split('T')(0),
                date_updated: r.row('date_updated').split('T')(0)
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
router.post('/insert', function (req, res, next) {
    var valid = validate(req.body);
    var result = { result: false, message: null, id: null };
    if (valid) {
        datacontext.insert("common", "province", req.body, res);
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
        datacontext.update("common", "province", req.body, res);
    } else {
        result.message = ajv.errorsText(validate.errors);
        res.json(result);
    }
});
router.delete('/delete/id/:id', function (req, res, next) {
    datacontext.delete("common", "province", req.params.id, res);
});


module.exports = router;
