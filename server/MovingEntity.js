/**
 * Created by Jerome on 09-10-17.
 */
import FightingEntity from './FightingEntity'
import GameServer from './GameServer'
import PFUtils from '../shared/PFUtils'
import {SpaceMap} from "../shared/SpaceMap";
import Utils from '../shared/Utils'

function MovingEntity(){
    FightingEntity.call(this);
    this.isMovingEntity = true;
    this.moving = false;
    this.xoffset = 0;
    this.chatTimer = null;
}

MovingEntity.prototype = Object.create(FightingEntity.prototype);
MovingEntity.prototype.constructor = MovingEntity;

// ### Movement ###

MovingEntity.prototype.setFieldOfVision = function(aois){
    this.fieldOfVision = aois;
};

MovingEntity.prototype.setPath = function(path){
    this.setProperty('path',path);
    this.updatePathTick();
    this.moving = true;
};

MovingEntity.prototype.updatePathTick = function(){ // Compute in how many seconds will the entity have moved by one tile
    if(this.path.length <= 1){
        this.endPath();
        return;
    }
    var duration = PFUtils.getDuration(
            this.x,
            this.y,
            this.path[1][0],
            this.path[1][1]
        )*1000;
    this.nextPathTick = Date.now() + duration;
};

MovingEntity.prototype.updateWalk = function(){
    // At any given time, entity is in the process of moving from the 0th index to the 1st in the path array
    if(this.moving && Date.now() >= this.nextPathTick){
        if(!this.path || this.path.length <= 1) return;
        this.path.shift(); // Position 0 after the shift is where the entity is supposed to be at this time
        var x = this.path[0][0];
        var y = this.path[0][1];
        this.updatePosition(x,y);

        if(this.updateSteps) this.updateSteps();

        if(this.path.length > 1 && !this.flagToStop) {
            this.updatePathTick();
        }else{
            this.endPath();
        }
    }
};

MovingEntity.prototype.updatePosition = function(x,y){
    this.x = x;
    this.y = y;
    this.setOrUpdateAOI();
    if(!this.inFight) this.checkForBattle();
};

MovingEntity.prototype.endPath = function(){
    if(this.flagToStop) this.setProperty('stop',{x:this.x,y:this.y});
    this.moving = false;
    this.flagToStop = false;
    this.path = null;
    this.onEndOfPath();
};

MovingEntity.prototype.onEndOfPath = function(){
    this.checkForBattle();// Check if the entity has stepped inside a battle area
};

MovingEntity.prototype.getEndOfPath = function(){
    if(this.path && this.path.length) {
        return {
            x: this.path[this.path.length - 1][0],
            y: this.path[this.path.length - 1][1]
        };
    }else{
        return {
            x: this.x,
            y: this.y
        }
    }
};

MovingEntity.prototype.getPathDuration = function(){
    return (this.path ? this.path.length*(1000/PFUtils.speed) : 0);
};

MovingEntity.prototype.stopWalk = function(){
    if(!this.moving) return;
    this.flagToStop = true;
};

MovingEntity.prototype.getBattleAreaAround = function(){
    var cells = new SpaceMap();
    for(var x = this.x - 1; x <= this.x + this.cellsWidth; x++){ // <= since we want the cells all around
        for(var y = this.y - 1; y <= this.y + this.cellsHeight; y++) {
            if(!GameServer.checkCollision(x,y)) cells.add(x,y);
        }
    }
    return cells;
};

// Check if the entity has stepped inside a battle area
MovingEntity.prototype.checkForBattle = function(){
    if(!this.isAvailableForFight() || this.isInFight()) return;
    for(var x = this.x; x < this.x + this.cellsWidth; x++){
        for(var y = this.y; y < this.y + this.cellsHeight; y++) {
            var cell = GameServer.battleCells.get(x,y);
            if(cell) GameServer.expandBattle(cell.battle,this);
        }
    }
};

// Where to target projectiles at
MovingEntity.prototype.getTargetCenter = function(){
    return {
        x: this.x + this.cellsWidth / 2,
        y: this.y + this.cellsHeight / 2 // - instead?
    };
};

// Central tile for pathfinding and such
MovingEntity.prototype.getLocationCenter = function(){
    return {
        x: Math.floor(this.x + this.cellsWidth / 2),
        y: Math.floor(this.y + this.cellsHeight / 2)
    };
};

MovingEntity.prototype.setChat = function(text){
    if(this.chatTimer) clearTimeout(this.chatTimer);
    this.setProperty('chat',text);
    var _entity = this;
    this.chatTimer = setTimeout(function(){
        _entity.chat = undefined;
    },GameServer.clientParameters.config.chatTimeout);
};

// ### Battle ###

MovingEntity.prototype.inBattleRange = function(x,y){
    var dist = Utils.euclidean({
        x: this.x,
        y: this.y
    },{
        x: x,
        y: y
    });
    return dist <= GameServer.PFParameters.battleRange;
};

// ### Status ###

MovingEntity.prototype.die = function(){
    this.setProperty('dead',true);
};

MovingEntity.prototype.isDead = function(){
    return this.dead;
};

MovingEntity.prototype.isMoving = function(){
    return this.moving;
};

MovingEntity.prototype.canFight = function(){
    return true;
};

/**
 * Return an object containing all the information about the item
 * equipped in a given slot.
 * @param {string} slot - name of the slot where the item of
 * interest is equiped.
 * @returns {Object} - Object containging data about item.
 */
MovingEntity.prototype.getEquippedItem = function (slot) {
    return this.equipment.getItem(slot);
};

/**
 * Returns the item ID of the item equipped at the given slot
 * @param {string} slot - name of the slot where the item of
 * @returns {number} - item ID of equipped item or -1 if nothing equipped
 */
MovingEntity.prototype.getEquippedItemID = function (slot) {
    return this.equipment.get(slot);
};

MovingEntity.prototype.getRangedContainer = function () {
    return this.getEquippedItem('range_container');
};

MovingEntity.prototype.canRange = function () {

    const weaponID = this.getEquippedItemID('rangedw');
    if (weaponID === -1) {
        if(this.isPlayer) {
            this.addMsg('I don\'t have a ranged weapon equipped!');
            this.setOwnProperty('resetTurn', true);
        }
        console.warn('no rangedw');
        return false;
    }
    var weapon = this.getEquippedItem('rangedw');

    const container = this.getRangedContainer();
    if (container === false || container === -1) {
        if(this.isPlayer) {
            this.addMsg('I don\'t have ammo!');
            this.setOwnProperty('resetTurn', true);
        }
        console.warn('no container');
        return false;
    }

    const hasAmmo = this.equipment.hasAnyAmmo();
    if (!hasAmmo) {
        if(this.isPlayer) {
            this.addMsg('I\'m out of ammo!');
            this.setOwnProperty('resetTurn', true);
        }
        console.warn('no ammo');
        return false;
    }

    if (weapon.ammo !== this.equipment.getAmmoContainerType()) {
        if(this.isPlayer) {
            this.addMsg('I can\'t use my weapon with that ammo');
            this.setOwnProperty('resetTurn', true);
        }
        console.warn('wrong ammo');
        return false;
    }

    if (hasAmmo) {
        return true;
    }

};

MovingEntity.prototype.decreaseAmmo = function () {
    var ammoID = this.equipment.get('range_ammo');
    this.equipment.load(-1);
    if(this.isPlayer) {
        var nb = this.equipment.getNbAmmo();
        if (nb === 0) this.unequip('range_ammo', true);
        this.updatePacket.addAmmo(nb);
    }
    return ammoID;
};

MovingEntity.prototype.getShootingPoint = function () {
    return {
        x: this.x + 1,
        y: this.y + 1
    };
};

MovingEntity.prototype.getRect = function(){
    return {
        x: this.x,
        y: this.y,
        w: this.cellsWidth,
        h: this.cellsHeight
    }
};

MovingEntity.prototype.remove = function(){
    if(this.battle) this.battle.removeFighter(this);
};

export default MovingEntity