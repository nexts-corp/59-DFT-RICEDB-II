exports.index = function (req, res, next) {
    var r = req._r;

    var parameters = {
        department: "2559"
    };

    r.db('g2g').table('invoice')
        .get(req.query.invoice_id)
        .merge(function (m) {
            return r.db('g2g').table('shipment_detail')
                .filter({ bl_no: m('bl_no') })
                .group(function (g) {
                    return g.pluck(
                        "ship", "load_port_id", "dest_port_id", "deli_port_id",
                        "bl_no", "book_no", "shm_id", "surveyor_id", "ship_lot_no", "carrier_id", "shipline_id",
                        "etd_date", "eta_date", "num_of_container", "weight_per_container", "packing_date", "cut_of_date", "cut_of_time", "product_date"
                    )
                })
                .sum("shm_det_quantity")
                .ungroup()
                .merge(function (me) {
                    return {
                        shm_id: me('group')('shm_id'),
                        bl_no: me('group')('bl_no'),
                        book_no: me('group')('book_no'),
                        ship: me('group')('ship'),
                        load_port_id: me('group')('load_port_id'),
                        dest_port_id: me('group')('dest_port_id'),
                        deli_port_id: me('group')('deli_port_id'),
                        surveyor_id: me('group')('surveyor_id'),
                        ship_lot_no: me('group')('ship_lot_no'),
                        carrier_id: me('group')('carrier_id'),
                        shipline_id: me('group')('shipline_id'),
                        etd_date: me('group')('etd_date'),
                        eta_date: me('group')('eta_date'),
                        num_of_container: me('group')('num_of_container'),
                        weight_per_container: me('group')('weight_per_container'),
                        packing_date: me('group')('packing_date'),
                        cut_of_date: me('group')('cut_of_date'),
                        cut_of_time: me('group')('cut_of_time'),
                        product_date: me('group')('product_date'),
                        quantity: me('reduction')
                    }
                })
                .without("group", "reduction")
                .eqJoin("shm_id", r.db('g2g').table("shipment")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
                .eqJoin("cl_id", r.db('g2g').table("confirm_letter")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
                .eqJoin("contract_id", r.db('g2g').table("contract")).without({ right: ["id", "date_created", "date_updated", "contract_type_rice"] }).zip()
                .merge(function (me) {
                    return {
                        bl_detail: r.db('g2g').table('shipment_detail')
                            .filter({ bl_no: me('bl_no') })
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
                                    season_en: me('cl_type_rice')
                                        .filter(function (tb) {
                                            return tb('type_rice_id').eq(me2('group')('type_rice_id'))
                                        }).getField("season_en")(0),
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
                                        .add(me2('season_en')).add(", ")
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
                .eqJoin("buyer_id", r.db('common').table("buyer")).map(function (buyer) {
                    return buyer.merge({
                        right: {
                            buyer_country_id: buyer("right")("country_id")
                        }
                    })
                }).without({ right: ["id", "date_created", "date_updated", "country_id"] }).zip()
                .eqJoin("buyer_country_id", r.db('common').table("country")).map(function (country) {
                    return country.merge({
                        right: {
                            buyer_country_fullname_en: country("right")("country_fullname_en"),
                            buyer_country_name_en: country("right")("country_name_en"),
                            buyer_country_name_th: country("right")("country_name_th")
                        }
                    })
                }).without({ right: ["id", "date_created", "date_updated", "country_fullname_en", "country_name_en", "country_name_th", "country_id"] }).zip()
                .eqJoin("dest_port_id", r.db('common').table("port")).map(function (port) {
                    return port.merge({
                        right: {
                            dest_port_name: port("right")("port_name"),//r.row["right"]["port_name"]
                            dest_port_code: port("right")("port_code"),
                            dest_country_id: port("right")("country_id")
                        }
                    })
                }).without({ right: ["id", "date_created", "date_updated", "port_name", "port_code", "country_id"] }).zip()
                .eqJoin("deli_port_id", r.db('common').table("port")).map(function (port) {
                    return port.merge({
                        right: {
                            deli_port_name: port("right")("port_name"),//r.row["right"]["port_name"]
                            deli_port_code: port("right")("port_code"),
                            deli_country_id: port("right")("country_id")
                        }
                    })
                }).without({ right: ["id", "date_created", "date_updated", "port_name", "port_code", "country_id"] }).zip()
                .eqJoin("load_port_id", r.db('common').table("port")).map(function (port) {
                    return port.merge({
                        right: {
                            load_port_name: port("right")("port_name"),//r.row["right"]["port_name"]
                            load_port_code: port("right")("port_code"),
                            load_country_id: port("right")("country_id")
                        }
                    })
                }).without({ right: ["id", "date_created", "date_updated", "port_name", "port_code", "country_id"] }).zip()
                .eqJoin("dest_country_id", r.db('common').table("country")).map(function (dest) {
                    return dest.merge({
                        right: {
                            dest_country_fullname_en: dest("right")("country_fullname_en"),
                            dest_country_name_en: dest("right")("country_name_en"),
                            dest_country_name_th: dest("right")("country_name_th")
                        }
                    })
                }).without({ right: ["id", "date_created", "date_updated", "country_fullname_en", "country_name_en", "country_name_th", "country_id"] }).zip()
                .eqJoin("deli_country_id", r.db('common').table("country")).map(function (deli) {
                    return deli.merge({
                        right: {
                            deli_country_fullname_en: deli("right")("country_fullname_en"),
                            deli_country_name_en: deli("right")("country_name_en"),
                            deli_country_name_th: deli("right")("country_name_th")
                        }
                    })
                }).without({ right: ["id", "date_created", "date_updated", "country_fullname_en", "country_name_en", "country_name_th", "country_id"] }).zip()
                .eqJoin("load_country_id", r.db('common').table("country")).map(function (load) {
                    return load.merge({
                        right: {
                            load_country_fullname_en: load("right")("country_fullname_en"),
                            load_country_name_en: load("right")("country_name_en"),
                            load_country_name_th: load("right")("country_name_th")
                        }
                    })
                }).without({ right: ["id", "date_created", "date_updated", "country_fullname_en", "country_name_en", "country_name_th", "country_id"] }).zip()
                //.eqJoin("ship_id", r.db('common').table("ship")).without({ right: ["id", "date_created", "date_updated","creater","updater"] }).zip()
                .eqJoin("shipline_id", r.db('common').table("shipline")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
                .eqJoin("inct_id", r.db('common').table("incoterms")).without({ right: ["id", "date_created", "date_updated", "creater", "updater"] }).zip()
                (0)
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
            res._ireport("report4.jasper", "pdf", [result], parameters);
        });
}
