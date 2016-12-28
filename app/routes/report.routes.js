module.exports = function(app){
var reportIndexCtrl = require('../controllers/report/index.controller')
    app.post('/report',reportIndexCtrl.insertReport);
    app.delete('/report/:id',reportIndexCtrl.deleteReport);
}