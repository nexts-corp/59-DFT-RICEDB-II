class Payment{

    selectBank(req,res){
        var r = req._r;
        var params = req.query;
        var quotaYear = parseInt(params.year);

        r.db('eu2').table('bank')
        .run().then(function(result){
            res.json(result);
        })
        .catch(function(err){
            res.status(500).json(err);
        });
    }

    saverc(req,res){
        var r = req._r;
        var params = req.body;
 /*
        r.db('eu2').table('rc').insert({
            receipt_number:params.receipt_number,
            amount:params.amount,
            bank_id:params.bank_id,
            check_number:params.check_number,
            check_date:r.ISO8601(params.check_date+'T00:00:00+07:00'),
            check_amount:params.check_amount,
            note:params.note,
            branch:params.branch
        })
        .do(function(x){
            return r.db('eu2').table('ec').get.update({
                rc_id:x('generated_keys')(0)
            })
        })

        .run().then(function(result){
            res.json(result);
        })
        .catch(function(err){
            res.status(500).json(err);
        });
    */
    }
}
module.exports = new Payment();