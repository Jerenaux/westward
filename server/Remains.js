function Remains(x, y) {
    this.instance = -1;
    this.updateCategory = 'remains';
    this.entityCategory = 'Remains';
    this.id = GameServer.lastRemainsID++;
    this.x = x;
    this.y = y;
    this.cellsWidth = 1;
    this.cellsHeight = 1;
    this.setOrUpdateAOI();
}

Remains.prototype = Object.create(GameObject.prototype);
Remains.prototype.constructor = Remains;

Remains.prototype.getRect = function () {
    return {
        x: this.x,
        y: this.y,
        w: 1,
        h: 1
    }
};

// Remains.prototype.getShortID = function () {
//     return 'btl' + this.id;
// };

Remains.prototype.trim = function () {
    return {
        id: this.id,
        x: this.x,
        y: this.y,
        instance: this.instance
    };
};

Remains.prototype.getLocationCenter = function () {
    return {
        x: this.x,
        y: this.y
    };
};

Remains.prototype.remove = function () {};

Remains.prototype.canFight = function () {
    return false;
};
Remains.prototype.isAvailableForFight = function () {
    return false;
};

export default Remains