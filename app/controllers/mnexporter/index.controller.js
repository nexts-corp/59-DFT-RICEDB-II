class index{

    selectExporter(req,res){
        
        var r = req._r;
        var params = req.query;

        r.db('eu2').table('exporter')
        .run().then(function(result){
            res.json(result);
        });
    } //end function

    insertExporter(req,res){
        var r = req._r;
        var params = req.body;

        r.db('eu2').table('exporter').insert(params)
        .run().then(function(result){
            res.json(result);
        });

    } //end function

    updateExporter(req,res){
        var r = req._r;
        var params = req.body;
        r.db('eu2').table('exporter').get(params.id).update(params)
        .run().then(function(result){
            res.json(result);
        });
        
    } //end function

    deleteExporter(req,res){
        var r = req._r;
        var params = req.query;
        console.log(params.id)
        r.db('eu2').table('exporter').get(params.id).delete()
        .run().then(function(result){
            res.json(result);
        });
    } //end function
    
    
}

module.exports = new index();