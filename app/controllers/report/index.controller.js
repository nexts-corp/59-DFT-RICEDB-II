
class index{

    insertReport(req,res){
        var r = req._r;
        var params = req.body;
        console.log(params);

        res.json(params);
        // r.db('eu2').table('report').insert(params).run().then(function(result){
        //     console.log(result)
        // });
    }
}

module.exports = new index();