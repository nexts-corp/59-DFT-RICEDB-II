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
        "book_id": {
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
        },
        "invoice_status": {
            "type": "boolean"
        }
    },
    "required": ["book_id", "invoice_date", "invoice_no", "made_out_to", "invoice_status"]
};
var validate = ajv.compile(schema);
router.get('/contract/id/:contract_id', function (req, res, next) {
    db.query(function (conn) {
        r.db('g2g').table('invoice')
            .getAll(false, { index: 'invoice_status' })
            .merge(function (m) {
                return {
                    invoice_id: m('id')
                }
            })
            .without('id')
            .eqJoin("book_id", r.db('g2g').table("book")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
            .eqJoin("load_port_id", r.db('common').table("port")).map(function (port) {
                return port.merge({
                    right: {
                        load_port_name: port("right")("port_name"),//r.row["right"]["port_name"]
                        load_port_code: port("right")("port_code")
                    }
                })
            }).without({ right: ["id", "date_created", "date_updated", "creater", "updater", "port_name", "port_code", "country_id"] }).zip()
            .eqJoin("dest_port_id", r.db('common').table("port")).map(function (port) {
                return port.merge({
                    right: {
                        dest_port_name: port("right")("port_name"),//r.row["right"]["port_name"]
                        dest_port_code: port("right")("port_code")
                    }
                })
            }).without({ right: ["id", "date_created", "date_updated", "creater", "updater", "port_name", "port_code", "country_id"] }).zip()
            .eqJoin("deli_port_id", r.db('common').table("port")).map(function (port) {
                return port.merge({
                    right: {
                        deli_port_name: port("right")("port_name"),//r.row["right"]["port_name"]
                        deli_port_code: port("right")("port_code")
                    }
                })
            }).without({ right: ["id", "date_created", "date_updated", "creater", "updater", "port_name", "port_code", "country_id"] }).zip()
            .eqJoin("shipline_id", r.db('common').table("shipline")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
            .eqJoin("shm_id", r.db('g2g').table("shipment")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
            .eqJoin("cl_id", r.db('g2g').table("confirm_letter")).without({ right: ["id", "date_created", "date_updated", "creater", "updater", "cl_type_rice"] }).zip()
            .eqJoin("contract_id", r.db('g2g').table("contract")).without({ right: ["id", "date_created", "date_updated", "creater", "updater", "contract_type_rice"] }).zip()
            .filter({ contract_id: req.params.contract_id })
            .merge(function (m) {
                return {
                    cl_date: m('cl_date').split('T')(0),
                    contract_date: m('contract_date').split('T')(0),
                    invoice_date: m('invoice_date').split('T')(0),
                    ship: m('ship').map(function (arr_ship) {
                        return arr_ship.merge(function (row_ship) {
                            return r.db('common').table('ship').get(row_ship('ship_id')).without('id', 'date_created', 'date_updated', "creater", "updater")
                        })
                    })
                }
            })
            .group(function (g) {
                return g.pluck(
                    "shm_id", "shm_no", "shm_name", "cl_id", "cl_no", "cl_name"
                )
            })
            .ungroup()
            .merge(function (me) {
                return {
                    shm_id: me('group')('shm_id'),
                    shm_no: me('group')('shm_no'),
                    shm_name: me('group')('shm_name'),
                    cl_id: me('group')('cl_id'),
                    cl_no: me('group')('cl_no'),
                    cl_name: me('group')('cl_name'),
                    invoice_detail: me('reduction')
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
});
router.get('/shipment/id/:shm_id', function (req, res, next) {
    db.query(function (conn) {
        r.db('g2g').table('invoice')
            .filter({ invoice_status: false })
            .merge(function (m) {
                return {
                    invoice_id: m('id')
                }
            })
            .without('id')
            .eqJoin("book_id", r.db('g2g').table("book")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
            .eqJoin("load_port_id", r.db('common').table("port")).map(function (port) {
                return port.merge({
                    right: {
                        load_port_name: port("right")("port_name"),//r.row["right"]["port_name"]
                        load_port_code: port("right")("port_code")
                    }
                })
            }).without({ right: ["id", "date_created", "date_updated", "creater", "updater", "port_name", "port_code", "country_id"] }).zip()
            .eqJoin("dest_port_id", r.db('common').table("port")).map(function (port) {
                return port.merge({
                    right: {
                        dest_port_name: port("right")("port_name"),//r.row["right"]["port_name"]
                        dest_port_code: port("right")("port_code")
                    }
                })
            }).without({ right: ["id", "date_created", "date_updated", "creater", "updater", "port_name", "port_code", "country_id"] }).zip()
            .eqJoin("deli_port_id", r.db('common').table("port")).map(function (port) {
                return port.merge({
                    right: {
                        deli_port_name: port("right")("port_name"),//r.row["right"]["port_name"]
                        deli_port_code: port("right")("port_code")
                    }
                })
            }).without({ right: ["id", "date_created", "date_updated", "creater", "updater", "port_name", "port_code", "country_id"] }).zip()
            .eqJoin("shipline_id", r.db('common').table("shipline")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
            .eqJoin("shm_id", r.db('g2g').table("shipment")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
            .eqJoin("cl_id", r.db('g2g').table("confirm_letter")).without({ right: ["id", "date_created", "date_updated", "creater", "updater", "cl_type_rice"] }).zip()
            .eqJoin("contract_id", r.db('g2g').table("contract")).without({ right: ["id", "date_created", "date_updated", "creater", "updater", "contract_type_rice"] }).zip()
            .filter({ shm_id: req.params.shm_id })
            .merge(function (m) {
                return {
                    cl_date: m('cl_date').split('T')(0),
                    contract_date: m('contract_date').split('T')(0),
                    invoice_date: m('invoice_date').split('T')(0),
                    ship: m('ship').map(function (arr_ship) {
                        return arr_ship.merge(function (row_ship) {
                            return r.db('common').table('ship').get(row_ship('ship_id')).without('id', 'date_created', 'date_updated', "creater", "updater")
                        })
                    })
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
});
router.get('/id/:invoice_id', function (req, res, next) {
    db.query(function (conn) {
        r.db('g2g').table('invoice')
            .get(req.params.invoice_id)
            .merge(function (row) {
                return r.db('g2g').table('book')
                    .get(row('book_id'))
                    .merge(function (m) {
                        return r.db('g2g').table("shipment").get(m('shm_id')).without("id", "date_created", "date_updated", "creater", "updater")
                    })
                    .merge(function (m) {
                        return r.db('g2g').table("confirm_letter").get(m('cl_id')).without("id", "date_created", "date_updated", "creater", "updater")
                    })
                    .merge(function (m) {
                        return r.db('g2g').table("contract").get(m('contract_id')).without("id", "date_created", "date_updated", "creater", "updater", "contract_type_rice")
                    })
                    .merge(function (me) {
                        return {
                            book_id: row('book_id'),
                            bl_detail: r.db('g2g').table('shipment_detail')
                                .getAll(row('book_id'), { index: 'book_id' })
                                .group(function (g) {
                                    return g.pluck(
                                        "type_rice_id", "package_id"
                                    )
                                })
                                .sum("shm_det_quantity")
                                .ungroup()
                                .merge(function (me2) {
                                    return {
                                        type_rice_id: me2('group')('type_rice_id'),
                                        package_id: me2('group')('package_id'),
                                        quantity_tons: me2('reduction'),
                                        price_per_ton: me('cl_type_rice')
                                            .filter(function (tb) {
                                                return tb('type_rice_id').eq(me2('group')('type_rice_id'))
                                            }).getField("package")(0)
                                            .filter(function (f) {
                                                return f('package_id').eq(me2('group')('package_id'))
                                            })(0)
                                            .pluck('price_per_ton')
                                            .values()(0)
                                    }
                                })
                                .without("group", "reduction")
                                .eqJoin("package_id", r.db('common').table("package")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
                                .merge(function (me2) {
                                    return {
                                        quantity_bags: me2('quantity_tons').mul(1000).div(me2('package_kg_per_bag'))
                                    }
                                })
                                .merge(function (me2) {
                                    return {
                                        weight_gross: me2('quantity_bags').mul(me2('package_kg_per_bag').add(me2('package_weight_bag').div(1000))).div(1000),
                                        weight_net: me2('quantity_bags').mul(me2('package_kg_per_bag')).div(1000),
                                        weight_tare: me2('quantity_bags').mul(me2('package_weight_bag').div(1000)).div(1000)

                                    }
                                })
                                .merge(function (me2) {
                                    return {
                                        amount_usd: me2('price_per_ton').mul(me2('weight_net'))
                                    }
                                })
                                .eqJoin("type_rice_id", r.db('common').table("type_rice")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
                                .coerceTo('array')
                                .orderBy('date_updated')
                        }
                    })
                    .merge(function (me) {
                        return {
                            weight_gross: me('bl_detail').sum('weight_gross'),
                            weight_net: me('bl_detail').sum('weight_net'),
                            weight_tare: me('bl_detail').sum('weight_tare'),
                            amount_usd: me('bl_detail').sum('amount_usd'),
                            quantity_bags: me('bl_detail').sum('quantity_bags'),
                            cl_date: me('cl_date').split('T')(0),
                            contract_date: me('contract_date').split('T')(0),
                            eta_date: me('eta_date').split('T')(0),
                            etd_date: me('etd_date').split('T')(0),
                            packing_date: me('packing_date').split('T')(0),
                            product_date: me('product_date').split('T')(0),
                            ship: me('ship').map(function (arr_ship) {
                                return arr_ship.merge(function (row_ship) {
                                    return r.db('common').table('ship').get(row_ship('ship_id')).without('id', 'date_created', 'date_updated', "creater", "updater")
                                })
                            }),
                            surveyor: me('surveyor').map(function (arr_surveyor) {
                                return arr_surveyor.merge(function (row_surveyor) {
                                    return r.db('common').table('surveyor').get(row_surveyor('surveyor_id')).without('id', 'date_created', 'date_updated', 'creater', 'updater')
                                })
                            })
                        }
                    })
                    .merge(function (m) {
                        return {
                            buyer_country_id: r.db('common').table("buyer").get(m('buyer_id')).getField('country_id'),
                            dest_port_name: r.db('common').table("port").get(m('dest_port_id')).getField('port_name'),
                            dest_port_code: r.db('common').table("port").get(m('dest_port_id')).getField('port_code'),
                            dest_country_id: r.db('common').table("port").get(m('dest_port_id')).getField('country_id'),
                            deli_port_name: r.db('common').table("port").get(m('deli_port_id')).getField('port_name'),
                            deli_port_code: r.db('common').table("port").get(m('deli_port_id')).getField('port_code'),
                            deli_country_id: r.db('common').table("port").get(m('deli_port_id')).getField('country_id'),
                            load_port_name: r.db('common').table("port").get(m('load_port_id')).getField('port_name'),
                            load_port_code: r.db('common').table("port").get(m('load_port_id')).getField('port_code'),
                            load_country_id: r.db('common').table("port").get(m('load_port_id')).getField('country_id')
                        }
                    })
                    .merge(function (m) {
                        return {
                            buyer_country_fullname_en: r.db('common').table("country").get(m('buyer_country_id')).getField('country_fullname_en'),
                            buyer_country_name_en: r.db('common').table("country").get(m('buyer_country_id')).getField('country_name_en'),
                            buyer_country_name_th: r.db('common').table("country").get(m('buyer_country_id')).getField('country_name_th'),
                            dest_country_fullname_en: r.db('common').table("country").get(m('dest_country_id')).getField('country_fullname_en'),
                            dest_country_name_en: r.db('common').table("country").get(m('dest_country_id')).getField('country_name_en'),
                            dest_country_name_th: r.db('common').table("country").get(m('dest_country_id')).getField('country_name_th'),
                            deli_country_fullname_en: r.db('common').table("country").get(m('deli_country_id')).getField('country_fullname_en'),
                            deli_country_name_en: r.db('common').table("country").get(m('deli_country_id')).getField('country_name_en'),
                            deli_country_name_th: r.db('common').table("country").get(m('deli_country_id')).getField('country_name_th'),
                            load_country_fullname_en: r.db('common').table("country").get(m('load_country_id')).getField('country_fullname_en'),
                            load_country_name_en: r.db('common').table("country").get(m('load_country_id')).getField('country_name_en'),
                            load_country_name_th: r.db('common').table("country").get(m('load_country_id')).getField('country_name_th')
                        }
                    })
                    .merge(function (m) {
                        return r.db('common').table("buyer").get(m('buyer_id')).pluck('buyer_name', 'buyer_address', 'buyer_tel', 'buyer_fax', 'buyer_email', 'buyer_masks')
                    })
                    .merge(function (m) {
                        return r.db('common').table("shipline").get(m('shipline_id')).pluck('shipline_name', 'shipline_tel')
                    })
                    // .merge(function (m) {
                    //     return r.db('common').table("surveyor").get(m('surveyor_id')).pluck('surveyor_name')
                    // })
                    .merge(function (m) {
                        return r.db('common').table("carrier").get(m('carrier_id')).pluck('carrier_name')
                    })
                    .merge(function (m) {
                        return r.db('common').table("incoterms").get(m('inct_id')).pluck('inct_name')
                    })
                    .without('id')
            })
            .merge(function (m) {
                return {
                    invoice_date: m('invoice_date').split('T')(0),
                    invoice_id: m('id')
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
    //console.log(req.body);
    var valid = validate(req.body);
    var result = { result: false, message: null, id: null };
    if (valid) {
        if (req.body.id == null) {
            datacontext.insert("g2g", "invoice", req.body, res);
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
        datacontext.update("g2g", "invoice", req.body, res);
    } else {
        result.message = ajv.errorsText(validate.errors);
        res.json(result);
    }
});
router.delete('/delete/id/:id', function (req, res, next) {
    var result = { result: false, message: null, id: null };
    result.id = req.params.id;
    db.query(function (conn) {
        var q = r.db('g2g').table("invoice").get(req.params.id).do(function (result) {
            return r.branch(
                result('invoice_status').eq(false)
                , r.expr('delete')
                , r.expr("Can't delete because this status = true.")
            )
        })
        q.run(conn)
            .then(function (response) {
                if (response == "delete") {
                    datacontext.delete("g2g", "invoice", req.params.id, res);
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

