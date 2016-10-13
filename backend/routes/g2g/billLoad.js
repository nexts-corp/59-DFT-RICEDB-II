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

router.get('/shipment/id/:shm_id', function (req, res, next) {
    db.query(function (conn) {
        r.table('shipment_detail')
            .filter({ shm_id: req.params.shm_id })
            .group("bl_no")
            // .group(function(g){
            //     return g.pluck(
            //         "bl_no"
            //         ,"ship_id","load_port_id","dest_port_id","deli_port_id","packing_date"
            //         "type_rice_id"
            //         )
            // })
            //.sum('shm_det_quantity')
            .ungroup()
            .merge(function (m) {
                return {
                    bl_no: m('group'),
                    shm_id: req.params.shm_id
                }
            })
            .without("reduction", "group")
            .outerJoin(r.table("invoice"),
            function (detail, invoice) {
                return invoice("bl_no").eq(detail("bl_no"))
            })
            .without({ right: "id" }).zip()
            .filter(r.row.hasFields('invoice_no').not())
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
router.get('/shipment/bl/no/:bl_no', function (req, res, next) {
    db.query(function (conn) {
        r.table('shipment_detail')
            .filter({ bl_no: req.params.bl_no })
            .group(function (g) {
                return g.pluck(
                    "ship_id", "load_port_id", "dest_port_id", "deli_port_id", "bl_no", "shm_id"
                )
            })
            .sum("shm_det_quantity")
            .ungroup()
            .merge(function (me) {
                return {
                    shm_id: me('group')('shm_id'),
                    ship_id: me('group')('ship_id'),
                    load_port_id: me('group')('load_port_id'),
                    dest_port_id: me('group')('dest_port_id'),
                    deli_port_id: me('group')('deli_port_id'),
                    bl_no: me('group')('bl_no'),
                    total_quantity: me('reduction')
                }
            })
            .without("group", "reduction")
            .eqJoin("shm_id", r.table("shipment")).without({ right: "id" }).zip()
            .eqJoin("contract_id", r.table("contract")).without({ right: ["id", "contract_type_rice"] }).zip()
            .eqJoin("buyer_id", r.table("buyer")).without({ right: "id" }).zip()
            .eqJoin("load_port_id", r.table("port")).map(function (port) {
                return port.merge({
                    right: {
                        load_port_name: port("right")("port_name"),//r.row["right"]["port_name"]
                        load_port_code: port("right")("port_code")
                    }
                })
            }).without({ right: ["id", "port_name", "port_code", "country_id"] }).zip()
            .eqJoin("dest_port_id", r.table("port")).map(function (port) {
                return port.merge({
                    right: {
                        dest_port_name: port("right")("port_name"),//r.row["right"]["port_name"]
                        dest_port_code: port("right")("port_code")
                    }
                })
            }).without({ right: ["id", "port_name", "port_code", "country_id"] }).zip()
            .eqJoin("deli_port_id", r.table("port")).map(function (port) {
                return port.merge({
                    right: {
                        deli_port_name: port("right")("port_name"),//r.row["right"]["port_name"]
                        deli_port_code: port("right")("port_code")
                    }
                })
            }).without({ right: ["id", "port_name", "port_code", "country_id"] }).zip()
            .eqJoin("ship_id", r.table("ship")).without({ right: "id" }).zip()
            .eqJoin("shipline_id", r.table("shipline")).without({ right: "id" }).zip()
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
