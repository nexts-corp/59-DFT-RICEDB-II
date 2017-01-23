module.exports = function (app) {

    var documentType = require('../controllers/external/documentType.controller');
    app.route('/').get(documentType.documentType);
    app.route('/id/:doc_type_id').get(documentType.documentTypeId);
    // app.route('/insert').post(documentType.insert);
    // app.route('/update').put(documentType.update);
    // app.route('/delete/id/:id').delete(documentType.delete);
}