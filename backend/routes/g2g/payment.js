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
        "exporter_id": {
            "type": "string"
        },
        "fee_id": {
            "type": "string"
        },
        "pay_no": {
            "type": "string"
        },
        "pay_amount": {
            "type": "number"
        },
        "pay_date": {
            "type": "string",
            "format": "date"
        },
        "bank_id": {
            "type": "string"
        },
        "bank_branch": {
            "type": "string"
        }
    },
    "required": ["exporter_id", "fee_id", "pay_no", "pay_amount", "pay_date", "bank_id", "bank_branch"]
};
var validate = ajv.compile(schema);
router.get('/exporter/id/:id', function (req, res, next) {
    db.query(function (conn) {
        r.db('g2g').table('fee')
            .filter({ fee_status: true })
            .merge(function (me1) {
                return {
                    invoice: me1('invoice').merge(function (me2) {
                        return {
                            invoice_detail: me2('invoice_detail').merge(function (me3) {
                                return r.branch(r.db('g2g').table('shipment_detail').filter({
                                    id: me3('shm_det_id'),
                                    exporter_id: req.params.id
                                }).coerceTo('array').eq([])
                                    , 0
                                    , r.db('g2g')
                                        .table('shipment_detail')
                                        .filter({
                                            id: me3('shm_det_id'),
                                            exporter_id: req.params.id
                                        })
                                        .merge({ shm_det_id: me3('shm_det_id') })
                                        .eqJoin("shm_id", r.db('g2g').table("shipment")).without({ right: ["id", "date_created", "date_updated"] }).zip()
                                        .eqJoin("cl_id", r.db('g2g').table("confirm_letter")).without({ right: ["id", "date_created", "date_updated", "cl_date", "cl_name", "cl_quality"] }).zip()
                                        .eqJoin("package_id", r.db('common').table("package")).without({ right: ["id", "date_created", "date_updated"] }).zip()
                                        // .eqJoin("exporter_id", r.db('external_f3').table("exporter")).without({ right: ["id","date_created","date_updated"] }).zip()
                                        // .eqJoin("trader_id", r.db('external_f3').table("trader")).without({ right: ["id","date_created","date_updated"] }).zip()
                                        // .eqJoin("seller_id", r.db('external_f3').table("seller")).without({ right: ["id","date_created","date_updated", "country_id"] }).zip()
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
                                        .coerceTo('array')(0)
                                        .without('id', 'cl_type_rice', 'shm_det_quantity')

                                )
                            })
                        }
                    })
                        .merge(function (me2) {
                            return {
                                invoice_detail: me2('invoice_detail').filter(function (child) {
                                    return child.eq(0).not()
                                }),

                            }
                        })
                        .merge(function (me2) {
                            return me2.merge(function (me3) {
                                return {
                                    amount_usd: me3('invoice_detail').sum('amount_usd'),
                                    amount_fee: me3('invoice_detail').sum('invoice_fee'),
                                    shm_id: me3('invoice_detail')('shm_id')(0)
                                }
                            })
                        })
                    // .filter(function (f) {
                    //     return f.eq(0).not()
                    // })
                }
            })
            .merge(function (me1) {
                return {
                    fee_id: me1('id'),
                    fee_date_receipt : me1('fee_date_receipt').split('T')(0),
                    shm_id: me1('invoice')('shm_id')(0),
                    amount_usd: me1('invoice').sum('amount_usd'),
                    amount_thb: me1('invoice').sum('amount_usd').mul(me1('rate_bank')),
                    amount_fee: me1('invoice').sum('amount_fee'),
                    amount_thb_balance: me1('invoice').sum('amount_usd')
                        .mul(
                        me1('rate_bank')
                        ).sub(
                        me1('invoice').sum('amount_fee')
                        )
                }
            })
            .without('id', 'invoice')
            .merge(function (me1) {
                return r.branch(r.db('g2g').table('payment').filter({
                    fee_id: me1('fee_id')
                    , exporter_id: req.params.id
                }).coerceTo('array').eq([])
                    , { pay_status: false, pay_date: '-' }
                    , r.db('g2g').table("payment")
                        .filter({
                            fee_id: me1('fee_id'),
                            exporter_id: req.params.id
                        })
                        .eqJoin("bank_id", r.db('common').table("bank")).without({ right: ["id", "date_created", "date_updated"] }).zip()
                        .coerceTo('array')(0)
                        .merge(function (me2) {
                            return {
                                pay_id: me2('id'),
                                pay_status: true,
                                pay_date: me2('pay_date').split('T')(0)
                            }
                        })
                        .without('id')

                )
            })
            .merge(function (me1) {
                return r.db('g2g').table('shipment').get(me1('shm_id')).without('id')
            })
            .orderBy('pay_status', 'shm_no', 'fee_no')
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
router.post('/insert', function (req, res, next) {
    //console.log(req.body);
    var valid = validate(req.body);
    var result = { result: false, message: null, id: null };
    if (valid) {
        //console.log(req.body);
        if (req.body.id == null) {
            datacontext.insert("g2g", "payment", req.body, res);
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
        datacontext.update("g2g", "payment", req.body, res);
    } else {
        result.message = ajv.errorsText(validate.errors);
        res.json(result);
    }
});

module.exports = router;

