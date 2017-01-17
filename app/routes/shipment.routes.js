module.exports = function (app) {

    var shipment = require('../controllers/shipment.controller');
    app.route('/report1').get(shipment.report1);
    app.route('/report2').get(shipment.report2);
    app.route('/report3').get(shipment.report3);
    app.route('/report4').get(shipment.report4);
    app.route('/report5').get(shipment.report5);
}