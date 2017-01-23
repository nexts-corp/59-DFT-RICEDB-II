module.exports = function (app) {

    var document = require('../controllers/external/document.controller');
    app.route('/').get(document.document);
    app.route('/id/:doc_type_id').get(document.documentId);
    // app.route('/insert').post(document.insert);
    // app.route('/update').put(document.update);
    // app.route('/delete/id/:id').delete(document.delete);
}