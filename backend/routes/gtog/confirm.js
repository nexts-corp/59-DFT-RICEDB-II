var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');


router.get('/:cl_id', function (req, res, next) {
    db.query(function (conn) {
        r.table("confirm_letter")
            .get(req.params.cl_id)
            .merge(function (row) {
                return {
                    cl_id: row('id'),
                    cl_type_rice: row('cl_type_rice').map(function (arr_type_rice) {
                        return arr_type_rice.merge(function (row_type_rice) {
                            return {
                                package: row_type_rice('package').map(function (arr_package) {
                                    return arr_package.merge(function (row_package) {
                                        return r.table('package').get(row_package('package_id')).without('id')
                                    })
                                })
                            }
                        }).merge(function (row_type_rice) {
                            return r.table('type_rice').get(row_type_rice('type_rice_id')).without('id')
                        })
                    })
                }
            })
            .without('id')
            .run(conn, function (err, cursor) {
                if (!err) {
                    res.json(cursor);
                } else {
                    res.json(null);
                }
            });
    })
});

module.exports = router;
