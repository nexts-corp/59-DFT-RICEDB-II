exports.index = function (req, res) {
    var parameters = {

    };

    var datas = [
        {
            name: "ประมาณการครั้งที่ 3 สต๊อกข้าว ณ วันที่ 31 ตค. 59",
            stock: "8.01 ล้านตัน",
            value: "3.2 แสนล้านบาท ",
            rate: "75.35 บาท/ตัน/เดือน"
        }
    ]


    res._ireport("stats9.jasper", "pdf", datas, parameters);
}