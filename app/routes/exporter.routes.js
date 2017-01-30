module.exports = function (app) {

    var exporter = require('../controllers/external/exporter.controller');
    app.route('/').get(exporter.exporter);
    app.route('/id/:exporter_id').get(exporter.exporterId);
    app.route('/insert').post(exporter.insert);
    app.route('/update').put(exporter.update);
    app.route('/delete/id/:id').delete(exporter.delete);
    app.route('/test').get(exporter.exporterTest);
}