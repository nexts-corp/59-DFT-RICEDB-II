module.exports = function (app) {

    var reportExporter = require('../controllers/reportExporter.controller');
    app.route('/report1').get(reportExporter.report1);
    app.route('/report2').get(reportExporter.report2);
    app.route('/report3').get(reportExporter.report3);
    app.route('/report4').get(reportExporter.report4);
    app.route('/report5').get(reportExporter.report5);
    app.route('/report6').get(reportExporter.report6);
    app.route('/report7').get(reportExporter.report7);
    app.route('/report8').get(reportExporter.report8);
}