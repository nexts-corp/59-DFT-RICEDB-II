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
        }
    },
    "required": ["bl_no", "invoice_date", "invoice_no", "made_out_to"]
};
var validate = ajv.compile(schema);
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
                    .eqJoin("buyer_id", r.table("buyer")).without({ right: "id" }).zip()
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
                    (0)
            })
            .merge(function (m) {
                return {
                    invoice_date: m('invoice_date').split('T')(0)
                }
            })
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

