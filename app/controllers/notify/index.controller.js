class index{

    getNotify(req,res){
        var r = req._r;
        var params = req.params;
        //res.json({ec:'01252'});

        r.db('eu2').table('allocate').filter({calculate_id:params.calculate_id})
        .innerJoin(r.db('eu2').table('quota'),function(left,right){
            return left('quota_id').eq(right('id'))
        })
        .map(function(row){
            return row('left').merge(row('right').pluck('type_rice_id','year'))
        })
        .innerJoin(r.db('eu2').table('exporter'),function(left,right){
            return left('exporter_id').eq(right('id'))
        })
        .map(function(row){
            return row('left').merge({exporter_name:row('right')('name')})
        })
        .group('type_rice_id').ungroup()
        .innerJoin(r.db('eu2').table('type_rice'),function(left,right){
            return left('group').eq(right('id'))
        })
        .map(function(row){
            return row('left').merge(row('right').pluck('type_rice_name_th'))
        })
        .map(function(row){
            return {
                detail:row('reduction'),
                type_rice_name:row('type_rice_name_th'),
                count:row('reduction').count()
            }
        })
        .run().then(function(result) {
            res.json(result);
            //res._ireport("test/report1.jasper","pdf", [{id:'ssssss',name:'กกก',row:[{id:'ssssss',name:'ddd'}]}], {x:'x'});
        }).catch(function(err){
            res.json(err);
        });

        
    }

}



module.exports = new index();