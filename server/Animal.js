/**
 * Created by Jerome on 09-10-17.
 */
"use strict";
var Utils = require('../shared/Utils.js').Utils;
var PFUtils = require('../shared/PFUtils.js').PFUtils;
var MovingEntity = require('./MovingEntity.js').MovingEntity;
var GameServer = require('./GameServer.js').GameServer;
var World = require('../shared/World.js').World;
var Stats = require('../shared/Stats.js').Stats;
var Inventory = require('../shared/Inventory.js').Inventory;

var debug = false;

function Animal(x,y,type){
    this.id = GameServer.lastAnimalID++;
    this.isPlayer = false;
    this.isAnimal = true;
    this.battleTeam = 'Animal';
    this.x = x;
    this.y = y;
    this.inFight = false;
    this.type = type;
    this.stats = Stats.getSkeleton();
    this.setAggressive();
    this.setWander();
    this.setStartingStats();
    this.setLoot();
    this.setOrUpdateAOI();
    this.setIdle();
    MovingEntity.call(this);
}

Animal.prototype = Object.create(MovingEntity.prototype);
Animal.prototype.constructor = Animal;

Animal.prototype.setLoot = function(){
    this.loot = new Inventory(10);
    var loot = GameServer.animalsData[this.type].loot;
    for(var id in loot){
        this.loot.add(id,loot[id]);
    }
};

Animal.prototype.addToLoot = function(id,nb){
    console.log('Adding ',nb,'of id',id);
    this.loot.add(id,nb);
};

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

Animal.prototype.setAggressive = function(){
    // Different from global aggro parameter, specifies if this specific animal should be aggressive pr not
    this.aggressive =  GameServer.animalsData[this.type].aggro;
};

Animal.prototype.setWander = function(){
    this.wander =  GameServer.animalsData[this.type].wander;
};

Animal.prototype.doesWander = function(){
    return (this.wander && GameServer.enableWander);
};

Animal.prototype.isAggressive = function(){
    return (this.aggressive && GameServer.enableAggro);
};

Animal.prototype.setSpawnZone = function(zone){
    this.spawnZone = zone;
};

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
    this.idleTime = Utils.randomInt(GameServer.wildlifeParameters.idleTime[0]*1000,GameServer.wildlifeParameters.idleTime[1]*1000);
};

Animal.prototype.updateIdle = function(){
    if(this.inFight) return;
    this.idleTime -= GameServer.NPCupdateRate;
    if(this.idleTime <= 0){
        var foundPath = this.goToDestination(this.findRandomDestination());
        if(!foundPath) this.idleTime = GameServer.wildlifeParameters.idleRetry;
    }
};

Animal.prototype.canRange = function(){
    return true;
};

Animal.prototype.isInBuilding = function(){
    return false;
};

Animal.prototype.findRandomDestination = function(){
    return {
        x: Utils.clamp(this.x + Utils.randomInt(-5,5),0,World.worldWidth),
        y: Utils.clamp(this.y + Utils.randomInt(-5,5),0,World.worldHeight)
    };
};

Animal.prototype.goToDestination = function(dest){
    var path = GameServer.findPath({x:this.x,y:this.y},dest);
    if(!path || path.length <= 1) return false;

    // quick fix
    var p = [];
    for(var i = 0; i < path.length; i++){
        var cell = path[i];
        if(cell[0] < 0 || cell[1] < 0 || cell[0] > World.worldWidth
            || cell[1] > World.worldHeight) break;
        p.push(cell);
    }
    path = p;

    var trim = PFUtils.trimPath(path,GameServer.battleCells);
    path = trim.path;
    if(debug) console.log('['+this.constructor.name+' '+this.id+'] Found path of length '+path.length);
    this.idle = false;
    this.setPath(path);
    return true;
};

Animal.prototype.checkForHostiles = function(){
    if(!this.isAggressive()) return;
    if(this.isInFight()) return;
    var AOIs = Utils.listAdjacentAOIs(this.aoi);
    for(var i = 0; i < AOIs.length; i++){
        var aoi = GameServer.AOIs[AOIs[i]];
        for(var j = 0; j < aoi.entities.length; j++) {
            var entity = aoi.entities[j];
            if(!entity.isPlayer) continue;
            if(!entity.isAvailableForFight()) continue;
            if(Utils.chebyshev(this,entity) <= GameServer.battleParameters.aggroRange){
                console.log(this.getShortID(),'spots',entity.getShortID());
                if(entity.isInFight()){
                    this.goToDestination(entity);
                }else {
                    GameServer.handleBattle(entity, this, true);
                }
                break;
            }
        }
    }
};

Animal.prototype.isAvailableForFight = function(){
    return (!this.isDead());
};

Animal.prototype.die = function(){
    MovingEntity.prototype.die.call(this);
    if(this.spawnZone) this.spawnZone.decrement('animal',this.type);
};

Animal.prototype.remove = function(){
    if(this.battle) this.battle.removeFighter(this);
    delete GameServer.animals[this.id];
};

module.exports.Animal = Animal;