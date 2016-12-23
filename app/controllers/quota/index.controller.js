class index{

    readQuota(req,res){
        var r = req._r;
        r.db('eu2').table('quota').coerceTo('array').run().then(function(result) {
            res.json(result);
        });
    }

    saveQuota(req,res){
        var r = req._r;
        var params = req.body;

        r.db('eu2').table('quota').insert(params).run().then(function(result) {
            res.json(result);
        });
    }

}



module.exports = new index();
// exports.getQuota = (req,res)=>{
//     var r = req._r;
//     r.db('eu2').table('quota').coerceTo('array').run().then(function(result) {
//         res.json(result);
//     });
// }