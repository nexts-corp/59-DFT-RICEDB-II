var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');

var DataContext = require('../../class/DataContext.js');
var datacontext = new DataContext();

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
                "type": "string",
                "minLength": 36
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
            "cut_of_date": {
                "type": "string",
                "format": "date-time"
            },
            "cut_of_time": {
                "type": "string",
                "pattern": "^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$"
            },
            "product_date": {
                "type": "string",
                "format": "date-time"
            },
            "exporter_id": {
                "type": "string",
                "minLength": 36
            },
            // "ship_id": {
            //     "type": "string",
            //     "minLength": 36
            // },
            "ship": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "ship_id": {
                            "type": "string"
                        },
                        "ship_voy_no": {
                            "type": "string"
                        }
                    },
                    "required": ["ship_id", "ship_voy_no"]
                }
            },
            "ship_lot_no": {
                "type": "string"
            },
            // "ship_voy_no": {
            //     "type": "string"
            // },
            "shipline_id": {
                "type": "string",
                "minLength": 36
            },
            "shm_det_quantity": {
                "type": "number"
            },
            "shm_id": {
                "type": "string",
                "minLength": 36
            },
            "surveyor_id": {
                "type": "string",
                "minLength": 36
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
            "exporter_id",
            "ship",
            // "shipline_id",
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
    var valid = validate(req.body);
    var result = { result: false, message: null, id: null };
    if (valid) {
        if (req.body.id == null) {
            datacontext.insert("g2g", "shipment_detail", req.body, res);
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
        datacontext.update("g2g", "shipment_detail", req.body, res);
    } else {
        result.message = ajv.errorsText(validate.errors);
        res.json(result);
    }
});
router.delete('/delete/id/:id', function (req, res, next) {
    datacontext.delete("g2g", "shipment_detail", req.params.id, res);
});

module.exports = router;