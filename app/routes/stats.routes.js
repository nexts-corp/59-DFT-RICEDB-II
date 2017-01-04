module.exports = function (app) {

    var stats1 = require('../controllers/stats1.controller');
    var stats3 = require('../controllers/stats3.controller');
    var stats4 = require('../controllers/stats4.controller');
    var stats6 = require('../controllers/stats6.controller');
    var stats7 = require('../controllers/stats7.controller');
    var stats8 = require('../controllers/stats8.controller');
    var stats9 = require('../controllers/stats9.controller');
    app.route('/stats1')
        .get(stats1.index);
    app.route('/stats3')
        .get(stats3.index);
    app.route('/stats4')
        .get(stats4.index);
           app.route('/home')
        .get(stats1.link);
    app.get('/stats6', stats6.index);
    app.get('/stats7', stats7.index);
    app.get('/stats8', stats8.index);
    app.get('/stats9', stats9.index);

}