module.exports = function (app) {

    var check = require('../controllers/external/check.controller');
    app.route('/duplicate').get(check.duplicate);
    app.route('/myowner').get(check.myowner);
}