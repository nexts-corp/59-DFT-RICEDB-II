var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');

var Timestamp = require('../../class/Timestamp.js');
var timestamp = new Timestamp();

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
        "buyer_fullname": {
            "type": "string"
        },
        "buyer_masks": {
            "type": "string"
        },
        "buyer_name": {
            "type": "string"
        },
        "buyer_tel": {
            "type": "string"
        },
        "country_id": {
            "type": "string"
        }
    },
    "required": ["buyer_address", "buyer_email","buyer_fullname","buyer_masks","buyer_name","country_id"]
};
var validate = ajv.compile(schema);

router.get(['/', '/list'], function (req, res, next) {
    db.query(function (conn) {
        r.db('common').table("buyer")
            .merge(function (row) {
                return { buyer_id: row('id') }
            })
            .without('id')
            .eqJoin("country_id", r.db('common').table("country")).without({ right: ["id","date_created","date_updated"] }).zip()
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
            { buyer_id: r.row('id') },
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
    var valid = validate(req.body);
    var result = { result: false, message: null, id: null };
    if (valid) {
        if (req.body.id == null) {
            req.body = timestamp.create(req.body);
            db.query(function (conn) {
                r.db('common').table("buyer")
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
        //console.log(req.body);
        if (req.body.id != '' && req.body.id != null) {
            result.id = req.body.id;
            req.body = timestamp.update(req.body);
            db.query(function (conn) {
                r.db('common').table("buyer")
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
            result.message = 'require field id';
            res.json(result);
        }
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
            r.db('common').table("buyer")
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
