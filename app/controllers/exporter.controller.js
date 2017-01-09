var dd = new Date();
var y = dd.getFullYear();
var m = dd.getMonth();
var d = dd.getDate();
var tz = "T00:00:00.000Z";
var d1y = (y - 1) + '-' + (m < 9 ? '0' : '') + (m + 1) + '-' + (d < 10 ? '0' : '') + d + tz;
exports.report1 = function (req, res, next) {
    var r = req._r;
    //res.json(__dirname.replace('controller','report'));
    var parameters = {
        CURRENT_DATE: new Date().toISOString().slice(0, 10),
        SUBREPORT_DIR: __dirname.replace('controller', 'report') + '\\' + req.baseUrl.replace("/api/", "") + '\\',
        date_start: y + "-01-01" + tz,
        date_end: y + "-12-31" + tz
    };
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
    // console.log(parameters, d);
    if (Object.getOwnPropertyNames(d).length !== 0) {
        parameters['date_start'] = d['date_start'].split('T')[0];
        parameters['date_end'] = d['date_end'].split('T')[0];
        d = r.row('exporter_date_approve').gt(d.date_start).and(r.row('exporter_date_approve').lt(d.date_end));
    } else {
        d = r.row('exporter_date_approve').gt(parameters['date_start']).and(r.row('exporter_date_approve').lt(parameters['date_end']));
        parameters['date_start'] = parameters['date_start'].split('T')[0];
        parameters['date_end'] = parameters['date_end'].split('T')[0];
    }
    //console.log(parameters);

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
                exporter_active_name: r.branch(m('exporter_active').eq(null), null, m('exporter_active').eq(true), 'ปกติ', 'ถูกระงับ'),
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
            //res.json(result);
            res._ireport("report5.jasper", req.query.export || "pdf", result, parameters);
        });
}
exports.report2 = function (req, res, next) {
    var r = req._r;
    //res.json(__dirname.replace('controller','report'));
    var parameters = {
        CURRENT_DATE: new Date().toISOString().slice(0, 10),
        SUBREPORT_DIR: __dirname.replace('controller', 'report') + '\\' + req.baseUrl.replace("/api/", "") + '\\',
        date_start: y + "-01-01" + tz,
        date_end: y + "-12-31" + tz
    };
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
    // console.log(parameters, d);
    if (Object.getOwnPropertyNames(d).length !== 0) {
        parameters['date_start'] = d['date_start'].split('T')[0];
        parameters['date_end'] = d['date_end'].split('T')[0];
        d = r.row('exporter_date_approve').gt(d.date_start).and(r.row('exporter_date_approve').lt(d.date_end));
    } else {
        d = r.row('exporter_date_approve').gt(parameters['date_start']).and(r.row('exporter_date_approve').lt(parameters['date_end']));
        parameters['date_start'] = parameters['date_start'].split('T')[0];
        parameters['date_end'] = parameters['date_end'].split('T')[0];
    }
    //console.log(parameters);

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
                exporter_active_name: r.branch(m('exporter_active').eq(null), null, m('exporter_active').eq(true), 'ปกติ', 'ถูกระงับ'),
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
            //res.json(result);
            res._ireport("report6.jasper", "pdf", result, parameters);
        });
}
exports.report3 = function (req, res, next) {
    var r = req._r;
    //res.json(__dirname.replace('controller','report'));
    var parameters = {
        CURRENT_DATE: new Date().toISOString().slice(0, 10),
        SUBREPORT_DIR: __dirname.replace('controller', 'report') + '\\' + req.baseUrl.replace("/api/", "") + '\\',
        date_start: y + "-01-01" + tz,
        date_end: y + "-12-31" + tz
    };
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
    // console.log(parameters, d);
    if (Object.getOwnPropertyNames(d).length !== 0) {
        parameters['date_start'] = d['date_start'].split('T')[0];
        parameters['date_end'] = d['date_end'].split('T')[0];
        d = r.row('exporter_date_approve').gt(d.date_start).and(r.row('exporter_date_approve').lt(d.date_end));
    } else {
        d = r.row('exporter_date_approve').gt(parameters['date_start']).and(r.row('exporter_date_approve').lt(parameters['date_end']));
        parameters['date_start'] = parameters['date_start'].split('T')[0];
        parameters['date_end'] = parameters['date_end'].split('T')[0];
    }
    //console.log(parameters);

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
                exporter_active_name: r.branch(m('exporter_active').eq(null), null, m('exporter_active').eq(true), 'ปกติ', 'ถูกระงับ'),
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
            //res.json(result);
            res._ireport("report7.jasper", "pdf", result, parameters);
        });
}
exports.report4 = function (req, res){
    var r = req._r;
    r.db('external_f3').table('exporter')
    .run()
    .then(function(result){
        res.json(result)
    })
    .error(function(err){
        res.json(err)
    })
}
