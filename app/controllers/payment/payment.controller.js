class Payment{

    getReqEcList(req,res){
        var r = req._r;
        var params = req.query;
        var quotaYear = parseInt(params.year);

        r.db('eu2').table('ec')
        .filter({
            year:quotaYear,
            exporter_id:params.exporter_id,
            status:'np'
        }).coerceTo('array')
        .run().then(function(result){
            res.json(result);
        })
        .catch(function(err){
            res.status(500).json(err);
        });
    }

}
module.exports = new Payment();