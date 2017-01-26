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
    }

    report1(req,res){
        var r = req._r;
        var params = req.body;
          
            r.db('eu2').table('rc').filter({id:'8c6131ea-e00f-48ec-b256-61006be8eed3'})
                .innerJoin(r.db('eu2').table('bank'),function(r,b){
                return r('bank_id').eq(b('id'))
            }).without({right:['id']}).zip()
            .merge(function(x){
                return {
                    amount: x('list')('amount')(0),
                    ec_id: x('list')('ec_id')(0),
                    price: x('list')('price')(0),
                    quantity: x('list')('quantity')(0)
                }
            })
            .run()
            .then(function (result){
                var parameters = {a:'a'};
                res._ireport("receipt/reportR1.jasper","pdf", result, parameters);
            }).error(function(err) {
                res.json(err);
            })
        }
}
module.exports = new Payment();