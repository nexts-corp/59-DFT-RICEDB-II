
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
}

module.exports = new index();