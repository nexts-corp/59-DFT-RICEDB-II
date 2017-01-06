class index{
    selectOrdinal(req,res){
        var r = req._r;
        var params = req.query;

        if(typeof params.ordinal !== "undefined"){
            params.ordinal = parseInt(params.ordinal);
        }

        r.db('eu2').table('allocate').group('ordinal').pluck('ordinal')
        .run().then(function(result){
            res.json(result);
        });
    }

    selectAmount(req,res){
        var r = req._r;
        var params = req.query;

        if(typeof params.year !== "undefined"){
            params.year = parseInt(params.year);
            params.ordinal = parseInt(params.ordinal);
        }
        console.log(params.year+" "+params.ordinal+" "+params.type_rice_id)
        r.db('eu2').table('allocate').merge(function(doc){
            return {quantity : doc('quantity').orderBy('period') }
        })
        .filter({
            year:params.year,
            type_rice_id:params.type_rice_id,
            ordinal:params.ordinal
        })

        .innerJoin(r.db('eu2').table('exporter'), function(al,ex){
        return al('exporter_id').eq(ex('id'))
        }).without({ right: ["id"] }).zip().orderBy('name')
    
        .merge(function(sumrow){
            return{
            sumweigth: sumrow('quantity')('weigth').sum(),
            sumweigth_update: sumrow('quantity')('weigth_update').sum() 
            //sumweigth_update: sumrow('quantity')('weigth_update').add(sumrow('quantity')('weigth_update')).sum() 
            }
        }).coerceTo('array')
    
        .do(function(result){
                    return {
                            result:result,
                    all:{ 
                        asumall:r.db('eu2').table('quota').filter({type_rice_id:'4b23b3af-e292-4ac7-8154-c51363cc5ea7',year:2560})
                        (0)('quantity')('period')
                        
                        .map(function(row){
                            return{
                                period:row,
                                amount: result('quantity').map(function(a){ return a.filter({period:row})(0)('weigth')}).sum(),
                                amount_update: result('quantity').map(function(aw){ return aw.filter({period:row})(0)('weigth_update') }).sum(),
                            // sumweigth_all:result('sumweigth').sum(),
                            // sumweigth_update_all:result('sumweigth_update').sum()
                
                                //month:'x'
                            }
                        }),
                        total:  {
                            sumweigth_all:result('sumweigth').sum(),
                            sumweigth_update_all:result('sumweigth_update').sum()
                        }
                        }
                }
            })
         
        .run().then(function(result){
            res.json(result);
        });
    }
}

module.exports = new index();