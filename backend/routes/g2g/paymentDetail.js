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
        "exporter_id": {
            "type": "string"
        },
        "fee_det_id": {
            "type": "string"
        },
        "invoice_exporter_date": {
            "type": "string"
        },
        "invoice_exporter_no": {
            "type": "string"
        },
        "invoice_fee": {
            "type": "number"
        },
        "invoice_id": {
            "type": "string"
        },
        "pay_amount": {
            "type": "number"
        },
        "shm_det_id": {
            "type": "string"
        }
    }
    // "required": ["invoice_exporter_date", "invoice_exporter_no"]
};
var validate = ajv.compile(schema);

router.put('/update', function (req, res, next) {
    //console.log(req.body);
    var valid = validate(req.body);
    var result = { result: false, message: null, id: null };
    if (valid) {
        datacontext.update("g2g", "payment_detail", req.body, res);
    } else {
        result.message = ajv.errorsText(validate.errors);
        res.json(result);
    }

});

module.exports = router;

