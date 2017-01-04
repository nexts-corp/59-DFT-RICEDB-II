class index{
    
    selectconfirm(req,res){ // select for ordinal 
        var r = req._r;
        var params = req.query;
        console.log('xxx7');
        console.log(params.type_rice_id);
        if(typeof params.year !== "undefined"){
            params.year = parseInt(params.year);
        }

        r.db('eu2').table('quota').filter({
            year: params.year,
            type_rice_id: params.type_rice_id
        })
        .innerJoin(r.db('eu2').table('notify'), function(x,xx) {
              return x('type_rice_id') .eq(xx('type_rice_id')).and( x('year') .eq(xx('year')))
          }).zip()
        .innerJoin(r.db('eu2').table('exporter'), function(i,ii) {
              return i('exporter_id') .eq(ii('id'))
            }).zip()  
        .pluck('ordinal','exporter_id','name')
        .run().then(function(result){
            res.json(result);
        });
    }
}

module.exports = new index();