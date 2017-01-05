
class index {


    getYearReport(req, res) {
        var r = req._r;
        var params = req.params;

        r.db('eu2').table('report').orderBy(r.desc('year'))('year').distinct()
            .run().then(function (result) {
                res.json(result);
            });

    }

    getExporter(req, res) {
        var r = req._r;
        var params = req.query;
        r.db('eu2').table('report').filter({ type_doc: 'c', type_rice_id: params.type_rice_id }).pluck('exporter_id')
            .union(r.db('eu2').table('confirm').filter({ type_rice_id: params.type_rice_id }).pluck('exporter_id')).distinct().innerJoin(
            r.db('eu2').table('exporter'), function (reportRow, exporterRow) {
                return reportRow('exporter_id').eq(exporterRow('id'))
            }
            )('right').orderBy('name')
            .run().then(function (result) {
                res.json(result);
            });

    }

    getCal(req, res) {
        var statement = FORMULA_FOR_CAL(req);
        statement
        //.pluck('calculate','report','quota','confirm')
        .run().then(function (result) {
            res.json(result);
        });

    }


    insertCalculate(req, res) {
        //save calculate
        var statement = FORMULA_FOR_CAL(req);
        statement
        .do(function (result) {
            //for save to calculate_detail
            return r.db('eu2').table('calculate').insert({
                calculate: result('calculate'),
                confirm: result('confirm'),
                quota: result('quota'),
                report: result('report'),
                ordinal: req.ordinal,
                quota_id:result('quota_id'),
            }).do(function (calSave) {
                return result('spreadsheets').merge(function (row) {
                    return { calculate_id: calSave('generated_keys')(0) }
                }).do(function (preSave) {
                    return r.db('eu2').table('calculate_detail').insert(preSave)
                })
            })
            

        })
        .run().then(function (result) {
            res.json(result);
        }).catch(function(err){
            res.json(err);
        })
    }
 

    getList(req,res){
        var r = req._r;
        var params = req.query;

        r.db('eu2').table('calculate').innerJoin(r.db('eu2').table('quota'),function(calRow,quotaRow){
            return calRow('quota_id').eq(quotaRow('id'))
        }).map(function(row){
            return row('left').merge({
                type_rice_id:row('right')('type_rice_id'),
                year:row('right')('year')
            })
        }).filter({
            year:parseInt(params.year),
            type_rice_id:params.type_rice_id
        })
        .run().then(function (result) {
            res.json(result);
        }).catch(function(err){
            res.json(err);
        })
    }


    getSpreadsheet(req,res){
        var r = req._r;
        var params = req.params;

        STM_PREADSHEET(r,params)
        .run().then(function (result) {
            res.json(result);
        }).catch(function(err){
            res.json(err);
        })
    }

    updateSpreadsheet(req,res){
        var r = req._r;
        var params = req.body;

        r.expr(params.quota_update).forEach(function(quotaUpdateRow){
            return r.db('eu2').table('calculate_detail').update(quotaUpdateRow)
        }).do(function(result){
            return {status:'updated'}
        })
        .run().then(function (result) {
            res.json(result);
        }).catch(function(err){
            res.json(err);
        })

    }


    insertNotify(req,res){
        var r = req._r;
        var params = req.params;

        STM_PREADSHEET(r,params).do(function(result){
            return result('spreadsheet').filter(function(row){
                return row('quota').ne(0)
            })
            .map(function(row){
                    return {
                        amount_real:row('quota_update'),
                        calculate_id:result('id'),
                        quota_id:result('quota_id'),
                        quantity:r.db('eu2').table('quota').get(result('quota_id'))('quantity').map(function(periodRow){
                            return row('quota_update').mul(periodRow('percent')).div(100).do(function(calResult){
                                return {
                                    period:periodRow('period'),
                                    weigth_source:calResult,
                                    weigth:r.round(calResult),
                                    weigth_update:r.round(calResult),
                                }
                            })
                            
                        })
                    }
            })
        })
        .run().then(function (result) {
            res.json(result);
        }).catch(function(err){
            res.json(err);
        })

    }


}



const STM_PREADSHEET = (r,params) => {
    return r.db('eu2').table('calculate').get(params.id).merge(function(row){
            return {
                spreadsheet:
                r.db('eu2').table('calculate_detail').filter({calculate_id:row('id')}).merge(function(row){
                    return { exproter_name:r.db('eu2').table('exporter').get(row('exporter_id'))('name') }
                })
                .coerceTo('array')
            }
        })
}


const FORMULA_FOR_CAL = (req) => {
    //caculate quota

    var r = req._r;
    var params = req.body;

    var duringYear = [];
    for (var i = parseInt(params.frist_year); i <= parseInt(params.last_year); i++) {
        duringYear.push(i);
    }
    var fristYearFilter = parseInt(params.frist_year) - 1;
    var LastYearFilter = parseInt(params.last_year) + 1;

    return r.do(
        //get history got quota
        r.db('eu2').table('confirm').filter(function (row) {
            return row('type_rice_id').eq(params.type_rice_id)
                .and(row('year').gt(fristYearFilter)).and(row('year').lt(LastYearFilter))
                .and(r.expr(params.exporter_id).contains(row('exporter_id')))
        }).group('exporter_id').ungroup().merge(function (row) {
            return {
                reduction: row('reduction')
                    .merge(function (row) { return { weigth: row('amount') } }).pluck('year', 'weigth')
            }
        }).map(function (groupRow) {
            return {
                exporter_id: groupRow('group'),
                quantity: r.expr(duringYear).map(function (yearItem) {
                    return groupRow('reduction').filter({ year: yearItem }).do(function (result) {
                        return r.branch(result.count().ne(0), result(0), { year: yearItem, weigth: 0 })
                    })
                }),
                amount: groupRow('reduction').sum('weigth'),
                table: 'confirm'
            }
        })

        ,
        //get history report
        r.db('eu2').table('report').filter(function (row) {
            return row('type_rice_id').eq(params.type_rice_id)
                .and(row('year').gt(fristYearFilter)).and(row('year').lt(LastYearFilter)).and(row('type_doc').eq('c'))
                .and(r.expr(params.exporter_id).contains(row('exporter_id')))
        }).group('exporter_id', 'year').ungroup().group(function (group) { return group('group')(0) }).ungroup()
            .merge(function (row) {
                return {
                    reduction: row('reduction').merge(function (row) {
                        return {
                            weigth: row('reduction')('weigth').sum(),
                            year: row('group')(1)
                        }
                    }).pluck('year', 'weigth')
                }
            }).map(function (groupRow) {
                return {
                    exporter_id: groupRow('group'),
                    quantity: r.expr(duringYear).map(function (yearItem) {
                        return groupRow('reduction').filter({ year: yearItem }).do(function (result) {
                            return r.branch(result.count().ne(0), result(0), { year: yearItem, weigth: 0 })
                        })
                    }),
                    amount: groupRow('reduction').sum('weigth'),
                    table: 'report'
                }
            })

        ,
        function (confirm, report) {
            return {
                spreadsheets:
                confirm.union(report).group('exporter_id').ungroup().map(function (joinRow) {
                    return r.do(
                        joinRow('reduction').filter({ table: 'confirm' }),
                        joinRow('reduction').filter({ table: 'report' }),
                        r.expr({
                            amount: 0,
                            quantity: r.expr(duringYear).map(function (yearItem) {
                                return { year: yearItem, weigth: 0 }
                            })
                        }),
                        function (confirm, report, layout) {
                            return {
                                confirm: r.branch(confirm.count().ne(0), confirm(0).without('table', 'exporter_id'), layout.merge(function (row) {
                                    return { expoter_id: report(0)('exporter_id') }
                                })),
                                report: r.branch(report.count().ne(0), report(0).without('table', 'exporter_id'), layout.merge(function (row) {
                                    return { expoter_id: confirm(0)('exporter_id') }
                                })),
                                exporter_id: r.branch(confirm.count().ne(0), confirm(0)('exporter_id'), report(0)('exporter_id'))
                            }
                        }
                    )
                }).merge(function (row) {
                    return row('report')('amount').sub(row('confirm')('amount')).do(function (resultDiv) {
                        return {
                            div: resultDiv,
                            div_round: r.branch(resultDiv.lt(0), 0, resultDiv)
                        }
                    })
                })
            }
        }
    ).merge(function (rowResult) {
        return rowResult('spreadsheets')('div_round').sum().do(function (sumForCal) {
            return {
                calculate: sumForCal,
                confirm: rowResult('spreadsheets')('confirm')('amount').sum(),
                report: rowResult('spreadsheets')('report')('amount').sum(),
                confirm_year: r.expr(duringYear).map(function (yearRow) {
                    return {
                        year: yearRow,
                        weigth: rowResult('spreadsheets')('confirm')('quantity').map(function (row) {
                            return row.filter({ year: yearRow })(0)
                        }).sum('weigth')
                    }
                }),
                report_year: r.expr(duringYear).map(function (yearRow) {
                    return {
                        year: yearRow,
                        weigth: rowResult('spreadsheets')('report')('quantity').map(function (row) {
                            return row.filter({ year: yearRow })(0)
                        }).sum('weigth')
                    }
                }),
                spreadsheets: rowResult('spreadsheets').merge(function (spreadsheetsRow) {
                    return r.db('eu2').table('quota')
                        .filter({ year: LastYearFilter, type_rice_id: params.type_rice_id })(0)
                        .do(function (quotaRow) {
                            return spreadsheetsRow('div_round').mul(quotaRow('amount')).div(sumForCal)
                                .do(function (resultCalQuota) {
                                    return {
                                        quota: resultCalQuota,
                                        quota_round: r.round(resultCalQuota),
                                        quota_update: r.round(resultCalQuota)
                                    }
                                })

                        })
                })
            }
        })
    }).merge(function (row) {
        return {
            quota: row('spreadsheets').sum('quota'),
            quota_id:r.db('eu2').table('quota')
            .filter({ year: LastYearFilter, type_rice_id: params.type_rice_id })(0)('id'),
            quota_round: row('spreadsheets').sum('quota_round'),
            quota_update: row('spreadsheets').sum('quota_round')
        }
    })
};


module.exports = new index();