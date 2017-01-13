module.exports = function(app){
var confirmIndexCtrl = require('../controllers/confirm/index.controller')
    app.get('/confirmordinal',confirmIndexCtrl.selectOrinal);
    app.get('/confirmexporter',confirmIndexCtrl.selectexporter); 
    app.get('/confirmnoexport',confirmIndexCtrl.selectall_noexporter);  
    app.get('/confirm',confirmIndexCtrl.selectall);  
    app.put('/confirm',confirmIndexCtrl.updateconfirm);
    app.put('/confirmdelete',confirmIndexCtrl.deleteconfirm); 
    app.put('/confirmtranfer',confirmIndexCtrl.tranfer);
}