module.exports = function(app){
var mnriceIndexCtrl = require('../controllers/mnrice/index.controller')
    app.get('/mnrice',mnriceIndexCtrl.selectRice); 
    app.post('/mnrice',mnriceIndexCtrl.insertRice); 
    app.put('/mnrice',mnriceIndexCtrl.updateRice); 
    app.delete('/mnrice',mnriceIndexCtrl.deleteRice); 
}