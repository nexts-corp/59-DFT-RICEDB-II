exports.index = function (req, res) {
    res.sendfile('./public/index.html');
}
exports.db = function (req, res) {

    var u = {
        id: 1333
    };

    if (!req.user) {
        var user = {
            id: 1234,
            name: "somchit",
            email: "somchit.c@nexts-corp.com"
        };

        req.login(user, function (err) {

        });


    } else {
        console.log('is loged');
    }

    var valid = req._validator.validate('user', u);
    if (!valid) console.log(req._validator.errorsText());

    req._r.table('session').coerceTo('array').run().then(function (result) {
        console.log(result);
        res.json(result);
    });



}
exports.render = function (req, res) {
    console.log(req.user);
    res.render('index', {
        'title': "Hello",
        'message': "somchit",
        'uname': "somchit@gm.com"
    });
}

exports.report = function (req, res) {
    //var iReport=req._jvm.import("nylon.report.iReport");
    var datas = [
        {
            name: "somchit",
            surname: "chanudom",
            address: "5/424"
        },
        {
            name: "somchit",
            surname: "chanudom",
            address: "5/424"
        }, {
            name: "somchit",
            surname: "chanudom",
            address: "5/424"
        }
    ];
    for (var i = 0; i < 1000; i++) {
        datas[i] = {
            name: "somchit",
            surname: "chanudom",
            address: "5/424"
        };
    }
    var parameters = {

        department: "it"
    };


    res._ireport("report1.jasper", "pdf", datas, parameters);





    //  var reportname=path.join(path.dirname(fs.realpathSync(__filename)), '../report/report1.jasper');
    // var rp=new iReport();
    // rp.export(reportname,"pdf",JSON.stringify(data),JSON.stringify(parameter),
    //   function(err,buff){
    //   res._responsePDF(buff);
    // var buffer= Buffer.from(buff, "hex");
    // var bufferStream = new stream.PassThrough();
    // bufferStream.end( buffer );
    // res.setHeader('Content-Length', buffer.length);
    //  res.setHeader('Content-Type', 'application/ms-word');
    //     res.setHeader('Content-Disposition', 'attachment; filename=quote.docx');
    // bufferStream.pipe(res);

    // }
    //);



}

exports.g2g = function (req, res, next) {
    var r = req._r;

    var parameters = {
        department: "2559"
    };
 var data=[{ name: '111' }];
   r.db('common').table('ship').run().then(function (result) {
          res._ireport("report1.jrxml", "pdf", result, parameters);
    });

  
    // .then(function (result) {
    //     
    // });


}

function toArrayBuffer(buf) {
    var ab = new ArrayBuffer(buf.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return ab;
}