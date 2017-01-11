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

        if(typeof params.year !== "undefined"){
            params.year = parseInt(params.year);
        }
    }

}
module.exports = new index();