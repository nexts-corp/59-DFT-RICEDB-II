class index{

    selectRice(req,res){
        var r = req._r;
        var params = req.query;

        r.db('eu2').table('type_rice')
        .run().then(function(result){
            res.json(result);
        });
    } //end function

    insertRice(req,res){
        var r = req._r;
        var params = req.body;

        r.db('eu2').table('type_rice').insert(params)
        .run().then(function(result){
            res.json(result);
        });

    } //end function

    updateRice(req,res){
        var r = req._r;
        var params = req.body;
        r.db('eu2').table('type_rice').get(params.id).update(params)
        .run().then(function(result){
            res.json(result);
        });
        
    } //end function

    deleteRice(req,res){
        var r = req._r;
        var params = req.query;
        console.log(params.id)
        r.db('eu2').table('type_rice').get(params.id).delete()
        .run().then(function(result){
            res.json(result);
        });
    } //end function
    
    
}

module.exports = new index();