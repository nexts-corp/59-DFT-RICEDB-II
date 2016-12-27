
// exports.ec=function(req,res){
//     res.json({ec:'01252'});
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

    exporter(req,res){
        var r = req._r;
        r.db('eu2').table('exporter').run().then(function(result) {
            res.json(result);
        });
    }
    year(req,res){
        var r = req._r;
        r.db('eu2').table('quota').orderBy(r.desc('year'))('year').run().then(function(result) {
            res.json(result);
        });
    }
    type_rice(req,res){
        var r = req._r;
        r.db('eu2').table('type_rice').run().then(function(result) {
            res.json(result);
        });
    }
}

module.exports = new index();