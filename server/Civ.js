/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 18-06-18.
 */

var GameServer = require('./GameServer.js').GameServer;
var NPC = require('./NPC.js').NPC;
var GameObject = require('./GameObject.js').GameObject;
var MovingEntity = require('./MovingEntity.js').MovingEntity;
var PFUtils = require('../shared/PFUtils.js').PFUtils;
var Utils = require('../shared/Utils.js').Utils;

function Civ(x,y,type){
    this.id = GameServer.lastCivID++;
    this.isCiv = true;
    this.battleTeam = 'Civ';
    this.entityCategory = 'Civ';
    this.updateCategory = 'civs';
    this.sentient = true; // used in battle to know if a battle shoud end
    this.x = x;
    this.y = y;
    this.type = type;

    var civData = GameServer.civsData[this.type];
    this.cellsWidth = civData.width || 1;
    this.cellsHeight = civData.height || 1;
    this.w = this.cellsWidth; // For quadtree
    this.h = this.cellsHeight;

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

Civ.prototype.findRandomDestination = function(){
    if(!this.camp){
        console.warn('Civ without camp');
        return null;
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

Civ.prototype.die = function(){
    MovingEntity.prototype.die.call(this);
    this.idle = false;
    if(this.camp) this.camp.remove(this);
};

Civ.prototype.endFight = function(alive){
    MovingEntity.prototype.endFight.call(this);
    if(!this.camp) return;
    if(alive) this.setTrackedTarget(this.camp.center);
};

Civ.prototype.talk = function(signal){
    // TODO: put all there in some conf files somewhere
    var msg = null;
    var upper = 10;
    var t = 1;
    switch(signal){
        case 'battle_start':
            var msgs = ['I found one!','There!'];
            //var msgs = ['We must defend our land!','Go back to the sea!','']
            if(Utils.randomInt(1,upper) > t) msg = Utils.randomElement(msgs);
            break;
        case 'hit':
            var msgs = ['Argh','Ughn'];
            if(Utils.randomInt(1,upper) > t) msg = Utils.randomElement(msgs);
            break;
        case 'self_falls':
            var msgs = ['No...','My brothers will avenge me!'];
            if(Utils.randomInt(1,upper) > t) msg = Utils.randomElement(msgs);
            break;
        case 'comrade_falls':
            var msgs = ['I will avenge my fallen brother','I will spill your blood for this!'];
            if(Utils.randomInt(1,upper) > t) msg = Utils.randomElement(msgs);
            break;
        case 'killed_foe':
            var msgs = ['Retribution!','May you never come back.'];
            if(Utils.randomInt(1,upper) > t) msg = Utils.randomElement(msgs);
            break;
    }
    if(msg) this.setChat(msg);
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
    // return trimmed;
    return GameObject.prototype.trim.call(this,trimmed);
};

module.exports.Civ = Civ;