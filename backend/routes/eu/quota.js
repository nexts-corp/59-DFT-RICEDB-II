var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');

var Ajv = require('ajv');
var ajv = Ajv({ allErrors: true, coerceTypes: 'array' });

router.get(['/'], function (req, res, next) {
    db.query(function (conn) {
            
            statemant = r.db('eu').table('quota');

            var params = req.query;
            if(typeof params != "undefined"){
                for(var key in params){
                    if(key=="id")
                    params[key] = parseInt(params[key]);
                }
                statemant = statemant.filter(params);
            }
            
            statemant.run(conn, function (err, cursor) {
                if (!err) {
                    cursor.toArray(function (err, result) {
                        if (!err) {
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



var schema = {

    "properties": {
        "id": {
            "type": "number"
        },
        "period": {
            "type": "array",
            "properties":{
                "percent":{
                    "type": "number"
                },
                "quantity":{
                    "type": "number"
                }
            },
            "required": [
                "percent",
                "quantity"
            ]
        },
        "type_rice_id": {
            "type": "string"
        }
    },
    "required": [
        "id",
        "period",
        "type_rice_id"
    ]
};

var validate = ajv.compile(schema);


router.post(['/'], function (req, res, next) {
    
    var valid = validate(req.body);
    
    if(valid){
        console.log(req.body);
        db.query(function (conn) {

            r.db('eu').table('quota').insert(req.body)
            .run(conn, function (err, cursor) {
                if (!err) {
                    res.json(cursor);
                } else {
                    res.json(null);
                }
            });

        });
    }else{
        res.json({error:"schema"}); 
    }

    
});

router.put(['/'], function (req, res, next) {
    
    var valid = validate(req.body);

    if(valid){
        db.query(function (conn) {

            r.db('eu').table('quota').get(req.body.id).update(req.body)
            .run(conn, function (err, cursor) {
                if (!err) {
                    console.log(req.body);
                    res.json(req.body);
                } else {
                    res.json(null);
                }
            });

        });
    }else{
        res.json({error:"schema"}); 
    }

    
});


router.delete(['/'], function (req, res, next) {
  
        db.query(function (conn) {

            r.db('eu').table('quota').get(parseInt(req.query.id)).delete()
            .run(conn, function (err, cursor) {
                if (!err) {
                    res.json(cursor);
                } else {
                    res.json(null);
                }
            });

        });
    
});

module.exports = router;

