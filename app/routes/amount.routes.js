module.exports = function(app){
var amountIndexCtrl = require('../controllers/amount/index.controller')
    app.get('/amountorinal',amountIndexCtrl.selectOrdinal); 
    app.get('/amount',amountIndexCtrl.selectAmount); 
}