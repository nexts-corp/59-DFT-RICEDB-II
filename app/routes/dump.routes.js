module.exports=function(app){
    var index=require('../controllers/dump/index.controller');
    app.post('/confirm',index.insertConfirm);
    app.post('/report',index.insertReport);
}
