exports.duplicate = function (req, res) {
    var r = req._r;
    var q = {};
    var tb = req.query['table'];
    q[req.query['field']] = req.query['value'];

    r.db('external_f3').table(tb)
        .filter(q)
        .count()
        .run()
        .then(function (result) {
            res.json(result);
        })
        .error(function (err) {
            res.json(err);
        })
}

exports.myowner = function (req, res) {
    var r = req._r;
    var q = {};
    var tb = req.query['table'];
    q['id'] = req.query['id'];
    q[req.query['field']] = req.query['value'];
    r.db('external_f3').table(tb)
        .filter(q)
        .count()
        .run()
        .then(function (result) {
            res.json(result);
        })
        .error(function (err) {
            res.json(err);
        })
}
