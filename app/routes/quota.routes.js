module.exports=function(app){

    var quotaIndexCtrl = require('../controllers/quota/index.controller');

    app.get('/quota/:year',quotaIndexCtrl.getQuota);
    app.get('/quota/:id',quotaIndexCtrl.selectQuota);
    app.post('/quota',quotaIndexCtrl.insertQuota);
    app.put('/quota',quotaIndexCtrl.updateQuota);
    app.delete('/quota/:id',quotaIndexCtrl.deleteQuota);

}