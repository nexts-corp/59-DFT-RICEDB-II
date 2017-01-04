module.exports = function(app){
var confirmIndexCtrl = require('../controllers/confirm/index.controller')
    app.get('/confirm',confirmIndexCtrl.selectnotconfirm);  //get is select
    app.get('/confirmall',confirmIndexCtrl.selectnotconfirm2);
}