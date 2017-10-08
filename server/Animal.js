/**
 * Created by Jerome on 09-10-17.
 */

var Utils = require('../shared/Utils.js').Utils;
var MovingEntity = require('./MovingEntity.js').MovingEntity;
var GameServer = require('./GameServer.js').GameServer;

function Animal(){
    this.id = GameServer.lastAnimalID++;
    this.setStartingPosition();
    this.setOrUpdateAOI();
}

Animal.prototype = Object.create(MovingEntity.prototype);
Animal.prototype.constructor = Animal;

Animal.prototype.setStartingPosition = function(){
    this.x = Utils.randomInt(23,44);
    this.y = Utils.randomInt(1,16);
    console.log('Grrrr at ('+this.x+', '+this.y+')');
};

Animal.prototype.trim = function(){
    // Return a smaller object, containing a subset of the initial properties, to be sent to the client
    var trimmed = {};
    var broadcastProperties = ['id','path']; // list of properties relevant for the client
    for(var p = 0; p < broadcastProperties.length; p++){
        trimmed[broadcastProperties[p]] = this[broadcastProperties[p]];
    }
    trimmed.x = parseInt(this.x);
    trimmed.y = parseInt(this.y);
    return trimmed;
};

module.exports.Animal = Animal;