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
                return row('type_rice_id').eq(params.type_rice_id)
                    .and(row("year").gt(String(parseInt(params.frist_year) - 1)).and(row("year").lt(String(parseInt(params.last_year) + 1))))
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

router.post(['/calculate'], function (req, res, next) {
    var params = req.body;
    db.query(function (conn) {

        statement = r.do(

            r.db('eu').table('ex_export_quantity_eu')
                .filter(
                function (row) {
                    return row('type_rice_id').eq(params.type_rice_id)
                        .and(row("year").gt(String(parseInt(params.frist_year) - 1)).and(row("year").lt(String(parseInt(params.last_year) + 1))))
                }
                )
                .filter(function (row) {
                    return r.expr(params.exporter_id).contains(row('exporter_id'))
                })
                .group('exporter_id')
                .sum('quantity').ungroup()

            ,


            r.db('eu').table('confirm_quota').merge(function (row) {
                return {
                    quantity: row('quantity')('quantity').reduce(function (left, right) {
                        return left.add(right)
                    }), year: row('quota_id')
                }
            }).filter(
                function (row) {
                    return row('type_rice_id').eq(params.type_rice_id)
                        .and(row("year").gt(String(parseInt(params.frist_year) - 1)).and(row("year").lt(String(parseInt(params.last_year) + 1))))
                }
                ).filter(function (row) {
                    return r.expr(params.exporter_id).contains(row('exporter_id'))
                })
                .group('exporter_id').sum('quantity').ungroup()

            ,


            function (sum_export, sum_quota) {
                return r.do(

                    sum_export.union(sum_quota)
                        .group('group').map(function (row) { return row('reduction') }).reduce(function (left, right) { return left.sub(right) }).ungroup()
                        .map(function (row) {
                            return {
                                quantity: r.branch(row('reduction').lt(0), 0, row('reduction')),
                                exporter_id: row('group')
                            }
                        })
                        .filter(function (row) {
                            return row('quantity').eq(0).not()
                        })

                    ,

                    r.db('eu').table('quota').get(params.year_quota).merge(
                        function (row) {
                            return row('type_rice')
                        }
                    ).filter({ type_rice_id: params.type_rice_id })

                    , function (result1, result2) {


                        return result1.merge(function (row) {
                            return { quantity: row('quantity').mul(result2('amount')(0)).div(result1.sum('quantity')) }
                        }).merge(function (row) {
                            return { period: result2('period')(0) }
                        }).merge(function (row) {
                            return {
                                period: row('period').merge(function (period) {
                                    return {
                                        quantity: row('quantity').mul(period('percent')).div(100).do(function (result) {
                                            return r.branch(result.lt(0), 0, result)
                                        })
                                    }
                                })
                                    .merge(function (row) {
                                        return { quantity_update: row('quantity') }
                                    })
                            }
                        }).do(function (exporter) {
                            return {
                                sum_for_cal: result1.sum('quantity'),
                                sum_export: sum_export.sum('reduction'),
                                sum_quota: sum_quota.sum('reduction'),
                                quota_amount:result2(0)('amount'),
                                exporter: exporter
                            }
                        })

                    }

                )
            }

        )

        statement.run(conn, function (err, cursor) {
            if (!err) {
                res.json(cursor);
            } else {
                res.json({ error: "error" });
            }
        });


    });
    //res.json({ error: params });
});


router.post(['/allocate_quota'], function (req, res, next) {

    var params = req.body;
    db.query(function (conn) {
        statement = r.db('eu').table('allocate_quota').insert(params);
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

