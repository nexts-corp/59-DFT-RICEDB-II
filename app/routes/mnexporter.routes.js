module.exports = function(app){
var mnexporterIndexCtrl = require('../controllers/mnexporter/index.controller')
    app.get('/mnexporter',mnexporterIndexCtrl.selectExporter);
    app.post('/mnexporter',mnexporterIndexCtrl.insertExporter); 
    app.put('/mnexporter',mnexporterIndexCtrl.updateExporter); 
    app.delete('/mnexporter',mnexporterIndexCtrl.deleteExporter); 
}