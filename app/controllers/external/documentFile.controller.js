exports.documentFile = function (req, res) {
    var r = req._r;
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
        .run()
        .then(function (result) {
            res.json(result);
        })
        .error(function (err) {
            res.json(err);
        })
}
exports.documentFileId = function (req, res) {
    var r = req._r;
    r.db('external_f3').table('document_file')
        .get(req.params.id)
        .merge({
            doc_id: r.row('id')
        })
        .without('id')
        .run()
        .then(function (result) {
            res.json(result);
        })
        .error(function (err) {
            res.json(err);
        })
}