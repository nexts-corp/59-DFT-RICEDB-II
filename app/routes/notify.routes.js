  module.exports=function(app){
    var index=require('../controllers/notify/index.controller');
    app.get('/:calculate_id',index.getNotify);
}