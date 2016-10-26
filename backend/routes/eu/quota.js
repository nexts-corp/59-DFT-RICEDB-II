var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');

var Ajv = require('ajv');
var ajv = Ajv({ allErrors: true, coerceTypes: 'array' });



router.get(['/year'], function (req, res, next) {
    console.log('dd');
    db.query(function (conn) {
        var statement = r.db('eu').table('quota').map(function(x){ return x('id') }).coerceTo('array');
        statement.run(conn, function (err, cursor) {
            if (!err) {
                res.json(cursor);
            } else {
                res.json({error:"error"});
            }
        });
    });
});


router.get(['/'], function (req, res, next) {
    db.query(function (conn) {
        var params = req.query;
        var statemant = r.db('eu').table('quota').get(params.id).merge(function (row) {
            return {
                type_rice: row('type_rice').merge(function (type_rice) {
                    return (r.db('eu').table('type_rice').get(type_rice('type_rice_id')).without('id'))
                })
            }
        })

        statemant.run(conn, function (err, cursor) {
            if (!err) {
                res.json(cursor);
            } else {
                res.json(null);
            }
        });
    })
});




router.post(['/'], function (req, res, next) {
    db.query(function (conn) {
        var statement = r.db('eu').table('quota').get(req.body.id).do(function (x) {
            return r.branch(
                x.eq(null),
                r.db('eu').table('quota').insert(
                    {
                        "id": req.body.id,
                        "type_rice": [req.body.type_rice]
                    }
                )
                ,
                r.db('eu').table('quota').filter(
                    function (row) {
                        return row('id').eq(req.body.id).and(
                            row('type_rice').contains(
                                function (type_rice) {
                                    return type_rice('type_rice_id').eq(req.body.type_rice.type_rice_id)
                                }
                            )
                        )
                    }
                ).coerceTo('array')
                .do(function (y) {
                    return r.branch(y.eq([]),
                        r.db('eu').table('quota').get(req.body.id).update(function (z) {
                            return {
                                type_rice: z('type_rice').append(req.body.type_rice)
                            }
                        })
                        , { error: "type_rice exist" })
                })
            )
        });

        statement.run(conn, function (err, cursor) {
            if (!err) {
                res.json(cursor);
            } else {
                res.json({error:"error"});
            }
        });
    });
});




module.exports = router;

