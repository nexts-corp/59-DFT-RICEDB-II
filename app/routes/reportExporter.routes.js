module.exports = function (app) {

    var reportExporter = require('../controllers/reportExporter.controller');
    app.route('/report1').get(reportExporter.report1);
    app.route('/report2').get(reportExporter.report2);
    app.route('/report3').get(reportExporter.report3);
    app.route('/report4').get(reportExporter.report4);
    app.route('/report5').get(reportExporter.report5);
    app.route('/report6').get(reportExporter.report6);
    app.route('/report10').get(reportExporter.report10);
    app.route('/report10_1').get(reportExporter.report10_1);
    app.route('/report10_2').get(reportExporter.report10_2);
    app.route('/report11/:trader_id').get(reportExporter.report11);
}