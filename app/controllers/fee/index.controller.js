
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

}

module.exports = new index();