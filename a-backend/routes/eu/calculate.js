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

router.post(['/calculateV1'], function (req, res, next) {
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
                            return { period: result2('period')(0), quantity_update: row('quantity') }
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
                                quota_amount: result2(0)('amount'),
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


router.post(['/calculate'], function (req, res, next) {
    var params = req.body;
    var duringYear = [];
    for (var i = parseInt(params.frist_year); i <= parseInt(params.last_year); i++) {
        duringYear.push(String(i));
    }

    db.query(function (conn) {

        statement = r.do(

            r.db('eu').table('ex_export_quantity_eu')
                .filter(
                function (row) {
                    return row('type_rice_id').eq(params.type_rice_id)
                        .and(row("year").gt(String(parseInt(params.frist_year) - 1)).and(row("year").lt(String(parseInt(params.last_year) + 1))))
                        .and(
                        r.expr(params.exporter_id)
                            .contains(row('exporter_id'))
                        )
                }
                ).group('exporter_id').ungroup()
                .merge(function (row) {
                    return {
                        amount: row('reduction')('quantity').reduce(function (left, right) {
                            return left.add(right);
                        }),
                        reduction: r.expr(duringYear).map(function (year) {
                            return r.do(row('reduction').filter({ year: year }), function (result) {
                                return r.branch(
                                    result.count().eq(0).not(),
                                    result(0).pluck('quantity', 'year'),
                                    { quantity: 0, year: year }
                                )
                            })

                        })
                    }
                })

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
                        .and(
                        r.expr(params.exporter_id)
                            .contains(row('exporter_id'))
                        )
                }
                ).group('exporter_id').ungroup()
                .merge(function (row) {
                    return {
                        amount: row('reduction')('quantity').reduce(function (left, right) {
                            return left.add(right);
                        }),
                        reduction: r.expr(duringYear).map(function (year) {
                            return r.do(row('reduction').filter({ year: year }), function (result) {
                                return r.branch(
                                    result.count().eq(0).not(),
                                    result(0).pluck('quantity', 'year'),
                                    { quantity: 0, year: year }
                                )
                            })

                        })
                    }
                })

            ,

            function (exported, confirmed) {
                return exported.merge(function (rowExport) {
                    return r.do(confirmed.filter({ group: rowExport('group') }), function (result) {
                        return r.branch(
                            result.count().eq(0).not(),
                            {
                                reduction2: result(0)('reduction'),
                                amount2: result(0)('amount')
                            },
                            {
                                reduction2: r.expr(duringYear).map(function (year) {
                                    return { quantity: 0, year: year }
                                }),
                                amount2: 0
                            }
                        )
                    })
                })
            }

        ).map(function (row) {
            return {
                exporter_id: row('group'),
                exported: row('reduction'),
                exported_amount: row('amount'),
                confirmed: row('reduction2'),
                confirmed_amount: row('amount2'),
                sum_export: row('amount').sub(row('amount2')),
                sum_export_convert: r.branch(row('amount').sub(row('amount2')).lt(0), 0, r.round(row('amount').sub(row('amount2'))))
            }
        })

            .merge(function (row) {
                return r.db('external_f3').table('exporter').filter({ id: row('exporter_id') })
                    .merge(function (exporter) { return { exporter_id: exporter('id') } })
                    .eqJoin('trader_id', r.db('external_f3').table('trader')).zip()
                    .eqJoin('seller_id', r.db('external_f3').table('seller')).zip()
                    .merge(function (seller) { return { id: seller('exporter_id') } }).pluck('id', 'seller_name_th')(0).without('id')
            })

            .do(function (result) {
                return r.do(

                    r.db('eu').table('quota').get(params.year_quota)
                        .merge(function (row) {
                            return {
                                type_rice: row('type_rice').filter({ type_rice_id: params.type_rice_id })(0)
                            }
                        })

                    , function (quota) {
                        return {
                            spreadsheets: result,
                            sum_for_cal: result('sum_export_convert').sum(),
                            sum_export: result('exported_amount').sum(),
                            sum_quota: result('confirmed_amount').sum(),
                            quota_amount: quota('type_rice')('amount'),
                            year: quota('id'),
                            period: quota('type_rice')('period')
                        }
                    })

            })


            .merge(function (row) {
                return {
                    spreadsheets: row('spreadsheets').merge(function (row2) {
                        return r.branch(row2('sum_export_convert').lt(0), 0, row2('sum_export_convert')).do(function (result) {
                            return { quantity: result.mul(row('quota_amount')).div(row('sum_for_cal')) }
                        })
                    })
                }
            })

            .merge(function (row) {
                return {
                    exporter: row('spreadsheets').filter(function (row2) {
                        return row2('quantity').eq(0).not()
                    }).pluck('quantity', 'exporter_id')
                        .merge(function (row3) {
                            return {
                                quantity_update: row3('quantity'),
                                period: row('period')
                                    .merge(function (row4) {
                                        return r.do(row3('quantity').mul(row4('percent')).div(100), function (result) {
                                            return { quantity: result, quantity_update: result }
                                        })
                                    })
                            }
                        })
                }
            }).without('year', 'period');

        statement.run(conn, function (err, cursor) {
            if (!err) {
                res.json(cursor);
            } else {
                res.json({ error: "error" });
            }
        });


    });
});


router.get(['/test'], function (req, res, next) {

    var data = [
        {
            "confirmed": [
                {
                    "quantity": 750,
                    "year": "2556"
                },
                {
                    "quantity": 350,
                    "year": "2557"
                },
                {
                    "quantity": 450,
                    "year": "2558"
                }
            ],
            "confirmed_amount": 1550,
            "exported": [
                {
                    "quantity": 840,
                    "year": "2556"
                },
                {
                    "quantity": 350,
                    "year": "2557"
                },
                {
                    "quantity": 50,
                    "year": "2558"
                }
            ],
            "exported_amount": 1240,
            "exporter_id": "05993550-ce69-46d3-8bac-24de7f75d88a",
            "quantity": 0,
            "seller_name_th": "บริษัท น้ำแข็งค้าข้าว จำกัด",
            "sum_export": -310,
            "sum_export_convert": 0
        },
        {
            "confirmed": [
                {
                    "quantity": 300,
                    "year": "2556"
                },
                {
                    "quantity": 1000,
                    "year": "2557"
                },
                {
                    "quantity": 450,
                    "year": "2558"
                }
            ],
            "confirmed_amount": 1750,
            "exported": [
                {
                    "quantity": 630,
                    "year": "2556"
                },
                {
                    "quantity": 150,
                    "year": "2557"
                },
                {
                    "quantity": 1200,
                    "year": "2558"
                }
            ],
            "exported_amount": 1980,
            "exporter_id": "45618ca7-157b-4fda-bbf1-7c8a01ecc744",
            "quantity": 425.9259259259259,
            "seller_name_th": "บริษัท ปองค้าข้าว จำกัด",
            "sum_export": 230,
            "sum_export_convert": 230
        },
        {
            "confirmed": [
                {
                    "quantity": 250,
                    "year": "2556"
                },
                {
                    "quantity": 300,
                    "year": "2557"
                },
                {
                    "quantity": 500,
                    "year": "2558"
                }
            ],
            "confirmed_amount": 1050,
            "exported": [
                {
                    "quantity": 100,
                    "year": "2556"
                },
                {
                    "quantity": 550,
                    "year": "2557"
                },
                {
                    "quantity": 320,
                    "year": "2558"
                }
            ],
            "exported_amount": 970,
            "exporter_id": "908c94d9-75ea-4cd7-b06a-66dbf60d2622",
            "quantity": 0,
            "seller_name_th": "บริษัท แคปปตัลซีเรียลส์ จํากัด",
            "sum_export": -80,
            "sum_export_convert": 0
        },
        {
            "confirmed": [
                {
                    "quantity": 700,
                    "year": "2556"
                },
                {
                    "quantity": 350,
                    "year": "2557"
                },
                {
                    "quantity": 600,
                    "year": "2558"
                }
            ],
            "confirmed_amount": 1650,
            "exported": [
                {
                    "quantity": 1500,
                    "year": "2556"
                },
                {
                    "quantity": 700,
                    "year": "2557"
                },
                {
                    "quantity": 300,
                    "year": "2558"
                }
            ],
            "exported_amount": 2500,
            "exporter_id": "adfa25b6-2060-4465-aaff-8e172fc36f22",
            "quantity": 1574.0740740740741,
            "seller_name_th": "บริษัท พงษ์ลาภ จำกัด",
            "sum_export": 850,
            "sum_export_convert": 850
        }
    ];

    res.json(data);



});


router.get(['/allocate_quota'], function (req, res, next) {

    var params = req.query;
    db.query(function (conn) {
        statement = r.db('eu').table('allocate_quota').without('exporter')
            .filter({ quota_id: params.quota_id }).group('type_rice_id')
            .ungroup()
            .map(function (row) {
                return {
                    type_rice_id: row('group'),
                    detail: row('reduction').orderBy('ordinal_number').without('spreadsheets')
                }
            })
            .eqJoin('type_rice_id', r.db('eu').table('type_rice')).zip().without('id');
        statement.run(conn, function (err, cursor) {
            if (!err) {
                res.json(cursor);
            } else {
                res.json({ error: "error" });
            }
        });
    });


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

router.delete(['/allocate_quota'], function (req, res, next) {

    var params = req.query;
    db.query(function (conn) {
        statement = r.db('eu').table('allocate_quota').get(params.id).delete();
        statement.run(conn, function (err, cursor) {
            if (!err) {
                res.json(cursor);
            } else {
                res.json({ error: "error" });
            }
        });
    });


});




router.get(['/spreadsheets'], function (req, res, next) {
    var params = req.query;
    db.query(function (conn) {
        var statement = r.db('eu').table('allocate_quota').get(params.id)
            .pluck('spreadsheets', 'quota_amount', 'sum_export', 'sum_for_cal', 'sum_quota', 'quota_id', 'ordinal_number', 'type_rice_id', 'id')
            .merge(function (row) {
                return r.db('eu').table('type_rice').get(row('type_rice_id')).without('id')
            })

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

