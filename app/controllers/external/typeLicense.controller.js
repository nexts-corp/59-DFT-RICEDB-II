var DataContext = require('../../class/DataContext.js');
var datacontext = new DataContext();

var Ajv = require('ajv');
var ajv = Ajv({ allErrors: true });

var schema = {
    "patternProperties": {
        ".*$": { "type": "string" }
    },
    "properties": {
        "id": {
            "type": "string",
            "maxLength": 2,
            "minLength": 2
        }
    }
};
var validate = ajv.compile(schema);


exports.typeLicense = function (req, res) {
    var r = req._r;
    r.db('external_f3').table("type_license")
        .merge(function (row) {
            return { type_lic_id: row('id') }
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
exports.typeLicenseId = function (req, res) {
    var r = req._r;
    r.db('external_f3').table("type_license")
        .get(req.params.type_lic_id.toUpperCase())
        .merge({
            type_lic_id: r.row('id')
        })
        .without('id')
        .run()
        .then(function (result) {
            res.json(result);
        })
        .error(function (err) {
            res.json(err)
        })
}
exports.insert = function (req, res) {
    var valid = validate(req.body);
    if (valid) {
        datacontext.insert("external_f3", "type_license", req.body, res, req);
    } else {
        result.message = ajv.errorsText(validate.errors);
        res.json(result);
    }
}
