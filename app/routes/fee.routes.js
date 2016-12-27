module.exports=function(app){
    var feeIndexCtrl = require('../controllers/fee/index.controller');

    app.get('/ec',feeIndexCtrl.ec);
    app.get('/receipt',feeIndexCtrl.receipt);
    app.get('/quota',feeIndexCtrl.quota);
    app.get('/common/exporter',feeIndexCtrl.exporter);
    app.get('/common/year',feeIndexCtrl.year);
    app.get('/common/type_rice',feeIndexCtrl.type_rice);
}