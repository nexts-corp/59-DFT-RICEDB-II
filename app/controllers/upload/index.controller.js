var fs = require('fs');
var path = require('path');
var multiparty = require('multiparty');
var stream = require('stream');

class index {

    uploadFile(req, res) {

        var r = req._r;
        var params = req.params;

        var form = new multiparty.Form();
        form.parse(req, function (err, fields, files) {

            var prefile = files.file[0];

            fs.readFile(prefile.path, function (err, data) {
                //console.log(r);
                r.db('files').table('files').insert({
                    name: prefile.originalFilename,
                    type: prefile.headers['content-type'],
                    contents: data,
                    timestamp: new Date(),
                    ref_path:req.headers['ref-path']
                })
                    .run().then(function (result) {
                        res.json(result);
                    }).catch(function (err) {
                        res.json(err);
                    })
            });


            //res.json({ec:'01252'});
        });

    }


    listFile(req, res) {

        var r = req._r;
        var params = req.params;
        r.db('files').table('files').without('contents')
        .orderBy(r.desc('timestamp'))
            .map(function (row) {
                return {
                    name: row('name').add(' -->> ')
                        .add(row('timestamp').year().coerceTo('string'))
                        .add('-')
                        .add(row('timestamp').month().coerceTo('string'))
                        .add('-')
                        .add(row('timestamp').day().coerceTo('string'))
                    ,
                    progress: 100, complete: true,
                    file_id: row('id')
                }
            })
            .run().then(function (result) {
                res.json(result);
            }).catch(function (err) {
                res.json(err);
            })

    }

    listFilePath(req, res){
        var r = req._r;
        var params = req.params;

        r.db('files').table('files').without('contents').filter({ref_path:params.refPath})
        .orderBy(r.desc('timestamp'))
            .map(function (row) {
                return {
                    name: row('name').add(' -->> ')
                        .add(row('timestamp').year().coerceTo('string'))
                        .add('-')
                        .add(row('timestamp').month().coerceTo('string'))
                        .add('-')
                        .add(row('timestamp').day().coerceTo('string'))
                    ,
                    progress: 100, complete: true,
                    file_id: row('id')
                }
            })
            .run().then(function (result) {
                res.json(result);
            }).catch(function (err) {
                res.json(err);
            })
    }

    downloadFile(req, res) {
        var r = req._r;
        var params = req.params;
        // console.log(params)

        r.db('files').table('files').get(params.id)
            .run().then(function (result) {
                res.writeHead(200, {
                    'Content-Type': result.type,
                    'Content-Length': result.contents.length,
                    //'Content-Disposition':'filename='+cursor.name
                    'Content-Disposition': 'attachment; filename=' + result.name
                });

                var bufferStream = new stream.PassThrough();
                bufferStream.end(result.contents);
                bufferStream.pipe(res);

            }).catch(function (err) {
                res.json(err);
            })

    }


    deleteFile(req, res) {
        var r = req._r;
        var params = req.params;
        // console.log(params)

        r.db('files').table('files').get(params.id).delete()
            .run().then(function (result) {
                res.json(result);
            }).catch(function (err) {
                res.json(err);
            })

    }


}

module.exports = new index();