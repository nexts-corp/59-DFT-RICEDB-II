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
        "contract_id": {
            "type": "string"
        },
        "cl_id": {
            "type": "string"
        },
        "shm_no": {
            "type": "number"
        },
        "shm_name": {
            "type": "string"
        },
        "shm_status": {
            "type": "boolean"
        }
    },
    "required": ["contract_id", "cl_id", "shm_no", "shm_name", "shm_status"]
};
var validate = ajv.compile(schema);

router.get('/id/:shm_id', function (req, res, next) {
    db.query(function (conn) {
        r.db('g2g').table("shipment")
            //.filter({contract_id:req.params.contract_id})
            .get(req.params.shm_id)
            .merge(function (row) {
                return {
                    shm_id: row('id'),
                    shipment_detail: r.db('g2g').table("shipment_detail")
                        .getAll(row('id'), { index: "shm_id" })
                        .orderBy(r.desc('shm_det_quantity'))
                        .eqJoin("book_id", r.db('g2g').table("book")).without({ right: ["id", "date_created", "date_updated", "creater", "updater","tags"] }).zip()
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
                        .eqJoin("carrier_id", r.db('common').table("carrier")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
                        .eqJoin("exporter_id", r.db('external_f3').table("exporter")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
                        .eqJoin("trader_id", r.db('external_f3').table("trader")).without({ right: ["id", "date_created", "date_updated", "creater", "updater", "creater", "updater"] }).zip()
                        .eqJoin("seller_id", r.db('external_f3').table("seller")).without({ right: ["id", "date_created", "date_updated", "creater", "updater", "country_id"] }).zip()
                        .eqJoin("shipline_id", r.db('common').table("shipline")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
                        // .eqJoin("surveyor_id", r.db('common').table("surveyor")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
                        .eqJoin("type_rice_id", r.db('common').table("type_rice")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
                        .eqJoin("package_id", r.db('common').table("package")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()

                        .merge(function (me) {
                            return {
                                shm_det_id: me('id'),
                                eta_date: me('eta_date').split('T')(0),
                                etd_date: me('etd_date').split('T')(0),
                                packing_date: me('packing_date').split('T')(0),
                                cut_of_date: me('cut_of_date').split('T')(0),
                                product_date: me('product_date').split('T')(0),
                                ship: me('ship').map(function (arr_ship) {
                                    return arr_ship.merge(function (row_ship) {
                                        return r.db('common').table('ship').get(row_ship('ship_id')).without('id', 'date_created', 'date_updated', 'creater', 'updater')
                                    })
                                }),
                                surveyor: me('surveyor').map(function (arr_surveyor) {
                                    return arr_surveyor.merge(function (row_surveyor) {
                                        return r.db('common').table('surveyor').get(row_surveyor('surveyor_id')).without('id', 'date_created', 'date_updated', 'creater', 'updater')
                                    })
                                })
                            }
                        })
                        .without('id')
                        .coerceTo('array'),
                    shm_quantity: r.db('g2g').table("shipment_detail")
                        .getAll(row('id'), { index: "shm_id" })
                        .sum("shm_det_quantity")
                }
            })
            .without('id')
            .merge(function (m) {
                return r.db('g2g').table("confirm_letter").get(m('cl_id')).without('id',"tags")
                    .merge(function (mm) {
                        return {
                            cl_type_rice: mm('cl_type_rice')
                                .merge(function (mmm) {
                                    return r.db('common').table('type_rice').get(mmm('type_rice_id')).without('id')
                                })
                                .merge(function (limit) {
                                    return {
                                        type_rice_quantity_confirm: r.db('g2g').table('shipment_detail')
                                            .eqJoin("shm_id", r.db('g2g').table("shipment")).without({ right: ["id", "date_created", "date_updated", "creater", "updater","tags"] }).zip()
                                            .filter({
                                                cl_id: m('cl_id'),
                                                //shm_id: m('shm_id'),
                                                type_rice_id: limit('type_rice_id')
                                            })
                                            .coerceTo('array')
                                            .getField('shm_det_quantity')
                                            .reduce(function (left, right) {
                                                return left.add(right);
                                            }).default(0)
                                    }
                                })
                                .merge(function (mmm) {
                                    return {
                                        package: mmm('package').map(function (arr_package) {
                                            return arr_package.merge(function (row_package) {
                                                return r.db('common').table('package').get(row_package('package_id')).without('id')
                                            })
                                        }),
                                        // type_rice_quantity_limit: mmm('type_rice_quantity').sub(mmm('type_rice_quantity_confirm')),
                                        type_rice_quantity_min: mmm('type_rice_quantity').sub(mmm('type_rice_quantity').mul(mmm('tolerance_rate').div(100)
                                        )),
                                        type_rice_quantity_max: mmm('type_rice_quantity').mul(mmm('tolerance_rate').div(100)
                                        ).add(mmm('type_rice_quantity')),
                                        type_rice_quantity_limit_min: mmm('type_rice_quantity').sub(mmm('type_rice_quantity').mul(mmm('tolerance_rate').div(100)
                                        )).sub(mmm('type_rice_quantity_confirm')),
                                        type_rice_quantity_limit_max: mmm('type_rice_quantity').mul(mmm('tolerance_rate').div(100)
                                        ).add(mmm('type_rice_quantity')).sub(mmm('type_rice_quantity_confirm'))
                                    }
                                })
                        }
                    })

            })
            // .map(function(m){
            //     return m('cl_type_rice').merge({xx:'xx'})
            // })
            //.eqJoin("cl_id", r.db('g2g').table("confirm_letter")).without({ right: ["id","date_created","date_updated"] }).zip()
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
        //console.log(req.body);
        if (req.body.id == null) {
            datacontext.insert("g2g", "shipment", req.body, res);
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
        datacontext.update("g2g", "shipment", req.body, res);
    } else {
        result.message = ajv.errorsText(validate.errors);
        res.json(result);
    }
});
router.delete('/delete/id/:id', function (req, res, next) {
    var result = { result: false, message: null, id: null };
    result.id = req.params.id;
    db.query(function (conn) {
        var q = r.db('g2g').table("shipment").get(req.params.id).do(function (result) {
            return r.branch(
                result('shm_status').eq(false)
                , r.expr('delete')
                , r.expr("Can't delete because this status = true.")
            )
        })
        q.run(conn)
            .then(function (response) {
                if (response == "delete") {
                    datacontext.delete("g2g", "shipment", req.params.id, res);
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
