
// exports.ec=function(req,res){
//     res.json({ec:'01252'});
// }

// exports.receipt=function(req,res){
//     res.json({r:'3445'});
// }

class index{

    ec(req,res){
        res.json({ec:'01252'});
    }

    receipt(req,res){
        res.json({r:'3445'});
    }

    quota(req,res){
        var r = req._r;
        r.db('eu').table('quota').coerceTo('array').run().then(function(result) {
            res.json(result);
        });
    }

}

module.exports = new index();