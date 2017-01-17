module.exports=function(app){
    var index=require('../controllers/notify/index.controller');
    app.get('/report/',index.getNotify);
    app.get('/path',index.getPath);

    var notify2IndexCtrl = require('../controllers/notify/notify2.controller');
    app.get('/noti',notify2IndexCtrl.selectnotify);
    app.get('/notiall',notify2IndexCtrl.selectnotifyAll); 
    app.put('/noti',notify2IndexCtrl.saveOrdinal); 
} 