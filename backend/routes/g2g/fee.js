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
            .getAll(req.params.contract_id, { index: 'tags' }).without('tags')
            .eqJoin('shm_id', r.db('g2g').table('shipment')).pluck("left", { right: ['shm_no', 'shm_name', 'cl_id'] }).zip()
            // .eqJoin('cl_id', r.db('g2g').table('confirm_letter')).pluck("left", { right: ['cl_name', 'cl_no', 'contract_id'] }).zip()
            .filter({ 'fee_status': false })
            .merge(function (m) {
                return {
                    fee_id: m('id'),
                    fee_detail: r.db('g2g').table('fee_detail').getAll(m('id'), { index: 'fee_id' })
                        .coerceTo('array')
                        .merge(function (inv_merge) {
                            return {
                                invoice: inv_merge('invoice').merge(function (inv_det_merge) {
                                    return r.db('g2g').table('invoice').get(inv_det_merge('invoice_id'))
                                }).merge(function (inv_det_merge) {
                                    return {
                                        invoice_detail: inv_det_merge('invoice_detail').merge(function (shm_det_merge) {
                                            return r.db('g2g').table('shipment_detail').get(shm_det_merge('shm_det_id'))
                                                .pluck('package_id', 'type_rice_id', 'price_per_ton', 'shm_det_quantity', 'shm_id')
                                                .merge(function (usd_merge) {
                                                    return {
                                                        usd_value: usd_merge('price_per_ton').mul(usd_merge('shm_det_quantity'))
                                                    }
                                                })
                                        })
                                    }
                                })
                                    .merge(function (inv_det_merge) {
                                        return { usd_value: inv_det_merge('invoice_detail').sum('usd_value') }
                                    })
                                    .pluck('usd_value', 'invoice_no'),
                                fee_det_id: inv_merge('id')
                            }
                        })
                        .merge(function (inv_merge) {
                            return {
                                invoice_no: inv_merge('invoice').getField('invoice_no')
                                    .reduce(function (left, right) {
                                        return left.add(', ', right)
                                    }),
                                invoice_count: inv_merge('invoice').getField('invoice_no').count(),
                                usd_value: inv_merge('invoice').sum('usd_value'),
                                fee_date_receipt: inv_merge('fee_date_receipt').split('T')(0)
                            }
                        })
                        .without('invoice', 'id')
                }
            })
            .merge(function (m) {
                return {
                    usd_value: m('fee_detail').sum('usd_value')
                }
            })
            .without('id', 'fee_detail')
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
                                invoice: inv_merge('invoice').merge(function (inv_det_merge) {
                                    return r.db('g2g').table('invoice').get(inv_det_merge('invoice_id'))
                                }).merge(function (inv_det_merge) {
                                    return {
                                        invoice_detail: inv_det_merge('invoice_detail').merge(function (shm_det_merge) {
                                            return r.db('g2g').table('shipment_detail').get(shm_det_merge('shm_det_id'))
                                                .pluck('package_id', 'type_rice_id', 'price_per_ton', 'shm_det_quantity', 'shm_id')
                                                .merge(function (usd_merge) {
                                                    return {
                                                        usd_value: usd_merge('price_per_ton').mul(usd_merge('shm_det_quantity'))
                                                    }
                                                })
                                        })
                                    }
                                })
                                    .merge(function (inv_det_merge) {
                                        return { usd_value: inv_det_merge('invoice_detail').sum('usd_value') }
                                    })
                                    .pluck('usd_value', 'invoice_no'),
                                fee_det_id: inv_merge('id')
                            }
                        })
                        .merge(function (inv_merge) {
                            return {
                                invoice_no: inv_merge('invoice').getField('invoice_no')
                                    .reduce(function (left, right) {
                                        return left.add(', ', right)
                                    }),
                                invoice_count: inv_merge('invoice').getField('invoice_no').count(),
                                usd_value: inv_merge('invoice').sum('usd_value'),
                                fee_date_receipt: inv_merge('fee_date_receipt').split('T')(0),
                                fee_det_status_name: r.branch(inv_merge('fee_det_status').eq(true), 'อนุมัติ', 'ยังไม่อนุมัติ')
                            }
                        })
                        .without('invoice', 'id', 'tags')
                }
            }).without('id', 'tags')
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
                        .pluck("id", "shm_id", "package_id", "exporter_id", "shm_det_quantity", "type_rice_id", "price_per_ton")
                        .eqJoin("shm_id", r.db('g2g').table("shipment")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
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
                    weight_gross: m('invoice_detail').sum('weight_gross'),
                    weight_net: m('invoice_detail').sum('weight_net'),
                    weight_tare: m('invoice_detail').sum('weight_tare'),
                    amount_usd: m('invoice_detail').sum('amount_usd'),
                }
            })
            .without("id")
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
            .eqJoin("shm_id", r.db('g2g').table("shipment")).pluck("left", { right: ["cl_id", "contract_id"] }).zip()
            .run(conn, function (err, cursor) {
                if (!err) {
                    cursor.toArray(function (err, result) {
                        if (!err) {
                            // res.json(result);
                            d['invoice'] = result;
                            d['cl_id'] = result[0].cl_id;
                            d['contract_id'] = result[0].contract_id;
                            d['shm_id'] = result[0].shm_id;
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
router.get('/approve/id/:fee_id', function (req, res, next) {
    db.query(function (conn) {
        r.db('g2g').table('fee_detail').getAll(req.params.fee_id, { index: 'fee_id' })
            .merge(function (fee_det_merge) {
                return r.db('g2g').table('fee').get(fee_det_merge('fee_id')).pluck('shm_id')
            })
            .eqJoin('shm_id', r.db('g2g').table('shipment')).pluck("left", { right: "contract_id" }).zip()
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
                                            amount: shm_det_merge('value_bath').sub(shm_det_merge('invoice_fee'))
                                        }
                                    })
                                    .map(function (inv_det_map) {
                                        return {
                                            invoice_exporter_no: "",
                                            invoice_exporter_date: "",
                                            tags: [
                                                fee_det_merge('fee_id'),
                                                invoice_merge('shm_id'),
                                                fee_det_merge('contract_id')
                                            ],
                                            fee_det_id: fee_det_merge('id'),
                                            invoice_fee: inv_det_map('invoice_fee'),
                                            invoice_id: invoice_merge('invoice_id'),
                                            shm_det_id: inv_det_map('shm_det_id'),
                                            exporter_id: inv_det_map('exporter_id'),
                                            pay_amount: inv_det_map('amount').sub(inv_det_map('amount').mul(0.01))
                                        }
                                    })
                            }
                        })
                        .getField('invoice_detail')
                }
            })
            .merge(function (inv_merge) {
                return {
                    invoice: inv_merge('invoice')
                        .reduce(function (left, right) {
                            return left.add(right);
                        })
                }
            })
            .getField('invoice')
            .reduce(function (left, right) {
                return left.add(right);
            })
            .do(function (delete_do) {
                return r.db('g2g').table('payment_detail').getAll(req.params.fee_id, { index: 'tags' }).delete()
                    .do(function (check_delete_do) {
                        return r.branch(
                            check_delete_do('errors').eq(0),
                            r.db('g2g').table('payment_detail').insert(delete_do)
                                .do(function (insert_do) {
                                    return r.branch(
                                        insert_do('inserted').gt(0),
                                        r.db('g2g').table('fee').get(req.params.fee_id).update({ fee_status: true })
                                            .do(function (update_do) {
                                                return update_do('replaced').eq(1).or(update_do('unchanged').eq(1))
                                            }),
                                        false
                                    )
                                }),
                            false
                        )
                    })
            })
            .run(conn, function (err, cursor) {
                if (!err) {
                    res.json(cursor)
                    // cursor.toArray(function (err, result) {
                    //     if (!err) {
                    //         return res.json(result)
                    //     } else {
                    //         return res.json(null)
                    //     }
                    // })
                } else {
                    res.json(null);
                }
            });
    })
})
router.get('/payment/contract/id/:contract_id', function (req, res, next) {
    db.query(function (conn) {
        r.db('g2g').table('fee')
            .getAll(req.params.contract_id, { index: 'tags' }).without('tags')
            .eqJoin('shm_id', r.db('g2g').table('shipment')).pluck("left", { right: ['shm_no', 'shm_name', 'cl_id'] }).zip()
            // .eqJoin('cl_id', r.db('g2g').table('confirm_letter')).pluck("left", { right: ['cl_name', 'cl_no', 'contract_id'] }).zip()
            .filter({ 'fee_status': true })
            .merge(function (m) {
                return {
                    fee_id: m('id'),
                    fee_detail: r.db('g2g').table('fee_detail').getAll(m('id'), { index: 'fee_id' })
                        .coerceTo('array')
                        .merge(function (inv_merge) {
                            return {
                                invoice: inv_merge('invoice').merge(function (inv_det_merge) {
                                    return r.db('g2g').table('invoice').get(inv_det_merge('invoice_id'))
                                }).merge(function (inv_det_merge) {
                                    return {
                                        invoice_detail: inv_det_merge('invoice_detail').merge(function (shm_det_merge) {
                                            return r.db('g2g').table('shipment_detail').get(shm_det_merge('shm_det_id'))
                                                .pluck('package_id', 'type_rice_id', 'price_per_ton', 'shm_det_quantity', 'shm_id')
                                                .merge(function (usd_merge) {
                                                    return {
                                                        usd_value: usd_merge('price_per_ton').mul(usd_merge('shm_det_quantity'))
                                                    }
                                                })
                                        })
                                    }
                                })
                                    .merge(function (inv_det_merge) {
                                        return { usd_value: inv_det_merge('invoice_detail').sum('usd_value') }
                                    })
                                    .pluck('usd_value', 'invoice_no'),
                                fee_det_id: inv_merge('id')
                            }
                        })
                        .merge(function (inv_merge) {
                            return {
                                invoice_no: inv_merge('invoice').getField('invoice_no')
                                    .reduce(function (left, right) {
                                        return left.add(', ', right)
                                    }),
                                invoice_count: inv_merge('invoice').getField('invoice_no').count(),
                                usd_value: inv_merge('invoice').sum('usd_value'),
                                fee_date_receipt: inv_merge('fee_date_receipt').split('T')(0)
                            }
                        })
                        .without('invoice', 'id')
                }
            })
            .merge(function (m) {
                return {
                    usd_value: m('fee_detail').sum('usd_value')
                }
            })
            .without('id', 'fee_detail')
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

