var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');


router.get('/list', function (req, res, next) {
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
                                cl_ship_quantity: cl('cl_total_quantity').div(2)
                            }
                        })
                        .without('id')
                        .coerceTo('array'),
                    contract_sent: r.table('confirm_letter')
                        .filter({ 'contract_id': row('id') })
                        .sum('cl_total_quantity'),
                    contract_balance: row('contract_quantity').sub(r.table('confirm_letter')
                        .filter({ 'contract_id': row('id') })
                        .sum('cl_total_quantity'))
                }
            }).without('id')
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

// router.get('/list/:abc', function (req, res, next) {
//     console.log(req.abc);
// });

module.exports = router;
