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
        "package_name_th": {
            "type": "string"
        },
        "package_name_en": {
            "type": "string"
        },
        "package_kg_per_bag": {
            "type": "number"
        },
        "package_weight_bag": {
            "type": "number"
        }
    },
    "required": ["id", "package_name_th", "package_name_en", "package_kg_per_bag", "package_weight_bag"]
};
var validate = ajv.compile(schema);
router.get(['/', '/list'], function (req, res, next) {
    db.query(function (conn) {
        r.db('common').table("package")
            .merge(function (row) {
                return {
                    package_id: row('id'),
                    date_created: row('date_created').split('T')(0),
                    date_updated: row('date_updated').split('T')(0)
                }
            })
            .without('id')
            .orderBy('package_id')
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
router.get('/id/:package_id', function (req, res, next) {
    db.query(function (conn) {
        r.db('common').table("package")
            .get(req.params.package_id.toUpperCase())
            .merge({
                package_id: r.row('id'),
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
    })
});
router.post('/insert', function (req, res, next) {
    var valid = validate(req.body);
    var result = { result: false, message: null, id: null };
    if (valid) {
        datacontext.insert("common", "package", req.body, res);
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
        datacontext.update("common", "package", req.body, res);
    } else {
        result.message = ajv.errorsText(validate.errors);
        res.json(result);
    }
});
router.delete('/delete/id/:id', function (req, res, next) {
    datacontext.delete("common", "package", req.params.id, res);
});
module.exports = router;
