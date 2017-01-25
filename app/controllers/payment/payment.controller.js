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

}
module.exports = new Payment();