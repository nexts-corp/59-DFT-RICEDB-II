module.exports=function(app){
    var index=require('../controllers/notify/index.controller');
    app.get('/:calculate_id',index.getNotify);

    var notify2IndexCtrl = require('../controllers/notify/notify2.controller');
    app.get('/notify2',notify2IndexCtrl.selectnotify);
}