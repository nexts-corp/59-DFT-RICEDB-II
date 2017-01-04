exports.index = function (req, res) {
    var parameters = {

    };

    var datas = [
        {
            name: "การระบายข้าวในสต๊อกของรัฐ",
            quantity: 8.60,
            value: 88649.89
        },
        {
            name: "การระบายข้าวฤดูกาลผลิตใหม่",
            quantity: 3.43,
            value: 50187.78
        }
    ]


    res._ireport("stats8.jasper", "pdf", datas, parameters);
}

