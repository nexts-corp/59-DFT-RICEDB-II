var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');
var Ajv = require('ajv');
var ajv = Ajv({ allErrors: true });

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
        "country_fullname_en": {
            "type": "string"
        },
        "country_fullname_th": {
            "type": "string"
        },
        "country_name_en": {
            "type": "string"
        },
        "country_name_th": {
            "type": "string"
        },
        "country_code2": {
            "type": "string"
        },
        "country_code3": {
            "type": "string"
        }
    },
    "required": ["id", "country_fullname_en", "country_fullname_th", "country_name_en", "country_name_th"]
};
var validate = ajv.compile(schema);


router.get(['/', '/list'], function (req, res, next) {
    db.query(function (conn) {
        r.db('common').table("country")
            .merge(function (row) {
                return {
                    country_id: row('id'),
                    date_created: row('date_created').split('T')(0),
                    date_updated: row('date_updated').split('T')(0)
                }
            })
            .merge(function (m) {
                return r.db('common').table('continent').get(m('continent_id')).without('id', 'creater', 'updater', 'date_created', 'date_updated')
            })
            .without('id')
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
router.get('/id/:country_id', function (req, res, next) {
    db.query(function (conn) {
        r.db('common').table("country")
            .get(req.params.country_id.toUpperCase())
            .merge({
                country_id: r.row('id'),
                date_created: r.row('date_created').split('T')(0),
                date_updated: r.row('date_updated').split('T')(0)
            })
            .without('id')
            .run(conn, function (err, cursor) {
                if (!err) {
                    res.json(cursor);
                } else {
                    res.json(null);
                }
            });
    });
});
router.get('/port', function (req, res, next) {
    db.query(function (conn) {
        r.db('common').table("country")
            .merge(function (row) {
                return { country_id: row('id') }
            })
            .map(function (m) {
                return m.merge(function (me) {
                    return {
                        port: r.db('common').table('port')
                            .getAll(me('country_id'), { index: 'country_id' })
                            .merge(function (p) {
                                return {
                                    port_id: p('id')
                                }
                            })
                            .without('id', 'date_created', 'date_updated', 'creater', 'updater')
                            .coerceTo('array')
                    }
                })
            })
            .without('id')
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
    var valid = validate(req.body);
    var result = { result: false, message: null, id: null };
    if (valid) {
        datacontext.insert("common", "country", req.body, res);
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
        datacontext.update("common", "country", req.body, res);
    } else {
        result.message = ajv.errorsText(validate.errors);
        res.json(result);
    }
});
router.delete('/delete/id/:id', function (req, res, next) {
    datacontext.delete("common", "country", req.params.id, res);
});


module.exports = router;
