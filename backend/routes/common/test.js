var express = require('express');
var router = express.Router();

var r = require('rethinkdb');
var db = require('../../db.js');
var DataContext = require('../../class/DataContext.js');
var datacontext = new DataContext();


router.post('/insert', function (req, res, next) {
    var result = { result: false, message: null, id: null };
    if (req.body.id == null) {
        datacontext.insert("common", "test", req.body, res);
    } else {
        result.message = 'field "id" must do not have data';
        res.json(result);
    }
});
router.put('/update', function (req, res, next) {
    //console.log(req.body);
    var result = { result: false, message: null, id: null };
    datacontext.update("common", "test", req.body, res);
});
router.delete('/delete/id/:id', function (req, res, next) {
    var result = { result: false, message: null, id: null };
    result.id = req.params.id;
    datacontext.delete("common", "test", req.params.id, res);
});
module.exports = router;
