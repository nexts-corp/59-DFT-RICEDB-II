var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');


router.get('/:shm_id', function (req, res, next) {
    db.query(function (conn) {
        r.table("shipment")
            //.filter({contract_id:req.params.contract_id})
            .get(req.params.shm_id)
            .merge(function (row) {
                return {
                    shm_id: row('id'),
                    shipment_detail: r.table("shipment_detail")
                        .filter({ "shm_id": row('id') })
                        .eqJoin("cl_id", r.table("confirm_letter")).without({ 
                            right: ["id","cl_quality","cl_type_rice","cl_total_quantity","cl_date"] 
                        }).zip()
                        .eqJoin("carrier_id", r.table("carrier")).without({ right: "id" }).zip()
                        .eqJoin("seller_id", r.table("seller")).without({ right: "id" }).zip()
                        .eqJoin("ship_id", r.table("ship")).without({ right: "id" }).zip()
                        .eqJoin("shipline_id", r.table("shipline")).without({ right: "id" }).zip()
                        .eqJoin("surveyor_id", r.table("surveyor")).without({ right: "id" }).zip()
                        .eqJoin("type_rice_id", r.table("type_rice")).without({ right: "id" }).zip()
                        .eqJoin("package_id", r.table("package")).without({ right: "id" }).zip()
                        .eqJoin("country_id", r.table("country")).without({ right: "id" }).zip()
                        .without('id')
                        .coerceTo('array'),
                    shm_quantity: r.table("shipment_detail")
                        .filter({ "shm_id": row('id') })
                        .sum("shm_det_quantity")
                }
            })
            //.innerJoin("shm_id", r.table("shipment_detail")).without({ right: "id" }).zip()
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

module.exports = router;
