module.exports = function (app) {

    var typeLicense = require('../controllers/external/typeLicense.controller');
    app.route('/').get(typeLicense.typeLicense);
    app.route('/id/:type_lic_id').get(typeLicense.typeLicenseId);
    app.route('/insert').post(typeLicense.insert);
    // app.route('/update').put(typeLicense.update);
    // app.route('/delete/id/:id').delete(typeLicense.delete);
}