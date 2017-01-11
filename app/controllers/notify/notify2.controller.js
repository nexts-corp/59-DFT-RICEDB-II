class index{

    selectnotify(req,res){ // select for ordinal 
        var r = req._r;
        var params = req.query;

        if(typeof params.year !== "undefined"){
            params.year = parseInt(params.year);
        }

        r.db('eu2').table('calculate').innerJoin(r.db('eu2').table('quota'), function(c,q){
        return c('quota_id').eq(q('id'))
        }).map(function(ml){
        return ml('left').merge(function(ty){
            return { year:ml('right')('year'), type_rice_id:ml('right')('type_rice_id') }
        })
        }).pluck('id','ordinal', 'amount_update','status','year','type_rice_id','').coerceTo('array')
        
        .filter({
            year:params.year,
            type_rice_id:'4b23b3af-e292-4ac7-8154-c51363cc5ea7',   //ข้าวขาว
        })
        
        .do(function (rwhite){
            return {
            rice_w: rwhite,
            rice_h: r.db('eu2').table('calculate').innerJoin(r.db('eu2').table('quota'), function(c,q){
                        return c('quota_id').eq(q('id'))
                        }).map(function(ml){
                        return ml('left').merge(function(ty){
                            return { year:ml('right')('year'), type_rice_id:ml('right')('type_rice_id') }
                        })
                        }).pluck('id','ordinal', 'amount_update','status','year','type_rice_id','').coerceTo('array')
                        
                        .filter({
                        year:params.year,
                        type_rice_id:'513aa18a-e0d9-4408-9ec2-62fa271958e5' //ข้าวหัก
                        })
            }
        })
        .run().then(function(result){
            res.json(result);
        });
    }

}
module.exports = new index();