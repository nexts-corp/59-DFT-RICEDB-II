class index{
    
    selectnotconfirm(req,res){ // select for ordinal 
        var r = req._r;
        var params = req.query;
        console.log('xxx7');
        console.log(params.type_rice_id);
        if(typeof params.year !== "undefined"){
            params.year = parseInt(params.year);
        }

        r.db('eu2').table('quota').filter({
            year: params.year,
            type_rice_id: params.type_rice_id
        })
        .innerJoin(r.db('eu2').table('notify'), function(x,xx) {
              return x('type_rice_id') .eq(xx('type_rice_id')).and( x('year') .eq(xx('year')))
          }).zip()
        .innerJoin(r.db('eu2').table('exporter'), function(i,ii) {
              return i('exporter_id') .eq(ii('id'))
            }).zip()  
        .pluck('ordinal','exporter_id','name')
        .run().then(function(result){
            res.json(result);
        });
    }

    selectnotconfirm2(req,res){ // select all 
        var r = req._r;
        var params = req.query;

        if(typeof params.year !== "undefined"){
            params.year = parseInt(params.year);
            params.ordinal = parseInt(params.ordinal);
        }

        r.db('eu2').table('quota').filter({
            year: params.year,
            type_rice_id: params.type_rice_id
        })
        .innerJoin(r.db('eu2').table('notify'), function(x,xx) {
            return x('type_rice_id') .eq(xx('type_rice_id')).and( x('year') .eq(xx('year')))
        })
        .map(function(join){
          return join('right')
          .merge(function(nid){
               return {id_notify:nid('id')}
          })
         
          .merge(function(right){
              return {
                  quantity:right('quantity').merge(function(row){
                  return {
                    percent:join('left')('quantity').filter({period:row('period')})(0)('percent'),
                    month:join('left')('quantity').filter({period:row('period')})(0)('month')
                  }
                })
              }
            })
          })

         .innerJoin(r.db('eu2').table('exporter'), function(i,ii) {
              return i('exporter_id') .eq(ii('id'))
            }).zip()  
          .filter({
            exporter_id:params.exporter_id,
            ordinal:params.ordinal,
            status:'nc'
          })
        .run().then(function(result){
            res.json(result);
        });
    }

    selectconfirm(req,res){ // select confirm 
        var r = req._r;
        var params = req.query;

        if(typeof params.year !== "undefined"){
            params.year = parseInt(params.year);
        }
        r.db('eu2').table('confirm').filter({
            year:params.year,
            type_rice_id: params.type_rice_id,
            exporter_id: params.exporter_id
        })
        .innerJoin(r.db('eu2').table('exporter'), function(x,xx){
            return x('exporter_id') .eq(xx('id'))
        }).zip()
        .run().then(function(result){
            res.json(result);
        });
    }

    // updateconfirm(req,res){ // update confirm 
    //     var r = req._r;
    //     var params = req.body;
    //     console.log(params.id);
    //     r.db('eu2').table('notify').get(params.id).update(params).run().then(function(result){
    //         res.json(result);
    //     });
    // }

    insertconfirm(req,res){ // insert confirm 
        var r = req._r;
        var params = req.body;

        r.db('eu2').table('confirm').insert(params.confirm).run().then(function(result){
            res.json(result);
        });

        r.db('eu2').table('notify').get(params.notify.id_notify).update({status:"c"}).run().then(function(result){
            res.json(result);
        });
    }

}

module.exports = new index();