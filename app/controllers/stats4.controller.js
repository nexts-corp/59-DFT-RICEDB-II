exports.index = function (req, res, next) {
    var r = req._r;

    var parameters = {
        department: "2559"
    };

    r.expr([
        {
            datas: [
                {
                    name: "แอฟริกา",
                    "y2559": r.db('external_f3').table('customs')
                        .getAll('AF', { index: 'continent2' })
                        .filter(function (f) {
                            return f('tran_type').eq('export').and(f('tran_year').eq(2559))
                        })
                        .sum('quantity').div(1000).div(1000000),
                    "y2558": r.db('external_f3').table('customs')
                        .getAll('AF', { index: 'continent2' })
                        .filter(function (f) {
                            return f('tran_type').eq('export').and(f('tran_year').eq(2558))
                        })
                        .sum('quantity').div(1000).div(1000000),
                },
                {
                    name: "เอเชีย",
                    "y2559": r.db('external_f3').table('customs')
                        .getAll('AS', { index: 'continent2' })
                        .filter(function (f) {
                            return f('tran_type').eq('export').and(f('tran_year').eq(2559))
                        })
                        .sum('quantity').div(1000).div(1000000),
                    "y2558": r.db('external_f3').table('customs')
                        .getAll('AS', { index: 'continent2' })
                        .filter(function (f) {
                            return f('tran_type').eq('export').and(f('tran_year').eq(2558))
                        })
                        .sum('quantity').div(1000).div(1000000),
                },
                {
                    name: "อเมริกา",
                    "y2559": r.db('external_f3').table('customs')
                        .getAll('NA', 'SA', { index: 'continent2' })
                        .filter(function (f) {
                            return f('tran_type').eq('export').and(f('tran_year').eq(2559))
                        })
                        .sum('quantity').div(1000).div(1000000),
                    "y2558": r.db('external_f3').table('customs')
                        .getAll('NA', 'SA', { index: 'continent2' })
                        .filter(function (f) {
                            return f('tran_type').eq('export').and(f('tran_year').eq(2558))
                        })
                        .sum('quantity').div(1000).div(1000000),
                },
                {
                    name: "ยุโรป",
                    "y2559": r.db('external_f3').table('customs')
                        .getAll('EU', { index: 'continent2' })
                        .filter(function (f) {
                            return f('tran_type').eq('export').and(f('tran_year').eq(2559))
                        })
                        .sum('quantity').div(1000).div(1000000),
                    "y2558": r.db('external_f3').table('customs')
                        .getAll('EU', { index: 'continent2' })
                        .filter(function (f) {
                            return f('tran_type').eq('export').and(f('tran_year').eq(2558))
                        })
                        .sum('quantity').div(1000).div(1000000),
                },
                {
                    name: "โอเชียเนีย",
                    "y2559": r.db('external_f3').table('customs')
                        .getAll('OC', { index: 'continent2' })
                        .filter(function (f) {
                            return f('tran_type').eq('export').and(f('tran_year').eq(2559))
                        })
                        .sum('quantity').div(1000).div(1000000),
                    "y2558": r.db('external_f3').table('customs')
                        .getAll('OC', { index: 'continent2' })
                        .filter(function (f) {
                            return f('tran_type').eq('export').and(f('tran_year').eq(2558))
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
            res._ireport("stats4.jasper", "pdf", result, parameters);
        });
}
