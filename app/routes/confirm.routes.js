module.exports = function(app){
var confirmIndexCtrl = require('../controllers/confirm/index.controller')
    app.get('/confirmordinal',confirmIndexCtrl.selectOrinal);
    app.get('/notconfirm',confirmIndexCtrl.selectnotconfirm);  

}