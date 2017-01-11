module.exports=function(app){
    var index=require('../controllers/notify/index.controller');
    app.get('/report/:calculate_id',index.getNotify);

    var notify2IndexCtrl = require('../controllers/notify/notify2.controller');
    app.get('/noti',notify2IndexCtrl.selectnotify);
} 