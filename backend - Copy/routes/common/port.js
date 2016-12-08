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
        "port_code": {
            "type": "string"
        },
        "port_name": {
            "type": "string"
        }
        ,
        "country_id": {
            "type": "string"
        }
    },
    "required": ["id", "port_code", "port_name", "country_id"]
};
var validate = ajv.compile(schema);
router.get(['/', '/list'], function (req, res, next) {
    db.query(function (conn) {
        r.db('common').table("port")
            .merge(function (row) {
                return { port_id: row('id') }
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
router.get('/id/:port_id', function (req, res, next) {
    db.query(function (conn) {
        r.db('common').table("port")
            .get(req.params.port_id.toUpperCase())
            .merge(
            { port_id: r.row('id') },
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
        datacontext.insert("common", "port", req.body, res);
    } else {
        result.message = ajv.errorsText(validate.errors);
        res.json(result);
    }
});
router.put('/update', function (req, res, next) {
    var valid = validate(req.body);
    var result = { result: false, message: null, id: null };
    if (valid) {
        datacontext.update("common", "port", req.body, res);
    } else {
        result.message = ajv.errorsText(validate.errors);
        res.json(result);
    }
});
router.delete('/delete/id/:id', function (req, res, next) {
    datacontext.delete("common", "port", req.params.id, res);
});

module.exports = router;



