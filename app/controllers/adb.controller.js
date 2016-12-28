exports.table_byId=function(req,res){
    var r = req._r;
    r.db('adb').table('student').get(req.params.id).run().then(function (result){
        //res.json(result);
        var parameters={year:'2559'};
        res._ireport("report1/report2.jasper","pdf", [result], parameters);
    })
}

exports.table=function(req,res){
    var r = req._r;
    r.db('adb').table('student').run().then(function (result){
        //res.json(result);
        var parameters={year:'2559'};
        res._ireport("report1/report2.jasper","pdf", result, parameters);
    }).error(function(err) {
        res.json(err);
    })
}

exports.tableQuery=function(req,res){
    var r = req._r;
    // res.json(req.query);

    if(typeof req.query.age !== "undefined"){
        req.query.age = parseInt(req.query.age);
    }

    r.db('adb').table('student')
    .filter(req.query)
    .run()
    .then(function (result){
        res.json(result);
        // var parameters={year:'2559'};
        // res._ireport("report1/report2.jasper","pdf", result, parameters);
    }).error(function(err) {
        res.json(err);
    })
}

exports.join = function (req, res) {
    var r = req._r; //rethink   
    r.db('adb').table('student')
        .eqJoin('gender', r.db('adb').table('gender')).without({ right: ["id"] }).zip()
        .merge(function (row) {
            return {
                grade: r.db('adb').table('grade').filter({ student_id: row('id') })
                    .eqJoin('school_id', r.db('adb').table('school')).without({ right: ["id"] }).zip()
                    // .without('id', 'school_id', 'student_id')
                    .pluck('grade','school_name_en')
                    .coerceTo('array')
            }
        })
        .run()
        .then(function (result) {
            //res.json(result)
            var parameters={year:'2559'};
            res._ireport("report1/report4.jasper", "pdf", result, parameters);
        })
}