
class index {


    getYearReport(req, res) {
        var r = req._r;
        var params = req.params;

        r.db('eu2').table('report')
        .innerJoin(r.db('eu2').table('quota'),function(l,r){
            return l('quota_id').eq(r('id'))
        }).map(function(result){
            return result('left').merge(function(row){
                return result('right').pluck('type_rice_id','year')
            })
        })
        .pluck('year').distinct()
        .orderBy(r.desc('year'))('year')
        .run()
        .then(function (result) {
            res.json(result);
        }).catch(function(err){
            res.json(err);
        });
    }

    getExporter(req, res) {
        var r = req._r;
        var params = req.query;


        var fristYearFilter = parseInt(params.frist_year) - 1;
        var LastYearFilter = parseInt(params.last_year) + 1;
        var yearFilter = parseInt(params.year);

        console.log(params.type_rice_id,yearFilter);
        r.db('eu2').table('quota').filter({type_rice_id:params.type_rice_id,year:yearFilter})(0).do(function(quotaRow){ 
            return r.db('eu2').table('calculate').filter(
                {quota_id:quotaRow('id')}
            ).coerceTo('array')
            .do(function(calculateRow){
                return r.branch(calculateRow.count().eq(0),
                    //หาผู้ประกอบการ ในการคำนวณครั้งแรก
                    r.db('eu2').table('report')
                    .innerJoin(r.db('eu2').table('quota'),function(l,r){
                        return l('quota_id').eq(r('id'))
                    }).map(function(result){
                        return result('left').merge(function(row){
                            return result('right').pluck('type_rice_id','year')
                        })
                    })
                    .filter(function(row){
                        return row('type_doc').eq('c').and(row('type_rice_id').eq(params.type_rice_id))
                        .and(row('year').gt(fristYearFilter)).and(row('year').lt(LastYearFilter))
                    }).pluck('exporter_id')
                        .union(r.db('eu2').table('confirm')
                        .innerJoin(r.db('eu2').table('quota'),function(l,r){
                            return l('quota_id').eq(r('id'))
                        }).map(function(result){
                            return result('left').merge(function(row){
                                return result('right').pluck('type_rice_id','year')
                            })
                        })
                        .filter(function(row){
                        return row('type_rice_id').eq(params.type_rice_id)
                        .and(row('year').gt(fristYearFilter)).and(row('year').lt(LastYearFilter))
                    }).pluck('exporter_id')).distinct().innerJoin(
                        r.db('eu2').table('exporter'), function (reportRow, exporterRow) {
                            return reportRow('exporter_id').eq(exporterRow('id'))
                        }
                    )('right').orderBy('name')
                    ,
                    //หาผู้ประกอบการ ในการคำนวณครั้งที่สองเป็นต้นไป

                    r.db('eu2').table('allocate').filter({calculate_id:calculateRow(0)('id')})
                    .innerJoin(r.db('eu2').table('confirm').filter({quota_id:quotaRow('id')}),function(left,right){
                        return left('id').eq(right('allocate_id'))
                    })
                    .filter(function(row){
                        return row('left')('amount').eq(row('right')('amount')).and(row('right')('status').eq('c').or(row('right')('status').eq('r')))
                    })
                    .map(function(row){
                        return row('right').pluck('exporter_id')
                    })
                    .innerJoin(r.db('eu2').table('exporter'),function(left,right){
                        return left('exporter_id').eq(right('id'))
                    }).zip().distinct().without('exporter_id')

                )
            })
        })
        .run().then(function (result) {
            res.json(result);
        }).catch(function(err){
            res.json(err);
        });

    }

    getCal(req, res) {
        var statement = FORMULA_FOR_CAL(req);
        statement
        //.pluck('calculate','report','amount','confirm')
        .run().then(function (result) {
            res.json(result);
        }).catch(function(err){
            res.json(err);
        });

    }


    insertCalculate(req, res) {
        var r = req._r;
        var params = req.body;
        var yearFilter = parseInt(params.year);

        //save calculate
        var statement = FORMULA_FOR_CAL(req);
        statement
        .do(function (result) {
            //count ordinal
            return r.db('eu2').table('quota').filter({type_rice_id:params.type_rice_id,year:yearFilter})(0).do(function(quotaRow){
                return r.db('eu2').table('calculate').filter(
                    {quota_id:quotaRow('id')}
                ).coerceTo('array').count()
            }).do(function(countOrdinal){
                // insert calculate
                return r.db('eu2').table('calculate').insert(
                    result.without('spreadsheets').merge({ordinal:countOrdinal.add(1),status:'a'})
                ).do(function (calSave) {
                    return result('spreadsheets').merge(function (row) {
                        return { calculate_id: calSave('generated_keys')(0) }
                    }).do(function (preSave) {
                        return r.db('eu2').table('calculate_detail').insert(preSave)
                    })
                })

            })
            //for save to calculate_detail

            
            

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
            return row('left').merge(row('right').pluck('year','type_rice_id'))
        }).filter({
            year:parseInt(params.year),
        }).group('type_rice_id').ungroup().map(function(row){
            return {
                 type_rice_id: row('group'),
                 type_rice_name_th:r.db('eu2').table('type_rice').get(row('group'))('type_rice_name_th'),
                 list:row('reduction').orderBy('ordinal')
            }
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
        .merge(function(row){
            return r.db('eu2').table('quota').get(row('quota_id')).do(function(quota){
                return r.db('eu2').table('type_rice').get(quota('type_rice_id')).pluck('type_rice_name_th')
            })
        })
        .run().then(function (result) {
            res.json(result);
        }).catch(function(err){
            res.json(err);
        })
    }

    updateSpreadsheet(req,res){
        var r = req._r;
        var params = req.body;

        r.expr(params.amount_update).forEach(function(quotaUpdateRow){
            return r.db('eu2').table('calculate_detail').update(quotaUpdateRow)
        })
        .do(function(result){
            return r.db('eu2').table('calculate_detail').get(params.amount_update[0].id)('calculate_id').do(function(calculateId){
                return r.db('eu2').table('calculate_detail').filter({calculate_id:calculateId}).sum('amount_update').do(function(amountUpdate){
                    return r.db('eu2').table('calculate').get(calculateId).update({amount_update:amountUpdate})
                })
            })
        })
        .run().then(function (result) {
            res.json(result);
        }).catch(function(err){
            res.json(err);
        })

    }


    insertAllocate(req,res){
        var r = req._r;
        var params = req.params;

        STM_PREADSHEET(r,params)
        .do(function(result){
            return result('spreadsheet').filter(function(row){
                return row('amount').ne(0)
            })
            .map(function(row){
                
                    return {
                        exporter_id:row('exporter_id'),
                        amount:row('amount_update'),
                        amount_update:row('amount_update'),
                        calculate_id:result('id'),
                        quota_id:result('quota_id'),
                        quantity:result('quantity')
                        .map(function(quantityBalance){
                            return {
                                period:quantityBalance('period'),
                                weigth_cal:row('amount_update').mul(quantityBalance('weigth').div(result('quantity').sum('weigth')))
                            }
                        })
                        .merge(function(quantityRow){
                            return r.round(quantityRow('weigth_cal')).do(function(weigthRound){
                                return {weigth:weigthRound,weigth_update:weigthRound};
                            })
                        })
                        ,
                        status:'nc'

                    }
                    
            })
        })
        .do(function(result){
            return r.db('eu2').table('allocate').insert(result)
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
                }).orderBy('exproter_name')
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
        r.db('eu2').table('confirm')
        .innerJoin(r.db('eu2').table('quota'),function(l,r){
            return l('quota_id').eq(r('id'))
        }).map(function(result){
            return result('left').merge(function(row){
                return result('right').pluck('type_rice_id','year')
            })
        })
        .filter(function (row) {
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
        r.db('eu2').table('report')
        .innerJoin(r.db('eu2').table('quota'),function(l,r){
            return l('quota_id').eq(r('id'))
        }).map(function(result){
            return result('left').merge(function(row){
                return result('right').pluck('type_rice_id','year')
            })
        })
        .filter(function (row) {
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
        return r.do(
                rowResult('spreadsheets')('div_round').sum()
            ,
                //ปีโค้วต้าปัจจุบัน
                r.db('eu2').table('quota').filter({ year: params.year, type_rice_id: params.type_rice_id })(0)
            ,
            function (sumForCal,quotaRow) {

                return r.do(
                    //หายอดการยื่นยันโควตาครั้งก่อนหน้า
                    r.db('eu2').table('confirm').filter(function(row){
                        return row('quota_id').eq(quotaRow('id')).and(row('status').eq('r').or(row('status').eq('c')))
                    })('quantity').concatMap(function(row){return row}).group('period').sum('weigth').ungroup()
                    .merge(function(groupRow){
                        return {period:groupRow('group'),weigth:groupRow('reduction')}
                    }).pluck('period','weigth')
                ,
                function(quantityConfirm){
                    return {
                        //ปริมาณโควตาคงเหลือ
                        quantity:quotaRow('quantity').map(function(quantityQuota){
                            return {
                                 period:quantityQuota('period'),
                                 weigth:quantityQuota('weigth').sub(
                                     quantityConfirm.filter({period:quantityQuota('period')}).do(function(row){
                                         return r.branch(row.count().ne(0) ,row(0)('weigth'),0)
                                     })
                                )
                            }
                        }),

                        quota_id:quotaRow('id'),
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
                            //หาโค้วต้าที่เหลือ
                            return quotaRow('amount').sub(quantityConfirm.sum('weigth')) 

                            .do(function (quotaBlance) {
                                return spreadsheetsRow('div_round').mul(quotaBlance).div(sumForCal)
                                    .do(function (resultCalQuota) {
                                        return {
                                            amount_cal: resultCalQuota,
                                            amount: r.round(resultCalQuota),
                                            amount_update: r.round(resultCalQuota)
                                        }
                                    })

                            })
                        })
                    }
                }


                )
            })
    }).merge(function (row) {
        return {
            amount_cal: row('spreadsheets').sum('amount_cal'),
            amount: row('spreadsheets').sum('amount'),
            amount_update: row('spreadsheets').sum('amount')
        }
    })
};


module.exports = new index();