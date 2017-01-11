class index{

    getNotify(req,res){
        var r = req._r;
        var params = req.params;
        //res.json({ec:'01252'});

        r.db('eu2').table('allocate').filter({calculate_id:params.calculate_id})
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
        .run().then(function(result) {
            //res.json(result);
            res._ireport("notify/notify.jasper","pdf", result, {x:'x'});
        }).catch(function(err){
            res.json(err);
        });

        
    }

}



module.exports = new index();