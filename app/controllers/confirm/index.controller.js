class index {

        selectOrinal(req,res){
            var r = req._r;
            var params = req.query;

            if(typeof params.year !== "undefined"){
                params.year = parseInt(params.year);
            }   

            r.db('eu2').table('quota').filter({year:params.year,type_rice_id:params.type_rice_id})
              .innerJoin(r.db('eu2').table('calculate').filter({status:'n'}), function(q,c){
                    return q('id').eq(c('quota_id'))
             }).zip()
             .orderBy('ordinal')
             .pluck('ordinal')
             .do(function(re){
                return re ('ordinal')
            })
     
            .run().then(function(result){
                res.json(result);
            })
            .catch(function(err){
                res.json(err);
            })
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
                })
                .catch(function(err){
                    res.json(err);
                })
        }

        selectall_noexporter(req,res){ 
            var r = req._r;
            var params = req.query;

            if(typeof params.year !== "undefined"){
                params.year = parseInt(params.year);
                params.ordinal = parseInt(params.ordinal);
            }

            r.db('eu2').table('confirm')
            .innerJoin(r.db('eu2').table('quota').filter({year:params.year, type_rice_id:params.type_rice_id}), function(all,q){
                return all('quota_id').eq(q('id'))
                }).map(function(x){
                return x('left').merge(function(quan){
                return {
                    year:x('right')('year'),
                    type_rice_id:x('right')('type_rice_id'),
                    quantity:x('left')('quantity').merge(function(xx){
                        return {
                        month: x('right')('quantity').filter({period:xx('period')})(0)('month'),
                        percent: x('right')('quantity').filter({period:xx('period')})(0)('percent')
                        }
                    })
                }
                })
                })

            .innerJoin(r.db('eu2').table('exporter'), function(c,e){
            return c('exporter_id').eq(e('id'))
            }).without({right:['id']}).zip()
            
            .innerJoin(r.db('eu2').table('allocate'), function(ta,al){
                return ta('allocate_id').eq(al('id'))
            }).map(function(ml){
                return ml('left').merge(function(x){
                    return {
                        calculate_id:ml('right')('calculate_id')
                    }
                })
            })
            
            .innerJoin(r.db('eu2').table('calculate'), function(ta,ca){
                return ta('calculate_id').eq(ca('id'))
            }).map(function(ml){
                return ml('left').merge(function(x){
                    return {
                        ordinal:ml('right')('ordinal')
                    }
                })
            })
            .filter(function(x){
                return x('ordinal').eq(params.ordinal)
                .and(x('status').eq('c').or(x('status').eq('r')))
            }).orderBy('name')

            .innerJoin(r.db('eu2').table('allocate'), function(all,a){
                return all('allocate_id').eq(a('id'))
                }).map(function(result){
                return result('left').merge(function(ex){
                    return {id_tranfer:result('right')('exporter_id')}
                })
                })
                
            .innerJoin(r.db('eu2').table('exporter'), function(all,e){
                return all('id_tranfer').eq(e('id'))
            }).map(function(x){return x('left').merge(function(xx){return {name_tranfer:x('right')('name')} }) })
                
            .merge(function(name){
                return {
                    name_tranfer: r.branch( 
                    name('status').eq('r'),name('name_tranfer') ,'-')
                }
            })

            .do(function(c){return { data:c, c_amount:c('amount').sum(),people:c.group('exporter_id').ungroup().count() }})        

            .do(function(result){
                return {
                confirm:result ,
                notconfirm : 
                   
                r.db('eu2').table('allocate').innerJoin(r.db('eu2').table('calculate').filter({ordinal:params.ordinal}), function(a,c){
                    return a('calculate_id').eq(c('id'))
                }).map(function(ml){
                return ml('left').merge(function(mr){
                    return { ordinal: ml('right')('ordinal'), status_calculte: ml('right')('status')}
                })
                })
                .filter({ status:'nc',status_calculte:'n'})   
                .innerJoin(r.db('eu2').table('exporter'), function(ta,e){
                    return ta('exporter_id').eq(e('id'))
                }).without({right:['id']}).zip()
                    
                .innerJoin(r.db('eu2').table('quota').filter({year:params.year, type_rice_id:params.type_rice_id }), function(ta,q){
                    return ta('quota_id').eq(q('id'))
                }).map(function(ml){
                    return ml('left').merge(function(mr){
                        return {
                            type_rice_id: ml('right')('type_rice_id'),
                            quantity: ml('left')('quantity').merge(function(m){
                            return {
                                month: ml('right')('quantity').filter({period:m('period')})(0)('month'),
                                percent: ml('right')('quantity').filter({period:m('period')})(0)('percent')
                            }
                        }),
                            year:ml('right')('year')
                        }
                    })
                }).orderBy('name')
                .do(function(nc){return { 
                    data:nc, 
                    nc_amount: 
                        r.db('eu2').table('calculate').filter({ordinal:params.ordinal})
                        .innerJoin(r.db('eu2').table('quota').filter({year:params.year,type_rice_id:params.type_rice_id}), function(c,q){
                            return c('quota_id').eq(q('id'))
                        }).map(function(x){ return x('left')('amount')}).coerceTo('array')(0).sub(result('c_amount'))
                    }
                })
            }
        }) 

        .run().then(function(result){
             res.json(result);
        })
        .catch(function(err){
            res.status(500).json(err);
        })
    }//end function

        selectall(req,res){ 
            var r = req._r;
            var params = req.query;

            if(typeof params.year !== "undefined"){
                params.year = parseInt(params.year);
                params.ordinal = parseInt(params.ordinal);
            }

            r.db('eu2').table('confirm')
            .innerJoin(r.db('eu2').table('quota').filter({year:params.year, type_rice_id:params.type_rice_id}), function(all,q){
                return all('quota_id').eq(q('id'))
                }).map(function(x){
                return x('left').merge(function(quan){
                return {
                    year:x('right')('year'),
                    type_rice_id:x('right')('type_rice_id'),
                    quantity:x('left')('quantity').merge(function(xx){
                        return {
                        month: x('right')('quantity').filter({period:xx('period')})(0)('month'),
                        percent: x('right')('quantity').filter({period:xx('period')})(0)('percent')
                        }
                    })
                }
                })
                })

            .innerJoin(r.db('eu2').table('exporter').filter({id:params.exporter_id}), function(c,e){
            return c('exporter_id').eq(e('id'))
            }).without({right:['id']}).zip()
            
            .innerJoin(r.db('eu2').table('allocate'), function(ta,al){
                return ta('allocate_id').eq(al('id'))
            }).map(function(ml){
                return ml('left').merge(function(x){
                    return {
                        calculate_id:ml('right')('calculate_id')
                    }
                })
            })
            
            .innerJoin(r.db('eu2').table('calculate'), function(ta,ca){
                return ta('calculate_id').eq(ca('id'))
            }).map(function(ml){
                return ml('left').merge(function(x){
                    return {
                        ordinal:ml('right')('ordinal')
                    }
                })
            })
            .filter(function(x){
                return x('ordinal').eq(params.ordinal)
                .and(x('status').eq('c').or(x('status').eq('r')))
            }).orderBy('name')

            .innerJoin(r.db('eu2').table('allocate'), function(all,a){
                return all('allocate_id').eq(a('id'))
                }).map(function(result){
                return result('left').merge(function(ex){
                    return {id_tranfer:result('right')('exporter_id')}
                })
                })
                
            .innerJoin(r.db('eu2').table('exporter'), function(all,e){
                return all('id_tranfer').eq(e('id'))
            }).map(function(x){return x('left').merge(function(xx){return {name_tranfer:x('right')('name')} }) })
                
            .merge(function(name){
                return {
                    name_tranfer: r.branch( 
                    name('status').eq('r'),name('name_tranfer') ,'-')
                }
            })

            .do(function(c){return { data:c, c_amount:c('amount').sum(),people:c.group('exporter_id').ungroup().count() }})        

            .do(function(result){
                return {
                confirm:result ,
                notconfirm : 
                   
                r.db('eu2').table('allocate').innerJoin(r.db('eu2').table('calculate').filter({ordinal:params.ordinal}), function(a,c){
                    return a('calculate_id').eq(c('id'))
                }).map(function(ml){
                return ml('left').merge(function(mr){
                    return { ordinal: ml('right')('ordinal'), status_calculte: ml('right')('status')}
                })
                })

            .filter({ status:'nc',status_calculte:'n'})   
            .innerJoin(r.db('eu2').table('exporter').filter({id:params.exporter_id}), function(ta,e){
                return ta('exporter_id').eq(e('id'))
            }).without({right:['id']}).zip()
                
            .innerJoin(r.db('eu2').table('quota').filter({year:params.year, type_rice_id:params.type_rice_id }), function(ta,q){
                return ta('quota_id').eq(q('id'))
            }).map(function(ml){
                return ml('left').merge(function(mr){
                    return {
                        type_rice_id: ml('right')('type_rice_id'),
                        quantity: ml('left')('quantity').merge(function(m){
                        return {
                            month: ml('right')('quantity').filter({period:m('period')})(0)('month'),
                            percent: ml('right')('quantity').filter({period:m('period')})(0)('percent')
                        }
                    }),
                        year:ml('right')('year')
                    }
                })
            }).orderBy('name')
            .do(function(nc){return { 
                data:nc, 
                nc_amount: 
                      r.db('eu2').table('calculate').filter({ordinal:params.ordinal})
                      .innerJoin(r.db('eu2').table('quota').filter({year:params.year,type_rice_id:params.type_rice_id}), function(c,q){
                          return c('quota_id').eq(q('id'))
                      }).map(function(x){ return x('left')('amount')}).coerceTo('array')(0).sub(result('c_amount'))
                }
              })
    }
       }) 
        .run().then(function(result){
            res.json(result);
        })
        .catch(function(err){
            res.status(500).json(err);
        }) 
        }


        updateconfirm(req,res){
            var r = req._r;
            var params = req.body;          

            console.log(params[0].id);

            for (let value of params) {
                console.log(value.id);

                r.db('eu2').table('allocate').get(value.allocate_id).update({
                    status:'c'
                }).do(function(result){
                    return r.db('eu2').table('confirm').insert({
                        amount:value.amount,
                        exporter_id:value.exporter_id,
                        quantity:value.quantity,
                        quota_id:value.quota_id,
                        allocate_id:value.allocate_id,
                        status:'c'
                    })
                })

                .run().then(function(result){
                    res.json(result);
                })
                .catch(function(err){
                    res.json(err);
                })
            }//end for
        }



        deleteconfirm(req,res){
            var r = req._r;
            var params = req.body;

            for (let value of params) {
                console.log(value.id);

                r.db('eu2').table('allocate').get(value.allocate_id ).update({
                    status:'nc'
                }).do(function(result){
                    return r.db('eu2').table('confirm').filter({allocate_id:value.allocate_id }).delete()
                })
                .run().then(function(result){
                    res.json(result);
                })
                .catch(function(err){
                    res.json(err);
                })
            }//end for
        }



        tranfer(req,res){
            var r = req._r;
            var params = req.body;
            console.log(params.id+""+params.exporter_id);
            
            r.db('eu2').table('confirm').get(params.id ).update({
                status:'t'
            })

            .do(function(result){
                return r.db('eu2').table('confirm').insert({
                    amount:params.amount,
                    exporter_id:params.exporter_id,
                    quantity:params.quantity,
                    quota_id:params.quota_id,
                    allocate_id:params.allocate_id,
                    status:'r'
                })
            })
            .run().then(function(result){
                res.json(result);
            })
            .catch(function(err){
                res.json(err);
            })
        }

    }

module.exports = new index();