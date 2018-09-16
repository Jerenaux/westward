/**
 * Created by Jerome on 09-10-17.
 */
"use strict";
var Utils = require('../shared/Utils.js').Utils;
var MovingEntity = require('./MovingEntity.js').MovingEntity;
var NPC = require('./NPC.js').NPC;
var GameServer = require('./GameServer.js').GameServer;
var World = require('../shared/World.js').World;

var debug = false;

function Animal(x,y,type){
    this.id = GameServer.lastAnimalID++;
    this.isAnimal = true;
    this.battleTeam = 'Animal';
    this.entityCategory = 'Animal';
    this.updateCategory = 'animals';
    this.battlePriority = 2;
    this.x = x;
    this.y = y;

    this.type = type;
    var animalData = GameServer.animalsData[this.type];

    this.cellsWidth = animalData.width || 1;
    this.cellsHeight = animalData.height || 1;
    this.xpReward = animalData.xp || 0;
    this.name = animalData.name;
    this.setAggressive();
    this.setWander();
    this.setStartingStats(animalData.stats);
    this.setLoot(animalData.loot);
    //this.setOrUpdateAOI();
    this.setIdle();
    NPC.call(this);
}

Animal.prototype = Object.create(NPC.prototype);
Animal.prototype.constructor = Animal;

Animal.prototype.setAggressive = function(){
    // Different from global aggro parameter, specifies if this specific animal should be aggressive pr not
    this.aggressive =  GameServer.animalsData[this.type].aggro;

    this.aggroMatrix = {
        'Player': true,
        'Civ': true,
        'CivBuilding': false,
        'PlayerBuilding': false
    };
};

Animal.prototype.isAggressive = function(){
    return (this.aggressive && GameServer.enableAnimalAggro);
};

Animal.prototype.setWander = function(){
    this.wander =  GameServer.animalsData[this.type].wander;
};

Animal.prototype.doesWander = function(){
    return (this.wander && GameServer.enableAnimalWander);
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

Animal.prototype.endFight = function(alive){
    MovingEntity.prototype.endFight.call(this);
    if(alive) this.setIdle();
};

Animal.prototype.findRandomDestination = function(){
    var r = GameServer.wildlifeParameters.wanderRange;
    return {
        x: Utils.clamp(this.x + Utils.randomInt(-r,r),0,World.worldWidth),
        y: Utils.clamp(this.y + Utils.randomInt(-r,r),0,World.worldHeight)
    };
};

Animal.prototype.die = function(){
    MovingEntity.prototype.die.call(this);
    this.idle = false;
    if(this.spawnZone) this.spawnZone.decrement('animal',this.type);
};

Animal.prototype.remove = function(){
    MovingEntity.prototype.remove.call(this);
    delete GameServer.animals[this.id];
};

module.exports.Animal = Animal;