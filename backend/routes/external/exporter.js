var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');

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
        "exporter_date_update": {
            "type": "string",
            "format": "date-time"
        },
        "trader_id": {
            "type": "string"
        }
    },
    "required": ["exporter_date_update", "trader_id"]
};
var validate = ajv.compile(schema);

var dd = new Date();
var y = dd.getFullYear();
var m = dd.getMonth();
var d = dd.getDate();
var tz = "T00:00:00.000Z";
var d1y = (y - 1) + '-' + (m < 9 ? '0' : '') + (m + 1) + '-' + (d < 10 ? '0' : '') + d + tz;

router.get('/', function (req, res, next) {
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
    // console.log(d);
    // console.log(q);
    db.query(function (conn) {
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
            .eqJoin("seller_id", r.db('external_f3').table("seller")).without({ right: "id" }).zip()
            .eqJoin("type_lic_id", r.db('external_f3').table("type_license")).without({ right: "id" }).zip()
            .eqJoin("country_id", r.table("country")).without({ right: "id" }).zip()
            .filter(q)
            .filter(d)
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
router.get('/id/:exporter_id', function (req, res, next) {
    db.query(function (conn) {
        r.db('external_f3').table("exporter")
            .get(req.params.exporter_id)
            .merge({
                exporter_id: r.row('id'),
                exporter_active: r.ISO8601(d1y).toEpochTime().lt(r.ISO8601(r.row('exporter_date_update')).toEpochTime()),
                exporter_date_approve: r.row('exporter_date_approve').split('T')(0),
                exporter_date_update: r.row('exporter_date_update').split('T')(0),
                exporter_status: r.row.hasFields('exporter_no'),
                exporter_status_name: r.branch(r.row.hasFields('exporter_no'), 'เป็นสมาชิก', 'ไม่เป็นสมาชิก')
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
            r.table("country").get(r.row("country_id"))
            )
            //  .merge(r.table("country").get(r.row("country_id")))
            .without('id')
            .run(conn, function (err, cursor) {
                //console.log(err);
                if (!err) {
                    res.json(cursor);
                } else {
                    res.json(null);
                }
            });
    })
});
router.post('/insert', function (req, res, next) {
    var valid = validate(req.body);
    var result = { result: false, message: null, id: null };
    if (valid) {
        if (req.body.id == null) {
            db.query(function (conn) {
                r.db('external_f3').table('exporter').max('exporter_no').getField('exporter_no').add(1)
                    .run(conn)
                    .then(function (response) {
                        console.log('new exporter_no >' + response);
                        if (response > 0) {
                            req.body.exporter_no = response;
                            req.body.exporter_date_approve = req.body.exporter_date_update;
                            r.db('external_f3').table("exporter")
                                .insert(req.body)
                                .run(conn)
                                .then(function (response) {
                                    result.message = response;
                                    if (response.errors == 0) {
                                        result.result = true;
                                        result.id = response.generated_keys;
                                    }
                                    res.json(result);
                                    console.log(result);
                                })
                                .error(function (err) {
                                    result.message = err;
                                    res.json(result);
                                    console.log(result);
                                })
                        }
                    })
            })
        } else {
            result.message = 'field "id" must do not have data';
            res.json(result);
        }
    } else {
        result.message = ajv.errorsText(validate.errors);
        res.json(result);
    }
});
router.put('/update', function (req, res, next) {
    //console.log(req.body);
    var valid = validate(req.body);
    var result = { result: false, message: null, id: null };
    if (valid) {
        //console.log(req.body);
        if (req.body.id != '' && req.body.id != null) {
            result.id = req.body.id;
            db.query(function (conn) {
                r.db('external_f3').table("exporter")
                    .get(req.body.id)
                    .update(req.body)
                    .run(conn)
                    .then(function (response) {
                        result.message = response;
                        if (response.errors == 0) {
                            result.result = true;
                        }
                        res.json(result);
                        console.log(result);
                    })
                    .error(function (err) {
                        result.message = err;
                        res.json(result);
                        console.log(result);
                    })
            })
        } else {
            result.message = 'require field id';
            res.json(result);
        }
    } else {
        result.message = ajv.errorsText(validate.errors);
        res.json(result);
    }
});
router.delete('/delete/id/:exporter_id', function (req, res, next) {
    //var valid = validate(req.body);
    var result = { result: false, message: null, id: null };
    //  if (valid) {
    //console.log(req.body);
    if (req.params.exporter_id != '' || req.params.exporter_id != null) {
        result.id = req.params.exporter_id;
        db.query(function (conn) {
            r.db('external_f3').table("exporter")
                .get(req.params.exporter_id)
                .delete()
                .run(conn)
                .then(function (response) {
                    result.message = response;
                    if (response.errors == 0) {
                        result.result = true;
                    }
                    res.json(result);
                    console.log(result);
                })
                .error(function (err) {
                    result.message = err;
                    res.json(result);
                    console.log(result);
                })
        })
    } else {
        result.message = 'require field id';
        res.json(result);
    }
    // } else {
    //     result.message = ajv.errorsText(validate.errors);
    //     res.json(result);
    // }
});
module.exports = router;
