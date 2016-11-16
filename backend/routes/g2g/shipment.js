var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');

var Timestamp = require('../../class/Timestamp.js');
var timestamp = new Timestamp();

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
            "type": "string"
        },
        "shm_name": {
            "type": "string"
        },
        "shm_status": {
            "type": "boolean"
        }
    },
    "required": ["contract_id", "cl_id", "shm_no", "shm_name","shm_status"]
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
                        .filter({ "shm_id": row('id') })
                        .orderBy(r.desc('shm_det_quantity'))
                        .eqJoin("load_port_id", r.db('common').table("port")).map(function (port) {
                            return port.merge({
                                right: {
                                    load_port_name: port("right")("port_name"),//r.row["right"]["port_name"]
                                    load_port_code: port("right")("port_code")
                                }
                            })
                        }).without({ right: ["id","date_created","date_updated", "port_name", "port_code", "country_id"] }).zip()
                        .eqJoin("dest_port_id", r.db('common').table("port")).map(function (port) {
                            return port.merge({
                                right: {
                                    dest_port_name: port("right")("port_name"),//r.row["right"]["port_name"]
                                    dest_port_code: port("right")("port_code")
                                }
                            })
                        }).without({ right: ["id","date_created","date_updated", "port_name", "port_code", "country_id"] }).zip()
                        .eqJoin("deli_port_id", r.db('common').table("port")).map(function (port) {
                            return port.merge({
                                right: {
                                    deli_port_name: port("right")("port_name"),//r.row["right"]["port_name"]
                                    deli_port_code: port("right")("port_code")
                                }
                            })
                        }).without({ right: ["id","date_created","date_updated", "port_name", "port_code", "country_id"] }).zip()
                        .eqJoin("carrier_id", r.db('common').table("carrier")).without({ right: ["id","date_created","date_updated"] }).zip()
                        .eqJoin("exporter_id", r.db('external_f3').table("exporter")).without({ right: ["id","date_created","date_updated"] }).zip()
                        .eqJoin("trader_id", r.db('external_f3').table("trader")).without({ right: ["id","date_created","date_updated"] }).zip()
                        .eqJoin("seller_id", r.db('external_f3').table("seller")).without({ right: ["id","date_created","date_updated", "country_id"] }).zip()
                        .eqJoin("ship_id", r.db('common').table("ship")).without({ right: ["id","date_created","date_updated"] }).zip()
                        .eqJoin("shipline_id", r.db('common').table("shipline")).without({ right: ["id","date_created","date_updated"] }).zip()
                        .eqJoin("surveyor_id", r.db('common').table("surveyor")).without({ right: ["id","date_created","date_updated"] }).zip()
                        .eqJoin("type_rice_id", r.db('common').table("type_rice")).without({ right: ["id","date_created","date_updated"] }).zip()
                        .eqJoin("package_id", r.db('common').table("package")).without({ right: ["id","date_created","date_updated"] }).zip()
                        // .eqJoin("country_id", r.db('common').table("country")).without({ right: ["id","date_created","date_updated"] }).zip()
                        .merge(function (r) {
                            return {
                                shm_det_id: r('id'),
                                eta_date: r('eta_date').split('T')(0),
                                etd_date: r('etd_date').split('T')(0),
                                packing_date: r('packing_date').split('T')(0),
                                product_date: r('product_date').split('T')(0)
                            }
                        })
                        .without('id')
                        .coerceTo('array'),
                    shm_quantity: r.db('g2g').table("shipment_detail")
                        .filter({ "shm_id": row('id') })
                        .sum("shm_det_quantity")
                }
            })
            .without('id')
            .merge(function (m) {
                return r.db('g2g').table("confirm_letter").get(m('cl_id')).without('id')
                    .merge(function (mm) {
                        return {
                            cl_type_rice: mm('cl_type_rice')
                                .merge(function (mmm) {
                                    return r.db('common').table('type_rice').get(mmm('type_rice_id')).without('id')
                                })
                                .merge(function (limit) {
                                    return {
                                        type_rice_quantity_confirm: r.db('g2g').table('shipment_detail')
                                            .eqJoin("shm_id", r.db('g2g').table("shipment")).without({ right: ["id","date_created","date_updated"] }).zip()
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
                                        type_rice_quantity_limit: mmm('type_rice_quantity').sub(mmm('type_rice_quantity_confirm'))
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
            //result.id = req.body.id;
            req.body = timestamp.create(req.body);
            db.query(function (conn) {
                r.db('g2g').table("shipment")
                    //.get(req.body.id)
                    .insert(req.body)
                    .run(conn)
                    .then(function (response) {
                        result.message = response;
                        if (response.errors == 0) {
                            result.result = true;
                            result.id = response.generated_keys;
                        }
                        res.json(result);
                        console.log(result);
                    })
                    .error(function (err) {
                        result.message = err;
                        res.json(result);
                        console.log(result);
                    })
            })
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
        //console.log(req.body);
        if (req.body.id != '' && req.body.id != null) {
            result.id = req.body.id;
            req.body = timestamp.update(req.body);
            db.query(function (conn) {
                r.db('g2g').table("shipment")
                    .get(req.body.id)
                    .update(req.body)
                    .run(conn)
                    .then(function (response) {
                        result.message = response;
                        if (response.errors == 0) {
                            result.result = true;
                        }
                        res.json(result);
                        console.log(result);
                    })
                    .error(function (err) {
                        result.message = err;
                        res.json(result);
                        console.log(result);
                    })
            })
        } else {
            result.message = 'require field id';
            res.json(result);
        }
    } else {
        result.message = ajv.errorsText(validate.errors);
        res.json(result);
    }
});
router.delete('/delete/id/:id', function (req, res, next) {
    var result = { result: false, message: null, id: null };
    if (req.params.id != '' && req.params.id != null) {
        result.id = req.params.id;
        db.query(function (conn) {
            var q = r.db('g2g').table("shipment").get(req.params.id).do(function (result) {
                return r.branch(
                    result('shm_status').eq(false)
                    , r.db('g2g').table("shipment").get(req.params.id).delete()
                    , r.expr("Can't delete because this status = true.")
                )
            })
            q.run(conn)
                .then(function (response) {
                    result.message = response;
                    if (response.errors == 0) {
                        result.result = true;
                    }
                    res.json(result);
                })
                .error(function (err) {
                    result.message = err;
                    res.json(result);
                    console.log(result);
                })
        })
    } else {
        result.message = 'require field id';
        res.json(result);
    }
});

module.exports = router;
