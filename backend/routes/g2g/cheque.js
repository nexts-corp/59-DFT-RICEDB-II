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
router.get('/contract/id/:contract_id', function (req, res, next) {
    db.query(function (conn) {
        r.db('g2g').table('fee')
            .getAll(req.params.contract_id, { index: 'tags' })
            .filter({ fee_status: true })
            .merge(function (fee_merge) {
                return {
                    fee_detail: r.db('g2g').table('fee_detail').getAll(fee_merge('id'), { index: 'fee_id' })
                        .coerceTo('array')
                        .merge(function (fee_det_merge) {
                            return {
                                invoice: fee_det_merge('invoice').merge(function (invoice_merge) {
                                    return r.db('g2g').table('invoice').get(invoice_merge('invoice_id')).pluck('book_id', 'invoice_no', 'invoice_date')
                                        .merge(function (book_merge) {
                                            return {
                                                shm_id: r.db('g2g').table('shipment_detail').getAll(book_merge('book_id'), { index: 'book_id' })
                                                    .getField('shm_id')
                                                    .distinct()(0),
                                                invoice_date: book_merge('invoice_date').split('T')(0)
                                            }
                                        })
                                })
                                    .merge(function (invoice_merge) {
                                        return {
                                            invoice_detail: invoice_merge('invoice_detail').merge(function (shm_det_merge) {
                                                return r.db('g2g').table('shipment_detail').get(shm_det_merge('shm_det_id'))
                                                    .pluck('price_per_ton', 'shm_det_quantity', 'exporter_id')
                                                    .merge(function (price_merge) {
                                                        return {
                                                            value_usd: price_merge('price_per_ton').mul(price_merge('shm_det_quantity'))
                                                        }
                                                    })
                                                    .merge(function (price_merge) {
                                                        return {
                                                            value_bath: price_merge('value_usd').mul(fee_det_merge('rate_bank'))
                                                        }
                                                    })
                                            })
                                                .merge(function (shm_det_merge) {
                                                    return {
                                                        pay_bath: shm_det_merge('value_bath').sub(shm_det_merge('invoice_fee'))
                                                    }
                                                })
                                                .group('exporter_id').sum('pay_bath').ungroup()
                                                .map(function (inv_det_map) {
                                                    return {
                                                        exporter_id: inv_det_map('group'),
                                                        pay_bath: inv_det_map('reduction')
                                                    }
                                                })
                                        }
                                    })
                                    .merge(function (invoice_merge) {
                                        return {
                                            pay_bath: invoice_merge('invoice_detail').sum('pay_bath'),
                                            fee_date_receipt: fee_det_merge('fee_date_receipt').split('T')(0)
                                        }
                                    })

                            }
                        })
                        .getField('invoice')
                }
            })
            .merge(function (fee_merge) {
                return {
                    fee_detail: fee_merge('fee_detail').reduce(function (left, right) {
                        return left.union(right)
                    })
                }
            })
            .getField('fee_detail')(0)
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

