class index{

    selectAmount(req,res){
        var r = req._r;
        var params = req.query;

        if(typeof params.ordinal !== "undefined"){
            params.ordinal = parseInt(params.ordinal);
            params.year = parseInt(params.year);
        }   

       r.db('eu2').table('calculate').filter({ordinal:params.ordinal}).merge(function(x){
          return { quantity_cal:x('quantity') }
        }) 
          
          .innerJoin(r.db('eu2').table('quota').filter({year:params.year,type_rice_id:params.type_rice_id}), function(ta,tq){
                        return ta('quota_id').eq(tq('id'))
                      }).map(function(ma){
                        return ma('left').merge(function(x){
                          return {
                            year:ma('right')('year'), 
                            type_rice_id:ma('right')('type_rice_id'),
                            quantity:ma('left')('quantity').merge(function(rowp){
                              return { month:ma('right')('quantity').filter({period:rowp('period')}) (0) ('month') }
                            })
                          }
                        })
          }) .without({right:['id']})
  
        
        .innerJoin(r.db('eu2').table('allocate'), function(c,a){	
                return c('id').eq(a('calculate_id'))
              }).map(function(mr){
                return mr('right').merge(function(qu){
                  return {
                    ordinal:mr('left')('ordinal'),
                    quantity_balance:mr('left')('quantity_cal')
                    //status_allocate:mr('left')('status')
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
                
              .merge(function(w){
                 return {amount_cal:w('quantity').sum('weigth_cal')}
              })
              .orderBy(r.desc('amount_update')) 
                
                
            .do(function(all){
                  return {
                    data:all,
                    sum:  {
                      sum_period: r.db('eu2').table('quota').filter({type_rice_id:params.type_rice_id,year:params.year})('quantity')(0)('period')
                            .map(function(p){
                                return {
                                  period: p,
                                  sum_weigth:all('quantity').map(function(a){ return a.filter({period:p})(0)('weigth') }).sum(),
                                  sum_weigth_update:all('quantity').map(function(a){ return a.filter({period:p})(0)('weigth_update') }).sum(),
                                  sum_weigth_cal:all('quantity').map(function(a){ return a.filter({period:p})(0)('weigth_cal') }).sum()
                                }
                            }),
                    sum_amount :all('amount').sum(),
                    sum_amount_update :all('amount_update').sum(),
                    sum_amount_cal :all('quantity').concatMap(function(row){
                        return row
                    }).sum('weigth_cal')
                    },
                    quantity_balance:all('quantity_balance')(0)
                }
              })


        .run().then(function(result){
            res.json(result);
        });
    }

    selectOrinal(req,res){
        var r = req._r;
        var params = req.query;

        if(typeof params.year !== "undefined"){
            params.year = parseInt(params.year);
        }   

           r.db('eu2').table('calculate').innerJoin(r.db('eu2').table('quota'), function(c,q){
                return c('quota_id').eq(q('id'))
           }).zip().filter({
             type_rice_id:params.type_rice_id,
             year:params.year
           }).orderBy('ordinal').pluck('ordinal')('ordinal')
             .map(function(nu){
               return [nu]
             })
        
         .run().then(function(result){
            res.json(result);
         });
    }

    updateAmount(req,res){
        var r = req._r;
        var params = req.body;

        r.db('eu2').table('allocate').get(params.id).update({
          amount:params.amount,
          amount_update:params.amount_update,
          quantity:params.quantity
        })
        .run().then(function(result){
            res.json(result);
        });
    }

}

module.exports = new index();