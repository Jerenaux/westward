
function BattleCell(x, y, battle) {
    this.instance = -1;
    this.updateCategory = 'cells';
    this.entityCategory = 'Cell';
    this.id = GameServer.lastCellID++;
    this.x = x;
    this.y = y;
    this.cellsWidth = 1;
    this.cellsHeight = 1;
    this.battle = battle;
    this.setOrUpdateAOI();
}

BattleCell.prototype = Object.create(GameObject.prototype);
BattleCell.prototype.constructor = BattleCell;

BattleCell.prototype.getRect = function () {
    return {
        x: this.x,
        y: this.y,
        w: 1,
        h: 1
    }
};

BattleCell.prototype.getShortID = function () {
    return 'btl' + this.id;
};

BattleCell.prototype.trim = function () {
    return {
        id: this.id,
        x: this.x,
        y: this.y,
        instance: this.instance
    };
};

BattleCell.prototype.getBattleAreaAround = function (cells) {
    cells = cells || new SpaceMap();
    for (var x = this.x - 1; x <= this.x + this.w; x++) {
        for (var y = this.y - 1; y <= this.y + this.h; y++) {
            if (!GameServer.checkCollision(x, y)) cells.add(x, y);
        }
    }
    return cells;
};

BattleCell.prototype.getLocationCenter = function () {
    return {
        x: this.x,
        y: this.y
    };
};

BattleCell.prototype.remove = function () {};

BattleCell.prototype.canFight = function () {
    return false;
};
BattleCell.prototype.isAvailableForFight = function () {
    return false;
};

export default BattleCell