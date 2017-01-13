class index {

    selectOrinal(req,res){
        var r = req._r;
        var params = req.query;

        if(typeof params.year !== "undefined"){
            params.year = parseInt(params.year);
        }   

        r.db('eu2').table('calculate').innerJoin(r.db('eu2').table('quota'), function(c,q){
                return c('quota_id').eq(q('id'))
        }).map(function(x){
          return {
            year:x('right')('year'),
            type_rice_id:x('right')('type_rice_id'),
            ordinal:x('left')('ordinal'),
            id:x('left')('id')
          }
        })
          
        .filter({
            type_rice_id:params.type_rice_id,
            year:params.year
        }) .orderBy('ordinal')
        
        .do(function(re){
            return re ('ordinal')
        })
          
        .run().then(function(result){
            res.json(result);
        });
    }

    selectexporter(req,res){ 
        var r = req._r;
        var params = req.query;

        if(typeof params.year !== "undefined"){
            params.year = parseInt(params.year);
            params.ordinal = parseInt(params.ordinal);
        }
            r.db('eu2').table('calculate').innerJoin(r.db('eu2').table('quota'), function(c,q){
                    return c('quota_id').eq(q('id'))
            }).map(function(x){
            return {
                year:x('right')('year'),
                type_rice_id:x('right')('type_rice_id'),
                ordinal:x('left')('ordinal'),
                id:x('left')('id')
            }
            })

            .innerJoin(r.db('eu2').table('allocate'), function(a,e){
                return a('id').eq(e('calculate_id'))
            }).map(function(e){
            return e('left').merge(function(ex){
                return { exporter_id :e('right')('exporter_id') }
            })
            })
            
            .innerJoin(r.db('eu2').table('exporter'), function(all,en){
                return all('exporter_id').eq(en('id'))
            }).map(function(x){
                return x('left').merge(function(n){
                return {name:x('right')('name')}
                })
            }) .orderBy('name')
            
            .filter({
                type_rice_id:params.type_rice_id,
                year:params.year,
                ordinal:params.ordinal
            })
            
            .do(function(result){
                return { 
                    ordinal: result('ordinal')(0),
                    type_rice_id:result('type_rice_id')(0),
                    data : result.map(function(x){
                        return {
                        exporter_id:x('exporter_id'),
                        name:x('name')
                        }
                    })
                }
            })
            .run().then(function(result){
                res.json(result);
            });
    }

    selectall(req,res){ 
        var r = req._r;
        var params = req.query;

        if(typeof params.year !== "undefined"){
            params.year = parseInt(params.year);
            params.ordinal = parseInt(params.ordinal);
        }

       r.db('eu2').table('allocate').innerJoin(r.db('eu2').table('calculate'), function(a,c){
            return a('calculate_id').eq(c('id'))
        }).map(function(ml){
            return ml('left').merge(function(mr){
                return { ordinal: ml('right')('ordinal'), status_calculte: ml('right')('status')}
        })
        })
        
        .innerJoin(r.db('eu2').table('exporter'), function(ta,e){
            return ta('exporter_id').eq(e('id'))
        }).map(function(ml){
            return ml('left').merge(function(mr){
                return {name:ml('right')('name')}
            })
        })
        
        .innerJoin(r.db('eu2').table('quota'), function(ta,q){
            return ta('quota_id').eq(q('id'))
        }).map(function(ml){
            return ml('left').merge(function(mr){
                return {
                    type_rice_id: ml('right')('type_rice_id'),
                    quantity: ml('left')('quantity').merge(function(m){
                    return {
                        month: ml('right')('quantity').filter({period:m('period')})(0)('month')
                    }
                    }),
                    year:ml('right')('year')
                }
            })
        })
        
        .filter({
            year:params.year,
            type_rice_id:params.type_rice_id,
            ordinal:params.ordinal,
            exporter_id:params.exporter_id,
            status:'c',
            status_calculte:'n'
        }).orderBy('name')
  
        .do(function(result){
            return {
            confirm:result ,
            notconfirm : 
            r.db('eu2').table('allocate').innerJoin(r.db('eu2').table('calculate'), function(a,c){
                    return a('calculate_id').eq(c('id'))
                }).map(function(ml){
                    return ml('left').merge(function(mr){
                        return { ordinal: ml('right')('ordinal'), status_calculte: ml('right')('status')}
                })
                })
                
                .innerJoin(r.db('eu2').table('exporter'), function(ta,e){
                    return ta('exporter_id').eq(e('id'))
                }).map(function(ml){
                    return ml('left').merge(function(mr){
                        return {name:ml('right')('name')}
                    })
                })
                
                .innerJoin(r.db('eu2').table('quota'), function(ta,q){
                    return ta('quota_id').eq(q('id'))
                }).map(function(ml){
                    return ml('left').merge(function(mr){
                        return {
                            type_rice_id: ml('right')('type_rice_id'),
                            quantity: ml('left')('quantity').merge(function(m){
                            return {
                                month: ml('right')('quantity').filter({period:m('period')})(0)('month')
                            }
                            }),
                            year:ml('right')('year')
                        }
                    })
                })
                
                .filter({
                    year:params.year,
                    type_rice_id:params.type_rice_id,
                    ordinal:params.ordinal,
                    exporter_id:params.exporter_id,
                    status:'nc',
                    status_calculte:'n'
                }).orderBy('name')

            } //End big return
        })
  

/*
        r.db('eu2').table('allocate').innerJoin(r.db('eu2').table('calculate'), function(a,c){
            return a('calculate_id').eq(c('id'))
        }).map(function(ml){
            return ml('left').merge(function(mr){
                return { ordinal: ml('right')('ordinal'), status_calculte: ml('right')('status')}
        })
        })
        
        .innerJoin(r.db('eu2').table('exporter'), function(ta,e){
            return ta('exporter_id').eq(e('id'))
        }).map(function(ml){
            return ml('left').merge(function(mr){
                return {name:ml('right')('name')}
            })
        })
        
        .innerJoin(r.db('eu2').table('quota'), function(ta,q){
            return ta('quota_id').eq(q('id'))
        }).map(function(ml){
            return ml('left').merge(function(mr){
                return {
                    type_rice_id: ml('right')('type_rice_id'),
                    quantity: ml('left')('quantity').merge(function(m){
                    return {
                        month: ml('right')('quantity').filter({period:m('period')})(0)('month')
                    }
                    }),
                    year:ml('right')('year')
                }
            })
        })
        
        .filter({
            year:params.year,
            type_rice_id:params.type_rice_id,
            ordinal:params.ordinal,
            exporter_id:params.exporter_id,
            status:'nc',
            status_calculte:'n'
        })
*/
        .run().then(function(result){
            res.json(result);
        });

    }
}

module.exports = new index();