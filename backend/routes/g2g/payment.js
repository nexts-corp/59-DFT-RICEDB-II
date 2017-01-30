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
        "pay_no": {
            "type": "number"
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
    "required": ["pay_no", "pay_amount", "pay_date", "bank_id", "bank_branch"]
};
var validate = ajv.compile(schema);
router.get('/contract/id/:contract_id', function (req, res, next) {
    db.query(function (conn) {
        r.db('g2g').table('payment_detail')
            .getAll(req.params.contract_id, { index: 'tags' })
            .filter({ pay_det_status: false })
            .merge({ pay_det_id: r.row('id') })
            .without('id', 'tags')
            .group("invoice_id")
            .ungroup()
            .map(det_map => {
                return {
                    invoice_id: det_map('group'),
                    payment_detail: det_map('reduction')
                        .eqJoin('shm_det_id', r.db('g2g').table('shipment_detail'))
                        .pluck("left", { right: ['book_id', 'type_rice_id', 'package_id', 'price_per_ton', 'shm_det_quantity'] }).zip()
                        .eqJoin('book_id', r.db('g2g').table('book'))
                        .pluck("left", { right: ['ship', 'ship_lot_no'] }).zip()
                        .eqJoin('type_rice_id', r.db('common').table('type_rice'))
                        .pluck("left", { right: 'type_rice_name_th' }).zip()
                        .eqJoin('package_id', r.db('common').table('package'))
                        .pluck("left", { right: 'package_kg_per_bag' }).zip()
                        .eqJoin('fee_det_id', r.db('g2g').table('fee_detail'))
                        .pluck("left", { right: ['rate_tt', 'rate_bank', 'fee_date_receipt'] }).zip()
                        .merge(fee_det_merge => {
                            return {
                                amount_usd: fee_det_merge('shm_det_quantity').mul(fee_det_merge('price_per_ton')),
                                amount_bath: fee_det_merge('shm_det_quantity').mul(fee_det_merge('price_per_ton')).mul(fee_det_merge('rate_bank')),
                                amount_bath_fee: fee_det_merge('pay_amount').mul(100).div(99),
                                fee_date_receipt: fee_det_merge('fee_date_receipt').split('T')(0),
                                ship: fee_det_merge('ship').map(ship_map => {
                                    return r.db('common').table('ship').get(ship_map('ship_id')).getField('ship_name')
                                        .add(' V.', ship_map('ship_voy_no'))

                                }).reduce((left, right) => {
                                    return left.add(' / ', right)
                                }),
                                exporter_name: r.db('external_f3').table('exporter').get(fee_det_merge('exporter_id'))
                                    .getField('trader_id').do(function (trader_do) {
                                        return r.db('external_f3').table('trader').get(trader_do).getField('seller_id').do(function (seller_do) {
                                            return r.db('external_f3').table('seller').get(seller_do).getField('seller_name_th')
                                        })
                                    }),
                                pay_det_status_name: r.branch(fee_det_merge('pay_det_status').eq(true), 'จ่ายแล้ว', 'ยังไม่ได้จ่าย')
                            }
                        })
                }
            })
            .eqJoin('invoice_id', r.db('g2g').table('invoice'))
            .pluck("left", { right: ['invoice_no', 'invoice_date'] }).zip()
            .merge(inv_merge => {
                return {
                    invoice_date: inv_merge('invoice_date').split('T')(0)
                }
            })
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
router.get('/fee/id/:fee_id', function (req, res, next) {
    db.query(function (conn) {
        r.db('g2g').table('payment_detail').getAll(req.params.fee_id, { index: 'tags' }).without('tags')
            .merge({ pay_det_id: r.row('id') })
            .without('id')
            .group("invoice_id")
            .ungroup()
            .map(det_map => {
                return {
                    invoice_id: det_map('group'),
                    payment_detail: det_map('reduction')
                        .eqJoin('shm_det_id', r.db('g2g').table('shipment_detail'))
                        .pluck("left", { right: ['book_id', 'type_rice_id', 'package_id', 'price_per_ton', 'shm_det_quantity'] }).zip()
                        .eqJoin('book_id', r.db('g2g').table('book'))
                        .pluck("left", { right: ['ship', 'ship_lot_no'] }).zip()
                        .eqJoin('type_rice_id', r.db('common').table('type_rice'))
                        .pluck("left", { right: 'type_rice_name_th' }).zip()
                        .eqJoin('package_id', r.db('common').table('package'))
                        .pluck("left", { right: 'package_kg_per_bag' }).zip()
                        .eqJoin('fee_det_id', r.db('g2g').table('fee_detail'))
                        .pluck("left", { right: ['rate_tt', 'rate_bank', 'fee_date_receipt'] }).zip()
                        .merge(fee_det_merge => {
                            return {
                                amount_usd: fee_det_merge('shm_det_quantity').mul(fee_det_merge('price_per_ton')),
                                amount_bath: fee_det_merge('shm_det_quantity').mul(fee_det_merge('price_per_ton')).mul(fee_det_merge('rate_bank')),
                                amount_bath_fee: fee_det_merge('pay_amount').mul(100).div(99),
                                fee_date_receipt: fee_det_merge('fee_date_receipt').split('T')(0),
                                ship: fee_det_merge('ship').map(ship_map => {
                                    return r.db('common').table('ship').get(ship_map('ship_id')).getField('ship_name')
                                        .add(' V.', ship_map('ship_voy_no'))

                                }).reduce((left, right) => {
                                    return left.add(' / ', right)
                                }),
                                exporter_name: r.db('external_f3').table('exporter').get(fee_det_merge('exporter_id'))
                                    .getField('trader_id').do(function (trader_do) {
                                        return r.db('external_f3').table('trader').get(trader_do).getField('seller_id').do(function (seller_do) {
                                            return r.db('external_f3').table('seller').get(seller_do).getField('seller_name_th')
                                        })
                                    }),
                                pay_det_status_name: r.branch(fee_det_merge('pay_det_status').eq(true), 'จ่ายแล้ว', 'ยังไม่ได้จ่าย')
                            }
                        })
                }
            })
            .eqJoin('invoice_id', r.db('g2g').table('invoice'))
            .pluck("left", { right: ['invoice_no', 'invoice_date'] }).zip()
            .merge(inv_merge => {
                return {
                    invoice_date: inv_merge('invoice_date').split('T')(0)
                }
            })
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

