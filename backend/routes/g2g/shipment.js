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

router.get('/id/:shm_id', function (req, res, next) {
    db.query(function (conn) {
        r.table("shipment")
            //.filter({contract_id:req.params.contract_id})
            .get(req.params.shm_id)
            .merge(function (row) {
                return {
                    shm_id: row('id'),
                    // shipment_detail: row('shipment_detail').map(function (arr_shm_det) {
                    //     return arr_shm_det.merge(function (row_shm_det) {
                    //         return r.table('port').get(row_shm_det('load_port_id'))
                    //             .merge(function (port) {
                    //                 return {
                    //                     load_port_name: port("port_name"),//r.row["right"]["port_name"]
                    //                     load_port_code: port("port_code")
                    //                 }
                    //             })
                    //             .without(["id", "port_name", "port_code", "country_id"])
                    //     })
                    //         .merge(function (row_shm_det) {
                    //             return r.table('port').get(row_shm_det('dest_port_id'))
                    //                 .merge(function (port) {
                    //                     return {
                    //                         dest_port_name: port("port_name"),//r.row["right"]["port_name"]
                    //                         dest_port_code: port("port_code")
                    //                     }
                    //                 })
                    //                 .without(["id", "port_name", "port_code", "country_id"])
                    //         })
                    //         .merge(function (row_shm_det) {
                    //             return r.table('port').get(row_shm_det('deli_port_id'))
                    //                 .merge(function (port) {
                    //                     return {
                    //                         deli_port_name: port("port_name"),//r.row["right"]["port_name"]
                    //                         deli_port_code: port("port_code")
                    //                     }
                    //                 })
                    //                 .without(["id", "port_name", "port_code", "country_id"])
                    //         })
                    //         .merge(function (row_shm_det) {
                    //             return r.table('confirm_letter').get(row_shm_det('cl_id'))
                    //                 .without(["id", "cl_quality", "cl_type_rice", "cl_total_quantity", "cl_date"])
                    //         })
                    //         .merge(function (row_shm_det) {
                    //             return r.table('carrier').get(row_shm_det('carrier_id'))
                    //                 .without("id")
                    //         })
                    //         .merge(function (row_shm_det) {
                    //             return r.db('external_f3').table("seller").get(row_shm_det('seller_id'))
                    //                 .without(["id", "country_id"])
                    //         })
                    //         .merge(function (row_shm_det) {
                    //             return r.table('ship').get(row_shm_det('ship_id')).without("id")
                    //         })
                    //         .merge(function (row_shm_det) {
                    //             return r.table('shipline').get(row_shm_det('shipline_id')).without("id")
                    //         })
                    //         .merge(function (row_shm_det) {
                    //             return r.table('surveyor').get(row_shm_det('surveyor_id')).without("id")
                    //         })
                    //         .merge(function (row_shm_det) {
                    //             return r.table('type_rice').get(row_shm_det('type_rice_id')).without("id")
                    //         })
                    //         .merge(function (row_shm_det) {
                    //             return r.table('package').get(row_shm_det('package_id')).without("id")
                    //         })
                    // }),
                    // shm_quantity: row('shipment_detail').sum("shm_det_quantity")
                    shipment_detail: r.table("shipment_detail")
                        .filter({ "shm_id": row('id') })
                        .orderBy(r.desc('shm_det_quantity'))
                        .eqJoin("load_port_id", r.table("port")).map(function (port) {
                            return port.merge({
                                right: {
                                    load_port_name: port("right")("port_name"),//r.row["right"]["port_name"]
                                    load_port_code: port("right")("port_code")
                                }
                            })
                        }).without({ right: ["id", "port_name", "port_code", "country_id"] }).zip()
                        .eqJoin("dest_port_id", r.table("port")).map(function (port) {
                            return port.merge({
                                right: {
                                    dest_port_name: port("right")("port_name"),//r.row["right"]["port_name"]
                                    dest_port_code: port("right")("port_code")
                                }
                            })
                        }).without({ right: ["id", "port_name", "port_code", "country_id"] }).zip()
                        .eqJoin("deli_port_id", r.table("port")).map(function (port) {
                            return port.merge({
                                right: {
                                    deli_port_name: port("right")("port_name"),//r.row["right"]["port_name"]
                                    deli_port_code: port("right")("port_code")
                                }
                            })
                        }).without({ right: ["id", "port_name", "port_code", "country_id"] }).zip()
                        .eqJoin("cl_id", r.table("confirm_letter")).without({
                            right: ["id", "cl_quality", "cl_type_rice", "cl_total_quantity", "cl_date"]
                        }).zip()
                        .eqJoin("carrier_id", r.table("carrier")).without({ right: "id" }).zip()
                        .eqJoin("seller_id", r.db('external_f3').table("seller")).without({ right: ["id", "country_id"] }).zip()
                        .eqJoin("ship_id", r.table("ship")).without({ right: "id" }).zip()
                        .eqJoin("shipline_id", r.table("shipline")).without({ right: "id" }).zip()
                        .eqJoin("surveyor_id", r.table("surveyor")).without({ right: "id" }).zip()
                        .eqJoin("type_rice_id", r.table("type_rice")).without({ right: "id" }).zip()
                        .eqJoin("package_id", r.table("package")).without({ right: "id" }).zip()
                        // .eqJoin("country_id", r.table("country")).without({ right: "id" }).zip()
                        .merge(function (r) {
                            return {
                                shm_det_id: r('id'),
                                eta_date: r('eta_date').split('T')(0),
                                etd_date: r('etd_date').split('T')(0),
                                packing_date:r('packing_date').split('T')(0),
                                product_date:r('product_date').split('T')(0)
                            }
                        })
                        .without('id')
                        .coerceTo('array'),
                    shm_quantity: r.table("shipment_detail")
                        .filter({ "shm_id": row('id') })
                        .sum("shm_det_quantity")
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
        res.json(req.body);
        // if (req.body.id == null) {
        //     //result.id = req.body.id;
        //     db.query(function (conn) {
        //         r.table("shipment")
        //             //.get(req.body.id)
        //             .insert(req.body)
        //             .run(conn)
        //             .then(function (response) {
        //                 result.message = response;
        //                 if (response.errors == 0) {
        //                     result.result = true;
        //                     result.id = response.generated_keys;
        //                 }
        //                 res.json(result);
        //                 console.log(result);
        //             })
        //             .error(function (err) {
        //                 result.message = err;
        //                 res.json(result);
        //                 console.log(result);
        //             })
        //     })
        // } else {
        //     result.message = 'field "id" must do not have data';
        //     res.json(result);
        // }
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
router.delete('/delete/id/:shm_id', function (req, res, next) {
    //var valid = validate(req.body);
    var result = { result: false, message: null, id: null };
    //  if (valid) {
    //console.log(req.body);
    if (req.params.shm_id != '' || req.params.shm_id != null) {
        result.id = req.params.shm_id;
        db.query(function (conn) {
            r.table("shipment")
                .get(req.params.shm_id)
                .delete({ durability: "soft" })
                .run(conn)
                .then(function (response) {
                    result.message = response;
                    if (response.errors == 0) {
                        result.result = true;
                        db.query(function (conn) {
                            r.table("test")
                                .filter({ shm_id: req.params.id })
                                .delete({ durability: "soft" })
                                .run(conn)
                                .then(function (resp) {
                                    //console.log('yyyyy');
                                    console.log(result);
                                    res.json(result);
                                })
                        })
                        // res.json(req.result);
                        // console.log('xxxx');
                    }
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
