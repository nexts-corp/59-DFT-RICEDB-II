var r = require('rethinkdb');
var db = require('../db.js');
// Constructor
function DataContext() {
    // always initialize all instance properties
    this.creater = 'admin';
    this.updater = 'admin';
    this.date_created = new Date();
    this.date_updated = new Date();
}
// // class methods

DataContext.prototype.insert = function (dbname, tbname, obj, res) {
    var result = { result: false, message: null, id: null };
    obj = Object.assign(obj, this);
    db.query(function (conn) {
        r.db(dbname).table(tbname)
            .insert(obj)
            .run(conn)
            .then(function (response) {
                result.message = response;
                if (response.errors == 0) {
                    result.result = true;
                    result.id = response.generated_keys;
                }
                res.json(result);
            })
            .error(function (err) {
                result.message = err;
                res.json(result);
            })
    })
};
DataContext.prototype.update = function (dbname, tbname, obj, res) {
    var result = { result: false, message: null, id: null };
    if (obj.id != '' && obj.id != null && typeof obj.id != 'undefined') {
        result.id = obj.id;
        obj = Object.assign(obj, { date_updated: this.date_updated, updater: 'admin' });
        db.query(function (conn) {
            r.db(dbname).table(tbname)
                .get(obj.id)
                .update(obj, { returnChanges: true })
                .run(conn)
                .then(function (response) {
                    result.message = response;
                    if (response.errors == 0) {
                        result.result = true;
                        var history = {
                            tb_name: tbname,
                            action: "update",
                            id_value: obj.id,
                            old_value: null,
                            new_value: obj,
                            date_created: new Date(),
                            actor: 'admin'
                        };
                        if (typeof response.changes !== 'undefined') {
                            // console.log(history.old_value);
                            history.old_value = response.changes[0].old_val;
                            //console.log(history.old_value);
                        }

                        r.db(dbname).table('history').insert(history).run(conn).then()
                    }
                    res.json(result);
                })
                .error(function (err) {
                    result.message = err;
                    res.json(result);
                })
        })
    } else {
        result.message = 'require field id';
        res.json(result);
    }
};
DataContext.prototype.delete = function (dbname, tbname, id, res) {
    var result = { result: false, message: null, id: null };
    if (id != '' || id != null) {
        result.id = id;
        db.query(function (conn) {
            r.db(dbname).table(tbname)
                .get(id)
                .delete({ returnChanges: true })
                .run(conn)
                .then(function (response) {
                    result.message = response;
                    if (response.errors == 0) {
                        result.result = true;
                        var history = {
                            tb_name: tbname,
                            action: "delete",
                            id_value: id,
                            old_value: response.changes[0].old_val,
                            new_value: null,
                            date_created: new Date(),
                            actor: 'admin'
                        }
                        r.db(dbname).table('history').insert(history).run(conn).then()
                    }
                    res.json(result);
                })
                .error(function (err) {
                    result.message = err;
                    res.json(result);
                })
        })
    } else {
        result.message = 'require field id';
        res.json(result);
    }
};
// export the class
module.exports = DataContext;