var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');


router.get(['/', '/list'], function (req, res, next) {
    db.query(function (conn) {
        r.table("country")
            .merge(function (row) {
                return { country_id: row('id') }
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
router.get('/:country_id', function (req, res, next) {
    db.query(function (conn) {
        r.table("country")
            .get(req.params.country_id.toUpperCase())
            .merge({
                country_id: r.row('id')
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
router.post('/insert', function (req, res, next) {
    db.query(function (conn) {
        r.table("country")
            .insert(req.body)
            .run(conn)
            .then(function (response) {
                console.log('Success ', response);
            })
            .error(function (err) {
                console.log('error occurred ', err);
            })
    })

});
module.exports = router;
