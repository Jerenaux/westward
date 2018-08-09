/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 11-06-18.
 */

var GameServer = require('./GameServer.js').GameServer;
var Utils = require('../shared/Utils.js').Utils;
var PFUtils = require('../shared/PFUtils.js').PFUtils;
var MovingEntity = require('./MovingEntity.js').MovingEntity;
var Stats = require('../shared/Stats.js').Stats;
var Inventory = require('../shared/Inventory.js').Inventory;

function NPC(){
    this.isPlayer = false;
    this.isNPC = true;
    this.inFight = false;
    this.actionQueue = [];
    MovingEntity.call(this);
}

NPC.prototype = Object.create(MovingEntity.prototype);
NPC.prototype.constructor = NPC;

// ### Equipment ###

NPC.prototype.setLoot = function(loot){
    this.loot = new Inventory(10);
    //var loot = GameServer.animalsData[this.type].loot;
    for(var id in loot){
        this.addToLoot(id,loot[id]);
    }
};

NPC.prototype.addToLoot = function(id,nb){
    this.loot.add(id,nb);
};

// ### Stats ###

NPC.prototype.setStartingStats = function(stats){
    //var stats = GameServer.animalsData[this.type].stats;
    this.stats = Stats.getSkeleton();
    for(var s in stats){
        if(!stats.hasOwnProperty(s)) return;
        this.setStat(s,stats[s]);
    }
};

NPC.prototype.setStat = function(key,value){
    this.getStat(key).setBaseValue(value);
};

// ### Battle ###

NPC.prototype.checkForAggro = function(){
    if(!this.isAggressive()) return;
    if(this.isInFight()) return;

    var AOIs = this.fieldOfVision;
    for(var i = 0; i < AOIs.length; i++){
        var aoi = GameServer.AOIs[AOIs[i]];
        for(var j = 0; j < aoi.entities.length; j++) {
            var entity = aoi.entities[j];
            if(!this.aggroAgainst(entity)) continue;
            if(!entity.isAvailableForFight()) continue;
            //TODO: vary aggro range?
            if(Utils.chebyshev(this,entity) <= GameServer.battleParameters.aggroRange){
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

NPC.prototype.queueAction = function(action){
    this.actionQueue.push(action);
};

NPC.prototype.decideBattleAction = function(){
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

NPC.prototype.findFreeCell = function(){
    var pos = {x:this.x,y:this.y};
    var list = this.battle.getCells(); //{x,y,v} objects
    list.sort(function(a,b){
        if(Utils.chebyshev(a,pos) < Utils.chebyshev(b,pos)) return -1;
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

NPC.prototype.findBattlePath = function(dest){
    var data = {};
    var path = this.battle.findPath({x: this.x, y: this.y}, dest);
    if(path && path.length > 0){
        this.setPath(path);
        data.action = 'move';
    }else{
        console.log('Combat path of length 0');
        data.action = 'pass';
    }
    return data;
};

NPC.prototype.attackTarget = function(){
    var data = {};
    // TODO: accomodate for ranged attacks
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

NPC.prototype.aggroAgainst = function(f){
    return this.aggroMatrix[f.battleTeam];
};

NPC.prototype.selectTarget = function(){
    var fighters = this.battle.fighters;
    var minHP = 99999;
    var currentTarget = null;
    for(var i = 0; i < fighters.length; i++){
        var f = fighters[i];
        if(this.isSameTeam(f)) continue;
        if(!this.aggroAgainst(f)) continue;
        if(f.getHealth() < minHP){
            minHP = f.getHealth();
            currentTarget = f;
        }
    }
    return currentTarget;
};

NPC.prototype.computeBattleDestination = function(target){
    var dest = target.getEndOfPath();
    var r = GameServer.battleParameters.battleRange;
    var candidates = [];
    for(var x = this.x - r; x < this.x + r + 1; x++){
        for(var y = this.y - r; y < this.y + r + 1; y++){
            if(x == dest.x && y == dest.y) continue;
            if(!this.battle.isPosition(x,y)) continue;
            if(!this.battle.isPositionFree(x,y)) continue;
            if(GameServer.checkCollision(x,y)) continue;
            if(!this.inBattleRange(x,y)) continue; // still needed as long as Euclidean range, the double-loop include corners outside of Euclidean range
            candidates.push({
                x: x,
                y: y
            });
        }
    }
    var _self = this;
    candidates.sort(function(a,b){
        var dA = Utils.chebyshev(a,dest);
        var dB = Utils.chebyshev(b,dest);
        if(dA == dB){
            var selfA = Utils.chebyshev(a,_self);
            var selfB = Utils.chebyshev(b,_self);
            if(selfA < selfB) return -1;
            return 1;
        }
        if(dA < dB) return -1;
        return 1;
    });
    var closest = candidates[0];
    return closest;
};

// ### Status ###

NPC.prototype.isAggressive = function(){
    return (this.aggressive && GameServer.enableAggro);
};

NPC.prototype.isInBuilding = function(){
    return false;
};

NPC.prototype.isAvailableForFight = function(){
    return (!this.isDead());
};

module.exports.NPC = NPC;