exports.report1 = function (req, res, next) {
    var r = req._r;
    var parameters = {
        CURRENT_DATE: new Date().toISOString().slice(0, 10),
        SUBREPORT_DIR: __dirname.replace('controller', 'report') + '\\' + req.baseUrl.replace("/api/", "") + '\\'
    };
    r.db('g2g').table('invoice')
        .get(req.query.invoice_id)
        .merge(function (m) {
            return r.db('g2g').table('book')
                .get(m('book_id'))
                .merge(function (m1) {
                    return r.db('g2g').table("shipment").get(m1('shm_id')).pluck('cl_id')
                    //.without("id", "date_created", "date_updated", "creater", "updater")
                })
                .merge(function (m1) {
                    return r.db('g2g').table("confirm_letter").get(m1('cl_id')).pluck("cl_type_rice", "contract_id", "cl_date", "inct_id")
                    //.without("id", "date_created", "date_updated", "creater", "updater")
                })
                .merge(function (m1) {
                    return r.db('g2g').table("contract").get(m1('contract_id')).pluck("contract_date", "contract_name", "buyer_id")
                    //.without("id", "date_created", "date_updated", "creater", "updater", "contract_type_rice")
                })
                .merge(function (me) {
                    return {
                        bl_detail: r.db('g2g').table('shipment_detail')
                            .getAll(me('book_id'), { index: 'book_id' })
                            .group(function (g) {
                                return g.pluck(
                                    "type_rice_id", "package_id"
                                )
                            })
                            .sum("shm_det_quantity")
                            .ungroup()
                            .merge(function (me2) {
                                return {
                                    type_rice_id: me2('group')('type_rice_id'),
                                    package_id: me2('group')('package_id'),
                                    quantity_tons: me2('reduction'),
                                    project_en: me('cl_type_rice')
                                        .filter(function (tb) {
                                            return tb('type_rice_id').eq(me2('group')('type_rice_id'))
                                        }).getField("project_en")(0),
                                    description_en: me('cl_type_rice')
                                        .filter(function (tb) {
                                            return tb('type_rice_id').eq(me2('group')('type_rice_id'))
                                        }).getField("description_en")(0),
                                    price_per_ton: me('cl_type_rice')
                                        .filter(function (tb) {
                                            return tb('type_rice_id').eq(me2('group')('type_rice_id'))
                                        }).getField("package")(0)
                                        .filter(function (f) {
                                            return f('package_id').eq(me2('group')('package_id'))
                                        })(0)
                                        .pluck('price_per_ton')
                                        .values()(0)
                                }
                            })
                            .without("group", "reduction")
                            .eqJoin("package_id", r.db('common').table("package")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
                            .merge(function (me2) {
                                return {
                                    quantity_bags: me2('quantity_tons').mul(1000).div(me2('package_kg_per_bag'))
                                }
                            })
                            .merge(function (me2) {
                                return {
                                    weight_gross: me2('quantity_bags').mul(me2('package_kg_per_bag').add(me2('package_weight_bag').div(1000))).div(1000),
                                    weight_net: me2('quantity_bags').mul(me2('package_kg_per_bag')).div(1000),
                                    weight_tare: me2('quantity_bags').mul(me2('package_weight_bag').div(1000)).div(1000)

                                }
                            })
                            .merge(function (me2) {
                                return {
                                    amount_usd: me2('price_per_ton').mul(me2('weight_net'))
                                }
                            })
                            .eqJoin("type_rice_id", r.db('common').table("type_rice")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
                            .merge(function (me2) {
                                return {
                                    invoice_of: me2('type_rice_name_en').add(", ")
                                        .add(me2('project_en')).add(" ")
                                        .add(me2('description_en')).add('')
                                }
                            })
                            .coerceTo('array')
                    }
                })
                .merge(function (me) {
                    return {
                        weight_gross: me('bl_detail').sum('weight_gross'),
                        weight_net: me('bl_detail').sum('weight_net'),
                        weight_tare: me('bl_detail').sum('weight_tare'),
                        amount_usd: me('bl_detail').sum('amount_usd'),
                        quantity_bags: me('bl_detail').sum('quantity_bags'),
                        cl_date: me('cl_date').split('T')(0),
                        contract_date: me('contract_date').split('T')(0),
                        ship: me('ship').map(function (arr_ship) {
                            return arr_ship.merge(function (row_ship) {
                                return r.db('common').table('ship').get(row_ship('ship_id')).without('id', 'date_created', 'date_updated', 'creater', 'updater')
                            }).merge(function (me2) {
                                return { ship_name: me2('ship_name').add(' V.').add(me2('ship_voy_no')) }
                            }).getField('ship_name')
                        }).reduce(function (l, r) {
                            return r.add("/ ").add(l)
                        })

                        ,
                        invoice_of: me('bl_detail').group(function (g) {
                            return g.pluck('invoice_of')
                        })
                            .ungroup()
                            .merge(function (me2) {
                                return {
                                    invoice_of: me2('group')('invoice_of')
                                }
                            }).without('group', 'reduction')
                            .getField('invoice_of')
                            .reduce(function (l, r) {
                                return r.add(" AND ").add(l)
                            })
                    }
                })
                .merge(function (m1) {
                    return r.db('common').table("buyer").get(m1('buyer_id'))
                        .merge(function (m2) {
                            return {
                                buyer_country_id: m2('country_id')
                            }
                        })
                        .pluck("buyer_country_id", "buyer_name", "buyer_address", "buyer_masks")
                })
                .merge(function (m1) {
                    return r.db('common').table("country").get(m1('buyer_country_id'))
                        .merge(function (country) {
                            return {
                                buyer_country_fullname_en: country("country_fullname_en"),
                                buyer_country_name_en: country("country_name_en"),
                                buyer_country_name_th: country("country_name_th")
                            }
                        })
                        .pluck("buyer_country_fullname_en", "buyer_country_name_en", "buyer_country_name_th")
                })
                .merge(function (m1) {
                    return r.db('common').table("port").get(m1('dest_port_id'))
                        .merge(function (port) {
                            return {
                                dest_port_name: port("port_name"),
                                dest_port_code: port("port_code"),
                                dest_country_id: port("country_id")
                            }
                        })
                        .pluck("dest_port_name", "dest_port_code", "dest_country_id")
                })
                .merge(function (m1) {
                    return r.db('common').table("port").get(m1('deli_port_id'))
                        .merge(function (port) {
                            return {
                                deli_port_name: port("port_name"),
                                deli_port_code: port("port_code"),
                                deli_country_id: port("country_id")
                            }
                        })
                        .pluck("deli_port_name", "deli_port_code", "deli_country_id")
                })
                .merge(function (m1) {
                    return r.db('common').table("port").get(m1('load_port_id'))
                        .merge(function (port) {
                            return {
                                load_port_name: port("port_name"),
                                load_port_code: port("port_code"),
                                load_country_id: port("country_id")
                            }
                        })
                        .pluck("load_port_name", "load_port_code", "load_country_id")
                })
                .merge(function (m1) {
                    return r.db('common').table("country").get(m1('dest_country_id'))
                        .merge(function (country) {
                            return {
                                dest_country_fullname_en: country("country_fullname_en"),
                                dest_country_name_en: country("country_name_en"),
                                dest_country_name_th: country("country_name_th")
                            }
                        })
                        .pluck("dest_country_fullname_en", "dest_country_name_en", "dest_country_name_th")
                })
                .merge(function (m1) {
                    return r.db('common').table("country").get(m1('deli_country_id'))
                        .merge(function (country) {
                            return {
                                deli_country_fullname_en: country("country_fullname_en"),
                                deli_country_name_en: country("country_name_en"),
                                deli_country_name_th: country("country_name_th")
                            }
                        })
                        .pluck("deli_country_fullname_en", "deli_country_name_en", "deli_country_name_th")
                })
                .merge(function (m1) {
                    return r.db('common').table("country").get(m1('load_country_id'))
                        .merge(function (country) {
                            return {
                                load_country_fullname_en: country("country_fullname_en"),
                                load_country_name_en: country("country_name_en"),
                                load_country_name_th: country("country_name_th")
                            }
                        })
                        .pluck("load_country_fullname_en", "load_country_name_en", "load_country_name_th")
                })
                .merge(function (m1) {
                    return r.db('common').table("shipline").get(m1('shipline_id')).pluck("shipline_name")
                    //.without("id", "date_created", "date_updated", "creater", "updater")
                })
                .merge(function (m1) {
                    return r.db('common').table("incoterms").get(m1('inct_id')).pluck("inct_name")
                    //.without("id", "date_created", "date_updated", "creater", "updater")
                })
            // (0)
        })
        .merge(function (m) {
            return {
                invoice_date: m('invoice_date').split('T')(0),
                invoice_id: m('id'),
                bl_detail: m('bl_detail').merge(function (m2) {
                    return {
                        buyer_masks: m('buyer_masks'),
                        inct_name: m('inct_name'),
                        contract_name: m('contract_name'),
                        contract_date: m('contract_date'),
                        buyer_name: m('buyer_name')
                    }
                })
            }
        })
        .without('id', 'cl_type_rice')
        .run()
        .then(function (result) {
            //res.json([result]);
            res._ireport("payment/report1.jasper", req.query.export || "pdf", [result], parameters);
        });


}
exports.report2 = function (req, res, next) {
    var r = req._r;
    var parameters = {
        CURRENT_DATE: new Date().toISOString().slice(0, 10),
        SUBREPORT_DIR: __dirname.replace('controller', 'report') + '\\' + req.baseUrl.replace("/api/", "") + '\\'
    };
    r.db('g2g').table('fee')
        .get(req.query.fee_id)
        .merge(function (fee_merge) {
            return {
                invoice: fee_merge('invoice').map(function (fee_map) {
                    return fee_map.merge(function (fee_merge1) {
                        return r.db('g2g').table('invoice')
                            .get(fee_merge1('invoice_id'))
                            .merge(function (m) {
                                return {
                                    shipment_detail: r.db('g2g').table('shipment_detail')
                                        .getAll(m('book_id'), { index: 'book_id' })
                                        .coerceTo('array')
                                        .pluck("id", "shm_id", "package_id", "exporter_id", "shm_det_quantity", "type_rice_id")
                                        .eqJoin("shm_id", r.db('g2g').table("shipment")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
                                        .eqJoin("cl_id", r.db('g2g').table("confirm_letter")).without({ right: ['id', 'date_created', 'date_updated', 'creater', 'updater', "cl_date", "cl_name", "cl_quality"] }).zip()
                                        .eqJoin("package_id", r.db('common').table("package")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
                                        .eqJoin("exporter_id", r.db('external_f3').table("exporter")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
                                        .eqJoin("trader_id", r.db('external_f3').table("trader")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
                                        .eqJoin("seller_id", r.db('external_f3').table("seller")).without({ right: ['id', 'date_created', 'date_updated', 'creater', 'updater', "country_id"] }).zip()
                                        .merge(function (m1) {
                                            return {
                                                shm_det_id: m1('id'),
                                                price_per_ton: m1('cl_type_rice')
                                                    .filter(function (tb) {
                                                        return tb('type_rice_id').eq(m1('type_rice_id'))
                                                    }).getField("package")(0)
                                                    .filter(function (f) {
                                                        return f('package_id').eq(m1('package_id'))
                                                    })(0)
                                                    .pluck('price_per_ton')
                                                    .values()(0),
                                                quantity_tons: m1('shm_det_quantity'),
                                                quantity_bags: m1('shm_det_quantity').mul(1000).div(m1('package_kg_per_bag'))

                                            }
                                        })
                                        .merge(function (m1) {
                                            return {
                                                weight_gross: m1('quantity_bags').mul(m1('package_kg_per_bag').add(m1('package_weight_bag').div(1000))).div(1000),
                                                weight_net: m1('quantity_bags').mul(m1('package_kg_per_bag')).div(1000),
                                                weight_tare: m1('quantity_bags').mul(m1('package_weight_bag').div(1000)).div(1000)
                                            }
                                        })
                                        .merge(function (m1) {
                                            return {
                                                amount_usd: m1('price_per_ton').mul(m1('weight_net'))
                                            }
                                        })
                                        .without('id', 'cl_type_rice', 'shm_det_quantity')
                                }
                            })
                            .merge(function (m) {
                                return r.db('g2g').table('book').get(m('book_id')).without('id', 'date_created', 'date_updated', 'creater', 'updater')
                            })
                            .merge(function (m) {
                                return {
                                    invoice_id: m('id'),
                                    // ship: m('group_ship')('ship')(0),
                                    // shipline_id: m('group_ship')('shipline_id')(0),
                                    // ship_lot_no: m('group_ship')('ship_lot_no')(0),
                                    //  ship_voy_no: m('group_ship')('ship_voy_no')(0),
                                    weight_gross: m('shipment_detail').sum('weight_gross'),
                                    weight_net: m('shipment_detail').sum('weight_net'),
                                    weight_tare: m('shipment_detail').sum('weight_tare'),
                                    amount_usd: m('shipment_detail').sum('amount_usd'),
                                    invoice_date: m('invoice_date').split('T')(0),
                                    invoice_detail: fee_merge1('invoice_detail').map(function (map1) {
                                        return m('shipment_detail').filter({ shm_det_id: map1('shm_det_id') })(0).merge(map1)
                                            .merge(function (m2) {
                                                return {
                                                    exporter_date_approve: m2('exporter_date_approve').split('T')(0),
                                                    exporter_date_update: m2('exporter_date_update').split('T')(0),
                                                    invoice_date: m2('invoice_date').split('T')(0),
                                                    trader_date_approve: m2('trader_date_approve').split('T')(0)
                                                }
                                            })
                                    })
                                }
                            })
                            .without("id", "shipment_detail")
                            .merge(function (m) {
                                return r.db('common').table("shipline").get(m('shipline_id')).without('id', 'date_created', 'date_updated', 'creater', 'updater')
                                // r.db('common').table("ship").get(m('ship_id')).without('id'),
                            })
                            .merge(function (m) {
                                return {
                                    ship: m('ship').map(function (arr_ship) {
                                        return arr_ship.merge(function (row_ship) {
                                            return r.db('common').table('ship').get(row_ship('ship_id')).without('id', 'date_created', 'date_updated', 'creater', 'updater')
                                        })
                                    })
                                }
                            })
                    })
                })
            }
        })
        .merge(function (fee_merge) {
            return {
                fee_id: fee_merge('id'),
                fee_date_receipt: fee_merge('fee_date_receipt').split('T')(0),
                amount_usd: fee_merge('invoice').sum('amount_usd'),
                weight_gross: fee_merge('invoice').sum('weight_gross'),
                weight_net: fee_merge('invoice').sum('weight_net'),
                weight_tare: fee_merge('invoice').sum('weight_tare')
            }
        })
        .without('id')
        .run()
        .then(function (result) {
            res.json(result)
        })
        .error(function (err) {
            res.json(err)
        })
}