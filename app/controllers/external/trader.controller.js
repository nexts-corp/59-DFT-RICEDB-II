var DataContext = require('../../class/DataContext.js');
var datacontext = new DataContext();

var Ajv = require('ajv');
var ajv = Ajv({ allErrors: true });
var schema = {
    //'type': 'object',
    "properties": {
        "id": {
            "type": "string"
        },
        "seller_id": {
            "type": "string"
        },
        "trader_date_approve": {
            "type": "string",
            "format": "date-time"
        },
        "trader_no": {
            "type": "string"
        },
        "trader_name": {
            "type": "string"
        },
        "trader_distric": {
            "type": "string"
        },
        "trader_office": {
            "type": "string"
        },
        "province_id": {
            "type": "string"
        },
        "type_lic_id": {
            "type": "string"
        }
    },
    "required": ["trader_date_approve"]
};
var validate = ajv.compile(schema);

exports.trader = function (req, res) {
    var r = req._r;
    var q = {};
    for (key in req.query) {

        if (req.query[key] == "true") {
            req.query[key] = true;
        } else if (req.query[key] == "false") {
            req.query[key] = false;
        } else if (req.query[key] == "null") {
            req.query[key] = null;
        }
        q[key] = req.query[key];
        console.log(q);
    }
    r.db('external_f3').table("trader")
        .merge(function (row) {
            return {
                trader_id: row('id'),
                date_updated: row('date_updated').split('T')(0),
                trader_date_approve: row('trader_date_approve').split('T')(0),
                trader_date_expire: row('trader_date_approve').split('T')(0).split('-')(0).add("-12-31"),
                trader_active: r.now().toISO8601().lt(row('trader_date_approve').split('T')(0).split('-')(0).add("-12-31T00:00:00.000Z"))
            }
        })
        .without('id')
        .eqJoin("seller_id", r.db('external_f3').table("seller")).without({ right: ["id", "date_created", "date_updated"] }).zip()
        .eqJoin("type_lic_id", r.db('external_f3').table("type_license")).without({ right: ["id", "date_created", "date_updated"] }).zip()
        .eqJoin("country_id", r.db('common').table("country")).without({ right: ["id", "date_created", "date_updated"] }).zip()
        .eqJoin("province_id", r.db('common').table("province")).without({ right: ["id", "date_created", "date_updated"] }).zip()
        .orderBy('trader_no')
        .filter(q)
        .run()
        .then(function (result) {
            res.json(result);
        })
        .error(function (err) {
            res.json(err);
        })
}
exports.traderId = function (req, res) {
    var r = req._r;
    r.db('external_f3').table("trader")
        .get(req.params.trader_id)
        .merge({
            trader_id: r.row('id'),
            trader_date_approve: r.row('trader_date_approve').split('T')(0),
            trader_date_expire: r.row('trader_date_approve').split('T')(0).split('-')(0).add("-12-31"),
            trader_active: r.now().toISO8601().lt(r.row('trader_date_approve').split('T')(0).split('-')(0).add("-12-31T00:00:00.000Z"))
        },
        r.db('external_f3').table("seller").get(r.row("seller_id")),
        r.db('external_f3').table("type_license").get(r.row("type_lic_id")),
        r.db('common').table("country").get(r.row("country_id")),
        r.db('common').table("province").get(r.row("province_id"))
        )
        //  .merge(r.db('common').table("country").get(r.row("country_id")))
        .without('id')
        .run()
        .then(function (result) {
            res.json(result);
        })
        .error(function (err) {
            res.json(err);
        })
}
exports.seller = function (req, res) {
    var r = req._r;
        r.db('external_f3').table("trader")
            .eqJoin("seller_id", r.db('external_f3').table("seller")).without({ right: ["id", "date_created", "date_updated"] }).zip()
            //.eqJoin("exporter_id", r.db('external_f3').table("exporter")).not()
            // ,function(t,e){
            //     return t("exporter_id").eq(e("id"));
            // })
            // .filter(
            //     r.row('seller_name_th').match(req.params.seller_name)
            // )
            // .pluck(
            //     "seller_id","seller_name_th","seller_name_en","seller_address_th",
            //     "trader_id","trader_no","trader_name"
            // )
            .run()
            .then(function(result){
                res.json(result);
            })
            .error(function(err){
                res.json(err);
            })
}
exports.insert = function (req, res, next) {
    var r = req._r;
    //console.log(req.body);
    var valid = validate(req.body);
    var result = { result: false, message: null, id: null };
    if (valid) {
        //console.log(req.body);
        if (req.body.id == null) {
            datacontext.insert("external_f3", "trader", req.body, res, req);
        } else {
            result.message = 'field "id" must do not have data';
            res.json(result);
        }
    } else {
        result.message = ajv.errorsText(validate.errors);
        res.json(result);
    }
}
exports.update = function (req, res, next) {
    var r = req._r;
    //console.log(req.body);
    var valid = validate(req.body);
    var result = { result: false, message: null, id: null };
    if (valid) {
        datacontext.update("external_f3", "trader", req.body, res, req);
    } else {
        result.message = ajv.errorsText(validate.errors);
        res.json(result);
    }
}
exports.delete = function (req, res, next) {
    datacontext.delete("external_f3", "trader", req.params.id, res, req);
}



