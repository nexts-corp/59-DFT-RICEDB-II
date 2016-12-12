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
        "contract_name": {
            "type": "string"
        },
        "buyer_id": {
            "type": "string"
        },
        "contract_date": {
            "type": "string",
            "format": "date-time"
        },
        "contract_desc": {
            "type": "string"
        },
        "contract_quantity": {
            "type": "number"
        },
        "tolerance_rate": {
            "type": "number"
        },
        "contract_type_rice": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "type_rice_id": { "type": "string" }
                },
                "required": ["type_rice_id"]
            }
        },
        "contract_status": {
            "type": "boolean"
        }
    },
    "required": ["contract_name", "buyer_id", "contract_date", "contract_quantity", "tolerance_rate", "contract_type_rice", "contract_status"]
};
var validate = ajv.compile(schema);

router.get(['/', '/list'], function (req, res, next) {
    db.query(function (conn) {
        r.db('g2g').table("contract")
            //.filter({ contract_status: true })
            .merge(function (row) {
                return {
                    contract_id: row('id'),
                    contract_date: row('contract_date').split('T')(0),
                    contract_type_rice: row('contract_type_rice').map(function (arr_type_rice) {
                        return arr_type_rice.merge(function (row_type_rice) {
                            return r.db('common').table('type_rice').get(row_type_rice('type_rice_id')).without('id')
                        })
                    }),
                    confirm_letter: r.db('g2g').table('confirm_letter')
                        .filter({ 'contract_id': row('id') })
                        .merge(function (cl) {
                            return {
                                cl_id: cl('id'),
                                cl_quantity_total: cl('cl_type_rice').sum('type_rice_quantity'),
                                // cl_quantity_sent: cl('cl_type_rice').sum('type_rice_quantity').div(4),
                                // cl_quantity_balance: cl('cl_type_rice').sum('type_rice_quantity').sub(cl('cl_type_rice').sum('type_rice_quantity').div(4)),
                                cl_date: cl('cl_date').split('T')(0),
                                cl_status_name: r.branch(cl('cl_status').eq(true), 'อนุมัติ', 'ยังไม่อนุมัติ')
                            }
                        })
                        .orderBy('cl_no')
                        .without('id')
                        .coerceTo('array'),
                    shipment: r.db('g2g').table('shipment')
                        .filter({ contract_id: row('id') })
                        .merge(function (shm) {
                            return {
                                shm_id: shm('id'),
                                shm_quantity: r.db('g2g').table("shipment_detail")
                                    .filter({ "shm_id": shm('id') })
                                    .sum("shm_det_quantity"),
                                shm_status_name: r.branch(shm('shm_status').eq(true), 'อนุมัติ', 'ยังไม่อนุมัติ')
                            }
                        })
                        .orderBy('shm_no')
                        .without('id')
                        .coerceTo('array')
                        .eqJoin("cl_id", r.db('g2g').table("confirm_letter")).without({ right: ["id", "date_created", "date_updated", "cl_type_rice", "cl_quality"] }).zip()
                }
            })
            .merge(function (row) {
                return {
                    // contract_quantity_total: row('contract_type_rice').sum('type_rice_quantity'),
                    contract_quantity_confirm: row('confirm_letter')
                        .filter(function (f) {
                            return f('cl_status').eq(true)
                        })
                        .sum('cl_quantity_total'),
                    contract_quantity_confirm_balance: row('contract_quantity').sub(
                        //row('contract_quantity').sum('type_rice_quantity').sub(
                        row('confirm_letter')
                            .filter(function (f) {
                                return f('cl_status').eq(true)
                            })
                            .sum('cl_quantity_total')
                    ),
                    contract_quantity_shipment: row('shipment')
                        .filter(function (f) {
                            return f('shm_status').eq(true)
                        })
                        .sum('shm_quantity'),
                    contract_quantity_shipment_balance: row('contract_quantity').sub(
                        //row('contract_quantity').sum('type_rice_quantity').sub(
                        row('shipment')
                            .filter(function (f) {
                                return f('shm_status').eq(true)
                            })
                            .sum('shm_quantity')
                    )
                }
            })
            .without('id')
            .eqJoin("buyer_id", r.db('common').table("buyer")).without({ right: ["id", "date_created", "date_updated"] }).zip()
            .eqJoin("country_id", r.db('common').table("country")).without({ right: ["id", "date_created", "date_updated"] }).zip()
            .orderBy('contract_name')
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

router.get('/id/:contract_id', function (req, res, next) {
    db.query(function (conn) {
        r.db('g2g').table("contract")
            .get(req.params.contract_id)
            .merge(function (row) {
                return {
                    contract_id: row('id'),
                    contract_type_rice: row('contract_type_rice').map(function (arr_type_rice) {
                        return arr_type_rice.merge(function (row_type_rice) {
                            return r.db('common').table('type_rice').get(row_type_rice('type_rice_id')).without('id')
                        })
                            .merge(function (limit) {
                                return {
                                    type_rice_quantity_confirm: r.db('g2g').table('confirm_letter')
                                        .filter(function (f) {
                                            return f('cl_type_rice').contains(function (c) {
                                                return c('type_rice_id').eq(limit('type_rice_id'))
                                            }).and(f('contract_id').eq(row('id')))
                                        })
                                        .coerceTo('array')
                                        .pluck("cl_type_rice")
                                        .map(function (m) {
                                            return m('cl_type_rice').merge(function (mer) {
                                                return r.branch(mer('type_rice_id').eq(limit('type_rice_id')), mer('type_rice_quantity'), 0)
                                            })
                                        })
                                        .reduce(function (left, right) {
                                            return left.add(right);
                                        }).default([])
                                        .reduce(function (left, right) {
                                            return left.add(right);
                                        }).default(0)
                                }
                            })
                    }),
                    contract_date: row('contract_date').split('T')(0)
                }
            })
            .merge(function (row) {
                return {
                    contract_quantity_confirm: row('contract_type_rice').sum('type_rice_quantity_confirm'),
                    contract_quantity_limit: row('contract_quantity').sub(row('contract_type_rice').sum('type_rice_quantity_confirm'))
                }
            })
            .merge(function (row) {
                return r.db('common').table("buyer").get(row('buyer_id')).without('id')
                    .merge(function (r_buyer) {
                        return r.db('common').table("country").get(r_buyer("country_id")).without("id")
                    })
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
router.get('/shipment', function (req, res, next) {
    db.query(function (conn) {
        r.db('g2g').table("contract")
            .merge(function (row) {
                return { contract_id: row('id') }
            })
            .map(function (m) {
                return m.merge(function (me) {
                    return {
                        shipment: r.db('g2g').table('shipment')
                            .filter({ contract_id: me('contract_id') })
                            .merge(function (p) {
                                return {
                                    shm_id: p('id')
                                }
                            })
                            .without('id')
                            .coerceTo('array')
                    }
                })
            })
            .without('id', 'contract_type_rice')
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
router.post('/insert', function (req, res, next) {
    //console.log(req.body);
    var valid = validate(req.body);
    var result = { result: false, message: null, id: null };
    if (valid) {
        if (req.body.id == null) {
            datacontext.insert("g2g", "contract", req.body, res);
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
        datacontext.update("g2g", "contract", req.body, res);
    } else {
        result.message = ajv.errorsText(validate.errors);
        res.json(result);
    }
});
router.delete('/delete/id/:id', function (req, res, next) {
    var result = { result: false, message: null, id: null };
    result.id = req.params.id;
    db.query(function (conn) {
        var q = r.db('g2g').table("contract").get(req.params.id).do(function (result) {
            return r.branch(
                result('contract_status').eq(false)
                , r.expr("delete")
                , r.expr("Can't delete because this status = true.")
            )
        })
        q.run(conn)
            .then(function (response) {
                if (response == "delete") {
                    datacontext.delete("g2g", "contract", req.params.id, res);
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
