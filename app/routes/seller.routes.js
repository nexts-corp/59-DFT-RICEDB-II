module.exports = function (app) {

    var seller = require('../controllers/external/seller.controller');
    app.route('/').get(seller.seller);
    app.route('/id/:seller_id').get(seller.sellerId);
    app.route('/insert').post(seller.insert);
    app.route('/update').put(seller.update);
    app.route('/delete/id/:id').delete(seller.delete);
}