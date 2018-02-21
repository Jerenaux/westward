/**
 * Created by Jerome on 09-10-17.
 */
var GameObject = require('./GameObject.js').GameObject;
var GameServer = require('./GameServer.js').GameServer;
var Utils = require('../shared/Utils.js').Utils;
var PFUtils = require('../shared/PFUtils.js').PFUtils;

var debug = false;

function MovingEntity(){
    this.moving = false;
}

MovingEntity.prototype = Object.create(GameObject.prototype);
MovingEntity.prototype.constructor = MovingEntity;

MovingEntity.prototype.setPath = function(path){
    //console.log('['+this.constructor.name+' '+this.id+'] moving to path');
    this.setProperty('path',path);
    this.updatePathTick();
    this.moving = true;
};

MovingEntity.prototype.updatePathTick = function(){ // Compute in how many seconds will the entity have moved by one tile
    if(this.path.length <= 1){
        console.log('['+this.constructor.name+' '+this.id+'] ERROR: Path too short (length = '+this.path.length+')');
        this.endPath();
        return;
    }
    var duration = PFUtils.getDuration(
            this.x,
            this.y,
            this.path[1][0],
            this.path[1][1]
        )*1000;
    if(debug && duration < 200) console.log('['+this.constructor.name+' '+this.id+'] Next tick in '+duration+' ms');
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
    if(debug) console.log('['+this.constructor.name+' '+this.id+'] Arrived at destination');
    //if(this.flagToStop) this.setProperty('stop',{x:this.x,y:this.y});
    this.moving = false;
    this.flagToStop = false;
    this.onEndOfPath();
};

MovingEntity.prototype.onEndOfPath = function(){
    GameServer.checkForBattle(this);
};

MovingEntity.prototype.getEndOfPath = function(){
    if(this.path) {
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

MovingEntity.prototype.die = function(){
    this.setProperty('dead',true);
    if(this.isPlayer) this.updatePacket.dead = true;
};

MovingEntity.prototype.endFight = function(){
    this.setProperty('inFight',false);
    this.battle = null;
};

MovingEntity.prototype.getStat = function(key){
    return this.stats[key];
};

MovingEntity.prototype.getHealth = function(){
    return this.getStat('hp').getValue();
};

MovingEntity.prototype.applyDamage = function(dmg){
    this.getStat('hp').increment(dmg);
};

MovingEntity.prototype.inBattleRange = function(x,y){
    var dist = Utils.euclidean({
        x: this.x,
        y: this.y
    },{
        x: x,
        y: y
    });
    return dist <= PFUtils.battleRange;
};

module.exports.MovingEntity = MovingEntity;