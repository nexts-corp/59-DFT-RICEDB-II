exports.documentType = function (req, res) {
    var r = req._r;
    r.db('external_f3').table('document_type')
        .merge(function (row) {
            return { doc_type_id: row('id') }
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
exports.documentTypeId = function (req, res) {
    var r = req._r;
    r.db('external_f3').table('document_type')
        .get(req.params.doc_type_id)
        .merge(function (row) {
            return { doc_type_id: row('id') }
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