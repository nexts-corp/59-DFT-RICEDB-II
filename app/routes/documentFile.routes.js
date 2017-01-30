module.exports = function (app) {

    var documentFile = require('../controllers/external/documentFile.controller');
    app.route('/').get(documentFile.documentFile);
    app.route('/id/:id').get(documentFile.documentFileId);
    // app.route('/insert').post(documentFile.insert);
    // app.route('/update').put(documentFile.update);
    // app.route('/delete/id/:id').delete(documentFile.delete);
}