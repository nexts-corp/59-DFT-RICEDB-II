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
                req_date:
                row('req_date').day().coerceTo('string').add('/')
                .add(row('req_date').month().coerceTo('string')).add('/')
                .add(row('req_date').year().coerceTo('string'))
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
        var params = req.body;

        r.db('eu2').table('ec')
        .filter(function(row){
            return r.expr(params.ec_id).contains(row('id'))
        }).coerceTo('array')
        .merge(function(row){
            return {
                req_date:
                row('req_date').day().coerceTo('string').add('/')
                .add(row('req_date').month().coerceTo('string')).add('/')
                .add(row('req_date').year().coerceTo('string')),
                exporter_name:r.db('eu2').table('exporter').get(row('exporter_id'))('name')
            }
        }).do(function(ecSelect){
            return {
                ecSelect:ecSelect,
                ecList:
                r.db('eu2').table('ec').filter(function(row){
                    return row('year').eq(ecSelect(0)('year'))
                    .and(
                        row('exporter_id').eq(ecSelect(0)('exporter_id'))
                    )
                    .and(
                        row('status').eq('c')
                    )
                }).filter(function(row){
                    return row('balance').ne(0);
                })
                .merge(function(row){
                    return {
                        req_date:
                        row('req_date').day().coerceTo('string').add('/')
                        .add(row('req_date').month().coerceTo('string')).add('/')
                        .add(row('req_date').year().coerceTo('string')),
                        exporter_name:ecSelect(0)('exporter_name'),
                        useBalance:0,
                        totalBalance:row('balance')
                    }
                })
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


    insertReceipt(req,res){
        var r = req._r;
        var params = req.body;

        //เช็คประเภทใบเสร็จรับเงิน N=จ่ายปกติ  O=จ่ายยอดเดิม A=จ่ายเพิ่ม
        var typeReceipt = (typeof params.list_old=='undefined')?'N':(typeof params.check_number == "undefined")?'O':'A';
        params.id = params.year+'-'+Math.floor(Math.random()*90000);
        params.type = typeReceipt;

        var check_date = params.check_date.split("-");

        r.expr(params)
        .merge({
            check_date:
                r.time(
                    r.expr(2018).coerceTo('number'),r.expr(check_date[1]).coerceTo('number'),r.expr(check_date[2]).coerceTo('number')
                , "Z"),
            pay_date:new Date()
        })
        .do(function(data){
            return r.db('eu2').table('receipt').insert(data);
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