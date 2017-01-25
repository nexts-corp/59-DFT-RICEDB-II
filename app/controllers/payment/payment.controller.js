class Payment{

    getExporterEcList(req,res){
        var r = req._r;
        var params = req.query;
        var quotaYear = parseInt(params.year);

        r.db('eu2').table('ec')
        .filter({
            year:quotaYear
        })
        .innerJoin(r.db('eu2').table('exporter'),function(left,right){
            return left('exporter_id').eq(right('id'))
        })
        .map(function(row){
            return row('right')
        }).distinct().orderBy('name')

        .run().then(function(result){
            res.json(result);
        })
        .catch(function(err){
            res.status(500).json(err);
        });


    }

    getReqEcList(req,res){
        var r = req._r;
        var params = req.query;
        var quotaYear = parseInt(params.year);

        r.db('eu2').table('ec')
        .filter({
            year:quotaYear,
            exporter_id:params.exporter_id,
            status:'np'
        })
        .merge(function(row){
            return {
                amount:row('price').sub(row('quantity')),
                delivery_date:
                row('delivery_date').day().coerceTo('string').add('/')
                .add(row('delivery_date').month().coerceTo('string')).add('/')
                .add(row('delivery_date').year().coerceTo('string'))
            }
        })
        .innerJoin(r.db('eu2').table('exporter'),function(left,right){
            return left('exporter_id').eq(right('id'))
        })
        .map(function(row){
            return row('left').merge(function(row2){
                return {exporter_name:row('right')('name')}
            })
        })
        .run().then(function(result){
            res.json(result);
        })
        .catch(function(err){
            res.status(500).json(err);
        });
    }

    getPaymentDetail(req,res){
        var r = req._r;
        var params = req.query;
        var quotaYear = parseInt(params.year);

        r.db('eu2').table('ec').get(params.ec_id)
        .merge(function(row){
            return {
                amount:row('price').sub(row('quantity')),
                delivery_date:
                row('delivery_date').day().coerceTo('string').add('/')
                .add(row('delivery_date').month().coerceTo('string')).add('/')
                .add(row('delivery_date').year().coerceTo('string')),
                exporter_name:r.db('eu2').table('exporter').get(row('exporter_id'))('name')
            }
        }).do(function(ecSelect){
            return {
                ecSelect:ecSelect,
                ecList:
                r.db('eu2').table('ec').filter(function(row){
                    return row('year').eq(ecSelect('year'))
                    .and(
                        row('exporter_id').eq(ecSelect('exporter_id'))
                    )
                    .and(
                        row('status').eq('c')
                    )
                }).filter(function(row){
                    return row('balance').ne(0);
                })
                .merge({exporter_name:ecSelect('exporter_name')})
                .coerceTo('array')
            }
        })
        .run().then(function(result){
            res.json(result);
        })
        .catch(function(err){
            res.status(500).json(err);
        });
    }

}
module.exports = new Payment();