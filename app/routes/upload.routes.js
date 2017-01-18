module.exports = function (app) {

    var upload = require('../controllers/upload.controller');
    app.route('/file').post(upload.uploadFile);
    app.route('/file/:id').delete(upload.deleteFile);
    app.route('/file/:id').get(upload.downloadFile);
    app.route('/list').get(upload.listFile);
    app.route('/list/:refPath').get(upload.listFilePath);
    app.route('/test').get(upload.test);
}