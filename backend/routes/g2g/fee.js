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
        "fee_no": {
            "type": "number"
        },
        "fee_name": {
            "type": "string"
        },
        "fee_status": {
            "type": "boolean"
        },
        "shm_id": {
            "type": "string"
        }
    },
    "required": ["fee_no", "fee_name", "fee_status", "shm_id"]
};
var validate = ajv.compile(schema);
router.get('/contract/id/:contract_id', function (req, res, next) {
    db.query(function (conn) {
        r.db('g2g').table('fee')
            .getAll(false, { index: 'fee_status' })
            .eqJoin('shm_id', r.db('g2g').table('shipment')).pluck("left", { right: ['shm_no', 'shm_name', 'cl_id'] }).zip()
            .eqJoin('cl_id', r.db('g2g').table('confirm_letter')).pluck("left", { right: ['cl_name', 'cl_no', 'contract_id'] }).zip()
            .filter({ 'contract_id': req.params.contract_id })
            .merge(function (m) {
                return {
                    fee_id: m('id')
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
})
router.get('/shm/id/:shm_id', function (req, res, next) {
    db.query(function (conn) {
        r.db('g2g').table('fee')
            .getAll(req.params.shm_id, { index: 'shm_id' })
            .merge({ fee_id: r.row('id') })
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
});
router.get('/id/:id', function (req, res, next) {
    db.query(function (conn) {
        r.db('g2g').table('fee')
            .get(req.params.id)
            .merge(function (fee_merge) {
                return {
                    fee_id: fee_merge('id'),
                    fee_detail: r.db('g2g').table('fee_detail').getAll(fee_merge('id'), { index: 'fee_id' })
                        .coerceTo('array')
                        .merge(function (inv_merge) {
                            return {
                                invoice: inv_merge('invoice').merge(function (inv_merge2) {
                                    return r.db('g2g').table('invoice').get(inv_merge2('invoice_id'))
                                })
                            }
                        })
                        .merge(function (inv_merge) {
                            return {
                                invoice_no: inv_merge('invoice').getField('invoice_no')
                                    .reduce(function (left, right) {
                                        return left.add(', ', right)
                                    }),
                                invoice_count: inv_merge('invoice').getField('invoice_no').count()
                            }
                        })
                        .without('invoice')
                }
            }).without('id')
            .run(conn, function (err, cursor) {
                if (!err) {
                    res.json(cursor);
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
                    invoice_detail: r.db('g2g').table('shipment_detail')
                        .getAll(m('book_id'), { index: 'book_id' })
                        .coerceTo('array')
                        .pluck("id", "shm_id", "package_id", "exporter_id", "shm_det_quantity", "type_rice_id")
                        .eqJoin("shm_id", r.db('g2g').table("shipment")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
                        .eqJoin("cl_id", r.db('g2g').table("confirm_letter")).without({ right: ["id", "date_created", "date_updated", "creater", "updater", "cl_date", "cl_name", "cl_quality"] }).zip()
                        .eqJoin("package_id", r.db('common').table("package")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
                        .eqJoin("exporter_id", r.db('external_f3').table("exporter")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
                        .eqJoin("trader_id", r.db('external_f3').table("trader")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
                        .eqJoin("seller_id", r.db('external_f3').table("seller")).without({ right: ["id", "date_created", "date_updated", "creater", "updater", "country_id"] }).zip()
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
            .eqJoin('book_id', r.db('g2g').table('book')).without({ right: ['id'] }).zip()
            .merge(function (m) {
                return {
                    invoice_id: m('id'),
                    invoice_date: m('invoice_date').split('T')(0),
                    // ship: m('group_ship')('ship')(0),
                    // shipline_id: m('group_ship')('shipline_id')(0),
                    // ship_lot_no: m('group_ship')('ship_lot_no')(0),
                    //ship_voy_no: m('group_ship')('ship_voy_no')(0),
                    weight_gross: m('invoice_detail').sum('weight_gross'),
                    weight_net: m('invoice_detail').sum('weight_net'),
                    weight_tare: m('invoice_detail').sum('weight_tare'),
                    amount_usd: m('invoice_detail').sum('amount_usd'),
                }
            })
            .without("id")
            // //.eqJoin("ship_id", r.db('common').table("ship")).without({ right: ["id", "date_created", "date_updated","creater","updater"] }).zip()
            .merge(function (m) {
                return {
                    ship: m('ship').map(function (arr_ship) {
                        return arr_ship.merge(function (row_ship) {
                            return r.db('common').table('ship').get(row_ship('ship_id')).without('id', 'date_created', 'date_updated')
                        })
                    })
                }
            })
            .eqJoin("shipline_id", r.db('common').table("shipline")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
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

