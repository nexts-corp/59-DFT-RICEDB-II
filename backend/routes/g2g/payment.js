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
router.get('/invoice/id/:invoice_id', function (req, res, next) {
    var d = {};
    db.query(function (conn) {
        r.table('invoice')
            .filter(function (f) {
                return r.expr(req.params.invoice_id.split('_'))
                    .contains(f('id'))
            })
            .merge(function (m) {
                return {
                    group_ship: r.table('shipment_detail')
                        .filter({ bl_no: m('bl_no') })
                        .coerceTo('array')
                        .group(function (g) {
                            return g.pluck(
                                "ship_id", "shipline_id", "ship_lot_no", "ship_voy_no"
                            )
                        })
                        .ungroup()
                        .merge(function (me) {
                            return {
                                ship_id: me('group')('ship_id'),
                                shipline_id: me('group')('shipline_id'),
                                ship_lot_no: me('group')('ship_lot_no'),
                                ship_voy_no: me('group')('ship_voy_no')
                            }
                        }),
                    shipment_detail: r.table('shipment_detail')
                        .filter({ bl_no: m('bl_no') })
                        .coerceTo('array')
                        .pluck("id", "shm_id", "package_id", "seller_id", "shm_det_quantity", "type_rice_id")
                        .eqJoin("shm_id", r.table("shipment")).without({ right: "id" }).zip()
                        .eqJoin("cl_id", r.table("confirm_letter")).without({ right: ["id", "cl_date", "cl_name", "cl_quality"] }).zip()
                        .merge(function (m1) {
                            return {
                                shm_det_id: m1('id'),
                                price_per_ton: m1('cl_type_rice')
                                    .filter(function (tb) {
                                        return tb('type_rice_id').eq(m1('type_rice_id'))
                                    }).getField("package")(0)
                                    .filter(function (f) {
                                        return f('package_id').eq(m1('package_id'))
                                    })(0)
                                    .pluck('price_per_ton')
                                    .values()(0)
                            }
                        })
                        .without('id', 'cl_type_rice')
                }
            })
            .merge(function (m) {
                return {
                    ship_id: m('group_ship')('ship_id')(0),
                    shipline_id: m('group_ship')('shipline_id')(0),
                    ship_lot_no: m('group_ship')('ship_lot_no')(0),
                    ship_voy_no: m('group_ship')('ship_voy_no')(0)
                }
            })
            .without("group_ship")
            .run(conn, function (err, cursor) {
                if (!err) {
                    cursor.toArray(function (err, result) {
                        if (!err) {
                            //console.log(JSON.stringify(result, null, 2));
                            d['invoice'] = result;
                            res.json(d);
                        } else {
                            res.json(null);
                        }
                    });
                } else {
                    res.json(null);
                }
            })
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

