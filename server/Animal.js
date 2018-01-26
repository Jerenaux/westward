/**
 * Created by Jerome on 09-10-17.
 */

var Utils = require('../shared/Utils.js').Utils;
var MovingEntity = require('./MovingEntity.js').MovingEntity;
var GameServer = require('./GameServer.js').GameServer;
var World = require('../shared/World.js').World;
//var Stats = require('../shared/Stats.js').Stats;

var debug = false;

function Animal(x,y,type){
    this.id = GameServer.lastAnimalID++;
    this.isPlayer = false;
    //this.setStartingPosition();
    this.x = x;
    this.y = y;
    this.inFight = false;
    this.type = type;
    this.idle = true;
    this.idleTime = 200;
    this.stats = {}; //Stats.getSkeleton();
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
        //this.stats[s] = stats[s];
    }
};

Animal.prototype.setStat = function(key,value){
    this.stats[key] = value;
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

Animal.prototype.onArrival = function(){
    //console.log('['+this.constructor.name+' '+this.id+'] arrived at destination');
    this.idle = true;
    this.idleTime = Utils.randomInt(500,2999); //ms
};

Animal.prototype.updateIdle = function(){
    if(this.inFight) return;
    this.idleTime -= GameServer.server.npcUpdateRate;
    if(this.idleTime <= 0){
        var dest = this.findRandomDestination();
        var path = GameServer.findPath({x:this.x,y:this.y},dest);
        if(!path || path.length <= 1){
            this.idleTime = 200;
            return;
        }
        if(debug) console.log('['+this.constructor.name+' '+this.id+'] Found path of length '+path.length);
        this.idle = false;
        this.setPath(path);
    }
};

Animal.prototype.findRandomDestination = function(){
    return {
        x: Utils.clamp(this.x + Utils.randomInt(-5,5),0,World.worldWidth),
        y: Utils.clamp(this.y + Utils.randomInt(-5,5),0,World.worldHeight)
    };
};

Animal.prototype.decideBattleAction = function(){
    var target = this.selectTarget();
    var data = {};
    if(this.battle.nextTo(this,target)){
        data.action = 'attack';
        data.id = target.getShortID();
    }else{
        data.action = 'move';
        var dest = this.computeBattleDestination(target);
        //console.log('destination : ',dest.x,dest.y);
        data.x = dest.x;
        data.y = dest.y;
    }
    this.battle.processAction(this,data);
};

Animal.prototype.selectTarget = function(){
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
    console.log(this.x,dest.x);
    console.log(this.y,dest.y);
    for(var x = Math.min(this.x,dest.x); x <= Math.max(this.x,dest.x); x++){
        for(var y = Math.min(this.y,dest.y); y <= Math.max(this.y,dest.y); y++) {
            //console.log('considering ',x,y);
            if(this.inBattleRange(x,y) && !GameServer.collisions.get(y,x)){
                if(x == dest.x && y == dest.y) continue;
                if(this.battle.nextTo({x:x,y:y},dest)) return {x:x,y:y};
                var dist = Utils.euclidean({x:x,y:y},{x:dest.x,y:dest.y});
                if(dist < minDist){
                    minDist = dist;
                    closest = {x:x,y:y};
                }
            }
        }
    }
    if(closest == null) console.log('not found');
    return closest;
};

module.exports.Animal = Animal;