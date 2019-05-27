/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 11-06-18.
 */

var GameServer = require('./GameServer.js').GameServer;
var Utils = require('../shared/Utils.js').Utils;
var PFUtils = require('../shared/PFUtils.js').PFUtils;
var MovingEntity = require('./MovingEntity.js').MovingEntity;
var StatsContainer = require('../shared/Stats.js').StatsContainer;
var Inventory = require('../shared/Inventory.js').Inventory;

function NPC(){
    this.isPlayer = false;
    this.isNPC = true;
    this.inFight = false;
    this.actionQueue = [];
    MovingEntity.call(this);
    this.skipBattleTurn = GameServer.battleParameters.freezeNPC;//false; // used to distinguish from buildings
    this.onAddAtLocation();
    this.setOrUpdateAOI();
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
    this.stats = new StatsContainer();
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
    if(!this.isInVision()) return;
    if(!this.isAggressive() || this.isInFight() || !this.isAvailableForFight()) return;

    var r = GameServer.battleParameters.aggroRange;
    // implies Chebyshev distance
    var neighbors = GameServer.getEntitiesAt(Math.floor(this.x-r/2),Math.floor(this.y-r/2),r,r);
    for(var i = 0; i < neighbors.length; i++){
        var entity = neighbors[i];
        if(this.getShortID() == entity.getShortID()) continue;
        if(!this.aggroAgainst(entity)) continue;
        if(!entity.isAvailableForFight()) continue;
        if(entity.instance != this.instance) continue;
        if(entity.isInFight()){
            this.goToDestination(entity);
        }else {
            GameServer.handleBattle(this, entity);
            if(this.isCiv) this.talk('battle_start');
        }
        break;
    }
};

NPC.prototype.goToDestination = function(dest){
    var path = GameServer.findPath({x:this.x,y:this.y},dest,true); // true for seek-path pathfinding
    if(!path || path.length <= 1) return false;

    var trim = PFUtils.trimPath(path,GameServer.battleCells);
    path = trim.path;
    this.idle = false;
    this.setPath(path);
    return true;
};

NPC.prototype.canRange = function(){
    return false;
};

NPC.prototype.queueAction = function(action){
    this.actionQueue.push(action);
};

NPC.prototype.decideBattleAction = function(){
    if(!this.inFight) return;
    var action = this.actionQueue.shift();
    if(!action) action = 'attack';
    if(!this.target || !this.target.isInFight()) this.target = this.selectTarget();
    if(!this.target) {
        this.battle.end();
        return;
    }
    console.log('Target of',this.getShortID(),'is',this.target.getShortID());
    var data;
    switch(action){
        case 'attack': // If not next to and can't range, will become a 'move' action
            data = this.attackTarget();
            break;
        case 'move':
            //data = this.findFreeCell();
            console.warn('move action for ',this.getShortID());
            if(data.action == 'pass') this.queueAction('move');
            break;
    }
    this.battle.processAction(this,data);
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
    if(Utils.nextTo(this,this.target)){
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
    return this.aggroMatrix[f.entityCategory];
};

NPC.prototype.selectTarget = function(){
    var fighters = this.battle.fighters.slice();
    if(fighters.length == 0) return null;
    var target = null;
    for(var i = 1; i < fighters.length; i++){
        var f = fighters[i];
        if(this.isSameTeam(f) || !this.aggroAgainst(f)) continue;
        if(!target){
            target = f;
            continue;
        }
        if(target.battlePriority == f.battlePriority){
            if(f.getHealth() < target.getHealth()) target = f;
        }else{
            if(f.battlePriority < target.battlePriority) target = f;
        }
    }
    return target;
};

//Check if a *moving entity* (no building or anything) other than self is at position
NPC.prototype.isPositionFree = function(x,y){
    var entities = GameServer.positions.get(x,y);
    if(entities.length == 0) return true;
    entities = entities.filter(function(e){
        return (e.isMovingEntity && e.getShortID() != this.getShortID());
    },this);
    return entities.length == 0;
};

NPC.prototype.computeBattleDestination = function(target){
    var dest = target;
    var r = GameServer.battleParameters.battleRange;
    var closest = null;
    var minDist = Infinity;
    var minSelfDist = Infinity;
    for(var x = this.x - r; x < this.x + r + 1; x++){
        for(var y = this.y - r; y < this.y + r + 1; y++){
            if(x == dest.x && y == dest.y) continue;
            if(!this.battle.isPosition(x,y)) continue;
            //if(GameServer.checkCollision(x,y)) continue; redundant with previous line?
            if(!this.isPositionFree(x,y)) continue;
            if(!this.inBattleRange(x,y)) continue; // still needed as long as Euclidean range, the double-loop include corners outside of Euclidean range
            var candidate = {
                x: x,
                y: y,
                w: this.cellsWidth,//1,
                h: this.cellsHeight//1
            };
            //console.log(candidate);
            var d = Utils.boxesDistance(candidate,dest.getRect());
            //console.log('d=',d);
            if(d < minDist){
                minDist = d;
                minSelfDist = Infinity;
                closest = candidate;
            }else if(d == minDist){
                // Simple manhattan distance because here we want to minimize travelled cells, not distance between (possibly multi-tile) entities
                var sd = Utils.manhattan(candidate,this);
                //console.log('sd=',sd);
                if(sd < minSelfDist){
                    minSelfDist = sd;
                    closest = candidate;
                }
            }
        }
    }
    return closest;
};

// ### Status ###

NPC.prototype.isInBuilding = function(){
    return false;
};

NPC.prototype.isAvailableForFight = function(){
    return (!this.isDead() && !this.isInFight());
};

// ### Wander ###

NPC.prototype.onEndOfPath = function(){
    MovingEntity.prototype.onEndOfPath.call(this);
    if(this.inFight) return;
    this.setIdle();
};

NPC.prototype.setIdle = function(){
    this.idle = true;
    this.idleTime = Utils.randomInt(GameServer.wildlifeParameters.idleTime[0]*1000,GameServer.wildlifeParameters.idleTime[1]*1000);
};

NPC.prototype.updateBehavior = function(){
    if(this.trackedTarget) {
        this.updateTracking();
    }else{
        if(!this.camp) return;
        this.updateWander();
    }
};

NPC.prototype.updateWander = function(){
    if(!this.isInVision()) return;
    if(this.isInFight() || this.isDead() || !this.idle || !this.doesWander()) return;
    //console.log(this.getShortID(),'updates wander',this.idleTime);
    this.idleTime -= GameServer.NPCupdateRate;
    if(this.idleTime <= 0){
        var dest = this.findRandomDestination();
        //console.log(dest);
        if(!dest){
            console.warn('No destination found');
            return;
        }
        var foundPath = this.goToDestination(dest);
        if(!foundPath) this.idleTime = GameServer.wildlifeParameters.idleRetry;
    }
};

NPC.prototype.setTrackedTarget = function(target){
    this.trackedTarget = target;
    this.idle = false;
};

NPC.prototype.updateTracking = function(){
    if(this.moving || this.isInFight() || this.isDead()) return;

    if(this.x == this.trackedTarget.x && this.y == this.trackedTarget.y){
        console.log(this.getShortID(),'reached target');
        this.trackedTarget = null;
        this.setIdle();
        return;
    }

    var path = GameServer.findPath(this,this.trackedTarget,true); // true for seek-path pathfinding
    if(!path || path.length <= 1) return;

    var trim = PFUtils.trimPath(path,GameServer.battleCells);
    path = trim.path;
    this.setPath(path);
};


module.exports.NPC = NPC;