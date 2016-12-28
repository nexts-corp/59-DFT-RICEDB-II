
class index{

    insertReport(req,res){
        var r = req._r;
        var params = req.body;
        
        r.db('eu2').table('report').insert(params).run().then(function(result){
            res.json(result);
        });
    }
    
    // deleteReport(req,res){
    //     var r = req._r;
    //     console.log(req.params.id);
    //     if(typeof req.params.id !== "undefined"){
    //         req.query.id = parseInt(req.query.id);
    //     }
    //     r.db('eu2').table('report').delte(params).run().then(function(result){
    //         res.json(result);
    //     });
    // }
}

module.exports = new index();