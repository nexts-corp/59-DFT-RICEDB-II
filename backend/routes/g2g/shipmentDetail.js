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
            "num_of_container": {
                "type": "integer"
            },
            "package_id": {
                "type": "string"
            },
            "exporter_id": {
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
            "type_rice_id": {
                "type": "string"
            },
            "book_id": {
                "type": "string"
            }
        },
        "required": [
            "package_id",
            "exporter_id",
            "book_id",
            "shm_det_quantity",
            "shm_id",
            "type_rice_id",
            "num_of_container"
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