class Report{

    getFeeReport(req,res){
        FEE_DATA(req)
        .run().then(function(result){
            res.json(result);
        })
        .catch(function(err){
            res.status(500).json(err);
        });
    }

    feeReport(req,res){
        //FEE_DATA(req)
        r.expr([{a:'x'}])
        .run().then(function(result){
            res._ireport("receipt/fee.jasper","pdf", result, {x:'x'});
            //res.json(result);
        })
        .catch(function(err){
            res.status(500).json(err);
        });
    }

}

const FEE_DATA = (req) => {
    var r = req._r;
    var params = req.query;
    var frist_date = params.frist_date.split("-");
    var last_date = params.last_date.split("-");

    return r.db('eu2').table('receipt')
    .filter(r.row('pay_date').during(
        r.time(r.expr(frist_date[0]).coerceTo('number'),r.expr(frist_date[1]).coerceTo('number'),r.expr(frist_date[2]).coerceTo('number'), "Z"),
        r.time(r.expr(last_date[0]).coerceTo('number'),r.expr(last_date[1]).coerceTo('number'),r.expr(last_date[2]).coerceTo('number'), "Z")
    ))
    //.filter(r.row('pay_date').during(r.time(2017,1,1, "Z"), r.time(2017, 1, 28, "Z")))
    .merge(function(row){
        return {
            pay_date:
                row('pay_date').year().coerceTo('string').add('-')
                .add(row('pay_date').month().coerceTo('string')).add('-')
                .add(row('pay_date').day().coerceTo('string')),
            type_name:
                r.branch(
                    row('type').eq('N'),"ปกติ",
                    r.branch(row('type').eq('O'),"จ่ายยอดเดิม","จ่ายเกิน")
                )
            ,
            list:
            row('list').innerJoin(r.db('eu2').table('ec'),function(left,right){
                return left('ec_id').eq(right('id'))
            })
            .map(function(row2){
                return row2('left')
                .merge(function(row3){
                    return row2('right').pluck('ec_number','req_number','exporter_id','req_date')
                })
            }).innerJoin(r.db('eu2').table('exporter'),function(left,right){
                return left('exporter_id').eq(right('id'))
            })
            .map(function(row2){
                return row2('left').merge(function(row3){
                    return {
                        exporter_name:row2('right')('name'),
                        req_date:
                        row3('req_date').year().coerceTo('string').add('-')
                        .add(row3('req_date').month().coerceTo('string')).add('-')
                        .add(row3('req_date').day().coerceTo('string')),
                    }
                })
            })
        }
    }).coerceTo('array')
    .do(function(result){

        return result.merge(function(row){
            return {
                list_count:row('list').count()
            }
        })
        .merge(function(row){
            return r.branch(
                row.hasFields('bank_id'),
                    r.branch(row('bank_id').ne(''),
                        {bank_name:r.db('eu2').table('bank').get(row('bank_id'))('name')}
                    ,
                        {}
                    )
                ,
                {}
            )
        })
        .concatMap(function(rootRow){
            return rootRow('list').merge(rootRow.without('list','list_old'))
        })
        
    })
}

module.exports = new Report();