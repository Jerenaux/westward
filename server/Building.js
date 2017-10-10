/**
 * Created by Jerome on 05-10-17.
 */
var GameObject = require('./GameObject.js').GameObject;
var GameServer = require('./GameServer.js').GameServer;

function Building(x,y,type){
    this.id = GameServer.lastBuildingID++;
    this.x = x;
    this.y = y;
    this.type = type;
    this.setOrUpdateAOI();
}

Building.prototype = Object.create(GameObject.prototype);
Building.prototype.constructor = Building;

Building.prototype.trim = function(){
    var trimmed = {};
    var broadcastProperties = ['id','type']; // list of properties relevant for the client
    for(var p = 0; p < broadcastProperties.length; p++){
        trimmed[broadcastProperties[p]] = this[broadcastProperties[p]];
    }
    trimmed.x = parseInt(this.x);
    trimmed.y = parseInt(this.y);
    return trimmed;
};

module.exports.Building = Building;