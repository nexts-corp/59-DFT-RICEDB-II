class Payment{

    selectBank(req,res){
        var r = req.r;
        var params = req.query;
        var quotaYear = parseInt(params.year);

        r.db('eu2').table('bank')
        .run().then(function(result){
            res.json(result);
        })
        .catch(function(err){
            res.status(500).json(err);
        });
    }

    saverc(req,res){
        var r = req.r;
        var params = req.body;
    }

    report1(req,res){
        var r = req.r;
        var parameters = req.query;
 
        r.db('eu2').table('receipt').filter({id:parameters.id}) //  2560-75361  2560-57440 2560-67954
        .merge(function(x){
            return {
                params:{
                bank_branch: r.branch( x('type').eq('O'),'NO',x('bank_branch') ),
                pay_date: r.branch( 
                    x('type').eq('O'),
                    r.now().year().coerceTo('string').add("-")
                    .add(r.now().month().coerceTo('string')).add("-").add(r.now().day().coerceTo('string')),
                    x('pay_date').year().coerceTo('string').add("-")
                    .add(r.now().month().coerceTo('string')).add("-").add(r.now().day().coerceTo('string'))
                ),
                bank_id: r.branch( x('type').eq('O'),'NO',x('bank_id') ),
                check_date: r.branch( 
                    x('type').eq('O'),'NO', x('check_date').year().coerceTo('string').add("-")
                    .add(r.now().month().coerceTo('string')).add("-").add(r.now().day().coerceTo('string'))
                ),
                check_number: r.branch( x('type').eq('O'),'NO', x('check_number') ),
                check_sum: r.branch( x('type').eq('O'),0, x('check_sum') ),
                total:x('total'),
                id:x('id'),
                type:x('type'),
                list_old: r.branch(  x('type').ne('N'), x('list_old'),'NO' )
                }
            }
        }).pluck('list','params')
        
        .merge(function(m){
            return {
            list: m('list').merge(function(result){
                return r.db('eu2').table('ec').get(result('ec_id')).pluck('amount','price','quantity','exporter_id','ec_number')
            }),
            
            list_old: r.branch(
                            m('params')('type').ne('N'), 
                            m('params')('list_old').merge(function(xi){
                                return r.db('eu2').table('ec').get(xi('ec_id')).pluck('ec_number','receipt_id')
                            }),[]
                        )
            }
        })
        
        .merge(function(total){
            return { 
            all:[{
                    ec_number:'รวม',
                        quantity:total('list')('quantity').sum(),
                        price:total('list')(0)('price'),
                        amount:total('list')('amount').sum(),
            }]
            }
        })
        
        .merge(function(row){
            return {list:row('list').union(row('all')).union(row('list_old'))}
        }).pluck('list','params')//.coerceTo('array')(0)
        
        .merge(function(all){
            return {
            bank_id:all('params')('bank_id'),
            exporter_id:all('list')('exporter_id')(0),
            }
        })
        
        .innerJoin(r.db('eu2').table('exporter'), function(a,e){
            return a('exporter_id').eq(e('id'))
        }).without({right:['id']}).zip()
        
        .merge(function(bank){
            return  {
            bank_name: r.branch(
                bank('bank_id').eq('NO'),"NO",
                r.db('eu2').table('bank').get(bank('bank_id')).pluck('name')('name')
            )
            }
        })
        
        .merge(function(all){
            return {
            params:all('params').merge(function(ex){ return {exporter_name:all('name'), bank_name:all('bank_name')} })
            }
        })
        
        .pluck('list','params').coerceTo('array')(0)
        .run()
        .then(function (result){
            var parameters = result.params
            //res.json(result);
            res._ireport("receipt/reportR1.jasper","pdf", result.list, parameters);
        }).error(function(err) {
            res.status(500).json(err);
        })
    }
}
module.exports = new Payment();