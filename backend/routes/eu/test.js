var express = require('express');
var router = express.Router();

var fs = require('fs');
var path = require('path');
var multiparty = require('multiparty');

var filePath = path.join(__dirname, 'image.png');

var r = require('rethinkdb');
var db = require('../../db.js');


// router.get(['/example'], function (req, res, next) {

//     var data = 'base64 base64 base64';
//     var img = new Buffer(data, 'base64'); 
//     res.writeHead(200, {
//         'Content-Type': 'image/png',
//         'Content-Length': img.length
//     });
//    res.end(img); 
// });


router.get(['/download'], function (req, res, next) {

    db.query(function (conn) {
        r.db('files').table('files').get('97cb832b-7424-4b16-83ca-a496f2c8ffa6')
        .run(conn, function (err, cursor) {
            if (!err) {
                res.writeHead(200, {
                    'Content-Type': cursor.type,
                    'Content-Length': cursor.contents.length
                });
                res.end(cursor.contents);
            } else {
                res.json({ error: "error" });
            }
        });

    });
  
});

router.put(['/upload'], function (req, res, next) {
   
    
    var form = new multiparty.Form();
    form.parse(req,function(err,fields,files){
        var prefile = files.file[0];
        fs.readFile(prefile.path,function(err,data){
            db.query(function (conn) {
                r.db('files').table('files').insert({
                    name:prefile.originalFilename,
                    type:prefile.headers['content-type'],
                    contents:data
                })
                .run(conn, function (err, cursor) {
                    if (!err) {
                        res.json(cursor);
                        //console.log(cursor);
                    } else {
                        res.json({ error: "error" });
                    }
                });
                //console.log(prefile.headers['content-type']);

            });
            //console.log(prefile);
            //console.log(data);
        });
    });

    
});

module.exports = router;

