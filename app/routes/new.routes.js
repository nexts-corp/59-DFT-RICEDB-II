module.exports = function(app){
var index = require('../controllers/new/new.controller')
    app.get('/new',index.select_data); 
    app.post('/new',index.insert_data); 
    app.put('/new',index.update_data);
    app.delete('/new',index.delete_data);
}