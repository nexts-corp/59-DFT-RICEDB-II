var express = require('express');
var router = express.Router();

var fs = require('fs');
var path = require('path');
var multiparty = require('multiparty');
var stream = require('stream');


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


router.get(['/download/:key'], function (req, res, next) {

    db.query(function (conn) {
        r.db('files').table('files').get(req.params.key)
            .run(conn, function (err, cursor) {
                if (!err) {
                    res.writeHead(200, {
                        'Content-Type': cursor.type,
                        'Content-Length': cursor.contents.length,
                        //'Content-Disposition':'filename='+cursor.name
                        'Content-Disposition': 'attachment; filename=' + cursor.name
                    });
                    //cursor.contents.pipe(res);
                    //res.end(cursor.contents);
                    // var buffer = new Buffer( cursor.contents );
                    var bufferStream = new stream.PassThrough();
                    bufferStream.end(cursor.contents);
                    bufferStream.pipe(res);


                } else {
                    res.json({ error: "error" });
                }
            });

    });

});

router.put(['/upload'], function (req, res, next) {


    var form = new multiparty.Form();
    form.parse(req, function (err, fields, files) {
        var prefile = files.file[0];
        fs.readFile(prefile.path, function (err, data) {
            db.query(function (conn) {
                r.db('files').table('files').insert({
                    name: prefile.originalFilename,
                    type: prefile.headers['content-type'],
                    contents: data
                })
                    .run(conn, function (err, cursor) {
                        if (!err) {
                            res.json(cursor);
                        } else {
                            res.json({ error: "error" });
                        }
                    });

            });
        });

    });


});


module.exports = router;

