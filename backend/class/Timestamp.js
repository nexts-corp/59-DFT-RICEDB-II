// Constructor
function Timestamp() {
    // always initialize all instance properties
    this.date_created = new Date();
    this.date_updated = new Date();
}
// // class methods
Timestamp.prototype.insert = function (obj) {
    return Object.assign(obj, this);
};
Timestamp.prototype.update = function (obj) {
    return Object.assign(obj, { date_updated: this.date_updated });
};
// export the class
module.exports = Timestamp;