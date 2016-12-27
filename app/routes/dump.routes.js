module.exports=function(app){
    var index=require('../controllers/dump/index.controller');
    app.post('/confirm',index.insertConfirm);
}
