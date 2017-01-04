exports.index = function (req, res) {
    var parameters = {

    };

    var datas = [
        {
            name: "ข้าวหอมมะลิ 100%",
            before: "23,500-23,600",
            after: "23,500-23,23,600"
        },
        {
            name: "ข้าวขาว 5 %",
            before: "23,500-23,600",
            after: "23,500-23,23,600"
        },
        {
            name: "ข้าวขาว 10 %",
            before: "23,500-23,600",
            after: "23,500-23,23,600"
        },
        {
            name: "ข้าวขาว 15 %",
            before: "23,500-23,600",
            after: "23,500-23,23,600"
        },
        {
            name: "ข้าวขาว 25 %",
            before: "23,500-23,600",
            after: "23,500-23,23,600"
        }

        ,
        {
            name: "ปลายข้าวเอวันเลิศ",
            before: "23,500-23,600",
            after: "23,500-23,23,600"
        }

        ,
        {
            name: "ข้าวเหนียวขาว 10%",
            before: "23,500-23,600",
            after: "23,500-23,23,600"
        }
    ]


    res._ireport("stats6.jasper", "pdf", datas, parameters);
}

