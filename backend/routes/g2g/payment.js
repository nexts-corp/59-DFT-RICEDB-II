var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');

var Ajv = require('ajv');
var ajv = Ajv({ allErrors: true });
var schema = {
    //'type': 'object',
    "properties": {
        "id": {
            "type": "string"
        },
        "fee_foreign": {
            "type": "number"
        },
        "fee_internal": {
            "type": "number"
        }
    },
    "required": ["fee_foreign", "fee_internal", "fee_other", "fee_date_receipt", "fee_no", "rate_bank", "rate_tt", "invoice", "fee_status"]
};
var validate = ajv.compile(schema);
router.get('/', function (req, res, next) {
    db.query(function (conn) {
        // r.db('g2g').table('shipment_detail')
        //     .merge(function (m) {
        //         return {
        //             shm_det_id: m('id')
        //         }
        //     })
        //     .without('id')
        //     .eqJoin('shm_id', r.db('g2g').table('shipment')).without({ right: "id" }).zip()
        //     .filter({
        //         exporter_id: '',
        //         shm_status: true
        //     })
        r.db('g2g').table('fee')
            .merge(function (me1) {
                return {
                    invoice: me1('invoice').merge(function (me2) {
                        return {
                            invoice_detail: me2('invoice_detail').merge(function (me3) {
                                return r.db('g2g').table('shipment_detail').filter({
                                    id: me3('shm_det_id'),
                                    exporter_id: '45618ca7-157b-4fda-bbf1-7c8a01ecc744'
                                }).coerceTo('array')(0)
                            })
                        }
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
})

router.post('/insert', function (req, res, next) {
    //console.log(req.body);
    var valid = validate(req.body);
    var result = { result: false, message: null, id: null };
    if (valid) {
        //console.log(req.body);
        if (req.body.id == null) {
            //result.id = req.body.id;
            db.query(function (conn) {
                r.db('g2g').table("payment")
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
            db.query(function (conn) {
                r.db('g2g').table("payment")
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
            r.db('g2g').table("payment").get(req.params.id).delete()
                .run(conn)
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

