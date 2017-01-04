exports.index = function (req, res, next) {
    var r = req._r;

    var parameters = {
        department: "2559"
    };

    r.expr([
        {
            datas: [
                {
                    name: "ข้าวขาว",
                    "y2559": r.db('external_f3').table('customs')
                        .between('10063099009', '10063099023', { index: 'hamonize' })
                        .filter(function (f) {
                            return f('tran_type').eq('export').and(f('tran_year').eq(2559))
                        })
                        .sum('quantity').div(1000).div(1000000),
                    "y2558": r.db('external_f3').table('customs')
                        .between('10063099009', '10063099023', { index: 'hamonize' })
                        .filter(function (f) {
                            return f('tran_type').eq('export').and(f('tran_year').eq(2558))
                        })
                        .sum('quantity').div(1000).div(1000000),
                },
                {
                    name: "ข้าวหอมมะลิไทย",
                    "y2559": r.db('external_f3').table('customs')
                        .getAll(2559, { index: 'tran_year' })
                        .filter(function (f) {
                            return f('tran_type').eq('export').and(f('hamonize').match('1006304'))
                        })
                        .sum('quantity').div(1000).div(1000000),
                    "y2558": r.db('external_f3').table('customs')
                        .getAll(2558, { index: 'tran_year' })
                        .filter(function (f) {
                            return f('tran_type').eq('export').and(f('hamonize').match('1006304'))
                        })
                        .sum('quantity').div(1000).div(1000000),
                },
                {
                    name: "ข้าวนึ่ง",
                    "y2559": r.db('external_f3').table('customs')
                        .getAll('10063091000', { index: 'hamonize' })
                        .filter({ tran_type: 'export', tran_year: 2559 })
                        .sum('quantity').div(1000).div(1000000),
                    "y2558": r.db('external_f3').table('customs')
                        .getAll('10063091000', { index: 'hamonize' })
                        .filter({ tran_type: 'export', tran_year: 2558 })
                        .sum('quantity').div(1000).div(1000000),
                },
                {
                    name: "ข้าวเหนียว",
                    "y2559": r.db('external_f3').table('customs')
                        .getAll(2559, { index: 'tran_year' })
                        .filter(function (f) {
                            return f('tran_type').eq('export').and(f('hamonize').match('1006303'))
                        })
                        .sum('quantity').div(1000).div(1000000),
                    "y2558": r.db('external_f3').table('customs')
                        .getAll(2558, { index: 'tran_year' })
                        .filter(function (f) {
                            return f('tran_type').eq('export').and(f('hamonize').match('1006303'))
                        })
                        .sum('quantity').div(1000).div(1000000),
                },
                {
                    name: "ข้าวปทุมธานี",
                    "y2559": r.db('external_f3').table('customs')
                        .between('10063099001', '10063099008', { index: 'hamonize' })
                        .filter(function (f) {
                            return f('tran_type').eq('export')
                                .and(f('tran_year').eq(2559))
                        })
                        .sum('quantity').div(1000).div(1000000),
                    "y2558": r.db('external_f3').table('customs')
                        .between('10063099001', '10063099008', { index: 'hamonize' })
                        .filter(function (f) {
                            return f('tran_type').eq('export')
                                .and(f('tran_year').eq(2558))
                        })
                        .sum('quantity').div(1000).div(1000000),
                },
                {
                    name: "ข้าวกล้อง",
                    "y2559": r.db('external_f3').table('customs')
                        .getAll(2559, { index: 'tran_year' })
                        .filter(function (f) {
                            return f('tran_type').eq('export').and(f('hamonize').match('10062'))
                        })
                        .sum('quantity').div(1000).div(1000000),
                    "y2558": r.db('external_f3').table('customs')
                        .getAll(2558, { index: 'tran_year' })
                        .filter(function (f) {
                            return f('tran_type').eq('export').and(f('hamonize').match('10062'))
                        })
                        .sum('quantity').div(1000).div(1000000),
                }
            ],
            y2558: 0,
            y2559: 0
        }
    ])
        .merge(function (m) {
            return {
                y2558: m('datas').sum('y2558'),
                y2559: m('datas').sum('y2559'),
            }
        })
        .merge(function (m) {
            return {
                datas: m('datas').merge(function (mm) {
                    return {
                        total2558: m('y2558'),
                        total2559: m('y2559')
                    }
                })
            }
        })
        .getField('datas')(0)
        .run()
        .then(function (result) {
            //res.json(result);
            res._ireport("stats3.jasper", "pdf", result, parameters);
        });
}
