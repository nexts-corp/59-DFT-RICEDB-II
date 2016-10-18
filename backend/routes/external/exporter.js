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
            "type": "string"
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
        },
        "seller_agent": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "agent_name": { "type": "string" }
                },
                "required": ["agent_name"]
            }
        }
    },
    "required": ["exporter_no", "exporter_date_approve", "exporter_date_update", "trader_id", "seller_agent"]
};
var validate = ajv.compile(schema);

var dd = new Date();
var y = dd.getFullYear();
var m = dd.getMonth();
var d = dd.getDate();
var d1y = (y - 1) + '-' + (m < 9 ? '0' : '') + (m + 1) + '-' + (d < 10 ? '0' : '') + d + "T00:00:00.000Z";

router.get(['/', '/list'], function (req, res, next) {
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
                    exporter_status: m.hasFields('exporter_no'),
                    exporter_status_name: r.branch(m.hasFields('exporter_no'), 'เป็นสมาชิก', 'ไม่เป็นสมาชิก'),
                    exporter_date_approve: r.branch(m.hasFields('exporter_date_approve'), m('exporter_date_approve').split('T')(0), null),
                    exporter_date_update: r.branch(m.hasFields('exporter_date_update'), m('exporter_date_update').split('T')(0), null),
                    trader_date_approve: m('trader_date_approve').split('T')(0),
                    trader_date_expire: m('trader_date_expire').split('T')(0)
                }
            })
            .without('id')
            .eqJoin("seller_id", r.db('external_f3').table("seller")).without({ right: "id" }).zip()
            .eqJoin("type_lic_id", r.db('external_f3').table("type_license")).without({ right: "id" }).zip()
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
router.get('/not', function (req, res, next) {
    db.query(function (conn) {
        r.db('external_f3').table("trader").outerJoin(
            r.db('external_f3').table("exporter"),
            function (trader, exporter) {
                return exporter("trader_id").eq(trader("id"))
            }).zip()
            .merge({
                trader_id: r.row('id'),
                trader_date_approve: r.row('trader_date_approve').split('T')(0),
                trader_date_expire: r.row('trader_date_expire').split('T')(0)
            }).without("id")
            .filter(r.row.hasFields('exporter_no').not())
            .eqJoin("seller_id", r.db('external_f3').table("seller")).without({ right: "id" }).zip()
            .eqJoin("type_lic_id", r.db('external_f3').table("type_license")).without({ right: "id" }).zip()
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
router.get('/active', function (req, res, next) {
    db.query(function (conn) {
        r.db('external_f3').table("exporter")
            .filter(function (row) {
                return r.ISO8601(row('exporter_date_update')).toEpochTime().gt(r.ISO8601(d1y).toEpochTime())
            })
            .merge(function (row) {
                return {
                    exporter_id: row('id'),
                    exporter_active: r.ISO8601(d1y).toEpochTime().lt(r.ISO8601(row('exporter_date_update')).toEpochTime()),
                    exporter_status: row.hasFields('exporter_no'),
                    exporter_status_name: r.branch(row.hasFields('exporter_no'), 'เป็นสมาชิก', 'ไม่เป็นสมาชิก'),
                    exporter_date_approve: row('exporter_date_approve').split('T')(0),
                    exporter_date_update: row('exporter_date_update').split('T')(0)
                }
            })
            .without('id')
            .eqJoin("trader_id", r.db('external_f3').table("trader"))
            .without({ right: "id" }).zip()
            .merge(function (r) {
                return {
                    trader_date_approve: r('trader_date_approve').split('T')(0),
                    trader_date_expire: r('trader_date_expire').split('T')(0)
                }
            })
            .eqJoin("seller_id", r.db('external_f3').table("seller")).without({ right: "id" }).zip()
            .eqJoin("type_lic_id", r.db('external_f3').table("type_license")).without({ right: "id" }).zip()
            .eqJoin("country_id", r.table("country")).without({ right: "id" }).zip()
            .orderBy(r.desc('exporter_date_approve'))
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
router.get('/unactive', function (req, res, next) {
    db.query(function (conn) {
        r.db('external_f3').table("exporter")
            .filter(function (row) {
                return r.ISO8601(row('exporter_date_update')).toEpochTime().lt(r.ISO8601(d1y).toEpochTime())
            })
            .merge(function (row) {
                return {
                    exporter_id: row('id'),
                    exporter_active: r.ISO8601(d1y).toEpochTime().lt(r.ISO8601(row('exporter_date_update')).toEpochTime()),
                    exporter_status: row.hasFields('exporter_no'),
                    exporter_status_name: r.branch(row.hasFields('exporter_no'), 'เป็นสมาชิก', 'ไม่เป็นสมาชิก'),
                    exporter_date_approve: row('exporter_date_approve').split('T')(0),
                    exporter_date_update: row('exporter_date_update').split('T')(0)
                }
            })
            .without('id')
            .eqJoin("trader_id", r.db('external_f3').table("trader"))
            .without({ right: "id" }).zip()
            .merge(function (r) {
                return {
                    trader_date_approve: r('trader_date_approve').split('T')(0),
                    trader_date_expire: r('trader_date_expire').split('T')(0)
                }
            })
            .eqJoin("seller_id", r.db('external_f3').table("seller")).without({ right: "id" }).zip()
            .eqJoin("type_lic_id", r.db('external_f3').table("type_license")).without({ right: "id" }).zip()
            .eqJoin("country_id", r.table("country")).without({ right: "id" }).zip()
            .orderBy(r.desc('exporter_date_update'))
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
                // exporter_date_create: r.row('exporter_date_create').split('T')(0),
                exporter_date_update: r.row('exporter_date_update').split('T')(0)
            },
            r.db('external_f3').table("trader").get(r.row("trader_id"))
                .merge(function (r) {
                    return {
                        trader_date_approve: r('trader_date_approve').split('T')(0),
                        trader_date_expire: r('trader_date_expire').split('T')(0)
                    }
                }),
            r.db('external_f3').table("seller").get(r.row("seller_id")),
            r.db('external_f3').table("type_license").get(r.row("type_lic_id")),
            r.table("country").get(r.row("country_id"))
            )
            //  .merge(r.table("country").get(r.row("country_id")))
            .without('id')
            .run(conn, function (err, cursor) {
                console.log(err);
                if (!err) {
                    res.json(cursor);
                } else {
                    res.json(null);
                }
            });
    })
});
router.get('/get', function (req, res, next) {
    var status = null;
    console.log(req.query.status);
    res.json(req.query.status);
    if (req.query.status == "true") {
        status = true;
    } else if (req.query.status == "false") {
        status = false;
    }
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
                    exporter_status: m.hasFields('exporter_no'),
                    exporter_status_name: r.branch(m.hasFields('exporter_no'), 'เป็นสมาชิก', 'ไม่เป็นสมาชิก')
                }
            })
            .without('id')
            .filter({ exporter_status: status })
            .eqJoin("seller_id", r.db('external_f3').table("seller")).without({ right: "id" }).zip()
            .eqJoin("type_lic_id", r.db('external_f3').table("type_license")).without({ right: "id" }).zip()
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

router.get('/type/:type_lic_id', function (req, res, next) {
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
                    exporter_status: m.hasFields('exporter_no'),
                    exporter_status_name: r.branch(m.hasFields('exporter_no'), 'เป็นสมาชิก', 'ไม่เป็นสมาชิก'),
                    exporter_date_approve: r.branch(m.hasFields('exporter_date_approve'), m('exporter_date_approve').split('T')(0), null),
                    exporter_date_update: r.branch(m.hasFields('exporter_date_update'), m('exporter_date_update').split('T')(0), null),
                    trader_date_approve: m('trader_date_approve').split('T')(0),
                    trader_date_expire: m('trader_date_expire').split('T')(0)
                }
            })
            .without('id')
            .filter({ type_lic_id: req.params.type_lic_id.toUpperCase() })
            .eqJoin("seller_id", r.db('external_f3').table("seller")).without({ right: "id" }).zip()
            .eqJoin("type_lic_id", r.db('external_f3').table("type_license")).without({ right: "id" }).zip()
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
router.get('/type/:type_lic_id/status/:status', function (req, res, next) {
    var status;
    if (req.params.status == "true") {
        status = true;
    } else {
        status = false;
    }
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
                    exporter_status: m.hasFields('exporter_no'),
                    exporter_status_name: r.branch(m.hasFields('exporter_no'), 'เป็นสมาชิก', 'ไม่เป็นสมาชิก'),
                    exporter_date_approve: r.branch(m.hasFields('exporter_date_approve'), m('exporter_date_approve').split('T')(0), null),
                    exporter_date_update: r.branch(m.hasFields('exporter_date_update'), m('exporter_date_update').split('T')(0), null),
                    trader_date_approve: m('trader_date_approve').split('T')(0),
                    trader_date_expire: m('trader_date_expire').split('T')(0)
                }
            })
            .without('id')
            .filter({ type_lic_id: req.params.type_lic_id.toUpperCase(), exporter_status: status })
            .eqJoin("seller_id", r.db('external_f3').table("seller")).without({ right: "id" }).zip()
            .eqJoin("type_lic_id", r.db('external_f3').table("type_license")).without({ right: "id" }).zip()
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
router.get('/status/:status', function (req, res, next) {
    var status;
    if (req.params.status == "true") {
        status = true;
    } else {
        status = false;
    }
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
                    exporter_status: m.hasFields('exporter_no'),
                    exporter_status_name: r.branch(m.hasFields('exporter_no'), 'เป็นสมาชิก', 'ไม่เป็นสมาชิก'),
                    exporter_date_approve: r.branch(m.hasFields('exporter_date_approve'), m('exporter_date_approve').split('T')(0), null),
                    exporter_date_update: r.branch(m.hasFields('exporter_date_update'), m('exporter_date_update').split('T')(0), null),
                    trader_date_approve: m('trader_date_approve').split('T')(0),
                    trader_date_expire: m('trader_date_expire').split('T')(0)
                }
            })
            .without('id')
            .filter({ exporter_status: status })
            .eqJoin("seller_id", r.db('external_f3').table("seller")).without({ right: "id" }).zip()
            .eqJoin("type_lic_id", r.db('external_f3').table("type_license")).without({ right: "id" }).zip()
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
router.post('/insert', function (req, res, next) {
    //console.log(req.body);
    var valid = validate(req.body);
    var result = { result: false, message: null, id: null };
    if (valid) {
        //console.log(req.body);
        if (req.body.id == null) {
            //result.id = req.body.id;
            db.query(function (conn) {
                r.db('external_f3').table("exporter")
                    //.get(req.body.id)
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
        if (req.body.id != '' || req.body.id != null) {
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

// router.get(['/', '/list'], function (req, res, next) {
//     db.query(function (conn) {
//         r.db('external_f3').table("exporter")
//             .merge(function (row) {
//                 return {
//                     exporter_id: row('id'),
//                     exporter_active: r.ISO8601(d1y).toEpochTime().lt(r.ISO8601(row('exporter_date_update')).toEpochTime()),
//                     exporter_date_approve: row('exporter_date_approve').split('T')(0),
//                     // exporter_date_create: row('exporter_date_create').split('T')(0),
//                     exporter_date_update: row('exporter_date_update').split('T')(0)
//                 }
//             })
//             .without('id')
//             .eqJoin("trader_id", r.db('external_f3').table("trader"))
//             .without({ right: "id" }).zip()
//             .merge(function (r) {
//                 return {
//                     trader_date_approve: r('trader_date_approve').split('T')(0),
//                     trader_date_expire: r('trader_date_expire').split('T')(0)
//                 }
//             })
//             .eqJoin("seller_id", r.db('external_f3').table("seller")).without({ right: "id" }).zip()
//             .eqJoin("type_lic_id", r.db('external_f3').table("type_license")).without({ right: "id" }).zip()
//             .eqJoin("country_id", r.table("country")).without({ right: "id" }).zip()
//             .orderBy(r.desc('exporter_date_update'))
//             .run(conn, function (err, cursor) {
//                 if (!err) {
//                     cursor.toArray(function (err, result) {
//                         if (!err) {
//                             //console.log(JSON.stringify(result, null, 2));
//                             res.json(result);
//                         } else {
//                             res.json(null);
//                         }
//                     });
//                 } else {
//                     res.json(null);
//                 }
//             });
//     })
// });

// router.get('/seller/name/:seller_name', function (req, res, next) {
//     // res.json(req.params.seller_name);
//     db.query(function (conn) {
//         r.db('external_f3').table("exporter")
//             .eqJoin("trader_id", r.db('external_f3').table("trader")).without({ right: "id" }).zip()
//             .eqJoin("seller_id", r.db('external_f3').table("seller")).without({ right: "id" }).zip()
//             .eqJoin("type_lic_id", r.db('external_f3').table("type_license")).without({ right: "id" }).zip()
//             .filter(
//             r.row('seller_name_th').match(req.params.seller_name)
//             )
//             // .without(
//             //     "id","country_id","exporter_date_approve","exporter_date_create","exporter_date_update",
//             //     "exporter_no","seller_address_en","seller_agent","seller_phone","trader_date_approve",
//             //     "trader_date_expire","trader_distric","trader_office","trader_province","type_lic_id"
//             // )
//             .pluck(
//             "seller_id", "seller_name_th", "seller_name_en", "seller_address_th",
//             "trader_id", "trader_no", "trader_name"
//             )
//             .run(conn, function (err, cursor) {
//                 if (!err) {
//                     cursor.toArray(function (err, result) {
//                         if (!err) {
//                             //console.log(JSON.stringify(result, null, 2));
//                             res.json(result);
//                         } else {
//                             res.json(null);
//                         }
//                     });
//                 } else {
//                     res.json(null);
//                 }
//             });
//     })
// });
// router.get('/type/license', function (req, res, next) {
//     db.query(function (conn) {
//         r.db('external_f3').table('type_license')
//             .map(function (ma) {
//                 return ma.merge(function (me) {
//                     return {
//                         type_lic_id: me('id'),
//                         seller: r.db('external_f3').table("trader").outerJoin(
//                             r.db('external_f3').table("exporter"),
//                             function (trader, exporter) {
//                                 return exporter("trader_id").eq(trader("id"))
//                             }).zip()
//                             .filter({ type_lic_id: me('id') })
//                             .merge(function (m) {
//                                 return {
//                                     exporter_status: m.hasFields('exporter_no'),
//                                     exporter_id: m('id'),
//                                     exporter_status_name: r.branch(m.hasFields('exporter_no'), 'เป็นสมาชิก', 'ไม่เป็นสมาชิก')
//                                 }
//                             })
//                             .without('id')
//                             .eqJoin("seller_id", r.db('external_f3').table("seller")).without({ right: "id" }).zip()
//                             .coerceTo('array')
//                     }
//                 })
//             })
//             .without('id')
//             .run(conn, function (err, cursor) {
//                 if (!err) {
//                     cursor.toArray(function (err, result) {
//                         if (!err) {
//                             //console.log(JSON.stringify(result, null, 2));
//                             res.json(result);
//                         } else {
//                             res.json(null);
//                         }
//                     });
//                 } else {
//                     res.json(null);
//                 }
//             });
//     })
// });