/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 18-06-18.
 */

var GameServer = require('./GameServer.js').GameServer;
var NPC = require('./NPC.js').NPC;

function Civ(x,y,type){
    this.id = GameServer.lastCivID++;
    this.isCiv = true;
    this.battleTeam = 'Civ';
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
    //this.setOrUpdateAOI();
    console.warn('creating NPC');
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
        'Building': true
    };
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