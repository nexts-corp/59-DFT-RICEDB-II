module.exports = function(app){
var confirmIndexCtrl = require('../controllers/confirm/index.controller')
    app.get('/confirmordinal',confirmIndexCtrl.selectOrinal);
    app.get('/confirmexporter',confirmIndexCtrl.selectexporter); 
    app.get('/confirmnoexport',confirmIndexCtrl.selectall_noexporter);  
    app.get('/confirm',confirmIndexCtrl.selectall);  
    app.put('/confirm',confirmIndexCtrl.updateconfirm);

}