class index{

    insertConfirm(req,res){
        var r = req._r;
        var params = req.body;
        // var params = {
        //     exporter_id:"xxxxxxx",
        //     year_2557:100,
        //     year_2558:200,
        //     year_2559:300
        // };

        var insertData = function(year,save){
            if(params['year_'+year]!=0){
                save(
                    {
                        year:year,
                        exporter_id:params.exporter_id,
                        amount:params['year_'+year],
                        quantity:[{period:1,weigth:params['year_'+year]}],
                        type_rice_id:'513aa18a-e0d9-4408-9ec2-62fa271958e5'
                    }
                )
            }
        }

        var rethinkSave = function(data){
            r.db('eu2').table('confirm').insert(data).run().then(function(result) {
                console.log(result);
            });
        }


        insertData(2557,function(data){
            rethinkSave(data)
        });

        insertData(2558,function(data){
            rethinkSave(data)
        });

        insertData(2559,function(data){
            rethinkSave(data)
        });

        res.json({ok:'ok'});
    }

    insertReport(req,res){
        var r = req._r;
        var params = req.body;

        var insertData = function(year,save){
            if(params['year_'+year]!=0){
                save(
                    {
                        year:year,
                        quota:true,
                        month:1,
                        type_doc:'c',
                        weigth:params['year_'+year],
                        exporter_id:params.exporter_id,
                        type_rice_id:'513aa18a-e0d9-4408-9ec2-62fa271958e5'
                    }
                )
            }
        }


        var rethinkSave = function(data){
            r.db('eu2').table('report').insert(data).run().then(function(result) {
                console.log(result);
            });
        }

        insertData(2557,function(data){
            rethinkSave(data)
        });

        insertData(2558,function(data){
            rethinkSave(data)
        });

        insertData(2559,function(data){
            rethinkSave(data)
        });

        res.json({ok:'ok'});
    }


}

module.exports = new index();