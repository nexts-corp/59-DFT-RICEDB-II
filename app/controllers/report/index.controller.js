
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

        var del_first_year = 0;
        var add_last_year = 0;

        if(typeof params.first_year !== "undefined"){
            if(params.quota=='true'){
                params.quota=true;
            }else{
                params.quota=false;
            }
            params.first_year = parseInt(params.first_year);
            params.first_month = parseInt(params.first_month);
            params.last_year = parseInt(params.last_year);
            params.last_month = parseInt(params.last_month);

            del_first_year = params.first_year-1;
            add_last_year = params.last_year+1;
        }

        if(params.last_year != 0){ // ถ้า !=0 แสดงว่ามีปีที่ 2 ก็ทำแบบเต็ม
            r.db('eu2').table('report').filter({quota:params.quota})
                .innerJoin(r.db('eu2').table('quota').filter(function(row){return row('year').gt(del_first_year).and( row('year').lt(add_last_year) )})  
                ,function(left,right){
                    return left('quota_id').eq(right('id'))
                }).map(function(row){
                    return row('left').merge(function(row2){
                        return {type_rice_id:row('right')('type_rice_id'),year:row('right')('year')}
                    })
                })
            .filter(function(row){
                return row('year').eq(params.first_year).and(row('month').gt(0)).and(row('month').lt(params.first_month))
                .or(row('year').eq(params.last_year).and(row('month').gt(params.last_month)).and(row('month').lt(13))).not()
            })
            .group('exporter_id','type_doc','type_rice_id').sum('weigth').ungroup()

                .merge(function(row){
                    return {
                        exporter_id:row('group')(0) ,
                        type_doc:row('group')(1),
                        type_rice_id:row('group')(2),
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
                if(params.quota==true) params.quota="(ในโควต้า)";
                else params.quota = "(นอกโควต้า)"

                var parameters = {
                    year:"ประจำเดือน "+params.first_month_th+" "+params.first_year+" - "+params.last_month_th+" "+params.last_year,
                    quota:params.quota
                };

                res._ireport("report_test/report_month.jasper","pdf", result, parameters);
            }).error(function(err) {
                res.json(err);
            })
        }
        else{ //////////////////// first month ///////////////////////
            r.db('eu2').table('report').filter({month:params.first_month,quota:params.quota})
            .innerJoin(r.db('eu2').table('quota').filter({year:params.first_year}) ,function(left,right){
                return left('quota_id').eq(right('id'))
            }).map(function(row){
                return row('left').merge(function(row2){
                return {type_rice_id:row('right')('type_rice_id')}
                })
            }).group('exporter_id','type_doc','type_rice_id').sum('weigth').ungroup()
            .merge(function(row){
                return {
                exporter_id:row('group')(0),
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
                if(params.quota==true) params.quota="(ในโควต้า)";
                else params.quota = "(นอกโควต้า)"

                var parameters = {
                    year:"ประจำเดือน "+params.first_month_th+" "+params.first_year,
                    quota:params.quota
                };

                res._ireport("report_test/report_month.jasper","pdf", result, parameters);
            }).error(function(err) {
                res.json(err);
            })
        }//end else   
    }

    reportAlert(req,res){
        var r = req._r;
        var params = req.query;

        var del_first_year = 0;
        var add_last_year = 0;

        if(typeof params.first_year !== "undefined"){
            if(params.quota=='true'){
                params.quota=true;
            }else{
                params.quota=false;
            }
            params.first_year = parseInt(params.first_year);
            params.first_month = parseInt(params.first_month);
            params.last_year = parseInt(params.last_year);
            params.last_month = parseInt(params.last_month);

            del_first_year = params.first_year-1;
            add_last_year = params.last_year+1;
        }

        if(params.last_year != 0){ // ถ้า !=0 แสดงว่ามีปีที่ 2 ก็ทำแบบเต็ม
            r.db('eu2').table('report').filter({exporter_id:params.exporter_id})
            .innerJoin(r.db('eu2').table('quota').filter(function(row){return row('year').gt(del_first_year).and( row('year').lt(add_last_year) )})  ,function(left,right){
                return left('quota_id').eq(right('id'))
            }).map(function(row){
                return row('left').merge(function(row2){
                return {type_rice_id:row('right')('type_rice_id'),year:row('right')('year')}
                })
            })
    
            .filter(function(row){
                return row('year').eq(params.first_year).and(row('month').gt(0)).and(row('month').lt(params.first_month))
                .or(row('year').eq(params.last_year).and(row('month').gt(params.last_month)).and(row('month').lt(13))).not()
            })

            .innerJoin( r.db('eu2').table('quota'), function(r,q){
                return r('quota_id').eq(q('id'))
            }).without({right:['id','quantity','amount']}).zip()
            
            .innerJoin(r.db('eu2').table('type_rice'), function(a,t){
                return a('type_rice_id').eq(t('id'))
            }).map(function(ml){
                return ml('left').merge(function(x){
                return {query_name:ml('right')('query_name'),type_rice_name_th:ml('right')('type_rice_name_th')}
                })
            }).group('exporter_id','type_doc','year','month','type_rice_id').sum('weigth').ungroup()
    
            .merge(function(list){
                return{
                //exporter_id:list('group')(0),
                type_doc:list('group')(1),
                year:list('group')(2),
                month:list('group')(3),
                type_rice_id:list('group')(4),
                weigth:list('reduction')
                }
            }).without('group','reduction')

            .innerJoin(r.db('eu2').table('type_rice'), function(a,t){
                return a('type_rice_id').eq(t('id'))
            }).without({right:['id','type_rice_name_th']}).zip()
            .group('year','month').ungroup()
    
            .merge(function(all){
                return { 
                reduction:r.object(r.args(
                    all('reduction').concatMap(function(row){
                    return [  row('type_doc').add('_').add(row('query_name')),row('weigth')  ]
                    })
                ))
                }
            })
    
            .merge(function(result){
                return{
                month: result('group')(1),
                month_th:r.branch( 
                    result('group')(1).eq(1),'ม.ค.',
                    result('group')(1).eq(2),'ก.พ.',
                    result('group')(1).eq(3),'มี.ค.',
                    result('group')(1).eq(4),'เม.ย.',
                    result('group')(1).eq(5),'พ.ค.',
                    result('group')(1).eq(6),'มิ.ย.',
                    result('group')(1).eq(7),'ก.ค.',
                    result('group')(1).eq(8),'ส.ค.',
                    result('group')(1).eq(9),'ก.ย.',
                    result('group')(1).eq(10),'ต.ค.',
                    result('group')(1).eq(11),'พ.ย.','ธ.ค.'
                ),
                year:result('group')(0).coerceTo('string').slice(2,5)}
            })
            
            .merge(function(result){return result('reduction')})
            .orderBy('year','month')
            .without('reduction','group')

            .run()
            .then(function (result){
                var parameters = {
                    exporter: params.exporter_name,
                    notify_date: params.notify_month_th+" "+params.notify_year,
                    full_date: params.first_month_th+" "+params.first_year+" - "+params.last_month_th+" "+params.last_year+" ",
                    hisDate_year : params.hisDate_year,
                    hisDate: params.hisDate,
                    notiDate_year : params.notiDate_year,
                    notiDate: params.notiDate,
                    fl:params.fl
                }
                //res.json(result);
                res._ireport("report_test/report_alert2.jasper","pdf", result,parameters);
            }).error(function(err) {
                res.json(err);
            });
        }
        else{///แบบเดี่ยว
            r.db('eu2').table('report').filter({exporter_id:params.exporter_id, month:params.first_month})
            .innerJoin( r.db('eu2').table('quota').filter({year:params.first_year}), function(r,q){
                return r('quota_id').eq(q('id'))
            }).without({right:['id','quantity','amount']}).zip()
            
            .innerJoin(r.db('eu2').table('type_rice'), function(a,t){
                return a('type_rice_id').eq(t('id'))
            }).map(function(ml){
                return ml('left').merge(function(x){
                return {query_name:ml('right')('query_name'),type_rice_name_th:ml('right')('type_rice_name_th')}
                })
            }).group('exporter_id','type_doc','year','month','type_rice_id').sum('weigth').ungroup()
            
            .merge(function(list){
                return{
                //exporter_id:list('group')(0),
                type_doc:list('group')(1),
                year:list('group')(2),
                month:list('group')(3),
                type_rice_id:list('group')(4),
                weigth:list('reduction')
                }
            }).without('group','reduction')
            
            
            .innerJoin(r.db('eu2').table('type_rice'), function(a,t){
                return a('type_rice_id').eq(t('id'))
            }).without({right:['id','type_rice_name_th']}).zip()
            .group('year','month').ungroup()
  
            .merge(function(all){
                return { 
                reduction:r.object(r.args(
                    all('reduction').concatMap(function(row){
                    return [  row('type_doc').add('_').add(row('query_name')),row('weigth')  ]
                    })
                ))
                }
            })
  
            .merge(function(result){
                return{
                month: result('group')(1),
                month_th:r.branch( 
                    result('group')(1).eq(1),'ม.ค.',
                    result('group')(1).eq(2),'ก.พ.',
                    result('group')(1).eq(3),'มี.ค.',
                    result('group')(1).eq(4),'เม.ย.',
                    result('group')(1).eq(5),'พ.ค.',
                    result('group')(1).eq(6),'มิ.ย.',
                    result('group')(1).eq(7),'ก.ค.',
                    result('group')(1).eq(8),'ส.ค.',
                    result('group')(1).eq(9),'ก.ย.',
                    result('group')(1).eq(10),'ต.ค.',
                    result('group')(1).eq(11),'พ.ย.','ธ.ค.'
                ),
                year:result('group')(0).coerceTo('string').slice(2,5)}
            })
  
            .merge(function(result){return result('reduction')})
            .orderBy('year','month')
            .without('reduction','group')

            .run()
            .then(function (result){
                var parameters = {
                    exporter: params.exporter_name,
                    notify_date: params.notify_month_th+" "+params.notify_year,
                    full_date: params.first_month_th+" "+params.first_year+" ",
                    hisDate_year : params.hisDate_year,
                    hisDate: params.hisDate,
                    notiDate_year : params.notiDate_year,
                    notiDate: params.notiDate,
                    fl:params.fl
                }
                //res.json(result);
                res._ireport("report_test/report_alert2.jasper","pdf", result,parameters);
            }).error(function(err) {
                res.json(err);
            });
        }
    }//end function

}
module.exports = new index();