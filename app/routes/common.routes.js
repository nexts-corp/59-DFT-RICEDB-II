module.exports=function(app){
    var commonIndexCtrl = require('../controllers/common/index.controller');

    app.get('/exporter',commonIndexCtrl.getExporter);
    app.get('/year',commonIndexCtrl.getYear);
    app.get('/type_rice',commonIndexCtrl.getTypeRice);
}