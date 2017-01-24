var fs = require('fs');
var path = require('path');
var multiparty = require('multiparty');
var stream = require('stream');

exports.uploadFile = function (req, res) {

    var r = req._r;
    var params = req.params;

    var form = new multiparty.Form();
    form.parse(req, function (err, fields, files) {

        var prefile = files.file[0];

        fs.readFile(prefile.path, function (err, data) {
            // console.log(r);
            r.db('files').table('files').insert({
                name: prefile.originalFilename,
                type: prefile.headers['content-type'],
                contents: data,
                timestamp: new Date(),
                ref_path: req.headers['ref-path']
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
exports.listFile = function (req, res) {

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
        .run()
        .then(function (result) {
            res.json(result);
        })
        .catch(function (err) {
            res.json(err);
        })

}
exports.listFilePath = function (req, res) {
    var r = req._r;
    var params = req.params;
    r.db('external_f3').table('document_file')
        .innerJoin(r.db('external_f3').table('document_type'),
        function (file, type) {
            return file('doc_type_id').eq(type('doc_code'))
        })
        .map(function (m) {
            return m('left').merge(function () {
                return { doc_type_id: m('right')('id') }
            })
        })
        .eqJoin('file_id', r.db('files').table('files')).without({ right: ["id", "contents"] }).zip()
        .eqJoin('exporter_id', r.db('external_f3').table('exporter')).pluck('left', { right: 'exporter_id' }).zip()
        .merge({ progress: 100, complete: true })
        .filter({ exporter_id: params.exporter_id, ref_path: params.refPath })
        .run()
        .then(function (result) {
            res.json(result);
        })
        .error(function (err) {
            res.json(err);
        })
    //     r.db('files').table('files').without('contents').filter({ ref_path: params.refPath })
    //     .orderBy(r.desc('timestamp'))
    //     .map(function (row) {
    //         return {
    //             name: row('name').add(' -->> ')
    //                 .add(row('timestamp').year().coerceTo('string'))
    //                 .add('-')
    //                 .add(row('timestamp').month().coerceTo('string'))
    //                 .add('-')
    //                 .add(row('timestamp').day().coerceTo('string'))
    //             ,
    //             progress: 100, complete: true,
    //             file_id: row('id')
    //         }
    //     })
    //     .run().then(function (result) {
    //         res.json(result);
    //     }).catch(function (err) {
    //         res.json(err);
    //     })
}
exports.downloadFile = function (req, res) {
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
exports.deleteFile = function (req, res) {
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
exports.uploadFileExporter = function (req, res) {
    var r = req._r;
    var params = req.params;

    var form = new multiparty.Form();
    form.parse(req, function (err, fields, files) {

        var prefile = files.file[0];
        var doc_code = req.headers['ref-path'].split("&")[1];

        fs.readFile(prefile.path, function (err, data) {
            // console.log(r);
            r.db('files').table('files').insert({
                name: prefile.originalFilename,
                type: prefile.headers['content-type'],
                contents: data,
                timestamp: new Date(),
                ref_path: req.headers['ref-path']
            })('generated_keys')(0)
                .do(function (file_id) {
                    return r.db('external_f3').table('document_file').insert({
                        file_id: file_id,
                        doc_type_id: doc_code,
                        exporter_id: params.exporter_id,
                        date_upload: new Date()
                    })
                })
                .run().then(function (result) {
                    res.json(result);
                }).catch(function (err) {
                    res.json(err);
                })
        });
    });

    // res.json({ec:'01252'});

}