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
        "contract_name": {
            "type": "string"
        },
        "buyer_id": {
            "type": "string"
        },
        "contract_date": {
            "type": "string",
            "format": "date"
        },
        "contract_desc": {
            "type": "string"
        },
        "contract_type_rice": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "type_rice_id": { "type": "string" },
                    "type_rice_quantity": { "type": "number" },
                },
                "required": ["type_rice_id", "type_rice_quantity"]
            }
        }
    },
    "required": ["contract_name", "buyer_id", "contract_date", "contract_type_rice"]
};
var validate = ajv.compile(schema);

router.get(['/', '/list'], function (req, res, next) {
    db.query(function (conn) {
        r.table("contract")
            .merge(function (row) {
                return {
                    contract_id: row('id'),
                    contract_type_rice: row('contract_type_rice').map(function (arr_type_rice) {
                        return arr_type_rice.merge(function (row_type_rice) {
                            return r.table('type_rice').get(row_type_rice('type_rice_id')).without('id')
                        })
                    }),
                    confirm_letter: r.table('confirm_letter')
                        .filter({ 'contract_id': row('id') })
                        .merge(function (cl) {
                            return {
                                cl_id: cl('id'),
                                cl_quantity_total: cl('cl_type_rice').sum('type_rice_quantity'),
                                cl_quantity_sent: cl('cl_type_rice').sum('type_rice_quantity').div(4),
                                cl_quantity_balance: cl('cl_type_rice').sum('type_rice_quantity').sub(cl('cl_type_rice').sum('type_rice_quantity').div(4))
                            }
                        })
                        .without('id')
                        .coerceTo('array'),
                    shipment: r.table('shipment')
                        .filter({ 'contract_id': row('id') })
                        .merge(function (shm) {
                            return {
                                shm_id: shm('id'),
                                shm_quantity: r.table("shipment_detail")
                                    .filter({ "shm_id": shm('id') })
                                    .sum("shm_det_quantity")
                            }
                        })
                        .without('id')
                        .coerceTo('array')
                }
            })
            .merge(function (row) {
                return {
                    //contract_quantity_sent: row('confirm_letter').sum('cl_quantity_sent'),
                    contract_quantity_confirm: row('confirm_letter').sum('cl_quantity_total'),
                    contract_quantity_total: row('contract_type_rice').sum('type_rice_quantity'),
                    contract_quantity_balance: row('contract_type_rice').sum('type_rice_quantity').sub(row('confirm_letter').sum('cl_quantity_total'))
                }
            })
            .without('id')
            .eqJoin("buyer_id", r.table("buyer")).without({ right: "id" }).zip()
            .eqJoin("country_id", r.table("country")).without({ right: "id" }).zip()
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

router.get('/:contract_id', function (req, res, next) {
    db.query(function (conn) {
        r.table("contract")
            .get(req.params.contract_id)
            .merge(function (row) {
                return {
                    contract_id: row('id'),
                    contract_type_rice: row('contract_type_rice').map(function (arr_type_rice) {
                        return arr_type_rice.merge(function (row_type_rice) {
                            return r.table('type_rice').get(row_type_rice('type_rice_id')).without('id')
                        })
                    })
                }
            })
            .merge(function (row) {
                return r.table("buyer").get(row('buyer_id')).without('id')
                    .merge(function (r_buyer) {
                        return r.table("country").get(r_buyer("country_id")).without("id")
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
router.post('/insert', function (req, res, next) {
    //console.log(req.body);
    var valid = validate(req.body);
    if (valid) {
        console.log(req.body);
        res.json(req.body);
    } else {
        console.log(req.body);
        console.log('Invalid: ' + ajv.errorsText(validate.errors));
        res.json('Invalid: ' + ajv.errorsText(validate.errors));
    }
});
module.exports = router;