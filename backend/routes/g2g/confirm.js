var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');

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
            "type": "string"
        },
        "cl_date": {
            "type": "string",
            "format": "date"
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
                "required": ["type_rice_id", "type_rice_quantity","package"]
            }
        },
        "inct_id":{
            "type":"string"
        }
    },
    "required": ["cl_name", "cl_no", "cl_date", "cl_type_rice","inct_id"]
};
var validate = ajv.compile(schema);

router.get('/:cl_id', function (req, res, next) {
    db.query(function (conn) {
        r.table("confirm_letter")
            .get(req.params.cl_id)
            .merge(function (row) {
                return {
                    cl_id: row('id'),
                    cl_type_rice: row('cl_type_rice').map(function (arr_type_rice) {
                        return arr_type_rice.merge(function (row_type_rice) {
                            return {
                                package: row_type_rice('package').map(function (arr_package) {
                                    return arr_package.merge(function (row_package) {
                                        return r.table('package').get(row_package('package_id')).without('id')
                                    })
                                })
                            }//, r.table('type_rice').get(row_type_rice('type_rice_id')).without('id')
                        })
                            .merge(function (row_type_rice) {
                                return r.table('type_rice').get(row_type_rice('type_rice_id')).without('id')
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
router.get('/contract/:contract_id', function (req, res, next) {
    db.query(function (conn) {
        r.table("confirm_letter")
            .filter({ "contract_id": req.params.contract_id })
            .merge(function (row) {
                return {
                    cl_id: row('id'),
                    cl_type_rice: row('cl_type_rice').map(function (arr_type_rice) {
                        return arr_type_rice.merge(function (row_type_rice) {
                            return {
                                package: row_type_rice('package').map(function (arr_package) {
                                    return arr_package.merge(function (row_package) {
                                        return r.table('package').get(row_package('package_id')).without('id')
                                    })
                                })
                            }
                        })
                            .merge(function (row_type_rice) {
                                return r.table('type_rice').get(row_type_rice('type_rice_id')).without('id')
                            })
                    })
                }
            })
            .without('id')
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
            //result.id = req.body.id;
            db.query(function (conn) {
                r.table("confirm_letter")
                    //.get(req.body.id)
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
        if (req.body.id != '' || req.body.id != null) {
            result.id = req.body.id;
            db.query(function (conn) {
                r.table("confirm_letter")
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
router.delete('/delete', function (req, res, next) {
    //var valid = validate(req.body);
    var result = { result: false, message: null, id: null };
    //  if (valid) {
    //console.log(req.body);
    if (req.body.id != '' || req.body.id != null) {
        // result.id = req.body.id;
        db.query(function (conn) {
            r.table("confirm_letter")
                .get(req.body.id)
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
    // } else {
    //     result.message = ajv.errorsText(validate.errors);
    //     res.json(result);
    // }
});
module.exports = router;
