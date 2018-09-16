/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 18-06-18.
 */

var GameServer = require('./GameServer.js').GameServer;
var NPC = require('./NPC.js').NPC;
var MovingEntity = require('./MovingEntity.js').MovingEntity;
var PFUtils = require('../shared/PFUtils.js').PFUtils;
var Utils = require('../shared/Utils.js').Utils;

function Civ(x,y,type){
    this.id = GameServer.lastCivID++;
    this.isCiv = true;
    this.battleTeam = 'Civ';
    this.entityCategory = 'Civ';
    this.updateCategory = 'civs';
    this.x = x;
    this.y = y;
    this.type = type;

    var civData = GameServer.civsData[this.type];
    this.cellsWidth = civData.width || 1;
    this.cellsHeight = civData.height || 1;
    this.xpReward = civData.xp || 0;
    this.name = 'Enemy';
    this.setAggressive();
    this.setStartingStats(civData.stats);
    this.setLoot(civData.loot);
    this.setIdle();
    NPC.call(this);
}

Civ.prototype = Object.create(NPC.prototype);
Civ.prototype.constructor = Civ;

Civ.prototype.setAggressive = function(){
    // Different from global aggro parameter, specifies if this specific civ should be aggressive pr not

    this.aggressive = true; // TODO: make it depend on in-game factors?

    // TODO: move to config somehow?
    this.aggroMatrix = {
        'Player': true,
        'Animal': true,
        'CivBuilding': false,
        'PlayerBuilding': true
    };
};

Civ.prototype.isAggressive = function(){
    return (this.aggressive && GameServer.enableCivAggro);
};

Civ.prototype.doesWander = function(){
    return GameServer.enableCivWander;
};

Civ.prototype.setCamp = function(camp){
    this.camp = camp;
};

Civ.prototype.updateBehavior = function(){
    if(this.trackedTarget) {
        this.updateTracking();
    }else{
        this.updateWander();
    }
};

Civ.prototype.findRandomDestination = function(){
    if(!this.camp){
        console.warn('Civ without camp');
        return;
    }
    var r = GameServer.wildlifeParameters.wanderRange; // TODO: specify one for civs specifically
    var campR = 10; // TODO: conf
    var xMin = Utils.clamp(this.camp.center.x-campR,0,World.worldWidth);
    var xMax = Utils.clamp(this.camp.center.x+campR,0,World.worldWidth);
    var yMin = Utils.clamp(this.camp.center.y-campR,0,World.worldHeight);
    var yMax = Utils.clamp(this.camp.center.y+campR,0,World.worldHeight);
    return {
        x: Utils.clamp(this.x + Utils.randomInt(-r,r),xMin,xMax),
        y: Utils.clamp(this.y + Utils.randomInt(-r,r),yMin,yMax)
    };
};

Civ.prototype.setTrackedTarget = function(target){
    this.trackedTarget = target;
    this.idle = false;
};

Civ.prototype.updateTracking = function(){
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

Civ.prototype.die = function(){
    MovingEntity.prototype.die.call(this);
    this.idle = false;
    if(this.camp) this.camp.remove(this);
};

Civ.prototype.endFight = function(alive){
    MovingEntity.prototype.endFight.call(this);
    if(alive) this.setTrackedTarget(this.camp.center);
};

Civ.prototype.remove = function(){
    MovingEntity.prototype.remove.call(this);
    delete GameServer.civs[this.id];
};

Civ.prototype.trim = function(){
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

module.exports.Civ = Civ;