
class index{

    getQuotaIdAndInsert(req,res){
        var r = req._r;
        var params = req.body;

        // if(typeof params.year !== "undefined"){
        //     if(params.quota=='true'){
        //         params.quota=true;
        //     }else{
        //         params.quota=false;
        //     } 
        //    params.year = parseInt(params.year);
        // }

        console.log(params);


        // r.db('eu2').table('quota').filter({
        //     year:params.year,
        //     type_rice_id:params.type_rice_id
        // }).merge(function(x){
        //     return {quota_id:x('id')} 
        // }).pluck('quota_id').coerceTo('array')
        

        // .do(function(ins){
        //    return r.db('eu2').table('report').insert({
        //         exports_id:params.exports_id,
        //         month:params.month,
        //         quota:params.quota,
        //         type_doc:params.type_doc,
        //         weigth:params.weigth,
        //         quota_id:ins('quota_id')(0)
        //     })
        // })


        // .run().then(function(result){
        //     res.json(result);
        // });
    }

    insertReport(req,res){
        var r = req._r;
        var params = req.body;
        console.log(params.year);
        console.log(params.type_rice_id);

        if(typeof params.year !== "undefined"){
            if(params.quota=='true'){
                params.quota=true;
            }else{
                params.quota=false;
            } 
           params.year = parseInt(params.year);

        }

        r.db('eu2').table('quota').filter({
            year:params.year,
            type_rice_id:params.type_rice_id
        }).merge(function(x){
            return {quota_id:x('id')} 
        }).pluck('quota_id').coerceTo('array')(0)

        .do(function(ins){
           return r.db('eu2').table('report').insert({
                exporter_id:params.exporter_id,
                month:params.month,
                quota:params.quota,
                type_doc:params.type_doc,
                weigth:params.weigth,
                quota_id:ins('quota_id')
            })
        })

        .run().then(function(result){
            res.json(result);
        });
    }
    
    deleteReport(req,res){
        var r = req._r;
        console.log(req.params.id);
        r.db('eu2').table('report').get(req.params.id).delete().run().then(function(result){
            res.json(result);
        });
    }

    selectReport(req,res){
        var r = req._r;
        var params = req.query;

        console.log(params.type_rice_id);
        if(typeof params.quota !== "undefined"){
            if(params.quota=='true'){
                params.quota=true;
            }else{
                params.quota=false;
            }
            params.year = parseInt(params.year);
            params.month = parseInt(params.month);
        }
        
            r.db('eu2').table('report').innerJoin(r.db('eu2').table('quota'), function(left,right){
                return left('quota_id').eq(right('id'))
            }).map(function(r){
                return r('left').merge(function(mr){
                    return {
                        year:r('right')('year'),
                        type_rice_id:r('right')('type_rice_id')
                    }
                })
            }).innerJoin(r.db('eu2').table('exporter'), function(a,e){
                return a('exporter_id').eq(e('id'))
            }).map(function(mra){
                return mra('left').merge(function(en){
                    return {
                        name:mra('right')('name')
                    }
                })
            }) .merge(function(x){
                    return {
                    type_doc_th: r.branch( x('type_doc').eq('c'), 'ถูกต้อง', x('type_doc').eq('ic'), 'ไม่ถูกต้อง', 'เกินกำหนด')
                    }
            }).filter({
                year:params.year,
                type_rice_id:params.type_rice_id,
                month:params.month,
                quota:params.quota
            })
            .run()
            .then(function(result){
                res.json(result);
            });
    }

    updateReport(req,res){
        var r = req._r;
        var params = req.body;
        r.db('eu2').table('report').get(params.id).update(params).run().then(function(result){
            res.json(result);
        });
    }
}

module.exports = new index();