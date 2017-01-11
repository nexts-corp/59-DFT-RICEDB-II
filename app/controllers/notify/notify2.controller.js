class index{

    selectnotify(req,res){ // select for ordinal 
        var r = req._r;
        var params = req.query;

        if(typeof params.year !== "undefined"){
            params.year = parseInt(params.year);
        }
        console.log(params.year)
        // r.db('eu2').table('calculate').innerJoin(r.db('eu2').table('quota'), function(c,q){
        // return c('quota_id').eq(q('id'))
        // }).map(function(ml){
        // return ml('left').merge(function(ty){
        //     return { 
        //     year:ml('right')('year'), 
        //     type_rice_id:ml('right')('type_rice_id'),
        //     status_calculate: r.branch( ml('left')('status').eq('n'), 'ออกประกาศ', 'จัดสรรโควต้า')
        //     }
        // })
        // })
        // .innerJoin(r.db('eu2').table('type_rice'), function(a,t){
        //     return a('type_rice_id').eq(t('id'))
        // }).map(function(m){ return m('left').merge(function(n){
        //     return {type_rice_name: m('right')('type_rice_name_th')}
        // })
        // })
        
        // .pluck('id','ordinal', 'amount_update','status','year','type_rice_id','type_rice_name_th','status_calculate') 
        
        // .filter({
        //     year:params.year,
        //     type_rice_id:'513aa18a-e0d9-4408-9ec2-62fa271958e5',   //ข้าวหัก
        // }).coerceTo('array')
        
        // .do(function (rwhite){
        //     return {
        //     rice_w: rwhite,
        //     rice_h: r.db('eu2').table('calculate').innerJoin(r.db('eu2').table('quota'), function(c,q){
        //                 return c('quota_id').eq(q('id'))
        //                 }).map(function(ml){
        //                 return ml('left').merge(function(ty){
        //                     return { 
        //                     year:ml('right')('year'), 
        //                     type_rice_id:ml('right')('type_rice_id'),
        //                     status_calculate: r.branch( ml('left')('status').eq('n'), 'ออกประกาศ', 'จัดสรรโควต้า')
        //                     }
        //                 })
        //                 })
        //                 .innerJoin(r.db('eu2').table('type_rice'), function(a,t){
        //                 return a('type_rice_id').eq(t('id'))
        //                 }).map(function(m){ return m('left').merge(function(n){
        //                 return {type_rice_name: m('right')('type_rice_name_th')}
        //                 })
        //                 })
                        
        //                 .pluck('id','ordinal', 'amount_update','status','year','type_rice_id','type_rice_name_th','status_calculate') 
                        
        //                 .filter({
        //                 year:params.year,
        //                 type_rice_id:'4b23b3af-e292-4ac7-8154-c51363cc5ea7',   //ข้าวขาว
        //                 }).coerceTo('array')
        
        //     }
        // })
        r.db('eu2').table('calculate').innerJoin(r.db('eu2').table('quota'), function(c,q){
        return c('quota_id').eq(q('id'))
        }).map(function(ml){
        return ml('left').merge(function(ty){
            return { 
            year:ml('right')('year'), 
            type_rice_id:ml('right')('type_rice_id'),
            status_calculate: r.branch( ml('left')('status').eq('n'), 'ออกประกาศ', 'จัดสรรโควต้า')
            }
        })
        })
        .innerJoin(r.db('eu2').table('type_rice'), function(a,t){
            return a('type_rice_id').eq(t('id'))
        }).map(function(m){ return m('left').merge(function(n){
            return {type_rice_name: m('right')('type_rice_name_th')}
        })
        })
        
        .without('amount', 'amount_cal', 'calculate', 'confirm', 'confirm_year', 'quota_id', 'report', 'report_year', 'row') 
        
        .map(function(x){
            return {
            year:x('year') ,
            type_rice_id:x('type_rice_id'),
            type_rice_name:x('type_rice_name'),
            row:[{
                amount_update: x('amount_update'),
                id:x('id'),
                ordinal:x('ordinal'),
                status:x('status'),
                status_calculate:x('status_calculate')
            }]
            }
        })
        
        .filter({
            year:params.year,
            type_rice_id:'513aa18a-e0d9-4408-9ec2-62fa271958e5'   //ข้าวหัก
        }).orderBy('ordinal')
        
        .do(function (rwhite){
            return {
            rice_w: rwhite,
            rice_h: r.db('eu2').table('calculate').innerJoin(r.db('eu2').table('quota'), function(c,q){
                        return c('quota_id').eq(q('id'))
                        }).map(function(ml){
                        return ml('left').merge(function(ty){
                            return { 
                            year:ml('right')('year'), 
                            type_rice_id:ml('right')('type_rice_id'),
                            status_calculate: r.branch( ml('left')('status').eq('n'), 'ออกประกาศ', 'จัดสรรโควต้า')
                            }
                        })
                        })
                        .innerJoin(r.db('eu2').table('type_rice'), function(a,t){
                            return a('type_rice_id').eq(t('id'))
                        }).map(function(m){ return m('left').merge(function(n){
                            return {type_rice_name: m('right')('type_rice_name_th')}
                        })
                        })
                        
                        .without('amount', 'amount_cal', 'calculate', 'confirm', 'confirm_year', 'quota_id', 'report', 'report_year', 'row') 
                        
                        .map(function(x){
                        return {
                            year:x('year') ,
                            type_rice_id:x('type_rice_id'),
                            type_rice_name:x('type_rice_name'),
                            row:[{
                            amount_update: x('amount_update'),
                            id:x('id'),
                            ordinal:x('ordinal'),
                            status:x('status'),
                            status_calculate:x('status_calculate')
                            }]
                        }
                        })
            
                        .filter({
                            year:params.year,
                            type_rice_id:'4b23b3af-e292-4ac7-8154-c51363cc5ea7'   //ข้าวขาว
                        }).orderBy('ordinal')
        
            }
        })
        .run().then(function(result){
            res.json(result);
        });
    }

    selectnotifyAll(req,res){ // select for ordinal 
        var r = req._r;
        var params = req.query;

        r.db('eu2').table('calculate').innerJoin(r.db('eu2').table('allocate'), function(c,a){	
            return c('id').eq(a('calculate_id'))
        }).map(function(mr){
            return mr('right').merge(function(qu){
            return {
                ordinal:mr('left')('ordinal'),
                status_allocate: r.branch( mr('left')('status').eq('n'), 'ประกาศ', 'จัดสรร'),
                status_calculate: r.branch( qu('status').eq('nc'), 'ไม่คอนเฟิร์ม', 'คอนเฟิร์ม')
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
                sum:  {
                sum_period: r.db('eu2').table('quota').filter({type_rice_id:'4b23b3af-e292-4ac7-8154-c51363cc5ea7',year:2560})('quantity')(0)('period')
                        .map(function(p){
                            return {
                            period: p,
                            sw_update:all('quantity').map(function(a){ return a.filter({period:p})(0)('weigth_update') }).sum()
                            }
                        }),
                sum_amount_update :r.db('eu2').table('allocate').sum('amount_update')
            }
            }
        })
		
        .run().then(function(result){
            res.json(result);
        });

        }

}
module.exports = new index();