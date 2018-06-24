/**
 * Created by Jerome on 09-10-17.
 */
var GameObject = require('./GameObject.js').GameObject;
var GameServer = require('./GameServer.js').GameServer;
var Utils = require('../shared/Utils.js').Utils;
var PFUtils = require('../shared/PFUtils.js').PFUtils;

function MovingEntity(){
    this.moving = false;
}

MovingEntity.prototype = Object.create(GameObject.prototype);
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
        if(this.path.length <= 1) return;
        this.path.shift(); // Position 0 after the shift is where the entity is supposed to be at this time
        var x = this.path[0][0];
        var y = this.path[0][1];
        this.updatePosition(x,y);

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
    if(!this.inFight) GameServer.checkForBattle(this);
};

MovingEntity.prototype.endPath = function(){
    if(this.flagToStop) this.setProperty('stop',{x:this.x,y:this.y});
    this.moving = false;
    this.flagToStop = false;
    this.path = null;
    this.onEndOfPath();
};

MovingEntity.prototype.onEndOfPath = function(){
    GameServer.checkForBattle(this); // Check if the entity has stepped inside a battle area
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
    return this.path.length*(1000/PFUtils.speed);
};

MovingEntity.prototype.stopWalk = function(){
    if(!this.moving) return;
    this.flagToStop = true;
};

// ### Equipment ###


// ### Stats ###

MovingEntity.prototype.applyDamage = function(dmg){
    this.getStat('hp').increment(dmg);
};

MovingEntity.prototype.getHealth = function(){
    return this.getStat('hp').getValue();
};

MovingEntity.prototype.getStat = function(key){
    return this.stats[key];
};

MovingEntity.prototype.getStats = function(){
    return Object.keys(this.stats);
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

MovingEntity.prototype.isInFight = function(){
    return this.inFight;
};

MovingEntity.prototype.isMoving = function(){
    return this.moving;
};

MovingEntity.prototype.isSameTeam = function(f){
    return this.battleTeam == f.battleTeam;
};

MovingEntity.prototype.canFight = function(){
    return true;
};

MovingEntity.prototype.endFight = function(){
    this.setProperty('inFight',false);
    this.battle = null;
};



module.exports.MovingEntity = MovingEntity;