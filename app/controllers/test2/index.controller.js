class index{

    test(req,res){
        res.json({ec:'01252'});
        //res._ireport("report1/report2.jasper","pdf", result, parameters);
    }
}

module.exports = new index();