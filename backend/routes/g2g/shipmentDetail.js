var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');

var Ajv = require('ajv');
var ajv = Ajv({ allErrors: true, coerceTypes: 'array' });
var schema = {
    //"type": "array",
    "items": {
        "properties": {
            "id": {
                "type": "string"
            },
            "bl_no": {
                "type": "string"
            },
            "book_no": {
                "type": "string"
            },
            "carrier_id": {
                "type": "string"
            },
            // "cl_id": {
            //     "type": "string"
            // },
            "deli_port_id": {
                "type": "string"
            },
            "dest_port_id": {
                "type": "string"
            },
            "eta_date": {
                "type": "string",
                "format": "date-time"
            },
            "etd_date": {
                "type": "string",
                "format": "date-time"
            },
            "load_port_id": {
                "type": "string"
            },
            "nn_page": {
                "type": "integer"
            },
            "num_of_container": {
                "type": "integer"
            },
            "origin_page": {
                "type": "integer"
            },
            "package_id": {
                "type": "string"
            },
            "packing_date": {
                "type": "string",
                "format": "date-time"
            },
            "packing_time": {
                "type": "string",
                "pattern": "^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$"
            },
            "product_date": {
                "type": "string",
                "format": "date-time"
            },
            "seller_id": {
                "type": "string"
            },
            "ship_id": {
                "type": "string"
            },
            "ship_lot_no": {
                "type": "string"
            },
            "ship_voy_no": {
                "type": "string"
            },
            "shipline_id": {
                "type": "string"
            },
            "shm_det_quantity": {
                "type": "number"
            },
            "shm_id": {
                "type": "string"
            },
            "surveyor_id": {
                "type": "string"
            },
            "type_rice_id": {
                "type": "string"
            },
            "weight_per_container": {
                "type": "number"
            }
        },
        "required": [
            "carrier_id",
            "deli_port_id",
            "dest_port_id",
            "load_port_id",
            "num_of_container",
            "package_id",
            "seller_id",
            "ship_id",
            "shipline_id",
            "shm_det_quantity",
            "shm_id",
            "surveyor_id",
            "type_rice_id",
            "weight_per_container"
        ]
    }
};
var validate = ajv.compile(schema);


router.post('/insert', function (req, res, next) {

    //console.log(req.body);
    var valid = validate(req.body);
    var result = { result: false, message: null, id: null };
    if (valid) {
        //console.log(req.body);
        if (req.body.id == null) {
            //result.id = req.body.id;
            db.query(function (conn) {
                r.table("shipment_detail")
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
        if (req.body.id != '' || req.body.id != null) {
            result.id = req.body.id;
            db.query(function (conn) {
                r.table("shipment_detail")
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
router.delete('/delete/id/:shm_det_id', function (req, res, next) {
    //var valid = validate(req.body);
    var result = { result: false, message: null, id: null };
    //  if (valid) {
    //console.log(req.body);
    if (req.params.shm_det_id != '' || req.params.shm_det_id != null) {
        result.id = req.params.shm_det_id;
        db.query(function (conn) {
            r.table("shipment_detail")
                .get(req.params.shm_det_id)
                .delete()
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
    // } else {
    //     result.message = ajv.errorsText(validate.errors);
    //     res.json(result);
    // }
});

module.exports = router;