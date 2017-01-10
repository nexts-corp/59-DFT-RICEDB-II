class index{
    selectAmount(req,res){
        var r = req._r;
        var params = req.query;

        if(typeof params.ordinal !== "undefined"){
            params.ordinal = parseInt(params.ordinal);
            params.year = parseInt(params.year);
        }   

      r.db('eu2').table('calculate').innerJoin(r.db('eu2').table('allocate'), function(c,a){
        return c('id').eq(a('calculate_id'))
      }).map(function(mr){
        return mr('right').merge(function(qu){
          return {ordinal:mr('left')('ordinal')}
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
            quantity:ma('left')('quantity').merge(function(rowp){
              return { month:ma('right')('quantity').filter({period:rowp('period')}) (0) ('month') }
            })
          }
        })
      }).orderBy('name')
        
       .filter({
         year:2560,
         type_rice_id:'4b23b3af-e292-4ac7-8154-c51363cc5ea7',
         ordinal:1,
         status:'nc'
      })
      
        
        .do(function(all){
          return {
            data:all,
            sum: {
              amount_all: r.db('eu2').table('allocate').sum('amount'),
              amount_update_all: r.db('eu2').table('allocate').sum('amount_update'),
              //p1: r.db('eu2').table('allocate').map(function(sup){ return sup('quantity')('weigth')})       .coerceTo('array')  
            }
         }
        })


        .run().then(function(result){
            res.json(result);
        });
    }

    selectOrinal(req,res){
         r.db('eu2').table('calculate').pluck('ordinal')('ordinal')
         .run().then(function(result){
            res.json(result);
         });
    }
    // selectOrdinal(req,res){
    //     var r = req._r;
    //     var params = req.query;

    //     if(typeof params.ordinal !== "undefined"){
    //         params.ordinal = parseInt(params.ordinal);
    //     }

    //     r.db('eu2').table('allocate').group('ordinal').pluck('ordinal')
    //     .run().then(function(result){
    //         res.json(result);
    //     });
    // }

    // selectAmount(req,res){
    //     var r = req._r;
    //     var params = req.query;

    //     if(typeof params.year !== "undefined"){
    //         params.year = parseInt(params.year);
    //         params.ordinal = parseInt(params.ordinal);
    //     }
    //     console.log(params.year+" "+params.ordinal+" "+params.type_rice_id)
    //     r.db('eu2').table('allocate').merge(function(doc){
    //         return {quantity : doc('quantity').orderBy('period') }
    //     })
    //     .filter({
    //         year:params.year,
    //         type_rice_id:params.type_rice_id,
    //         ordinal:params.ordinal
    //     })

    //     .innerJoin(r.db('eu2').table('exporter'), function(al,ex){
    //     return al('exporter_id').eq(ex('id'))
    //     }).without({ right: ["id"] }).zip().orderBy('name')
    
    //     .merge(function(sumrow){
    //         return{
    //         sumweigth: sumrow('quantity')('weigth').sum(),
    //         sumweigth_update: sumrow('quantity')('weigth_update').sum() 
    //         //sumweigth_update: sumrow('quantity')('weigth_update').add(sumrow('quantity')('weigth_update')).sum() 
    //         }
    //     }).coerceTo('array')
    
    //     .do(function(result){
    //                 return {
    //                         result:result,
    //                 all:{ 
    //                     asumall:r.db('eu2').table('quota').filter({type_rice_id:'4b23b3af-e292-4ac7-8154-c51363cc5ea7',year:2560})
    //                     (0)('quantity')('period')
                        
    //                     .map(function(row){
    //                         return{
    //                             period:row,
    //                             amount: result('quantity').map(function(a){ return a.filter({period:row})(0)('weigth')}).sum(),
    //                             amount_update: result('quantity').map(function(aw){ return aw.filter({period:row})(0)('weigth_update') }).sum(),
    //                         // sumweigth_all:result('sumweigth').sum(),
    //                         // sumweigth_update_all:result('sumweigth_update').sum()
                
    //                             //month:'x'
    //                         }
    //                     }),
    //                     total:  {
    //                         sumweigth_all:result('sumweigth').sum(),
    //                         sumweigth_update_all:result('sumweigth_update').sum()
    //                     }
    //                     }
    //             }
    //         })
         
    //     .run().then(function(result){
    //         res.json(result);
    //     });
    // }
}

module.exports = new index();