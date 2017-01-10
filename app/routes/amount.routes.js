module.exports = function(app){
var amountIndexCtrl = require('../controllers/amount/index.controller')
    app.get('/amount',amountIndexCtrl.selectAmount); 
}