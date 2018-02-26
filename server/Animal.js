/**
 * Created by Jerome on 09-10-17.
 */

var Utils = require('../shared/Utils.js').Utils;
var PFUtils = require('../shared/PFUtils.js').PFUtils;
var MovingEntity = require('./MovingEntity.js').MovingEntity;
var GameServer = require('./GameServer.js').GameServer;
var World = require('../shared/World.js').World;
var Stats = require('../shared/Stats.js').Stats;

var debug = false;

function Animal(x,y,type){
    this.id = GameServer.lastAnimalID++;
    this.isPlayer = false;
    this.canFight = true;
    //this.setStartingPosition();
    this.x = x;
    this.y = y;
    this.inFight = false;
    this.type = type;
    this.idle = true;
    this.idleTime = 200;
    this.stats = Stats.getSkeleton();
    this.setStartingStats();
    this.setOrUpdateAOI();
}

Animal.prototype = Object.create(MovingEntity.prototype);
Animal.prototype.constructor = Animal;

Animal.prototype.setStartingStats = function(){
    var stats = GameServer.animalsData[this.type].stats;
    for(var s in stats){
        if(!stats.hasOwnProperty(s)) return;
        this.setStat(s,stats[s]);
    }
};

Animal.prototype.setStat = function(key,value){
    this.getStat(key).setBaseValue(value);
};

/*Animal.prototype.setStartingPosition = function(){
    this.x = Utils.randomInt(23,44);
    this.y = Utils.randomInt(1,16);
    console.log('Grrrr at ('+this.x+', '+this.y+')');
};*/

Animal.prototype.trim = function(){
    // Return a smaller object, containing a subset of the initial properties, to be sent to the client
    var trimmed = {};
    var broadcastProperties = ['id','path','type','inFight','battlezone','dead']; // list of properties relevant for the client
    for(var p = 0; p < broadcastProperties.length; p++){
        trimmed[broadcastProperties[p]] = this[broadcastProperties[p]];
    }
    trimmed.x = parseInt(this.x);
    trimmed.y = parseInt(this.y);
    return trimmed;
};

Animal.prototype.endFight = function(){
    MovingEntity.prototype.endFight.call(this);
    this.setIdle();
};

Animal.prototype.onEndOfPath = function(){
    //console.log('['+this.constructor.name+' '+this.id+'] arrived at destination');
    MovingEntity.prototype.onEndOfPath.call(this);
    if(this.inFight) return;
    this.setIdle();
};

Animal.prototype.setIdle = function(){
    this.idle = true;
    this.idleTime = Utils.randomInt(1000,3500); //ms
};

Animal.prototype.updateIdle = function(){
    if(this.inFight) return;
    this.idleTime -= GameServer.npcUpdateRate;
    if(this.idleTime <= 0){
        var dest = this.findRandomDestination();
        var path = GameServer.findPath({x:this.x,y:this.y},dest);
        if(!path || path.length <= 1){
            this.idleTime = 200;
            return;
        }
        path = PFUtils.trimPath(path,GameServer.battleCells);
        if(debug) console.log('['+this.constructor.name+' '+this.id+'] Found path of length '+path.length);
        this.idle = false;
        this.setPath(path);
    }
};

Animal.prototype.canRange = function(){
    return true;
};

Animal.prototype.findRandomDestination = function(){
    return {
        x: Utils.clamp(this.x + Utils.randomInt(-5,5),0,World.worldWidth),
        y: Utils.clamp(this.y + Utils.randomInt(-5,5),0,World.worldHeight)
    };
};

Animal.prototype.decideBattleAction = function(){
    if(!this.inFight) return;
    var target = this.selectTarget();
    var data = {};
    if(this.battle.nextTo(this,target)){
        //console.log('melee : ',this.id,' at ',this.x,this.y);
        data.action = 'attack';
        data.id = target.getShortID();
    }else{
        data.action = 'move';
        var dest = this.computeBattleDestination(target);
        //console.log('destination found : ',dest.x,dest.y);
        if(dest) {
            var path = GameServer.findPath({x: this.x, y: this.y}, dest,this.battle.PFgrid);
            this.setPath(path);
        }else{
            data.action = 'pass';
        }
    }
    this.battle.processAction(this,data);
};

Animal.prototype.selectTarget = function(){
    //console.log('selecting target');
    var fighters = this.battle.fighters;
    var minHP = 9999;
    var currentTarget = null;
    for(var i = 0; i < fighters.length; i++){
        var f = fighters[i];
        if(!f.isPlayer) continue;
        if(f.getHealth() < minHP){
            minHP = f.getHealth();
            currentTarget = f;
        }
    }
    //console.log('Selected target ',currentTarget.getShortID());
    return currentTarget;
};

Animal.prototype.computeBattleDestination = function(target){
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

module.exports.Animal = Animal;