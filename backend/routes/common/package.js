var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');

var Timestamp = require('../../class/Timestamp.js');
var timestamp = new Timestamp();

var Ajv = require('ajv');
var ajv = Ajv({ allErrors: true });
var schema = {
    //'type': 'object',
    "properties": {
        "id": {
            "type": "string"
        },
        "package_name": {
            "type": "string"
        },
        "package_kg_per_bag": {
            "type": "number"
        },
        "package_weight_bag": {
            "type": "number"
        }
    },
    "required": ["id", "package_name", "package_kg_per_bag", "package_weight_bag"]
};
var validate = ajv.compile(schema);
router.get(['/', '/list'], function (req, res, next) {
    db.query(function (conn) {
        r.db('common').table("package")
            .merge(function (row) {
                return { package_id: row('id') }
            })
            .without('id')
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
                package_id: r.row('id')
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
        req.body = timestamp.insert(req.body);
        db.query(function (conn) {
            r.db('common').table("package")
                .insert(req.body)
                .run(conn)
                .then(function (response) {
                    result.message = response;
                    if (response.errors == 0) {
                        result.result = true;
                        result.id = response.generated_keys;
                    }
                    res.json(result);
                    console.log(result);
                })
                .error(function (err) {
                    result.message = err;
                    res.json(result);
                    console.log(result);
                })
        })
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
        result.id = req.body.id;
        req.body = timestamp.update(req.body);
        db.query(function (conn) {
            r.db('common').table("package")
                .get(req.body.id)
                .update(req.body)
                .run(conn)
                .then(function (response) {
                    result.message = response;
                    if (response.errors == 0) {
                        result.result = true;
                    }
                    res.json(result);
                    console.log(result);
                })
                .error(function (err) {
                    result.message = err;
                    res.json(result);
                    console.log(result);
                })
        })
    } else {
        result.message = ajv.errorsText(validate.errors);
        res.json(result);
    }
});
router.delete('/delete/id/:id', function (req, res, next) {
    var result = { result: false, message: null, id: null };
    if (req.params.id != '' || req.params.id != null) {
        result.id = req.params.id;
        db.query(function (conn) {
            r.db('common').table("package")
                .get(req.params.id)
                .delete()
                .run(conn)
                .then(function (response) {
                    result.message = response;
                    if (response.errors == 0) {
                        result.result = true;
                    }
                    res.json(result);
                    console.log(result);
                })
                .error(function (err) {
                    result.message = err;
                    res.json(result);
                    console.log(result);
                })
        })
    } else {
        result.message = 'require field id';
        res.json(result);
    }
});
module.exports = router;
