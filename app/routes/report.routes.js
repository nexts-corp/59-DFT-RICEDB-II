module.exports = function(app){
var reportIndexCtrl = require('../controllers/report/index.controller')
    app.post('/report',reportIndexCtrl.insertReport); // post is insert
    app.delete('/report/:id',reportIndexCtrl.deleteReport); // is delete
    app.get('/report',reportIndexCtrl.selectReport);  //get is select
    app.put('/report',reportIndexCtrl.updateReport); // put is update

    app.get('/report_quota',reportIndexCtrl.report); // test report 
    
}