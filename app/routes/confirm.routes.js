module.exports = function(app){
var confirmIndexCtrl = require('../controllers/confirm/index.controller')
    app.get('/notconfirm',confirmIndexCtrl.selectnotconfirm);  //get is select
    app.get('/notconfirmall',confirmIndexCtrl.selectnotconfirm2);
    //app.get('/confirm',confirmIndexCtrl.selectconfirm);
}