
class index{

    insertReport(req,res){
        var r = req._r;
        var params = req.body;

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
            }).orderBy('name')
            .run()
            .then(function(result){
                res.json(result);
            });
    }

    updateReport(req,res){
        var r = req._r;
        var params = req.body;

        r.db('eu2').table('quota').filter({
            year:params.year,
            type_rice_id:params.type_rice_id
        }).merge(function(x){
            return {quota_id:x('id')} 
        }).pluck('quota_id').coerceTo('array')(0)
        .do(function(ud){
            return r.db('eu2').table('report').get(params.id).update({
                exporter_id:params.exporter_id,
                month:params.month,
                quota:params.quota,
                type_doc:params.type_doc,
                weigth:params.weigth,
                quota_id:ud('quota_id')
            })
        })
        .run()
        .then(function(result){
            res.json(result);
        });        
    }

    report(req,res){
        var r = req._r;
        var params = req.query;

        if(typeof params.year !== "undefined"){
            if(params.quota=='true'){
                params.quota=true;
            }else{
                params.quota=false;
            }
            params.year = parseInt(params.year);
            params.month = parseInt(params.month);
        }

        r.db('eu2').table('report').filter({month:params.month,quota:params.quota})
        .innerJoin(r.db('eu2').table('quota').filter({year:params.year}) ,function(left,right){
            return left('quota_id').eq(right('id'))
        }).map(function(row){
            return row('left').merge(function(row2){
            return {type_rice_id:row('right')('type_rice_id')}
            })
        }).group('exporter_id','type_doc','type_rice_id').sum('weigth').ungroup()
        .merge(function(row){
            return {
            exporter_id:row('group')(0) ,
            type_doc:row('group')(1),
            type_rice_id:row('group')(2)
            }
        }).without('group')
        .innerJoin(r.db('eu2').table('type_rice'),function(left,right){
            return left('type_rice_id').eq(right('id'))
        }).map(function(row){
            return row('left').merge({query_name:row('right')('query_name')})
        })
        .group('exporter_id').ungroup()
        .merge(function(row){
            return {
            reduction:r.object(r.args(
                
            row('reduction').concatMap(function(rowConcat){
                return [
                rowConcat('type_doc').add('_').add(rowConcat('query_name'))
                ,rowConcat('reduction')
                ]
            })
                
            ))
            }
        })
        
        .innerJoin(r.db('eu2').table('exporter'), function(a,e){
            return a('group').eq(e('id'))
        }).without({right:['id']}).zip()
        .merge(function(x){return x('reduction')}).orderBy('name')
        .without('group','reduction')

        .run()
        .then(function (result){
            var year={year:params.month_th+" "+params.year};
            res._ireport("report_test/report_month.jasper","pdf", result, year);
        }).error(function(err) {
            res.json(err);
        })
    }

}

module.exports = new index();