class index{

    getNotify(req,res){
        var r = req._r;
        var params = req.query;

        var calculate_id = params.calculate_id.split(',')
        //res.json({ec:calculate_id});

        r.do(
            r.db('eu2').table('allocate').filter(function(row){
                return r.expr(calculate_id).contains(row('calculate_id'))
            })
            .innerJoin(r.db('eu2').table('quota'),function(left,right){
                return left('quota_id').eq(right('id'))
            })
            .map(function(row){
                return row('left').merge(row('right').pluck('type_rice_id','year'))
                .merge(function(row2){
                    return r.object(r.args(row2('quantity').concatMap(function(quantity){
                        return [r.expr('period_').add(quantity('period').coerceTo('string').add('_weigth')),quantity('weigth_update')]
                    })))
                }).without('quantity')
            })
            .innerJoin(r.db('eu2').table('exporter'),function(left,right){
                return left('exporter_id').eq(right('id'))
            })
            .map(function(row){
                return row('left').merge({exporter_name:row('right')('name')})
            })
            .group('type_rice_id').ungroup()
            .innerJoin(r.db('eu2').table('type_rice'),function(left,right){
                return left('group').eq(right('id'))
            })
            .map(function(row){
                return row('left').merge(row('right').pluck('type_rice_name_th'))
            })
            .map(function(row){
                return {
                    detail:row('reduction').orderBy(r.desc('amount')),
                    type_rice_name:row('type_rice_name_th'),
                    count:row('reduction').count(),
                    quota_id:row('reduction')(0)('quota_id')
                }
            })
            .innerJoin(r.db('eu2').table('quota'),function(left,right){
                return left('quota_id').eq(right('id'))
            }).map(function(row){
                return row('left').merge(function(row2){
                return r.object(r.args(row('right')('quantity').concatMap(function(quantity){
                        return [
                            r.expr('period_').add(quantity('period').coerceTo('string').add('_month')),
                            r.expr(['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'])
                            .nth(quantity('month').sub(1))
                        ]
                })))
                
                })
            })

        ,

            r.db('eu2').table('calculate').get(calculate_id[0]).do(function(result){
                return {
                    //a:result,
                    quota_year:r.db('eu2').table('quota').get(result('quota_id'))('year'),
                    rule_date:result('date_moc').year().coerceTo('string').add('-').add(result('date_moc').month().coerceTo('string')).add('-').add(result('date_moc').day().coerceTo('string')),
                    rule_year:result('date_moc').year().add(543),
                    notify_date:result('date_notify').year().coerceTo('string').add('-').add(result('date_notify').month().coerceTo('string')).add('-').add(result('date_notify').day().coerceTo('string')),
                    notify_year:result('date_notify').year().add(543)
                }
            })
        ,
            function(do1,do2){
                return  { 
                    result:do1,
                    params:do2
                }
            }
        )
        .run().then(function(result) {

            // var parameters = {
            //     quota_year:2017+543,
            //     rule_date:'2015-12-16',
            //     rule_year:2015+543,
            //     notify_date:'2016-12-25',
            //     notify_year:2016+543,
            // };

            //res.json(result);
            //result.params
            var path = require('path');
            result.params['SUBREPORT_DIR'] = path.join(__dirname+"/../../reports/notify")+"\\";

            res._ireport("notify/notify.jasper","pdf", result.result, result.params);
        }).catch(function(err){
            res.json(err);
        });

        
    }


    getPath(req,res){
        var path = require('path');
        res.json({a:path.join(__dirname+"/../../report/notify")+"\\"})
    }

}



module.exports = new index();