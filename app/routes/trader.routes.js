module.exports = function (app) {

    var trader = require('../controllers/external/trader.controller');
    app.route('/').get(trader.trader);
    app.route('/id/:trader_id').get(trader.traderId);
    app.route('/seller').get(trader.seller);
    app.route('/insert').post(trader.insert);
    app.route('/update').put(trader.update);
    app.route('/delete/id/:id').delete(trader.delete);
}