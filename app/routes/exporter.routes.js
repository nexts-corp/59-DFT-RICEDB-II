module.exports = function (app) {

    var exporter = require('../controllers/exporter.controller');
    app.route('/report1').get(exporter.report1);
    app.route('/report2').get(exporter.report2);
    app.route('/report3').get(exporter.report3);
    app.route('/report4').get(exporter.report4);
    app.route('/report5').get(exporter.report5);
    app.route('/report6').get(exporter.report6);
}