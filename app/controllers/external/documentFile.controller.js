exports.documentFile = function (req, res) {
    var r = req._r;
    r.db('external_f3').table('document_file')
        .eqJoin('doc_type_id', r.db('external_f3').table('document_type')).without({ right: "id" }).zip()
        .eqJoin('file_id', r.db('files').table('files')).without({ right: ["id", "contents"] }).zip()
        .eqJoin('exporter_id', r.db('external_f3').table('exporter')).without({ right: ["id","date_updated"] }).zip()
        .run()
        .then(function (result) {
            res.json(result);
        })
        .error(function (err) {
            res.json(err);
        })
}