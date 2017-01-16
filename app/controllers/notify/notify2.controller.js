class index{

    selectnotify(req,res){ // select for ordinal 
        var r = req._r;
        var params = req.query;

        if(typeof params.year !== "undefined"){
            params.year = parseInt(params.year);
        }
        r.db('eu2').table('quota').filter({
            year:params.year
        }).innerJoin(r.db('eu2').table('type_rice'), function(q,tr){
            return q('type_rice_id').eq(tr('id'))
        }).without({ right: ['id'] }).zip()
        .without('amount','quantity')
            
        .merge(function(data){
        return {
            row: r.db('eu2').table('calculate') .filter({quota_id:data('id')}).orderBy('ordinal')
            .merge(function(x){return {
               status_th:r.branch(x('status').eq('n'), 'ออกประกาศ', 'จัดสรรโควต้า'),
               year:data('year'),
               type_rice_id:data('type_rice_id')
            }
            })
          
           .pluck('ordinal','amount_update','status_th','status','year','type_rice_id','id')
            .coerceTo('array')
        }
        })
        .run().then(function(result){
            res.json(result);
        });
    } //end function


    selectnotifyAll(req,res){ 
        var r = req._r;
        var params = req.query;

        if(typeof params.year !== "undefined"){
            params.year = parseInt(params.year);
        }

           r.db('eu2').table('quota').filter({
                year:2560,
                type_rice_id:'4b23b3af-e292-4ac7-8154-c51363cc5ea7'
            }).innerJoin(r.db('eu2').table('type_rice'), function(q,tr){
                return q('type_rice_id').eq(tr('id'))
            }).without({ right: ['id'] }).zip()
            .without('amount')
                
            .innerJoin( r.db('eu2').table('calculate').filter({ordinal:1,id:'3d39afad-ae61-4c82-91ac-fecf7395888e'}), function(all, c){
            return all('id').eq(c('quota_id'))
            }).map(function(mr){
            return mr('right').merge(function(x){
                return {
                quantity:mr('left')('quantity'), 
                year:mr('left')('year'), 
                type_rice_id:mr('left')('type_rice_id'), 
                type_rice_name_th:mr('left')('type_rice_name_th'),
                status_th:r.branch(mr('right')('status').eq('n'), 'ออกประกาศ', 'จัดสรรโควต้า')
                }
            })
            }).without('amount', 'amount_cal', 'amount_update', 'calculate', 'confirm', 'confirm_year', 'report', 'report_year')
            
            .innerJoin(r.db('eu2').table('allocate'), function(all,a){
            return all('id').eq(a('calculate_id'))
            }).map(function(ml){
            return ml('left').merge(function(x){
                return{
                status_allocate:ml('right')('status'),
                amount_update:ml('right')('amount_update'),
                exporter_id:ml('right')('exporter_id'),
                quantity:ml('left')('quantity').map(function(mq){
                    return {
                    period:mq('period'),
                    month:mq('month'),
                    weigth_update:ml('right')('quantity').filter({period:mq('period')})(0)('weigth_update')
                    }
                })
                }
            })
            })
            
            .innerJoin(r.db('eu2').table('exporter'), function(a,e){
            return a('exporter_id').eq(e('id'))
            }).map(function(x){
            return x('left').merge(function(ne){
                return{ name_exporter:x('right')('name')}
            })
            }).orderBy('name_exporter')

                .do(function(all){
                    return {
                        data:all,
                        sum:{
                            sum_period: r.db('eu2').table('quota')
                        .filter({type_rice_id:'4b23b3af-e292-4ac7-8154-c51363cc5ea7',year:2560})('quantity')(0)('period')
                                .map(function(p){
                                    return {
                                    period: p,
                                    sw_update:all('quantity').map(function(a){ return a.filter({period:p})(0)('weigth_update') }).sum()
                                    }
                                }),
                            sum_amount_update :all('amount_update').sum()
                        },
                        name:all('name')(0),
                        date_moc: all('date_moc')(0),
                        date_notify:all('date_notify')(0)
                    }
                })
    /*
        r.db('eu2').table('calculate').innerJoin(r.db('eu2').table('allocate'), function(c,a){	
            return c('id').eq(a('calculate_id'))
        }).map(function(mr){
            return mr('right').merge(function(qu){
            return {
                ordinal:mr('left')('ordinal'),
                status_allocate: r.branch( mr('left')('status').eq('n'), 'ประกาศ', 'จัดสรร'),
                status_calculate: r.branch( qu('status').eq('nc'), 'ไม่คอนเฟิร์ม', 'คอนเฟิร์ม'),
                name_calculate:mr('left')('name'),
                date_moc:mr('left')('date_moc'),
                date_notify:mr('left')('date_notify')
            }
            })
        })
            
            .innerJoin(r.db('eu2').table('exporter'), function(all,e){
            return all('exporter_id').eq(e('id'))
        }).map(function(ml){
            return ml('left').merge(function(mn){
            return { name:ml('right')('name') }
            })
        })
            
        .innerJoin(r.db('eu2').table('quota'), function(ta,tq){
            return ta('quota_id').eq(tq('id'))
        }).map(function(ma){
            return ma('left').merge(function(x){
            return {
                year:ma('right')('year'), 
                type_rice_id:ma('right')('type_rice_id'),
                quantity:ma('left')('quantity').map(function(rowp){
                return { 
                    period:rowp('period'),
                    month:ma('right')('quantity').filter({period:rowp('period')}) (0) ('month'),
                    weigth_update: ma('left')('quantity').filter({period:rowp('period')}) (0) ('weigth_update')
                }
                })
            }
            })
        }) .orderBy('name') 
                    
        .filter({ calculate_id:params.id })
        .without('amount','type_rice_id','exporter_id','quota_id','status')

        .do(function(all){
            return {
                data:all,
                sum:{
                    sum_period: r.db('eu2').table('quota').filter({type_rice_id:params.type_rice_id,year:params.year})('quantity')(0)('period')
                        .map(function(p){
                            return {
                            period: p,
                            sw_update:all('quantity').map(function(a){ return a.filter({period:p})(0)('weigth_update') }).sum()
                            }
                        }),
                    sum_amount_update :all('amount_update').sum()
                },
                name:all('name_calculate')(0),
                date_moc: all('date_moc')(0),
                date_notify:all('date_notify')(0)
            }
        })
		
        .run().then(function(result){
            res.json(result);
        });*/
    }//end function 

    saveOrdinal(req,res){ 
        var r = req._r;
        var params = req.body;

        r.db('eu2').table('calculate').get(params.calculate_id)
        .update({ 
            status:'n',
            name:params.name, 
            date_moc:r.ISO8601(params.date_moc+'T00:00:00+07:00'), 
            date_notify:r.ISO8601(params.date_notify+'T00:00:00+07:00') 
        })        
        
        .run().then(function(result){
            res.json(result);
        });

    }//end function

}
module.exports = new index();