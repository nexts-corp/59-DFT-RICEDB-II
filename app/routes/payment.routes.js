module.exports=function(app){
    var payment=require('../controllers/payment/payment.controller');
    app.get('/reqEcList',payment.getReqEcList);
    app.get('/exporterEcList',payment.getExporterEcList);
    app.get('/paymentDetail',payment.getPaymentDetail);

    var payment2=require('../controllers/payment/payment2.controller');
    app.get('/selectbank',payment2.selectBank);
    app.post('/saverc',payment2.saverc);
    app.get('/report1',payment2.report1);
}