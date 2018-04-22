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
    this.actionQueue = [];
}

MovingEntity.prototype = Object.create(GameObject.prototype);
MovingEntity.prototype.constructor = MovingEntity;

MovingEntity.prototype.setPath = function(path){
    this.setProperty('path',path);
    this.updatePathTick();
    this.moving = true;
};

MovingEntity.prototype.updatePathTick = function(){ // Compute in how many seconds will the entity have moved by one tile
    if(this.path.length <= 1){
        //console.log('['+this.constructor.name+' '+this.id+'] ERROR: Path too short (length = '+this.path.length+')');
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
    if(this.isPlayer) console.log('Position:',this.x,',',this.y);
    this.setOrUpdateAOI();
    if(!this.inFight) GameServer.checkForBattle(this);
};

MovingEntity.prototype.endPath = function(){
    if(debug) console.log('['+this.constructor.name+' '+this.id+'] Arrived at destination');
    if(this.flagToStop) this.setProperty('stop',{x:this.x,y:this.y});
    this.moving = false;
    this.flagToStop = false;
    this.onEndOfPath();
    this.checkForHostiles(this);
};

MovingEntity.prototype.onEndOfPath = function(){
    GameServer.checkForBattle(this);
};

MovingEntity.prototype.getEndOfTile = function(){
    if(this.path) {
        return {
            x: this.path[0][0],
            y: this.path[0][1]
        };
    }else{
        return {
            x: this.x,
            y: this.y
        }
    }
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
    return this.isPlayer == f.isPlayer;
};

MovingEntity.prototype.canFight = function(){
    return true;
};

MovingEntity.prototype.endFight = function(){
    this.setProperty('inFight',false);
    this.battle = null;
};

MovingEntity.prototype.getStats = function(){
    return Object.keys(this.stats);
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

MovingEntity.prototype.queueAction = function(action){
    this.actionQueue.push(action);
};

MovingEntity.prototype.decideBattleAction = function(){
    if(!this.inFight) return;
    var action = this.actionQueue.shift();
    if(!action) action = 'attack';
    if(!this.target || !this.target.isInFight()) this.target = this.selectTarget();
    var data;
    switch(action){
        case 'attack':
            data = this.attackTarget();
            break;
        case 'move':
            data = this.findFreeCell();
            if(data.action == 'pass') this.queueAction('move');
            break;
    }
    this.battle.processAction(this,data);
};

MovingEntity.prototype.findFreeCell = function(){
    var pos = {x:this.x,y:this.y};
    var list = this.battle.getCells(); //{x,y,v} objects
    list.sort(function(a,b){
        if(Utils.manhattan(a,pos) < Utils.manhattan(b,pos)) return -1;
        return 1;
    });
    for(var i = 0; i < list.length; i++){
        var cell = list[i];
        if(this.battle.isPositionFree(cell.x,cell.y)) return this.findBattlePath(cell);
    }
    return {
        action: 'pass'
    };
};

MovingEntity.prototype.findBattlePath = function(dest){
    var data = {};
    var path = GameServer.findPath({x: this.x, y: this.y}, dest,this.battle.PFgrid);
    if(path.length > 0){
        this.setPath(path);
        data.action = 'move';
    }else{
        console.log('Combat path of length 0');
        data.action = 'pass';
    }
    return data;
};

MovingEntity.prototype.attackTarget = function(){
    var data = {};
    if(this.battle.nextTo(this,this.target)){
        data.action = 'attack';
        data.id = this.target.getShortID();
    }else{
        var dest = this.computeBattleDestination(this.target);
        if(dest) {
            data = this.findBattlePath(dest);
        }else{
            data.action = 'pass';
        }
    }
    return data;
};

MovingEntity.prototype.selectTarget = function(){
    var fighters = this.battle.fighters;
    var minHP = 9999;
    var currentTarget = null;
    for(var i = 0; i < fighters.length; i++){
        var f = fighters[i];
        //if(!f.isPlayer) continue;
        if(this.isSameTeam(f)) continue;
        if(f.getHealth() < minHP){
            minHP = f.getHealth();
            currentTarget = f;
        }
    }
    //console.log('Selected target ',currentTarget.getShortID());
    return currentTarget;
};

MovingEntity.prototype.computeBattleDestination = function(target){
    var dest = target.getEndOfPath();
    var closest = null;
    var minDist = 9999;
    //console.log('target : ',dest.x,dest.y);
    for(var x = Math.min(this.x,dest.x-1); x <= Math.max(this.x,dest.x+1); x++){
        for(var y = Math.min(this.y,dest.y-1); y <= Math.max(this.y,dest.y+1); y++) {
            if(x == dest.x && y == dest.y) continue;
            if(!this.battle.isPosition(x,y)) continue;
            if(!this.battle.isPositionFree(x,y)) continue;
            if(PFUtils.checkCollision(x,y)) continue;
            if(!this.inBattleRange(x,y)) continue;

            if(this.battle.nextTo({x:x,y:y},dest)) return {x:x,y:y};

            var dist = Utils.euclidean({x:x,y:y},{x:dest.x,y:dest.y});
            if(dist < minDist){
                minDist = dist;
                closest = {x:x,y:y};
            }
        }
    }
    if(closest == null) console.log('not found');
    return closest;
};


module.exports.MovingEntity = MovingEntity;