// Constructor
function Timestamp() {
    // always initialize all instance properties
    this.created = new Date();
    this.updated = new Date();
}
// // class methods
Timestamp.prototype.create = function (obj) {
    return Object.assign(obj, this);
};
Timestamp.prototype.update = function (obj) {
    return Object.assign(obj, { updated: this.updated });
};
// export the class
module.exports = Timestamp;