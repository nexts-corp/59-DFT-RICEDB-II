var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');
var Ajv = require('ajv');
var ajv = Ajv({ allErrors: true });

var schema = {
    "patternProperties": {
        ".*$": { "type": "string" }
    },
    "properties": {
        "id": {
            "type": "string",
            "maxLength": 2,
            "minLength": 2
        }
    }
};
var validate = ajv.compile(schema);


router.get(['/', '/list'], function (req, res, next) {
    db.query(function (conn) {
        r.db('external_f3').table("type_license")
            .merge(function (row) {
                return { type_lic_id: row('id') }
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
router.get('/:type_lic_id', function (req, res, next) {
    db.query(function (conn) {
        r.db('external_f3').table("type_license")
            .get(req.params.type_lic_id.toUpperCase())
            .merge({
                type_lic_id: r.row('id')
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
    if (valid) {
        //res.json(req.body);
        db.query(function (conn) {
            r.db('external_f3').table("type_license")
                .insert(req.body)
                .run(conn)
                .then(function (response) {
                    if (response.errors == 0) {
                        res.json(req.body);
                        console.log('Success ', response);
                    } else {
                        res.json("Error ", response);
                        console.log('Error ', response);
                    }
                })
                .error(function (err) {
                    res.json("Error", err);
                    console.log('error occurred ', err);
                })
        })
    } else {
        //console.log('Invalid: ' + ajv.errorsText(validate.errors));
        res.json('Invalid: ' + ajv.errorsText(validate.errors));
    }

});
module.exports = router;
