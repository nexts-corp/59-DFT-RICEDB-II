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
        "fee_foreign": {
            "type": "number"
        },
        "fee_internal": {
            "type": "number"
        },
        "fee_other": {
            "type": "number"
        },
        "fee_date_receipt": {
            "type": "string",
            "format": "date-time"
        },
        "fee_no": {
            "type": "string"
        },
        "fee_name": {
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
                                "invoice_fee": {
                                    "type": "number"
                                },
                                "invoice_no": {
                                    "type": "string"
                                },
                                "shm_det_id": {
                                    "type": "string"
                                }
                            },
                            "required": ["invoice_date", "invoice_fee", "invoice_no", "shm_det_id"]
                        }
                    },
                },
                "required": ["invoice_id", "invoice_detail"]
            }
        },
        "fee_status": {
            "type": "boolean"
        }
    },
    "required": ["fee_foreign", "fee_internal", "fee_other", "fee_date_receipt", "fee_no", "fee_name", "rate_bank", "rate_tt", "invoice", "fee_status"]
};
var validate = ajv.compile(schema);
router.get('/contract/id/:contract_id', function (req, res, next) {
    db.query(function (conn) {
        r.db('g2g').table('fee')
            .filter({ fee_status: false })
            .merge(function (m) {
                return {
                    fee_id: m('id'),
                    invoice: m('invoice').merge(function (inv_mer) {
                        return {
                            invoice_detail: inv_mer('invoice_detail').merge(function (det_map) {
                                return r.db('g2g').table('shipment_detail').get(det_map('shm_det_id'))
                                    .merge(function (shm_det_mer) {
                                        return r.db('g2g').table('shipment').get(shm_det_mer('shm_id'))
                                    })
                                    .merge(function (shm_det_mer) {
                                        return r.db('g2g').table('confirm_letter').get(shm_det_mer('cl_id'))
                                    })
                                    .pluck('cl_id', 'cl_no', 'cl_name', 'cl_status', 'shm_id', 'shm_no', 'shm_name', 'shm_status')
                            })
                        }
                    })
                        .merge(function (inv_mer) {
                            return inv_mer('invoice_detail')(0)
                        })
                        .group(function (g) {
                            return g.pluck('cl_id', 'cl_no', 'cl_name', 'cl_status', 'shm_id', 'shm_no', 'shm_name', 'shm_status')
                        })
                        .ungroup()
                        .without('reduction')
                        .getField('group')(0)
                }
            })
            .merge(function (m) {
                return m('invoice')
            })
            .without('id', 'invoice')
            .eqJoin("cl_id", r.db('g2g').table("confirm_letter")).without({ right: ["id", "date_created", "date_updated", "cl_type_rice"] }).zip()
            .filter(
            r.row('contract_id').eq(req.params.contract_id)
                .and(r.row('fee_status').eq(false))
            )
            .merge(function (m) {
                return {
                    cl_date: m('cl_date').split('T')(0),
                    fee_date_receipt: m('fee_date_receipt').split('T')(0)
                }
            })
            .group(function (g) {
                return g.pluck(
                    'contract_id', 'cl_id', 'cl_no', 'cl_name', 'cl_status', 'shm_id', 'shm_no', 'shm_name', 'shm_status'
                )
            })
            .ungroup()
            .merge(function (me) {
                return {
                    contract_id: me('group')('contract_id'),
                    cl_id: me('group')('cl_id'),
                    cl_no: me('group')('cl_no'),
                    cl_name: me('group')('cl_name'),
                    cl_status: me('group')('cl_status'),
                    shm_id: me('group')('shm_id'),
                    shm_no: me('group')('shm_no'),
                    shm_name: me('group')('shm_name'),
                    shm_status: me('group')('shm_status'),
                    fee_detail: me('reduction')
                }
            })
            .without("group", "reduction")
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
router.get('/id/:id', function (req, res, next) {
    db.query(function (conn) {
        r.db('g2g').table('fee')
            .get(req.params.id)
            .merge(function (fee_merge) {
                return {
                    invoice: fee_merge('invoice').map(function (fee_map) {
                        return fee_map.merge(function (fee_merge1) {
                            return r.db('g2g').table('invoice')
                                .get(fee_merge1('invoice_id'))
                                .merge(function (m) {
                                    return {
                                        group_ship: r.db('g2g').table('shipment_detail')
                                            .filter({ bl_no: m('bl_no') })
                                            .coerceTo('array')
                                            .group(function (g) {
                                                return g.pluck(
                                                    "ship", "shipline_id", "ship_lot_no"//, "ship_voy_no"
                                                )
                                            })
                                            .ungroup()
                                            .merge(function (me) {
                                                return {
                                                    ship: me('group')('ship'),
                                                    shipline_id: me('group')('shipline_id'),
                                                    ship_lot_no: me('group')('ship_lot_no'),
                                                    //ship_voy_no: me('group')('ship_voy_no')
                                                }
                                            }),
                                        shipment_detail: r.db('g2g').table('shipment_detail')
                                            .filter({ bl_no: m('bl_no') })
                                            .coerceTo('array')
                                            .pluck("id", "shm_id", "package_id", "exporter_id", "shm_det_quantity", "type_rice_id")
                                            .eqJoin("shm_id", r.db('g2g').table("shipment")).without({ right: ["id", "date_created", "date_updated"] }).zip()
                                            .eqJoin("cl_id", r.db('g2g').table("confirm_letter")).without({ right: ["id", "date_created", "date_updated", "cl_date", "cl_name", "cl_quality"] }).zip()
                                            .eqJoin("package_id", r.db('common').table("package")).without({ right: ["id", "date_created", "date_updated"] }).zip()
                                            .eqJoin("exporter_id", r.db('external_f3').table("exporter")).without({ right: ["id", "date_created", "date_updated"] }).zip()
                                            .eqJoin("trader_id", r.db('external_f3').table("trader")).without({ right: ["id", "date_created", "date_updated"] }).zip()
                                            .eqJoin("seller_id", r.db('external_f3').table("seller")).without({ right: ["id", "date_created", "date_updated", "country_id"] }).zip()
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
                                                    quantity_tons: m1('shm_det_quantity'),
                                                    quantity_bags: m1('shm_det_quantity').mul(1000).div(m1('package_kg_per_bag'))

                                                }
                                            })
                                            .merge(function (m1) {
                                                return {
                                                    weight_gross: m1('quantity_bags').mul(m1('package_kg_per_bag').add(m1('package_weight_bag').div(1000))).div(1000),
                                                    weight_net: m1('quantity_bags').mul(m1('package_kg_per_bag')).div(1000),
                                                    weight_tare: m1('quantity_bags').mul(m1('package_weight_bag').div(1000)).div(1000)
                                                }
                                            })
                                            .merge(function (m1) {
                                                return {
                                                    amount_usd: m1('price_per_ton').mul(m1('weight_net'))
                                                }
                                            })
                                            .without('id', 'cl_type_rice', 'shm_det_quantity')
                                    }
                                })
                                .merge(function (m) {
                                    return {
                                        invoice_id: m('id'),
                                        ship: m('group_ship')('ship')(0),
                                        shipline_id: m('group_ship')('shipline_id')(0),
                                        ship_lot_no: m('group_ship')('ship_lot_no')(0),
                                        //  ship_voy_no: m('group_ship')('ship_voy_no')(0),
                                        weight_gross: m('shipment_detail').sum('weight_gross'),
                                        weight_net: m('shipment_detail').sum('weight_net'),
                                        weight_tare: m('shipment_detail').sum('weight_tare'),
                                        amount_usd: m('shipment_detail').sum('amount_usd'),
                                        invoice_date: m('invoice_date').split('T')(0),
                                        invoice_detail: fee_merge1('invoice_detail').map(function (map1) {
                                            return m('shipment_detail').filter({ shm_det_id: map1('shm_det_id') })(0).merge(map1)
                                                .merge(function (m2) {
                                                    return {
                                                        exporter_date_approve: m2('exporter_date_approve').split('T')(0),
                                                        exporter_date_update: m2('exporter_date_update').split('T')(0),
                                                        invoice_date: m2('invoice_date').split('T')(0),
                                                        trader_date_approve: m2('trader_date_approve').split('T')(0)
                                                    }
                                                })
                                        })
                                    }
                                })
                                .without("id", "group_ship", "shipment_detail")
                                .merge(function (m) {
                                    return r.db('common').table("shipline").get(m('shipline_id')).without('id')
                                    // r.db('common').table("ship").get(m('ship_id')).without('id'),
                                })
                                .merge(function (m) {
                                    return {
                                        ship: m('ship').map(function (arr_ship) {
                                            return arr_ship.merge(function (row_ship) {
                                                return r.db('common').table('ship').get(row_ship('ship_id')).without('id', 'date_created', 'date_updated')
                                            })
                                        })
                                    }
                                })
                        })
                    })
                }
            })
            .merge(function (fee_merge) {
                return {
                    fee_id: fee_merge('id'),
                    fee_date_receipt: fee_merge('fee_date_receipt').split('T')(0),
                    amount_usd: fee_merge('invoice').sum('amount_usd'),
                    weight_gross: fee_merge('invoice').sum('weight_gross'),
                    weight_net: fee_merge('invoice').sum('weight_net'),
                    weight_tare: fee_merge('invoice').sum('weight_tare')
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
        r.db('g2g').table('shipment_detail')
            .filter({ shm_id: req.params.shm_id })
            .group(function (g) {
                return g.pluck(
                    "ship", "load_port_id", "dest_port_id", "deli_port_id", "bl_no", "shm_id", "shipline_id"//, "ship_voy_no"
                )
            })
            .ungroup()
            .merge(function (me) {
                return {
                    shm_id: me('group')('shm_id'),
                    bl_no: me('group')('bl_no'),
                    ship: me('group')('ship'),
                    //ship_voy_no: me('group')('ship_voy_no'),
                    shipline_id: me('group')('shipline_id'),
                    load_port_id: me('group')('load_port_id'),
                    dest_port_id: me('group')('dest_port_id'),
                    deli_port_id: me('group')('deli_port_id'),
                    //quantity: me('reduction')
                }
            })
            .without("group", "reduction")
            .outerJoin(r.db('g2g').table("invoice"),
            function (detail, invoice) {
                return invoice("bl_no").eq(detail("bl_no"))
            })
            .zip()
            .filter(r.row.hasFields('invoice_no'))
            .merge(function (m) {
                return {
                    invoice_id: m('id'),
                    ship: m('ship').map(function (arr_ship) {
                        return arr_ship.merge(function (row_ship) {
                            return r.db('common').table('ship').get(row_ship('ship_id')).without('id', 'date_created', 'date_updated')
                        })
                    })
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
        r.db('g2g').table('invoice')
            .filter(function (f) {
                return r.expr(req.params.invoice_id.split('_'))
                    .contains(f('id'))
            })
            .merge(function (m) {
                return {
                    group_ship: r.db('g2g').table('shipment_detail')
                        .filter({ bl_no: m('bl_no') })
                        .coerceTo('array')
                        .group(function (g) {
                            return g.pluck(
                                "ship", "shipline_id", "ship_lot_no"//, "ship_voy_no"
                            )
                        })
                        .ungroup()
                        .merge(function (me) {
                            return {
                                ship: me('group')('ship'),
                                shipline_id: me('group')('shipline_id'),
                                ship_lot_no: me('group')('ship_lot_no'),
                                //ship_voy_no: me('group')('ship_voy_no')
                            }
                        }),
                    invoice_detail: r.db('g2g').table('shipment_detail')
                        .filter({ bl_no: m('bl_no') })
                        .coerceTo('array')
                        .pluck("id", "shm_id", "package_id", "exporter_id", "shm_det_quantity", "type_rice_id")
                        .eqJoin("shm_id", r.db('g2g').table("shipment")).without({ right: ["id", "date_created", "date_updated"] }).zip()
                        .eqJoin("cl_id", r.db('g2g').table("confirm_letter")).without({ right: ["id", "date_created", "date_updated", "cl_date", "cl_name", "cl_quality"] }).zip()
                        .eqJoin("package_id", r.db('common').table("package")).without({ right: ["id", "date_created", "date_updated"] }).zip()
                        .eqJoin("exporter_id", r.db('external_f3').table("exporter")).without({ right: ["id", "date_created", "date_updated"] }).zip()
                        .eqJoin("trader_id", r.db('external_f3').table("trader")).without({ right: ["id", "date_created", "date_updated"] }).zip()
                        .eqJoin("seller_id", r.db('external_f3').table("seller")).without({ right: ["id", "date_created", "date_updated", "country_id"] }).zip()
                        .merge(function (m1) {
                            return {
                                shm_det_id: m1('id'),
                                exporter_date_approve: m1('exporter_date_approve').split('T')(0),
                                exporter_date_update: m1('exporter_date_update').split('T')(0),
                                trader_date_approve: m1('trader_date_approve').split('T')(0),
                                price_per_ton: m1('cl_type_rice')
                                    .filter(function (tb) {
                                        return tb('type_rice_id').eq(m1('type_rice_id'))
                                    }).getField("package")(0)
                                    .filter(function (f) {
                                        return f('package_id').eq(m1('package_id'))
                                    })(0)
                                    .pluck('price_per_ton')
                                    .values()(0),
                                quantity_tons: m1('shm_det_quantity'),
                                quantity_bags: m1('shm_det_quantity').mul(1000).div(m1('package_kg_per_bag'))
                            }
                        })
                        .merge(function (m1) {
                            return {
                                weight_gross: m1('quantity_bags').mul(m1('package_kg_per_bag').add(m1('package_weight_bag').div(1000))).div(1000),
                                weight_net: m1('quantity_bags').mul(m1('package_kg_per_bag')).div(1000),
                                weight_tare: m1('quantity_bags').mul(m1('package_weight_bag').div(1000)).div(1000)
                            }
                        })
                        .merge(function (m1) {
                            return {
                                amount_usd: m1('price_per_ton').mul(m1('weight_net'))
                            }
                        })
                        .without('id', 'cl_type_rice', 'shm_det_quantity')
                }
            })
            .merge(function (m) {
                return {
                    invoice_id: m('id'),
                    invoice_date: m('invoice_date').split('T')(0),
                    ship: m('group_ship')('ship')(0),
                    shipline_id: m('group_ship')('shipline_id')(0),
                    ship_lot_no: m('group_ship')('ship_lot_no')(0),
                    //ship_voy_no: m('group_ship')('ship_voy_no')(0),
                    weight_gross: m('invoice_detail').sum('weight_gross'),
                    weight_net: m('invoice_detail').sum('weight_net'),
                    weight_tare: m('invoice_detail').sum('weight_tare'),
                    amount_usd: m('invoice_detail').sum('amount_usd'),
                }
            })
            .without("id", "group_ship")
            //.eqJoin("ship_id", r.db('common').table("ship")).without({ right: ["id", "date_created", "date_updated"] }).zip()
            .merge(function (m) {
                return {
                    ship: m('ship').map(function (arr_ship) {
                        return arr_ship.merge(function (row_ship) {
                            return r.db('common').table('ship').get(row_ship('ship_id')).without('id', 'date_created', 'date_updated')
                        })
                    })
                }
            })
            .eqJoin("shipline_id", r.db('common').table("shipline")).without({ right: ["id", "date_created", "date_updated"] }).zip()
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
        if (req.body.id == null) {
            datacontext.insert("g2g", "fee", req.body, res);
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
    var valid = validate(req.body);
    var result = { result: false, message: null, id: null };
    if (valid) {
        datacontext.update("g2g", "fee", req.body, res);
    } else {
        result.message = ajv.errorsText(validate.errors);
        res.json(result);
    }
});
router.delete('/delete/id/:id', function (req, res, next) {
    var result = { result: false, message: null, id: null };
    result.id = req.params.id;
    db.query(function (conn) {
        var q = r.db('g2g').table("fee").get(req.params.id).do(function (result) {
            return r.branch(
                result('fee_status').eq(false)
                , r.expr('delete')
                , r.expr("Can't delete because this status = true.")
            )
        })
        q.run(conn)
            .then(function (response) {
                if (response == "delete") {
                    datacontext.delete("g2g", "fee", req.params.id, res);
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

