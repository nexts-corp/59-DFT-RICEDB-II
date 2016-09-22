var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../db.js');


router.get('/list', function (req, res, next) {
    db.query(function (conn) {
        r.table("contract")
        .eqJoin("buyer_id",r.table("buyer")).zip()
        .eqJoin("country_id",r.table("country")).zip()
        .merge(function (row){
            return {
                contract_type_rice: row('contract_type_rice').map(function(arr_type_rice){
                    return arr_type_rice.merge(function (row_type_rice) {
                        return r.table('type_rice').get(row_type_rice('type_rice_id')).without('id')
                    })
                })
            }
        })
        .run(conn, function (err, cursor) {
            if (!err) {
                cursor.toArray(function (err, result) {
                    if (!err) {
                        console.log(JSON.stringify(result, null, 2));
                        res.json(result);
                    }
                });
            }
        });
    })
});

module.exports = router;
