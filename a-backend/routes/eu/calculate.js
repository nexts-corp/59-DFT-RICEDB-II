var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');

var Ajv = require('ajv');
var ajv = Ajv({ allErrors: true, coerceTypes: 'array' });



router.get(['/year'], function (req, res, next) {
    db.query(function (conn) {
        var statement = r.db('eu').table('ex_export_quantity_eu').pluck('year').orderBy(r.desc('year'))('year').distinct();
        statement.run(conn, function (err, cursor) {
            if (!err) {
                res.json(cursor);
            } else {
                res.json({ error: "error" });
            }
        });
    });
});

router.get(['/exporter'], function (req, res, next) {
    var params = req.query;
    db.query(function (conn) {
        var statement = r.db('eu').table('ex_export_quantity_eu')
            .filter(
            function (row) {
                return row('type_rice_id').eq(params.type_rice)
                    .and(row("year").gt(String(parseInt(params.frist_year)-1)).and(row("year").lt(String(parseInt(params.frist_year)+1))))
            }
            )("exporter_id").distinct().map(function (row) {
                return { id: row }
            }).merge(function (row) {
                return r.db('external_f3').table('exporter').filter({ id: row('id') })
                    .merge(function (exporter) { return { exporter_id: exporter('id') } })
                    .eqJoin('trader_id', r.db('external_f3').table('trader')).zip()
                    .eqJoin('seller_id', r.db('external_f3').table('seller')).zip()
                    .merge(function (seller) { return { id: seller('exporter_id') } }).pluck('id', 'seller_name_th')(0)

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

