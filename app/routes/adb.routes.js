module.exports=function(app){
    var index = require('../controllers/adb.controller');
    app.get('/table_byId/:id',index.table_byId);
    app.get('/table',index.table);
    app.get('/tableQuery',index.tableQuery);
    app.get('/join',index.join);
}