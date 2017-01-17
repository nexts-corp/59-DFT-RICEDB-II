module.exports = function(app){
var indexCtrl = require('../controllers/upload/index.controller')
    app.post('/file',indexCtrl.uploadFile); 
    app.get('/file/:id',indexCtrl.downloadFile); 
    app.delete('/file/:id',indexCtrl.deleteFile); 
    app.get('/list',indexCtrl.listFile); 
    app.get('/list/:refPath',indexCtrl.listFilePath); 
}