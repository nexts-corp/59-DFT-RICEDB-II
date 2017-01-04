exports.index = function (req, res, next) {
    var r = req._r;

    var parameters = {
        department: "2559"
    };

    r.db('g2g').table('shipment')
        .get(req.query.shm_id)
        .merge(function (row) {
            return r.db('g2g').table('confirm_letter').get(row('cl_id')).pluck('cl_type_rice', 'inct_id')
        })
        .merge(function (row) {
            return r.db('common').table('incoterms').get(row('inct_id')).pluck('inct_name')
        })
        .merge(function (row) {
            return r.db('g2g').table('contract').get(row('contract_id')).pluck('buyer_id', 'contract_date')
        })
        .merge(function (row) {
            return r.db('common').table('buyer').get(row('buyer_id')).without('id', 'date_created', 'date_updated', 'creater', 'updater')
        })
        .merge(function (row) {
            return r.db('common').table('country').get(row('country_id')).without('id', 'date_created', 'date_updated', 'creater', 'updater')
        })
        .merge(function (row) {
            return {
                shm_id: row('id'),
                contract_year: row('contract_date').split('T')(0).split('-')(0).coerceTo('number').add(543),
                shipment_detail: r.db('g2g').table("shipment_detail").filter({ "shm_id": row('id') })
                    .group(function (g) {
                        return g.pluck(
                            'ship_lot_no', 'load_port_id', 'shipline_id', 'surveyor_id', 'book_no',
                            'dest_port_id', 'deli_port_id', 'product_date', 'cut_of_date', 'cut_of_time'
                        )
                    }).ungroup()
                    .merge(function (m) {
                        return {
                            ship_lot_no: m('group')('ship_lot_no'),
                            load_port_id: m('group')('load_port_id'),
                            shipline_id: m('group')('shipline_id'),
                            surveyor_id: m('group')('surveyor_id'),
                            book_no: m('group')('book_no'),
                            dest_port_id: m('group')('dest_port_id'),
                            deli_port_id: m('group')('deli_port_id'),
                            product_date: m('group')('product_date'),
                            cut_of_date: m('group')('cut_of_date'),
                            cut_of_time: m('group')('cut_of_time')
                        }
                    })
                    .without("group", "reduction")
                    .merge(function (m) {
                        return {
                            ship: r.db('g2g').table('shipment_detail')
                                .filter({
                                    shm_id: row('id'),
                                    ship_lot_no: m('ship_lot_no')
                                })
                                .coerceTo('array')
                                .getField('ship')
                                .group(function (g1) {
                                    return g1.pluck("ship_id", "ship_voy_no")
                                }).ungroup()
                                .without("reduction").getField('group')(0)
                                .merge(function (m1) {
                                    return r.db('common').table('ship').get(m1('ship_id')).pluck('ship_name')
                                }).without('ship_id')
                                .map(function (m1) {
                                    return m1('ship_name').add(" V.").add(m1('ship_voy_no'))
                                })
                                .reduce(function (l, r) {
                                    return r.add("/ ").add(l)
                                })
                            ,
                            type_rice: r.db('g2g').table('shipment_detail')
                                .filter({
                                    shm_id: row('id'),
                                    ship_lot_no: m('ship_lot_no')
                                })
                                .coerceTo('array')
                                .pluck(
                                'type_rice_id', 'package_id', 'weight_per_container', 'num_of_container', 'shm_det_quantity'
                                )
                                .group(function (g1) {
                                    return g1.pluck('type_rice_id', 'package_id', 'weight_per_container', 'num_of_container')
                                })
                                .sum("shm_det_quantity").ungroup()
                                .merge(function (m1) {
                                    return {
                                        type_rice_id: m1('group')('type_rice_id'),
                                        package_id: m1('group')('package_id'),
                                        weight_per_container: m1('group')('weight_per_container'),
                                        inct_id: row('inct_id'),
                                        num_of_container: m1('group')('num_of_container'),
                                        project_th: row('cl_type_rice')
                                            .filter(function (tb) {
                                                return tb('type_rice_id').eq(m1('group')('type_rice_id'))
                                            }).getField("project_th")(0),
                                        season_th: row('cl_type_rice')
                                            .filter(function (tb) {
                                                return tb('type_rice_id').eq(m1('group')('type_rice_id'))
                                            }).getField("season_th")(0),
                                        description_th: row('cl_type_rice')
                                            .filter(function (tb) {
                                                return tb('type_rice_id').eq(m1('group')('type_rice_id'))
                                            }).getField("description_th")(0),
                                        weight_net: m1('reduction'),
                                        price_per_ton: row('cl_type_rice')
                                            .filter(function (tb) {
                                                return tb('type_rice_id').eq(m1('group')('type_rice_id'))
                                            }).getField("package")(0)
                                            .filter(function (f) {
                                                return f('package_id').eq(m1('group')('package_id'))
                                            })(0)
                                            .pluck('price_per_ton')
                                            .values()(0),

                                    }
                                }).without('group', 'reduction')
                                .merge(function (m1) {
                                    return r.db('common').table('type_rice').get(m1('type_rice_id')).pluck('type_rice_name_th')
                                })
                                .merge(function (m1) {
                                    return r.db('common').table('package').get(m1('package_id')).pluck('package_name_th', 'package_name_en', 'package_weight_bag')
                                })
                            ,
                            exporter: r.db('g2g').table('shipment_detail')
                                .filter({
                                    shm_id: row('id'),
                                    ship_lot_no: m('ship_lot_no')
                                })
                                .coerceTo('array')
                                .pluck('exporter_id')
                                .group(function (g1) {
                                    return g1.pluck('exporter_id')
                                }).ungroup()
                                .merge(function (m1) {
                                    return {
                                        exporter_id: m1('group')('exporter_id')
                                    }
                                }).without('group', 'reduction')
                                .getField('exporter_id')
                                .map(function (m1) {
                                    return r.db('external_f3').table('exporter').get(m1).getField('trader_id')
                                        .do(function (d1) {
                                            return r.db('external_f3').table('trader').get(d1).getField('seller_id')
                                                .do(function (d2) {
                                                    return r.db('external_f3').table('seller').get(d2).getField('seller_name_th')
                                                })
                                        })
                                })
                                .reduce(function (l, r) {
                                    return r.add("/ ").add(l)
                                })
                            ,
                        }
                    })
                    .merge(function (m) {
                        return {
                            notify_name: r.db('common').table('notify_party').filter({
                                port_id: m('deli_port_id'),
                                buyer_id: row('buyer_id')
                            }).getField('notify_name')(0),
                            notify_address: r.db('common').table('notify_party').filter({
                                port_id: m('deli_port_id'),
                                buyer_id: row('buyer_id')
                            }).getField('notify_address')(0),
                            notify_tel: r.db('common').table('notify_party').filter({
                                port_id: m('deli_port_id'),
                                buyer_id: row('buyer_id')
                            }).getField('notify_tel')(0),
                            notify_fax: r.db('common').table('notify_party').filter({
                                port_id: m('deli_port_id'),
                                buyer_id: row('buyer_id')
                            }).getField('notify_fax')(0)
                        }
                    })
                    .merge(function (m) {
                        return {
                            shipline_name: r.db('common').table('shipline').get(m('shipline_id')).getField('shipline_name'),
                            shipline_tel: r.db('common').table('shipline').get(m('shipline_id')).getField('shipline_tel'),
                            deli_port_name: r.db('common').table('port').get(m('deli_port_id')).getField('port_name'),
                            dest_port_name: r.db('common').table('port').get(m('dest_port_id')).getField('port_name'),
                            load_port_name: r.db('common').table('port').get(m('load_port_id')).getField('port_name'),
                            surveyor_name: r.db('common').table('surveyor').get(m('surveyor_id')).getField('surveyor_name'),
                            product_date: m('product_date').split('T')(0),
                            cut_of_date: m('cut_of_date').split('T')(0)
                        }
                    })
                    .coerceTo('array')
            }
        })
        .without('id', 'contract_date', 'cl_type_rice', 'date_created', 'date_updated', 'creater', 'updater')
        .merge(function (row) {
            return {
                Lists: row('shipment_detail').merge(function (m) {
                    return row.without('shipment_detail')
                })
            }
        }).getField('Lists')
        .run()
        .then(function (result) {
            //res.json(result);
            res._ireport("report1.jasper", "pdf", result, parameters);
        });
}
