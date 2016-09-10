var express = require('express');
var router = express.Router();

router.get('/test', function(req, res, next) {
  var obj = {a:1};  
  res.json(obj);
});

module.exports = router;
