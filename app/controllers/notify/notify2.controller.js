class index{

    selectnotify(req,res){ 
        var r = req.r;
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
        var r = req.r;
        var params = req.query;

        if(typeof params.year !== "undefined"){
            params.year = parseInt(params.year);
        }

        r.db('eu2').table('calculate').filter({ id:params.id, status:params.status}) 
        .innerJoin(r.db('eu2').table('allocate'), function(c,a){	
                return c('id').eq(a('calculate_id'))
            }).map(function(mr){
                return mr('right').merge(function(qu){
                return {
                    ordinal:mr('left')('ordinal'),
                    status_allocate: r.branch( mr('left')('status').eq('n'), 'ประกาศ', 'จัดสรร'),
                    status_calculate: r.branch( qu('status').eq('nc'), 'ไม่คอนเฟิร์ม', 'คอนเฟิร์ม'),

                    name_calculate: r.branch( mr('left')('status').eq('n'), mr('left')('name'),'' ),
                    date_moc: r.branch( mr('left')('status').eq('n'), mr('left')('date_moc'),'' ) ,
                    date_notify: r.branch( mr('left')('status').eq('n'), mr('left')('date_notify'),'' )
                }
                })
            })
                
            .innerJoin(r.db('eu2').table('exporter'), function(all,e){
                return all('exporter_id').eq(e('id'))
            }).without({ right: ['id'] }).zip()
        
                
        .innerJoin(r.db('eu2').table('quota').filter({type_rice_id:params.type_rice_id, year:params.year}), function(ta,tq){
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
            .without('amount','exporter_id','quota_id','status')

            .do(function(all){
                return {
                    data:all,
                    sum:{
                        sum_period: r.db('eu2').table('quota')
                    .filter({type_rice_id:params.type_rice_id, year:params.year})('quantity')(0)('period')
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
        });
    }//end function 


    saveOrdinal(req,res){ 
        var r = req.r;
        var params = req.body;

        r.db('eu2').table('calculate').get(params.calculate_id)
        .update({ 
            status:'n',
            name:params.name, 
            date_moc:r.ISO8601(params.date_moc+'T00:00:00+07:00'), 
            date_notify:r.ISO8601(params.date_notify+'T00:00:00+07:00') 
        }) 

        /* ///edit add /// ต้องเปลี่ยนสถานะครั้งที่ 2 ใน calcualte เป็น nc ด้วย
            .do(function(result){
                r.db('eu2').table('allocate').filter({calculate_id:params.calculate_id})
                .update({
                    status:'nc'
                })
            }) /////end edit //// ต้องเปลี่ยนสถานะครั้งที่ 2 ใน คอนเฟิร์ม เป็น nc ด้วย
            .do(function(result){
                r.db('eu2').table('confirm').filter({allocate_id:params.allocate_id})
                .update({
                    status:'nc'
                })
            })
        */

        .run().then(function(result){
            res.json(result);
        });

    }//end function

}
module.exports = new index();