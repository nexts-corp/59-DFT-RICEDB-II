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
        },
        "shipment_detail": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "bl_no": {
                        "type": "string"
                    },
                    "book_no": {
                        "type": "string"
                    },
                    "carrier_id": {
                        "type": "string"
                    },
                    "cl_id": {
                        "type": "string"
                    },
                    "deli_port_id": {
                        "type": "string"
                    },
                    "dest_port_id": {
                        "type": "string"
                    },
                    "eta_date": {
                        "type": "string",
                        "format": "date"
                    },
                    "etd_date": {
                        "type": "string",
                        "format": "date"
                    },
                    "load_port_id": {
                        "type": "string"
                    },
                    "nn_page": {
                        "type": "integer"
                    },
                    "num_of_container": {
                        "type": "integer"
                    },
                    "origin_page": {
                        "type": "integer"
                    },
                    "package_id": {
                        "type": "string"
                    },
                    "packing_date": {
                        "type": "string",
                        "format": "date"
                    },
                    "packing_time": {
                        "type": "string",
                        "pattern": "^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$"
                    },
                    "product_date": {
                        "type": "string",
                        "format": "date"
                    },
                    "seller_id": {
                        "type": "string"
                    },
                    "ship_id": {
                        "type": "string"
                    },
                    "ship_lot_no": {
                        "type": "string"
                    },
                    "ship_voy_no": {
                        "type": "string"
                    },
                    "shipline_id": {
                        "type": "string"
                    },
                    "shm_det_quantity": {
                        "type": "number"
                    },
                    "shm_id": {
                        "type": "string"
                    },
                    "surveyor_id": {
                        "type": "string"
                    },
                    "type_rice_id": {
                        "type": "string"
                    },
                    "weight_per_container": {
                        "type": "number"
                    }
                },
                "required": [
                    "carrier_id",
                    "cl_id",
                    "deli_port_id",
                    "dest_port_id",
                    "load_port_id",
                    "num_of_container",
                    "package_id",
                    "seller_id",
                    "ship_id",
                    "shipline_id",
                    "shm_det_quantity",
                    "shm_id",
                    "surveyor_id",
                    "type_rice_id",
                    "weight_per_container"
                ]
            }
        }
    },
    "required": ["contract_id", "shm_no", "shm_name", "shipment_detail"]
};
var validate = ajv.compile(schema);

router.get('/:shm_id', function (req, res, next) {
    db.query(function (conn) {
        r.table("shipment")
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
                    }),
                    shm_quantity: row('shipment_detail').sum("shm_det_quantity")
                    // shipment_detail: r.table("shipment_detail")
                    //     .filter({ "shm_id": row('id') })
                    //     .orderBy(r.desc('shm_det_quantity'))
                    //     .eqJoin("load_port_id", r.table("port")).map(function (port) {
                    //         return port.merge({
                    //             right: {
                    //                 load_port_name: port("right")("port_name"),//r.row["right"]["port_name"]
                    //                 load_port_code: port("right")("port_code")
                    //             }
                    //         })
                    //     }).without({ right: ["id", "port_name", "port_code", "country_id"] }).zip()
                    //     .eqJoin("dest_port_id", r.table("port")).map(function (port) {
                    //         return port.merge({
                    //             right: {
                    //                 dest_port_name: port("right")("port_name"),//r.row["right"]["port_name"]
                    //                 dest_port_code: port("right")("port_code")
                    //             }
                    //         })
                    //     }).without({ right: ["id", "port_name", "port_code", "country_id"] }).zip()
                    //     .eqJoin("deli_port_id", r.table("port")).map(function (port) {
                    //         return port.merge({
                    //             right: {
                    //                 deli_port_name: port("right")("port_name"),//r.row["right"]["port_name"]
                    //                 deli_port_code: port("right")("port_code")
                    //             }
                    //         })
                    //     }).without({ right: ["id", "port_name", "port_code", "country_id"] }).zip()
                    //     .eqJoin("cl_id", r.table("confirm_letter")).without({
                    //         right: ["id", "cl_quality", "cl_type_rice", "cl_total_quantity", "cl_date"]
                    //     }).zip()
                    //     .eqJoin("carrier_id", r.table("carrier")).without({ right: "id" }).zip()
                    //     .eqJoin("seller_id", r.db('external_f3').table("seller")).without({ right: ["id", "country_id"] }).zip()
                    //     .eqJoin("ship_id", r.table("ship")).without({ right: "id" }).zip()
                    //     .eqJoin("shipline_id", r.table("shipline")).without({ right: "id" }).zip()
                    //     .eqJoin("surveyor_id", r.table("surveyor")).without({ right: "id" }).zip()
                    //     .eqJoin("type_rice_id", r.table("type_rice")).without({ right: "id" }).zip()
                    //     .eqJoin("package_id", r.table("package")).without({ right: "id" }).zip()
                    //     // .eqJoin("country_id", r.table("country")).without({ right: "id" }).zip()
                    //     .merge(function (r) {
                    //         return { shm_det_id: r('id') }
                    //     })
                    //     .without('id')
                    //     .coerceTo('array'),
                    // shm_quantity: r.table("shipment_detail")
                    //     .filter({ "shm_id": row('id') })
                    //     .sum("shm_det_quantity")
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
