module.exports = function(app){
var confirmIndexCtrl = require('../controllers/confirm/index.controller')
    app.get('/confirm',confirmIndexCtrl.selectconfirm);  //get is select
}