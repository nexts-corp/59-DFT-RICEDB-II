module.exports=function(app){
    var feeIndexCtrl = require('../controllers/fee/index.controller');

    app.get('/ec',feeIndexCtrl.ec);
    app.get('/receipt',feeIndexCtrl.receipt);

}