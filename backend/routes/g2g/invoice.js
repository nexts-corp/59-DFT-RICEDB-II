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
        "bl_no": {
            "type": "string"
        },
        "invoice_date": {
            "type": "string",
            "format": "date-time"
        },
        "invoice_no": {
            "type": "string"
        },
        "made_out_to": {
            "type": "string"
        },
        "invoice_status": {
            "type": "boolean"
        }
    },
    "required": ["bl_no", "invoice_date", "invoice_no", "made_out_to", "invoice_status"]
};
var validate = ajv.compile(schema);
router.get('/', function (req, res, next) {
    db.query(function (conn) {
        r.table('shipment_detail')
            .group(function (g) {
                return g.pluck(
                    "ship_id", "load_port_id", "dest_port_id", "deli_port_id", "bl_no", "shm_id", "ship_voy_no"
                )
            })
            .ungroup()
            .merge(function (me) {
                return {
                    shm_id: me('group')('shm_id'),
                    bl_no: me('group')('bl_no'),
                    ship_id: me('group')('ship_id'),
                    ship_voy_no: me('group')('ship_voy_no'),
                    load_port_id: me('group')('load_port_id'),
                    dest_port_id: me('group')('dest_port_id'),
                    deli_port_id: me('group')('deli_port_id'),
                    //quantity: me('reduction')
                }
            })
            .without("group", "reduction")
            .outerJoin(r.table("invoice"),
            function (detail, invoice) {
                return invoice("bl_no").eq(detail("bl_no"))
            })
            .zip()
            .filter(r.row.hasFields('invoice_no').and(r.row('invoice_status').eq(false)))
            .merge(function (m) {
                return {
                    invoice_id: m('id')
                }
            }).without('id')
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
            .eqJoin("ship_id", r.table("ship")).without({ right: "id" }).zip()
            .eqJoin("shipline_id", r.table("shipline")).without({ right: "id" }).zip()
            .eqJoin("shm_id", r.table("shipment")).without({ right: "id" }).zip().filter(r.row('shm_status').eq(true))
            .eqJoin("cl_id", r.table("confirm_letter")).without({ right: ["id", "cl_type_rice"] }).zip()
            .eqJoin("contract_id", r.table("contract")).without({ right: ["id", "contract_type_rice"] }).zip()
            .orderBy('invoice_no')
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
router.get('/shipment/id/:shm_id', function (req, res, next) {
    db.query(function (conn) {
        r.table('shipment_detail')
            .filter({ shm_id: req.params.shm_id })
            .group(function (g) {
                return g.pluck(
                    "ship_id", "load_port_id", "dest_port_id", "deli_port_id", "bl_no", "shm_id", "ship_voy_no"
                )
            })
            .ungroup()
            .merge(function (me) {
                return {
                    shm_id: me('group')('shm_id'),
                    bl_no: me('group')('bl_no'),
                    ship_id: me('group')('ship_id'),
                    ship_voy_no: me('group')('ship_voy_no'),
                    load_port_id: me('group')('load_port_id'),
                    dest_port_id: me('group')('dest_port_id'),
                    deli_port_id: me('group')('deli_port_id'),
                    //quantity: me('reduction')
                }
            })
            .without("group", "reduction")
            .outerJoin(r.table("invoice"),
            function (detail, invoice) {
                return invoice("bl_no").eq(detail("bl_no"))
            })
            .zip()
            .filter(r.row.hasFields('invoice_no'))
            .merge(function (m) {
                return {
                    invoice_id: m('id')
                }
            }).without('id')
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
router.get('/id/:invoice_id', function (req, res, next) {
    db.query(function (conn) {
        r.table('invoice')
            .get(req.params.invoice_id)
            .merge(function (m) {
                return r.table('shipment_detail')
                    .filter({ bl_no: m('bl_no') })
                    .group(function (g) {
                        return g.pluck(
                            "ship_id", "load_port_id", "dest_port_id", "deli_port_id", "bl_no", "shm_id"
                        )
                    })
                    .sum("shm_det_quantity")
                    .ungroup()
                    .merge(function (me) {
                        return {
                            shm_id: me('group')('shm_id'),
                            bl_no: me('group')('bl_no'),
                            ship_id: me('group')('ship_id'),
                            load_port_id: me('group')('load_port_id'),
                            dest_port_id: me('group')('dest_port_id'),
                            deli_port_id: me('group')('deli_port_id'),
                            quantity: me('reduction')
                        }
                    })
                    .without("group", "reduction")
                    .eqJoin("shm_id", r.table("shipment")).without({ right: "id" }).zip()
                    .eqJoin("cl_id", r.table("confirm_letter")).without({ right: "id" }).zip()
                    .eqJoin("contract_id", r.table("contract")).without({ right: ["id", "contract_type_rice"] }).zip()
                    .merge(function (me) {
                        return {
                            bl_detail: r.table('shipment_detail')
                                .filter({ bl_no: me('bl_no') })
                                .group(function (g) {
                                    return g.pluck(
                                        "type_rice_id", "package_id"
                                    )
                                })
                                .sum("shm_det_quantity")
                                .ungroup()
                                .merge(function (me2) {
                                    return {
                                        type_rice_id: me2('group')('type_rice_id'),
                                        package_id: me2('group')('package_id'),
                                        quantity: me2('reduction'),
                                        price_per_ton: me('cl_type_rice')
                                            .filter(function (tb) {
                                                return tb('type_rice_id').eq(me2('group')('type_rice_id'))
                                            }).getField("package")(0)
                                            .filter(function (f) {
                                                return f('package_id').eq(me2('group')('package_id'))
                                            })(0)
                                            .pluck('price_per_ton')
                                            .values()(0)
                                    }
                                })
                                .without("group", "reduction")
                                .eqJoin("package_id", r.table("package")).without({ right: "id" }).zip()
                                .merge(function (me2) {
                                    return {
                                        weight_gross: me2('quantity').mul(me2('package_kg_per_bag').add(me2('package_weight_bag').div(1000))).div(1000),
                                        weight_net: me2('quantity').mul(me2('package_kg_per_bag')).div(1000),
                                        weight_tare: me2('quantity').mul(me2('package_weight_bag').div(1000)).div(1000)
                                    }
                                })
                                .merge(function (me2) {
                                    return {
                                        amount_usd: me2('price_per_ton').mul(me2('weight_net'))
                                    }
                                })
                                .eqJoin("type_rice_id", r.table("type_rice")).without({ right: "id" }).zip()
                                .coerceTo('array')
                        }
                    })
                    .merge(function (me) {
                        return {
                            weight_gross: me('bl_detail').sum('weight_gross'),
                            weight_net: me('bl_detail').sum('weight_net'),
                            weight_tare: me('bl_detail').sum('weight_tare'),
                            amount_usd: me('bl_detail').sum('amount_usd'),
                            cl_date: me('cl_date').split('T')(0),
                            contract_date: me('contract_date').split('T')(0)
                        }
                    })
                    .eqJoin("buyer_id", r.table("buyer")).map(function (buyer) {
                        return buyer.merge({
                            right: {
                                buyer_country_id: buyer("right")("country_id")
                            }
                        })
                    }).without({ right: ["id", "country_id"] }).zip()
                    .eqJoin("buyer_country_id", r.table("country")).map(function (country) {
                        return country.merge({
                            right: {
                                buyer_country_fullname_en: country("right")("country_fullname_en"),
                                buyer_country_name_en: country("right")("country_name_en"),
                                buyer_country_name_th: country("right")("country_name_th")
                            }
                        })
                    }).without({ right: ["id", "country_fullname_en", "country_name_en", "country_name_th", "country_id"] }).zip()
                    .eqJoin("dest_port_id", r.table("port")).map(function (port) {
                        return port.merge({
                            right: {
                                dest_port_name: port("right")("port_name"),//r.row["right"]["port_name"]
                                dest_port_code: port("right")("port_code"),
                                dest_country_id: port("right")("country_id")
                            }
                        })
                    }).without({ right: ["id", "port_name", "port_code", "country_id"] }).zip()
                    .eqJoin("deli_port_id", r.table("port")).map(function (port) {
                        return port.merge({
                            right: {
                                deli_port_name: port("right")("port_name"),//r.row["right"]["port_name"]
                                deli_port_code: port("right")("port_code"),
                                deli_country_id: port("right")("country_id")
                            }
                        })
                    }).without({ right: ["id", "port_name", "port_code", "country_id"] }).zip()
                    .eqJoin("load_port_id", r.table("port")).map(function (port) {
                        return port.merge({
                            right: {
                                load_port_name: port("right")("port_name"),//r.row["right"]["port_name"]
                                load_port_code: port("right")("port_code"),
                                load_country_id: port("right")("country_id")
                            }
                        })
                    }).without({ right: ["id", "port_name", "port_code", "country_id"] }).zip()
                    .eqJoin("dest_country_id", r.table("country")).map(function (dest) {
                        return dest.merge({
                            right: {
                                dest_country_fullname_en: dest("right")("country_fullname_en"),
                                dest_country_name_en: dest("right")("country_name_en"),
                                dest_country_name_th: dest("right")("country_name_th")
                            }
                        })
                    }).without({ right: ["id", "country_fullname_en", "country_name_en", "country_name_th", "country_id"] }).zip()
                    .eqJoin("deli_country_id", r.table("country")).map(function (deli) {
                        return deli.merge({
                            right: {
                                deli_country_fullname_en: deli("right")("country_fullname_en"),
                                deli_country_name_en: deli("right")("country_name_en"),
                                deli_country_name_th: deli("right")("country_name_th")
                            }
                        })
                    }).without({ right: ["id", "country_fullname_en", "country_name_en", "country_name_th", "country_id"] }).zip()
                    .eqJoin("load_country_id", r.table("country")).map(function (load) {
                        return load.merge({
                            right: {
                                load_country_fullname_en: load("right")("country_fullname_en"),
                                load_country_name_en: load("right")("country_name_en"),
                                load_country_name_th: load("right")("country_name_th")
                            }
                        })
                    }).without({ right: ["id", "country_fullname_en", "country_name_en", "country_name_th", "country_id"] }).zip()
                    .eqJoin("ship_id", r.table("ship")).without({ right: "id" }).zip()
                    .eqJoin("shipline_id", r.table("shipline")).without({ right: "id" }).zip()
                    .eqJoin("inct_id", r.table("incoterms")).without({ right: "id" }).zip()
                    (0)
            })
            .merge(function (m) {
                return {
                    invoice_date: m('invoice_date').split('T')(0),
                    invoice_id: m('id')
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
                r.table("invoice")
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
                r.table("invoice")
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
router.delete('/delete/id/:invoice_id', function (req, res, next) {
    //var valid = validate(req.body);
    var result = { result: false, message: null, id: null };
    //  if (valid) {
    //console.log(req.body);
    if (req.params.invoice_id != '' || req.params.invoice_id != null) {
        result.id = req.params.invoice_id;
        db.query(function (conn) {
            r.table("invoice")
                .get(req.params.invoice_id)
                .delete()
                .run(conn)
                .then(function (response) {
                    result.message = response;
                    if (response.errors == 0) {
                        result.result = true;
                        res.json(result);
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

