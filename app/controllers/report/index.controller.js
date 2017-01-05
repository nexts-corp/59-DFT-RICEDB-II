
class index{

    insertReport(req,res){
        var r = req._r;
        var params = req.body;
        
        r.db('eu2').table('report').insert(params).run().then(function(result){
            res.json(result);
        });
    }
    
    deleteReport(req,res){
        var r = req._r;
        console.log(req.params.id);
        // if(typeof req.params.id !== "undefined"){
        //     req.params.id = parseInt(req.params.id);
        // }
        r.db('eu2').table('report').get(req.params.id).delete().run().then(function(result){
            res.json(result);
        });
    }

    selectReport(req,res){
        var r = req._r;
        var params = req.query;

        console.log(params.type_rice_id);
        if(typeof params.quota !== "undefined"){
            if(params.quota=='true'){
                params.quota=true;
            }else{
                params.quota=false;
            }
            params.year = parseInt(params.year);
            params.month = parseInt(params.month);
        }
        
          r.db('eu2').table('report').filter({
                year:params.year,
                month:params.month,
                quota:params.quota,
                type_rice_id:params.type_rice_id
            })
            .merge(function(x){
                return {
                    type_doc_th: r.branch( x('type_doc').eq('c'), 'ถูกต้อง', x('type_doc').eq('ic'), 'ไม่ถูกต้อง', 'เกินกำหนด')
                }
            })
            .innerJoin(r.db('eu2').table('exporter'), function(x,xx) {
                return x('exporter_id') .eq(xx('id'))
            }).without({ right: ["id"] }).zip()
            .innerJoin(r.db('eu2').table('type_rice'), function(x,xx){
                return x('type_rice_id') . eq(xx('id')) 
            }).without({ right: ["id"] }).zip()
            .run()
            .then(function(result){
                res.json(result);
            });
    }

    updateReport(req,res){
        var r = req._r;
        var params = req.body;
        r.db('eu2').table('report').get(params.id).update(params).run().then(function(result){
            res.json(result);
        });
    }
}

module.exports = new index();