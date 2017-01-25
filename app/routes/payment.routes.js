module.exports=function(app){
    var payment=require('../controllers/payment/payment.controller');
    app.get('/reqEcList',payment.getReqEcList);
} 