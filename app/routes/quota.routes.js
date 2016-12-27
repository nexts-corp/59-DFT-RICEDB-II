module.exports=function(app){

    var quotaIndexCtrl = require('../controllers/quota/index.controller');

    app.get('/quota',quotaIndexCtrl.getQuota);
    app.post('/quota',quotaIndexCtrl.insertQuota);
    app.put('/quota',quotaIndexCtrl.updateQuota);
    app.delete('/quota',quotaIndexCtrl.deleteQuota);

}