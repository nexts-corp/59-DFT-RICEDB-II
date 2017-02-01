var DataContext = require('../../class/DataContext.js');
var datacontext = new DataContext();

var Ajv = require('ajv');
var ajv = Ajv({ allErrors: true });
var schema = {
    //'type': 'object',
    "properties": {
        "id": {
            "type": "string"
        },
        "exporter_no": {
            "type": "number"
        },
        "exporter_date_approve": {
            "type": "string",
            "format": "date-time"
        },
        "exporter_remark": {
            "type": "string"
        },
        "trader_id": {
            "type": "string"
        }
    },
    "required": ["exporter_date_approve", "trader_id"]
};
var validate = ajv.compile(schema);

var dd = new Date();
var y = dd.getFullYear();
var m = dd.getMonth();
var d = dd.getDate();
var tz = "T00:00:00.000Z";
var d1y = (y - 1) + '-' + (m < 9 ? '0' : '') + (m + 1) + '-' + (d < 10 ? '0' : '') + d + tz;

exports.exporterTest = function (req, res) {
    var r = req._r;
    var q = {}, d = {};
    for (key in req.query) {

        if (req.query[key] == "true") {
            req.query[key] = true;
        } else if (req.query[key] == "false") {
            req.query[key] = false;
        } else if (req.query[key] == "null") {
            req.query[key] = null;
        }

        if (key.indexOf('date') > -1) {
            d[key] = req.query[key] + tz;
        } else {
            q[key] = req.query[key];
        }
    }
    if (Object.getOwnPropertyNames(d).length !== 0) {
        d = r.row('exporter_date_approve').gt(d.date_start).and(r.row('exporter_date_approve').lt(d.date_end));
    }

    r.db('external_f3').table("trader").outerJoin(
        r.db('external_f3').table("exporter"),
        function (trader, exporter) {
            return exporter("trader_id").eq(trader("id"))
        })
        .merge(function (mm) {
            return {
                left: {
                    trader_id: mm('left')('id')
                }
            }
        })
        .without({ left: 'id' })
        .zip()
        .merge(function (m) {
            return {
                exporter_id: r.branch(m.hasFields('id'), m('id'), null),
                exporter_active: r.branch(m.hasFields('exporter_date_update'), r.ISO8601(d1y).toEpochTime().lt(r.ISO8601(m('exporter_date_update')).toEpochTime()), null),
                exporter_status: m.hasFields('exporter_no'),
                exporter_status_name: r.branch(m.hasFields('exporter_no'), 'เป็นสมาชิก', 'ไม่เป็นสมาชิก'),
                exporter_date_approve: r.branch(m.hasFields('exporter_date_approve'), m('exporter_date_approve').split('T')(0), null),
                exporter_no_name: r.branch(
                    m.hasFields('exporter_no'),
                    r.branch(
                        m('exporter_no').lt(10)
                        , r.expr('ข.000')
                        , r.branch(
                            m('exporter_no').lt(100)
                            , r.expr('ข.00')
                            , r.branch(
                                m('exporter_no').lt(1000)
                                , r.expr('ข.0')
                                , r.expr('ข.')
                            )
                        )
                    ).add(m('exporter_no').coerceTo('string'))
                    , null
                ),
                exporter_date_update: r.branch(m.hasFields('exporter_date_update'), m('exporter_date_update').split('T')(0), null),
                trader_date_approve: m('trader_date_approve').split('T')(0),
                trader_date_expire: m('trader_date_approve').split('T')(0).split('-')(0).add("-12-31"),
                trader_active: r.now().toISO8601().lt(m('trader_date_approve').split('T')(0).split('-')(0).add("-12-31T00:00:00.000Z"))
                //r.time(m('trader_date_approve').split('T')(0).split('-')(0).coerceTo('number'), r.december, 31, 0, 0, 0, '+07:00').toISO8601()
            }
        })
        .merge(function (m) {
            return {
                exporter_active_name: r.branch(m('exporter_active').eq(null), null, m('exporter_active').eq(true), 'ปกติ', 'หมดอายุ'),
                trader_active_name: r.branch(m('trader_active').eq(true), 'ปกติ', 'หมดอายุ')
            }
        })
        .without('id')
        .eqJoin("seller_id", r.db('external_f3').table("seller")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
        .eqJoin("type_lic_id", r.db('external_f3').table("type_license")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
        .eqJoin("country_id", r.db('common').table("country")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
        .filter(q)
        .filter(d)
        .orderBy('exporter_no')
        .run()
        .then(function (result) {
            res.json(result)
        })
        .error(function (err) {
            res.json(err)
        })
}
exports.exporterId = function (req, res) {
    var r = req._r;
    r.db('external_f3').table("exporter")
        .get(req.params.exporter_id)
        .merge({
            exporter_id: r.row('id'),
            exporter_active: r.ISO8601(d1y).toEpochTime().lt(r.ISO8601(r.row('exporter_date_approve')).toEpochTime()),
            exporter_date_approve: r.row('exporter_date_approve').split('T')(0),
            exporter_status: r.row.hasFields('exporter_no'),
            exporter_status_name: r.branch(r.row.hasFields('exporter_no'), 'เป็นสมาชิก', 'ไม่เป็นสมาชิก'),
            exporter_no_name: r.branch(
                r.row('exporter_no').lt(10)
                , r.expr('ข.000')
                , r.branch(
                    r.row('exporter_no').lt(100)
                    , r.expr('ข.00')
                    , r.branch(
                        r.row('exporter_no').lt(1000)
                        , r.expr('ข.0')
                        , r.expr('ข.')
                    )
                )
            ).add(r.row('exporter_no').coerceTo('string'))
        },
        r.db('external_f3').table("trader").get(r.row("trader_id"))
            .merge(function (m) {
                return {
                    trader_date_approve: m('trader_date_approve').split('T')(0),
                    trader_date_expire: m('trader_date_approve').split('T')(0).split('-')(0).add("-12-31"),
                    trader_active: r.now().toISO8601().lt(m('trader_date_approve').split('T')(0).split('-')(0).add("-12-31T00:00:00.000Z"))
                }
            }),
        r.db('external_f3').table("seller").get(r.row("seller_id")),
        r.db('external_f3').table("type_license").get(r.row("type_lic_id")),
        r.db('common').table("country").get(r.row("country_id"))
        )
        //  .merge(r.db('common').table("country").get(r.row("country_id")))
        .without('id')
        .run()
        .then(function (result) {
            res.json(result)
        })
        .error(function (err) {
            res.json(err)
        })
    // .run(conn, function (err, cursor) {
    //     //console.log(err);
    //     if (!err) {
    //         res.json(cursor);
    //     } else {
    //         res.json(null);
    //     }
    // });
}
exports.insert = function (req, res) {
    var r = req._r;
    var valid = validate(req.body);
    var result = { result: false, message: null, id: null };
    if (valid) {
        if (req.body.id == null) {
            r.db('external_f3').table('exporter').max('exporter_no').getField('exporter_no').add(1)
                .run()
                .then(function (response) {
                    // console.log('new exporter_no >' + response);
                    console.log(req.body);
                    if (response > 0) {
                        req.body.exporter_no = response;
                        req.body.exporter_date_approve = req.body.exporter_date_approve;
                        datacontext.insert("external_f3", "exporter", req.body, res, req);
                    }
                })
        } else {
            result.message = 'field "id" must do not have data';
            res.json(result);
        }
    } else {
        result.message = ajv.errorsText(validate.errors);
        res.json(result);
    }
}
exports.update = function (req, res) {
    var r = req._r;
    var valid = validate(req.body);
    var result = { result: false, message: null, id: null };
    if (valid) {
        datacontext.update("external_f3", "exporter", req.body, res, req);
    } else {
        result.message = ajv.errorsText(validate.errors);
        res.json(result);
    }
}
exports.delete = function (req, res) {
    datacontext.delete("external_f3", "exporter", req.params.id, res, req);
}
exports.exporter = function (req, res) {
    var r = req._r;
    var q = {}, d = {};
    for (key in req.query) {

        if (req.query[key] == "true") {
            req.query[key] = true;
        } else if (req.query[key] == "false") {
            req.query[key] = false;
        } else if (req.query[key] == "null") {
            req.query[key] = null;
        }

        if (key.indexOf('date') > -1) {
            d[key] = req.query[key] + tz;
        } else {
            q[key] = req.query[key];
        }
    }
    if (Object.getOwnPropertyNames(d).length !== 0) {
        d = r.row('exporter_date_approve').gt(d.date_start).and(r.row('exporter_date_approve').lt(d.date_end));
    }

    r.db('external_f3').table("trader").outerJoin(
        r.db('external_f3').table("exporter")
            .merge(function (m) {
                return {
                    exporter_id: m('id'),
                    book: r.db('g2g').table('shipment_detail')
                        .getAll(m('id'), { index: 'exporter_id' })
                        .pluck('book_id')
                        .distinct()
                        .coerceTo('array')
                        .eqJoin('book_id', r.db('g2g').table('book')).pluck({ right: 'etd_date' }, "left").zip()
                        .orderBy(r.desc('etd_date'))
                        .limit(1)
                        .getField('etd_date')
                }
            }).without('id')
            .merge(function (m) {
                return {
                    export_date: r.branch(
                        m('book').eq([]),
                        null,
                        m('book')(0).split('T')(0)
                    ),
                    export_date_expire: r.branch(
                        m('book').eq([]),
                        null,
                        r.ISO8601(m('book')(0)).add(31449600)
                        // r.ISO8601(m('book')(0)).year().add(1)
                        //  r.ISO8601(m('book')(0)).month()
                        //r.ISO8601(m('book')(0)).day().sub(1)
                        //.add(31536000)
                    ),
                    // export_status: r.branch(
                    //     m('book').eq([]),
                    //     false,
                    //     r.ISO8601(m('book')(0)).add(31449600).gt(r.now())
                    // ),
                    exporter_date_expire: r.ISO8601(m('exporter_date_approve')).add(31449600)
                }
            })
            .merge(function (mm) {
                return {
                    export_date_expire: r.branch(mm('export_date_expire').gt(mm('exporter_date_expire')),
                        mm('export_date_expire'),
                        mm('exporter_date_expire'))
                }
            })
            .merge(function (mmm) {
                return {
                    export_status: r.branch(mmm('export_date_expire').gt(r.now()), true, false),
                    export_date_expire: mmm('export_date_expire').toISO8601(),
                    exporter_date_expire: mmm('exporter_date_expire').toISO8601()
                }
            })
            .without('book'),
        function (trader, exporter) {
            return exporter("trader_id").eq(trader("id"))
        })
        .merge(function (mm) {
            return {
                left: {
                    trader_id: mm('left')('id')
                }
            }
        })
        .without({ left: 'id' })
        .zip()
        .merge(function (m) {
            return {
                export_date_expire: r.branch(m.hasFields('export_date_expire'), m('export_date_expire').split('T')(0), null),
                export_status: r.branch(m.hasFields('export_status'), m('export_status'), null),
                exporter_id: r.branch(m.hasFields('exporter_id'), m('exporter_id'), null),
                exporter_status: m.hasFields('exporter_no'),
                exporter_status_name: r.branch(m.hasFields('exporter_no'), 'เป็นสมาชิก', 'ไม่เป็นสมาชิก'),
                exporter_date_approve: r.branch(m.hasFields('exporter_date_approve'), m('exporter_date_approve').split('T')(0), null),
                exporter_date_expire: r.branch(m.hasFields('exporter_date_expire'), m('exporter_date_expire').split('T')(0), null),
                exporter_no_name: r.branch(
                    m.hasFields('exporter_no'),
                    r.branch(
                        m('exporter_no').lt(10)
                        , r.expr('ข.000')
                        , r.branch(
                            m('exporter_no').lt(100)
                            , r.expr('ข.00')
                            , r.branch(
                                m('exporter_no').lt(1000)
                                , r.expr('ข.0')
                                , r.expr('ข.')
                            )
                        )
                    ).add(m('exporter_no').coerceTo('string'))
                    , null
                ),
                trader_date_approve: m('trader_date_approve').split('T')(0),
                trader_date_expire: m('trader_date_approve').split('T')(0).split('-')(0).add("-12-31"),
                trader_active: r.now().toISO8601().lt(m('trader_date_approve').split('T')(0).split('-')(0).add("-12-31T00:00:00.000Z"))
                //r.time(m('trader_date_approve').split('T')(0).split('-')(0).coerceTo('number'), r.december, 31, 0, 0, 0, '+07:00').toISO8601()
            }
        })
        .merge(function (m) {
            return {
                trader_active_name: r.branch(m('trader_active').eq(true), 'ปกติ', 'หมดอายุ'),
                export_status_name: r.branch(m('export_status').eq(null), null, m('export_status').eq(true), 'ปกติ', 'หมดอายุ')
            }
        })
        .without('id')
        .eqJoin("seller_id", r.db('external_f3').table("seller")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
        .eqJoin("type_lic_id", r.db('external_f3').table("type_license")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
        .eqJoin("country_id", r.db('common').table("country")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
        .filter(q)
        .filter(d)
        .orderBy('exporter_no')
        .run()
        .then(function (result) {
            res.json(result)
        })
        .error(function (err) {
            res.json(err)
        })
}
