module.exports=function(app){

    var quotaIndexCtrl = require('../controllers/quota/index.controller');

    app.get('/quota',quotaIndexCtrl.readQuota);
    app.post('/quota',quotaIndexCtrl.saveQuota);
    

}