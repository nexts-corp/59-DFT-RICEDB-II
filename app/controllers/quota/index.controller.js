class index{

    readQuota(req,res){
        var r = req._r;
        var params = req.query;

        r.db('eu2').table('quota').coerceTo('array').run().then(function(result) {
            res.json(result);
        });
    }

    insertQuota(req,res){
        var r = req._r;
        var params = req.body;

        r.db('eu2').table('quota').insert(params).run().then(function(result) {
            res.json(result);
        });
    }


    updateQuota(req,res){
        var r = req._r;
        var params = req.body;

        r.db('eu2').table('quota').update(params).run().then(function(result) {
            res.json(result);
        });
    }

    deleteQuota(req,res){
        var r = req._r;
        var params = req.query;

        if(params.id != undefined && params.id.trim() != ""){
            r.db('eu2').table('quota').get(params.id).delete().run().then(function(result) {
                res.json(result);
            });
        }else{
            res.status(500).send('No Args : id');
        }
    }

}



module.exports = new index();