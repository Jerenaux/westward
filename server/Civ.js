/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 18-06-18.
 */

var NPC = require('./NPC.js').NPC;

function Civ(x,y,type){
    this.id = GameServer.lastCivID++;
    this.isCiv = true;
    this.battleTeam = 'Civ';
    this.updateCategory = 'civs';
    this.x = x;
    this.y = y;
    this.type = type;

    this.setAggressive();
    //this.setStartingStats(GameServer.animalsData[this.type].stats);
    //this.setLoot(GameServer.animalsData[this.type].loot);
    this.setOrUpdateAOI();
    NPC.call(this);
}

Civ.prototype = Object.create(NPC.prototype);
Civ.prototype.constructor = Civ;

Civ.prototype.setAggressive = function(){
    // Different from global aggro parameter, specifies if this specific animal should be aggressive pr not

    //this.aggressive =  GameServer.animalsData[this.type].aggro;

    // TODO: move to config somehow?
    this.aggroMatrix = {
        'Player': true,
        'Animal': true,
        'Building': true
    };
};