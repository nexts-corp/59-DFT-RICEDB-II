
class index{

    getExporter(req,res){
        var r = req._r;
        r.db('eu2').table('exporter').run().then(function(result) {
            res.json(result);
        });
    }
    getYear(req,res){
        var r = req._r;
        r.db('eu2').table('quota').orderBy(r.desc('year'))('year').run().then(function(result) {
            res.json(result);
        });
    }
    getTypeRice(req,res){
        var r = req._r;
        r.db('eu2').table('type_rice').run().then(function(result) {
            res.json(result);
        });
    }
}

module.exports = new index();