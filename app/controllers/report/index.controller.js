
class index{

    insertReport(req,res){
        var r = req._r;
        var params = req.body;
        
        r.db('eu2').table('report').insert(params).run().then(function(result){
            res.json(result);
        });
    }
    
    deleteReport(req,res){
        var r = req._r;
        console.log(req.params.id);
        // if(typeof req.params.id !== "undefined"){
        //     req.params.id = parseInt(req.params.id);
        // }
        r.db('eu2').table('report').get(req.params.id).delete().run().then(function(result){
            res.json(result);
        });
    }

    selectReport(req,res){
        var r = req._r;
        var params = req.query;
        
        if(typeof params.quota !== "undefined"){
            params.quota = Boolean(params.quota);
            params.year = parseInt(params.year);
            params.month = parseInt(params.month);
        }
        console.log(params)
          r.db('eu2').table('report').filter({
                year:params.year,
                month:params.month,
                quota:params.quota //ในโควต้า
            }).without('id')
            .innerJoin(r.db('eu2').table('exporter'), function(x,xx) {
                return x('exporter_id') .eq(xx('id'))
            }).zip()
            .innerJoin(r.db('eu2').table('type_rice'), function(x,xx){
                return x('type_rice_id') . eq(xx('id')) 
            }).without('id').zip()
            .run()
            .then(function(result){
                res.json(result);
            });
    }
}

module.exports = new index();