module.exports = function (app) {

    var report1 = require('../controllers/report1.controller');
    var report2 = require('../controllers/report2.controller');
    var report4 = require('../controllers/report4.controller');
    var report5 = require('../controllers/report5.controller');
    var report6 = require('../controllers/report6.controller');
    var report7 = require('../controllers/report7.controller');
    app.route('/report1')
        .get(report1.index);
    app.route('/report2')
        .get(report2.index);
    app.route('/report4')
        .get(report4.index);
    app.route('/report5')
        .get(report5.index);
    app.route('/report6')
        .get(report6.index);
    app.route('/report7')
        .get(report7.index);

}