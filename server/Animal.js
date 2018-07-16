/**
 * Created by Jerome on 09-10-17.
 */
"use strict";
var Utils = require('../shared/Utils.js').Utils;
var PFUtils = require('../shared/PFUtils.js').PFUtils;
var MovingEntity = require('./MovingEntity.js').MovingEntity;
var NPC = require('./NPC.js').NPC;
var GameServer = require('./GameServer.js').GameServer;
var World = require('../shared/World.js').World;

var debug = false;

function Animal(x,y,type){
    this.id = GameServer.lastAnimalID++;
    this.isAnimal = true;
    this.battleTeam = 'Animal';
    this.updateCategory = 'animals';
    this.x = x;
    this.y = y;
    this.type = type;
    this.xpReward = GameServer.animalsData[this.type].xp || 0;
    this.setAggressive();
    this.setWander();
    this.setStartingStats(GameServer.animalsData[this.type].stats);
    this.setLoot(GameServer.animalsData[this.type].loot);
    this.setOrUpdateAOI();
    this.setIdle();
    NPC.call(this);
}

Animal.prototype = Object.create(NPC.prototype);
Animal.prototype.constructor = Animal;

Animal.prototype.setAggressive = function(){
    // Different from global aggro parameter, specifies if this specific animal should be aggressive pr not
    this.aggressive =  GameServer.animalsData[this.type].aggro;

    // TODO: move to config somehow?
    this.aggroMatrix = {
        'Player': true,
        'Civ': true,
        'Building': false
    };
};

Animal.prototype.setWander = function(){
    this.wander =  GameServer.animalsData[this.type].wander;
};

Animal.prototype.doesWander = function(){
    return (this.wander && GameServer.enableWander);
};

Animal.prototype.setSpawnZone = function(zone){
    this.spawnZone = zone;
};

Animal.prototype.trim = function(){
    // Return a smaller object, containing a subset of the initial properties, to be sent to the client
    var trimmed = {};
    var broadcastProperties = ['id','path','type','inFight','dead']; // list of properties relevant for the client
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
    this.idleTime = Utils.randomInt(GameServer.wildlifeParameters.idleTime[0]*1000,GameServer.wildlifeParameters.idleTime[1]*1000);
};

Animal.prototype.updateIdle = function(){
    if(this.isInFight() || this.isDead()) return;
    this.idleTime -= GameServer.NPCupdateRate;
    if(this.idleTime <= 0){
        var foundPath = this.goToDestination(this.findRandomDestination());
        if(!foundPath) this.idleTime = GameServer.wildlifeParameters.idleRetry;
    }
};

Animal.prototype.canRange = function(){
    return false;
};


Animal.prototype.findRandomDestination = function(){
    var r = GameServer.wildlifeParameters.wanderRange;
    return {
        x: Utils.clamp(this.x + Utils.randomInt(-r,r),0,World.worldWidth),
        y: Utils.clamp(this.y + Utils.randomInt(-r,r),0,World.worldHeight)
    };
};

Animal.prototype.goToDestination = function(dest){
    var path = GameServer.findPath({x:this.x,y:this.y},dest);
    if(!path || path.length <= 1) return false;

    var trim = PFUtils.trimPath(path,GameServer.battleCells);
    path = trim.path;
    if(debug) console.log('['+this.constructor.name+' '+this.id+'] Found path of length '+path.length);
    this.idle = false;
    this.setPath(path);
    return true;
};

Animal.prototype.die = function(){
    MovingEntity.prototype.die.call(this);
    this.idle = false;
    if(this.spawnZone) this.spawnZone.decrement('animal',this.type);
};

Animal.prototype.remove = function(){
    if(this.battle) this.battle.removeFighter(this);
    delete GameServer.animals[this.id];
};

module.exports.Animal = Animal;