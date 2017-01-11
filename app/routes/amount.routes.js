module.exports = function(app){
var amountIndexCtrl = require('../controllers/amount/index.controller')
    app.get('/amountOrinal',amountIndexCtrl.selectOrinal); 
    app.get('/amount',amountIndexCtrl.selectAmount); 
    app.put('/amount',amountIndexCtrl.updateAmount); 
}