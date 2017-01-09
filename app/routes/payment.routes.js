module.exports = function (app) {
    var payment = require('../controllers/payment.controller');
    app.route('/report1').get(payment.report1);
    app.route('/report2').get(payment.report2);
}