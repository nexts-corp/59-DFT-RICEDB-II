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
        "contract_id": {
            "type": "string"
        },
        "shm_no": {
            "type": "string"
        },
        "shm_name": {
            "type": "string"
        }
    },
    "required": ["contract_id", "shm_no", "shm_name"]
};
var validate = ajv.compile(schema);

router.get('/:shm_id', function (req, res, next) {
    db.query(function (conn) {
        r.db('external_f3').table("shipment")
            //.filter({contract_id:req.params.contract_id})
            .get(req.params.shm_id)
            .merge(function (row) {
                return {
                    shm_id: row('id'),
                    shipment_detail: row('shipment_detail').map(function (arr_shm_det) {
                        return arr_shm_det.merge(function (row_shm_det) {
                            return r.table('port').get(row_shm_det('load_port_id'))
                                .merge(function (port) {
                                    return {
                                        load_port_name: port("port_name"),//r.row["right"]["port_name"]
                                        load_port_code: port("port_code")
                                    }
                                })
                                .without(["id", "port_name", "port_code", "country_id"])
                        })
                            .merge(function (row_shm_det) {
                                return r.table('port').get(row_shm_det('dest_port_id'))
                                    .merge(function (port) {
                                        return {
                                            dest_port_name: port("port_name"),//r.row["right"]["port_name"]
                                            dest_port_code: port("port_code")
                                        }
                                    })
                                    .without(["id", "port_name", "port_code", "country_id"])
                            })
                            .merge(function (row_shm_det) {
                                return r.table('port').get(row_shm_det('deli_port_id'))
                                    .merge(function (port) {
                                        return {
                                            deli_port_name: port("port_name"),//r.row["right"]["port_name"]
                                            deli_port_code: port("port_code")
                                        }
                                    })
                                    .without(["id", "port_name", "port_code", "country_id"])
                            })
                            .merge(function (row_shm_det) {
                                return r.table('confirm_letter').get(row_shm_det('cl_id'))
                                    .without(["id", "cl_quality", "cl_type_rice", "cl_total_quantity", "cl_date"])
                            })
                            .merge(function (row_shm_det) {
                                return r.table('carrier').get(row_shm_det('carrier_id'))
                                    .without("id")
                            })
                            .merge(function (row_shm_det) {
                                return r.db('external_f3').table("seller").get(row_shm_det('seller_id'))
                                    .without(["id", "country_id"])
                            })
                            .merge(function (row_shm_det) {
                                return r.table('ship').get(row_shm_det('ship_id')).without("id")
                            })
                            .merge(function (row_shm_det) {
                                return r.table('shipline').get(row_shm_det('shipline_id')).without("id")
                            })
                            .merge(function (row_shm_det) {
                                return r.table('surveyor').get(row_shm_det('surveyor_id')).without("id")
                            })
                            .merge(function (row_shm_det) {
                                return r.table('type_rice').get(row_shm_det('type_rice_id')).without("id")
                            })
                            .merge(function (row_shm_det) {
                                return r.table('package').get(row_shm_det('package_id')).without("id")
                            })
                    })
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
router.post('/insert', function (req, res, next) {
    //console.log(req.body);
    var valid = validate(req.body);
    var result = { result: false, message: null, id: null };
    if (valid) {
        //console.log(req.body);
        if (req.body.id == null) {
            //result.id = req.body.id;
            db.query(function (conn) {
                r.table("shipment")
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
                r.table("shipment")
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
            r.table("shipment")
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
