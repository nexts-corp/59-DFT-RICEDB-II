var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');

var DataContext = require('../../class/DataContext.js');
var datacontext = new DataContext();

var Ajv = require('ajv');
var ajv = Ajv({ allErrors: true, coerceTypes: 'array' });
var schema = {
    //'type': 'object',
    "properties": {
        "id": {
            "type": "string"
        },
        "fee_id": {
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
        // "fee_no": {
        //     "type": "number"
        // },
        // "fee_name": {
        //     "type": "string"
        // },
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
        "fee_det_status": {
            "type": "boolean"
        }
    },
    "required": ["fee_id", "fee_foreign", "fee_internal", "fee_other", "fee_date_receipt", "rate_bank", "rate_tt", "invoice", "fee_det_status"]
};
router.get('/id/:fee_det_id', function (req, res, next) {
    db.query(function (conn) {
        r.db('g2g').table('fee_detail')
            .get(req.params.fee_det_id)
            .merge(function (fee_merge) {
                return {
                    invoice: fee_merge('invoice').map(function (fee_map) {
                        return fee_map.merge(function (fee_merge1) {
                            return r.db('g2g').table('invoice')
                                .get(fee_merge1('invoice_id'))
                                .merge(function (m) {
                                    return {
                                        shipment_detail: r.db('g2g').table('shipment_detail')
                                            .getAll(m('book_id'), { index: 'book_id' })
                                            .coerceTo('array')
                                            .pluck("id", "shm_id", "package_id", "exporter_id", "shm_det_quantity", "type_rice_id")
                                            .eqJoin("shm_id", r.db('g2g').table("shipment")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
                                            .eqJoin("cl_id", r.db('g2g').table("confirm_letter")).without({ right: ['id', 'date_created', 'date_updated', 'creater', 'updater', "cl_date", "cl_name", "cl_quality"] }).zip()
                                            .eqJoin("package_id", r.db('common').table("package")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
                                            .eqJoin("exporter_id", r.db('external_f3').table("exporter")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
                                            .eqJoin("trader_id", r.db('external_f3').table("trader")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
                                            .eqJoin("seller_id", r.db('external_f3').table("seller")).without({ right: ['id', 'date_created', 'date_updated', 'creater', 'updater', "country_id"] }).zip()
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
                                    return r.db('g2g').table('book').get(m('book_id')).without('id', 'date_created', 'date_updated', 'creater', 'updater')
                                })
                                .merge(function (m) {
                                    return {
                                        invoice_id: m('id'),
                                        // ship: m('group_ship')('ship')(0),
                                        // shipline_id: m('group_ship')('shipline_id')(0),
                                        // ship_lot_no: m('group_ship')('ship_lot_no')(0),
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
                                .without("id", "shipment_detail")
                                .merge(function (m) {
                                    return r.db('common').table("shipline").get(m('shipline_id')).without('id', 'date_created', 'date_updated', 'creater', 'updater')
                                    // r.db('common').table("ship").get(m('ship_id')).without('id'),
                                })
                                .merge(function (m) {
                                    return {
                                        ship: m('ship').map(function (arr_ship) {
                                            return arr_ship.merge(function (row_ship) {
                                                return r.db('common').table('ship').get(row_ship('ship_id')).without('id', 'date_created', 'date_updated', 'creater', 'updater')
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

router.post('/insert', function (req, res, next) {
    var valid = validate(req.body);
    var result = { result: false, message: null, id: null };
    if (valid) {
        if (req.body.id == null) {
            datacontext.insert("g2g", "fee_detail", req.body, res);
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
        datacontext.update("g2g", "fee_detail", req.body, res);
    } else {
        result.message = ajv.errorsText(validate.errors);
        res.json(result);
    }
});
router.delete('/delete/id/:id', function (req, res, next) {
    datacontext.delete("g2g", "fee_detail", req.params.id, res);
});

module.exports = router;