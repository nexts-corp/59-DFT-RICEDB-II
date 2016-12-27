class index{

    getQuota(req,res){
        var r = req._r;
        var params = req.query;

        // r.db('eu2').table('quota').filter({year:2559}).without('year')
        // .eqJoin(r.row('type_rice_id'),r.db('eu2').table('type_rice')).coerceTo('array')


        r.expr({year:2556}).merge(function(row){
            return {
                type_rice:
                r.db('eu2').table('quota').filter({year:2559}).without('year')
                .merge(function(row){
                    return {quota_id:row('id')}
                })
                .eqJoin(function(row){return row('type_rice_id')},r.db('eu2').table('type_rice')).zip().without('id')
                .coerceTo('array')
            }
        })
        .run().then(function(result) {
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