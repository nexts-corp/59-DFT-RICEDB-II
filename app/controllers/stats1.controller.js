exports.index = function (req, res, next) {
    var r = req._r;

    var parameters = {
        department: "2559"
    };

    r.expr([
        {
            name: "ปริมาณ(ตัน)",
            "y2559": r.db('external_f3').table('customs')
                .filter({ tran_type: 'export', tran_year: 2559 })
                .sum('quantity').div(1000),
            "y2558": r.db('external_f3').table('customs')
                .filter({ tran_type: 'export', tran_year: 2558 })
                .sum('quantity').div(1000)
        },
        {
            name: "มูลค่า(ล้านบาท)",
            "y2559": r.db('external_f3').table('customs')
                .filter({ tran_type: 'export', tran_year: 2559 })
                .sum('value_baht').div(1000000),
            "y2558": r.db('external_f3').table('customs')
                .filter({ tran_type: 'export', tran_year: 2558 })
                .sum('value_baht').div(1000000),
        },
        {
            name: "มูลค่า(ล้าน USD)",
            "y2559": r.db('external_f3').table('customs')
                .filter({ tran_type: 'export', tran_year: 2559 })
                .sum('value_usd').div(1000000),
            "y2558": r.db('external_f3').table('customs')
                .filter({ tran_type: 'export', tran_year: 2558 })
                .sum('value_usd').div(1000000),
        },
        {
            name: "ราคาเฉลี่ย(usd/ตัน)",
            "y2559": r.db('external_f3').table('customs')
                .filter({ tran_type: 'export', tran_year: 2559 })
                .sum('value_usd')
                .div(
                r.db('external_f3').table('customs')
                    .filter({ tran_type: 'export', tran_year: 2559 })
                    .sum('quantity').div(1000)
                ),
            "y2558": r.db('external_f3').table('customs')
                .filter({ tran_type: 'export', tran_year: 2558 })
                .sum('value_usd')
                .div(
                r.db('external_f3').table('customs')
                    .filter({ tran_type: 'export', tran_year: 2558 })
                    .sum('quantity').div(1000)
                ),
        },
    ])
        .run()
        .then(function (result) {
            //res.json(result);
            res._ireport("stats1.jasper", "pdf", result, parameters);
        });
}


exports.link = function (req, res, next) {
    var html="<a href='http://localhost:8081/api/stats/stats1' target='_blank'>1.สถานการณ์ส่งออก</a><br>";
    html+="<a href='http://localhost:8081/api/stats/stats3' target='_blank'>3.การส่งออกข้าวไทยแยกตามชนิดข้าว</a><br>";
    html+="<a href='http://localhost:8081/api/stats/stats4' target='_blank'>4.ตลาดส่งออกข้าวแบ่งตามภูมิภาค</a><br>";
    html+="<a href='http://localhost:8081/api/stats/stats6' target='_blank'>6.ราคาข้าวสาร</a><br>";
    html+="<a href='http://localhost:8081/api/stats/stats7' target='_blank'>7.ราคาข้าวเปลือก</a><br>";
    html+="<a href='http://localhost:8081/api/stats/stats8' target='_blank'>8.สถานะการระบายข้าว</a><br>";
    html+="<a href='http://localhost:8081/api/stats/stats9' target='_blank'>9.ประมาณการมูลค่าข้าว</a><br>";

    
    html+="<a href='http://www.thairiceinfo.go.th/?page=Info.ShowInfo_5' target='_blank'>การขายข้าวแบบ G to G</a><br>";
    html+="<a href='http://www.thairiceinfo.go.th/?page=Info.ShowInfo_1&inf=preview1_1_3' target='_blank'>ปริมาณ/มูลค่าการส่งออกข้าวไทย</a><br>";
    html+="<a href='http://www.thairiceinfo.go.th/?page=DataL3.ShowData&codeData=A1002' target='_blank'>การส่งออกข้าวของไทย แยกตามประเทศที่ส่งออก</a><br>";
    html+="<a href='http://www.thairiceinfo.go.th/?page=DataL3.ShowData&codeData=A1003' target='_blank'>การส่งออกข้าวของไทยแยกตามชนิดข้าว</a><br>";
    html+="<a href='http://www.thairiceinfo.go.th/?page=DataL3.ShowData&codeData=C3003' target='_blank'>ราคาข้าวสารขายส่งตลาดกรุงเทพฯและราคาข้าวเปลือก</a><br>";


    res.send(html);

}