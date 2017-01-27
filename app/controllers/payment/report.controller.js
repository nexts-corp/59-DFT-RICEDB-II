class Report{

    getFeeReport(req,res){
        var r = req._r;
        //var params = req.query;
        //var quotaYear = parseInt(params.year);

        r.db('eu2').table('receipt')
        .filter(r.row('pay_date').during(r.time(2017,1,1, "Z"), r.time(2017, 1, 28, "Z")))
        .merge(function(row){
            return {
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
                        return { exporter_name:row2('right')('name') }
                    })
                })
            }
        }).coerceTo('array')
        .do(function(result){

            return result.merge(function(row){
                return {list_count:row('list').count()}
            })
            .merge(function(row){
                return r.branch(
                    row.hasFields('bank_id'),
                    {bank_name:r.db('eu2').table('bank').get(row('bank_id'))('name')},
                    {}
                )
            })
            .concatMap(function(rootRow){
                return rootRow('list').merge(rootRow.without('list','list_old'))
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

module.exports = new Report();