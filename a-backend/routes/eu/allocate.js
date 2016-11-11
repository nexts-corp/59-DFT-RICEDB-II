var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');

var Ajv = require('ajv');
var ajv = Ajv({ allErrors: true, coerceTypes: 'array' });



router.get(['/allocate'], function (req, res, next) {
    var params = req.query;
    db.query(function (conn) {

        var statement = r.db('eu').table('allocate_quota').filter({
            quota_id: params.quota_id,
            type_rice_id: params.type_rice_id,
            ordinal_number: params.ordinal_number
        }).merge(function (row) {
            return {
                exporter: row('exporter').merge(function (exporter) {
                    return r.db('external_f3').table('exporter').filter({ id: exporter('exporter_id') })
                        .merge(function (exporter) { return { exporter_id: exporter('id') } })
                        .eqJoin('trader_id', r.db('external_f3').table('trader')).zip()
                        .eqJoin('seller_id', r.db('external_f3').table('seller')).zip()
                        .merge(function (seller) { return { id: seller('exporter_id') } }).pluck('id', 'seller_name_th','seller_tax_id')(0)
                        .without('id')

                })
            }
        }).coerceTo('array')(0);

        statement.run(conn, function (err, cursor) {
            if (!err) {
                res.json(cursor);
            } else {
                res.json({ error: "error" });
            }
        });
    });
});


router.get(['/quota_ordinal'], function (req, res, next) {
    var params = req.query;
    db.query(function (conn) {
        var statement = r.db('eu').table('allocate_quota')
            .filter({ quota_id: params.quota_id, type_rice_id: params.type_rice_id })
            .orderBy('ordinal_number')
            .map(function (row) {
                return row('ordinal_number')
            });
        
        statement.run(conn, function (err, cursor) {
            if (!err) {
                res.json(cursor);
            } else {
                res.json({ error: "error" });
            }
        });

    });
});


module.exports = router;

