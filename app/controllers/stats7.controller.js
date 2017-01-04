exports.index = function (req, res) {
    var parameters = {

    };

    var datas = [
        {
            name: "ขป.เจ้า 5 % นาปรัง ปี 59",
            before: "80,000-8,200",
            after: "80,000-8,200"
        },
        {
            name: "ขป.หอมมะลิ ปี 58/59",
            before: "10,600-12,100",
            after: "10,600-12,100"
        }
    ]


    res._ireport("stats7.jasper", "pdf", datas, parameters);
}

