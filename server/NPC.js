/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 11-06-18.
 */

var MovingEntity = require('./MovingEntity.js').MovingEntity;

function NPC(){
    this.isPlayer = false;
    this.isNPC = true;
    this.actionQueue = [];
    MovingEntity.call(this);
}

NPC.prototype = Object.create(MovingEntity.prototype);
NPC.prototype.constructor = NPC;

module.exports.NPC = NPC;