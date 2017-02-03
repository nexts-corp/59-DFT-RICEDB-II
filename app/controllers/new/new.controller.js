class index{

    select_data(req,res){ 
        var r = req._r;
        var params = req.query;

        r.db('new').table('data')
        .run().then(function(result){
            res.json(result);
        });
        
    }

    insert_data(req,res){ 
        var r = req._r;
        var params = req.body;

        r.db('new').table('data').insert(params)
        .run().then(function(result){
            res.json(result);
        });
    }

    update_data(req,res){ 
        var r = req._r;
        var params = req.body;

        r.db('new').table('data').get(params.id).update(params)
        .run().then(function(result){
            res.json(result);
        });
    }

    delete_data(req,res){ 
        var r = req._r;
        var params = req.query;

        r.db('new').table('data').get(params.id).delete()
        .run().then(function(result){
            res.json(result);
        });
    }
}
module.exports = new index();