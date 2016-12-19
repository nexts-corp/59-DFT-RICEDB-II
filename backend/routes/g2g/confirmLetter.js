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
        "cl_name": {
            "type": "string"
        },
        "cl_no": {
            "type": "number"
        },
        "cl_date": {
            "type": "string",
            "format": "date-time"
        },
        "cl_quality": {
            "type": "string"
        },
        "cl_type_rice": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "type_rice_id": { "type": "string" },
                    "type_rice_quantity": { "type": "number" },
                    "project_th": { "type": "string" },
                    "project_en": { "type": "string" },
                    "season_th": { "type": "string" },
                    "season_en": { "type": "string" },
                    "description_th": { "type": "string" },
                    "description_en": { "type": "string" },
                    "tolerance_rate": { "type": "number" },
                    "package": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "package_id": { "type": "string" },
                                "price_per_ton": { "type": "number" },
                            },
                            "required": ["package_id", "price_per_ton"]
                        }
                    }
                },
                "required": ["type_rice_id", "type_rice_quantity", "package"]
            }
        },
        "inct_id": {
            "type": "string"
        },
        "cl_status": {
            "type": "boolean"
        }
    },
    "required": ["cl_name", "cl_no", "cl_date", "cl_type_rice", "inct_id", "cl_status"]
};
var validate = ajv.compile(schema);

router.get('/id/:cl_id', function (req, res, next) {
    db.query(function (conn) {
        r.db('g2g').table("confirm_letter")
            .get(req.params.cl_id)
            .merge(function (row) {
                return {
                    cl_id: row('id'),
                    cl_date: row('cl_date').split('T')(0),
                    cl_type_rice: row('cl_type_rice').map(function (arr_type_rice) {
                        return arr_type_rice.merge(function (row_type_rice) {
                            return {
                                package: row_type_rice('package').map(function (arr_package) {
                                    return arr_package.merge(function (row_package) {
                                        return r.db('common').table('package').get(row_package('package_id')).without('id')
                                    })
                                })
                            }//, r.db('common').table('type_rice').get(row_type_rice('type_rice_id')).without('id')
                        })
                            .merge(function (row_type_rice) {
                                return r.db('common').table('type_rice').get(row_type_rice('type_rice_id')).without('id')
                            })
                    }),
                    cl_total_quantity: row('cl_type_rice').sum('type_rice_quantity')
                }
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
router.get('/contract/id/:contract_id', function (req, res, next) {
    db.query(function (conn) {
        r.db('g2g').table("confirm_letter")
            .filter({ "contract_id": req.params.contract_id, "cl_status": true })
            .merge(function (row) {
                return {
                    cl_id: row('id'),
                    cl_date: row('cl_date').split('T')(0),
                    cl_type_rice: row('cl_type_rice').map(function (arr_type_rice) {
                        return arr_type_rice.merge(function (row_type_rice) {
                            return {
                                package: row_type_rice('package').map(function (arr_package) {
                                    return arr_package.merge(function (row_package) {
                                        return r.db('common').table('package').get(row_package('package_id')).without('id')
                                    })
                                })
                            }
                        })
                            .merge(function (row_type_rice) {
                                return r.db('common').table('type_rice').get(row_type_rice('type_rice_id')).without('id')
                            })
                    })
                }
            })
            .without('id')
            .orderBy('cl_no')
            .run(conn, function (err, cursor) {
                if (!err) {
                    cursor.toArray(function (err, result) {
                        if (!err) {
                            console.log(JSON.stringify(result, null, 2));
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
router.post('/insert', function (req, res, next) {
    //console.log(req.body);
    var valid = validate(req.body);
    var result = { result: false, message: null, id: null };
    if (valid) {
        //console.log(req.body);
        if (req.body.id == null) {
            datacontext.insert("g2g", "confirm_letter", req.body, res);
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
        datacontext.update("g2g", "confirm_letter", req.body, res);
    } else {
        result.message = ajv.errorsText(validate.errors);
        res.json(result);
    }
});
router.delete('/delete/id/:id', function (req, res, next) {
    var result = { result: false, message: null, id: req.params.id };
    db.query(function (conn) {
        var q = r.db('g2g').table("confirm_letter").get(req.params.id).do(function (result) {
            return r.branch(
                result('cl_status').eq(false)
                , r.expr("delete")
                , r.expr("Can't delete because this status = true.")
            )
        })
        q.run(conn)
            .then(function (response) {
                if (response == "delete") {
                    datacontext.delete("g2g", "confirm_letter", req.params.id, res);
                } else {
                    result.message = response;
                    res.json(result);
                }
            })
            .error(function (err) {
                result.message = err;
                res.json(result);
                console.log(result);
            })
    })
});

module.exports = router;
