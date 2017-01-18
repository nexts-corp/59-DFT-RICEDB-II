function routes(app){
var confirmIndexCtrl = require('../controllers/calculate/index.controller')
    app.post('/cal',confirmIndexCtrl.getCal);
    app.post('/calculate',confirmIndexCtrl.insertCalculate);


    app.get('/year/report',confirmIndexCtrl.getYearReport);
    app.get('/exporter',confirmIndexCtrl.getExporter);
    app.get('/list',confirmIndexCtrl.getList);

    app.get('/spreadsheet/:id',confirmIndexCtrl.getSpreadsheet);
    app.put('/spreadsheet',confirmIndexCtrl.updateSpreadsheet);

    //calculate to allocate
    app.post('/allocate/:id',confirmIndexCtrl.insertAllocate);
}


module.exports = routes;