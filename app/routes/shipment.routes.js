module.exports = function (app) {

    var shipment = require('../controllers/shipment.controller');
    // var report2 = require('../controllers/report2.controller');
    // var report4 = require('../controllers/report4.controller');
    // var report5 = require('../controllers/report5.controller');
    // var report6 = require('../controllers/report6.controller');
    // var report7 = require('../controllers/report7.controller');
    app.route('/report1')
        .get(shipment.report1);
    app.route('/report2')
        .get(shipment.report2);

}