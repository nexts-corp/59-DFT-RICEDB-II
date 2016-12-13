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
        "type_rice_name_th": {
            "type": "string"
        },
        "type_rice_name_en": {
            "type": "string"
        }
    },
    "required": ["id", "type_rice_name_th", "type_rice_name_en"]
};
var validate = ajv.compile(schema);

router.get(['/', '/list'], function(req, res, next) {
    db.query(function(conn) {
        r.db('common').table("type_rice")
            .merge(function(row) {
                return { type_rice_id: row('id') }
            })
            .without('id')
            .orderBy('type_rice_id')
            .run(conn, function(err, cursor) {
                if (!err) {
                    cursor.toArray(function(err, result) {
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

router.get('/id/:type_rice_id', function(req, res, next) {
    db.query(function(conn) {
        r.db('common').table("type_rice")
            .get(req.params.type_rice_id.toUpperCase())
            .merge({
                type_rice_id: r.row('id')
            })
            .without('id')
            .run(conn, function(err, cursor) {
                if (!err) {
                    res.json(cursor);
                } else {
                    res.json(null);
                }
            });
    })
});
router.post('/insert', function(req, res, next) {
    var valid = validate(req.body);
    var result = { result: false, message: null, id: null };
    if (valid) {
        datacontext.insert("common", "type_rice", req.body, res);
    } else {
        result.message = ajv.errorsText(validate.errors);
        res.json(result);
    }
});
router.put('/update', function(req, res, next) {
    //console.log(req.body);
    var valid = validate(req.body);
    var result = { result: false, message: null, id: null };
    if (valid) {
        datacontext.update("common", "type_rice", req.body, res);
    } else {
        result.message = ajv.errorsText(validate.errors);
        res.json(result);
    }
});
router.delete('/delete/id/:id', function(req, res, next) {
    datacontext.delete("common", "type_rice", req.params.id, res);
});
module.exports = router;
