var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');


router.get('/:shm_id', function (req, res, next) {
    db.query(function (conn) {
        r.table("shipment")
            //.filter({contract_id:req.params.contract_id})
            .get(req.params.shm_id)
            .merge({ shm_id: r.row('id') })
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
