module.exports = function(app){
var indexCtrl = require('../controllers/test2/index.controller')
    app.get('/',indexCtrl.test); 
}