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
        "fe_foreign": {
            "type": "number"
        },
        "fe_internal": {
            "type": "number"
        },
        "fe_other": {
            "type": "number"
        },
        "pay_date_receipt": {
            "type": "string",
            "format": "date-time"
        },
        "pay_no": {
            "type": "string"
        },
        "rate_bank": {
            "type": "number"
        },
        "rate_tt": {
            "type": "number"
        },
        "invoice": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "invoice_id": {
                        "type": "string"
                    },
                    "invoice_detail": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "invoice_date": {
                                    "type": "string",
                                    "format": "date-time"
                                },
                                "invoice_fe": {
                                    "type": "number"
                                },
                                "invoice_no": {
                                    "type": "string"
                                },
                                "shm_det_id": {
                                    "type": "string"
                                }
                            },
                            "required": ["invoice_date", "invoice_fe", "invoice_no", "shm_det_id"]
                        }
                    },
                },
                "required": ["invoice_id", "invoice_detail"]
            }
        },
        "pay_status": {
            "type": "boolean"
        }
    },
    "required": ["fe_foreign", "fe_internal", "fe_other", "pay_date_receipt", "pay_no", "rate_bank", "rate_tt", "invoice", "pay_status"]
};
var validate = ajv.compile(schema);
router.get('/', function (req, res, next) {
    db.query(function (conn) {
        r.table('payment')
            .filter({ pay_status: false })
            .merge(function(m){
                return {
                    pay_id:m('id')
                }
            })
            .without('id')
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
})
router.get('/id/:pay_id', function (req, res, next) {
    db.query(function (conn) {
        r.table('payment')
            .get(req.params.pay_id)
            .merge(function (pay_merge) {
                return {
                    invoice: pay_merge('invoice').map(function (pay_map) {
                        return pay_map.merge(function (pay_merge1) {
                            return r.table('invoice')
                                .get(pay_merge1('invoice_id'))
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
                                            .pluck("id", "shm_id", "package_id", "exporter_id", "shm_det_quantity", "type_rice_id")
                                            .eqJoin("shm_id", r.table("shipment")).without({ right: "id" }).zip()
                                            .eqJoin("cl_id", r.table("confirm_letter")).without({ right: ["id", "cl_date", "cl_name", "cl_quality"] }).zip()
                                            .eqJoin("package_id", r.table("package")).without({ right: "id" }).zip()
                                            .eqJoin("exporter_id", r.db('external_f3').table("exporter")).without({ right: "id" }).zip()
                                            .eqJoin("trader_id", r.db('external_f3').table("trader")).without({ right: "id" }).zip()
                                            .eqJoin("seller_id", r.db('external_f3').table("seller")).without({ right: ["id", "country_id"] }).zip()
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
                                                        .values()(0),
                                                    weight_gross: m1('shm_det_quantity').mul(m1('package_kg_per_bag').add(m1('package_weight_bag').div(1000))).div(1000),
                                                    weight_net: m1('shm_det_quantity').mul(m1('package_kg_per_bag')).div(1000),
                                                    weight_tare: m1('shm_det_quantity').mul(m1('package_weight_bag').div(1000)).div(1000)
                                                }
                                            })
                                            .merge(function (m2) {
                                                return {
                                                    amount_usd: m2('price_per_ton').mul(m2('weight_net'))
                                                }
                                            })
                                            .without('id', 'cl_type_rice')
                                    }
                                })
                                .merge(function (m) {
                                    return {
                                        invoice_id: m('id'),
                                        ship_id: m('group_ship')('ship_id')(0),
                                        shipline_id: m('group_ship')('shipline_id')(0),
                                        ship_lot_no: m('group_ship')('ship_lot_no')(0),
                                        ship_voy_no: m('group_ship')('ship_voy_no')(0),
                                        weight_gross: m('shipment_detail').sum('weight_gross'),
                                        weight_net: m('shipment_detail').sum('weight_net'),
                                        weight_tare: m('shipment_detail').sum('weight_tare'),
                                        amount_usd: m('shipment_detail').sum('amount_usd'),
                                        invoice_detail: pay_merge1('invoice_detail').map(function (map1) {
                                            return m('shipment_detail').filter({ shm_det_id: map1('shm_det_id') })(0).merge(map1)
                                        })
                                    }
                                })
                                .without("id", "group_ship", "shipment_detail")
                                .merge(function (m) {
                                    return r.table("ship").get(m('ship_id')).without('id'),
                                        r.table("shipline").get(m('shipline_id')).without('id')
                                })
                        })
                    })
                }
            })
            .merge(function (pay_merge) {
                return {
                    pay_id: pay_merge('id'),
                    amount_usd: pay_merge('invoice').sum('amount_usd'),
                    weight_gross: pay_merge('invoice').sum('weight_gross'),
                    weight_net: pay_merge('invoice').sum('weight_net'),
                    weight_tare: pay_merge('invoice').sum('weight_tare')
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
                    invoice_detail: r.table('shipment_detail')
                        .filter({ bl_no: m('bl_no') })
                        .coerceTo('array')
                        .pluck("id", "shm_id", "package_id", "exporter_id", "shm_det_quantity", "type_rice_id")
                        .eqJoin("shm_id", r.table("shipment")).without({ right: "id" }).zip()
                        .eqJoin("cl_id", r.table("confirm_letter")).without({ right: ["id", "cl_date", "cl_name", "cl_quality"] }).zip()
                        .eqJoin("package_id", r.table("package")).without({ right: "id" }).zip()
                        .eqJoin("exporter_id", r.db('external_f3').table("exporter")).without({ right: "id" }).zip()
                        .eqJoin("trader_id", r.db('external_f3').table("trader")).without({ right: "id" }).zip()
                        .eqJoin("seller_id", r.db('external_f3').table("seller")).without({ right: ["id", "country_id"] }).zip()
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
                                    .values()(0),
                                weight_gross: m1('shm_det_quantity').mul(m1('package_kg_per_bag').add(m1('package_weight_bag').div(1000))).div(1000),
                                weight_net: m1('shm_det_quantity').mul(m1('package_kg_per_bag')).div(1000),
                                weight_tare: m1('shm_det_quantity').mul(m1('package_weight_bag').div(1000)).div(1000)
                            }
                        })
                        .merge(function (m2) {
                            return {
                                amount_usd: m2('price_per_ton').mul(m2('weight_net'))
                            }
                        })
                        .without('id', 'cl_type_rice')
                }
            })
            .merge(function (m) {
                return {
                    invoice_id: m('id'),
                    ship_id: m('group_ship')('ship_id')(0),
                    shipline_id: m('group_ship')('shipline_id')(0),
                    ship_lot_no: m('group_ship')('ship_lot_no')(0),
                    ship_voy_no: m('group_ship')('ship_voy_no')(0),
                    weight_gross: m('invoice_detail').sum('weight_gross'),
                    weight_net: m('invoice_detail').sum('weight_net'),
                    weight_tare: m('invoice_detail').sum('weight_tare'),
                    amount_usd: m('invoice_detail').sum('amount_usd'),
                }
            })
            .without("id", "group_ship")
            .eqJoin("ship_id", r.table("ship")).without({ right: "id" }).zip()
            .eqJoin("shipline_id", r.table("shipline")).without({ right: "id" }).zip()
            .run(conn, function (err, cursor) {
                if (!err) {
                    cursor.toArray(function (err, result) {
                        if (!err) {
                            d['invoice'] = result;
                            d['amount_usd'] = Object.keys(result).reduce(function (a, b) {
                                return a + result[b].amount_usd;
                            }, 0);
                            d['weight_gross'] = Object.keys(result).reduce(function (a, b) {
                                return a + result[b].weight_gross;
                            }, 0);
                            d['weight_net'] = Object.keys(result).reduce(function (a, b) {
                                return a + result[b].weight_net;
                            }, 0);
                            d['weight_tare'] = Object.keys(result).reduce(function (a, b) {
                                return a + result[b].weight_tare;
                            }, 0);
                            res.json(Object.keys(d).sort().reduce((r, k) => (r[k] = d[k], r), {})); //sort keys es2015
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
                r.table("payment")
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
        if (req.body.id != '' && req.body.id != null) {
            result.id = req.body.id;
            db.query(function (conn) {
                r.table("payment")
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
router.delete('/delete/id/:id', function (req, res, next) {
    var result = { result: false, message: null, id: null };
    if (req.params.id != '' && req.params.id != null) {
        result.id = req.params.id;
        db.query(function (conn) {
            var q = r.table("payment").get(req.params.id).do(function (result) {
                return r.branch(
                    result('pay_status').eq(false)
                    , r.table("payment").get(req.params.id).delete()
                    , r.expr("Can't delete because this status = true.")
                )
            })
            q.run(conn)
                .then(function (response) {
                    result.message = response;
                    if (response.errors == 0) {
                        result.result = true;
                    }
                    res.json(result);
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
});
module.exports = router;

