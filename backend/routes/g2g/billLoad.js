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
            "format": "date-time"
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
        r.table('shipment_detail')
            .group(function(g){
                return g.pluck(
                    "bl_no","ship_id","load_port_id","dest_port_id","deli_port_id","packing_date"
                    //"type_rice_id"
                    )
            })
            .sum('shm_det_quantity')
            .ungroup()
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


module.exports = router;
