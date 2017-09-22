/**
 * Created by Jerome on 20-09-17.
 */

var Utils = require('../shared/Utils.js').Utils;
var PersonalUpdatePacket = require('./PersonalUpdatePacket.js').PersonalUpdatePacket;

function Player(socketID,playerID){
    this.socketID = socketID;
    this.id = playerID;
    this.x = Utils.randomInt(1,21);
    this.y = Utils.randomInt(1,16);
    this.aoi = Utils.tileToAOI({x:this.x,y:this.y});
    this.updatePacket = new PersonalUpdatePacket();
    this.newAOIs = [];
    console.log('['+this.id+'] Hi at '+this.x+', '+this.y+', aoi = '+this.aoi+')');
}

Player.prototype.trim = function(){
    // Return a smaller object, containing a subset of the initial properties, to be sent to the client
    var trimmed = {};
    var broadcastProperties = ['id']; // list of properties relevant for the client
    for(var p = 0; p < broadcastProperties.length; p++){
        trimmed[broadcastProperties[p]] = this[broadcastProperties[p]];
    }
    trimmed.x = parseInt(this.x);
    trimmed.y = parseInt(this.y);
    //if(this.route) trimmed.route = this.route.trim(this.category);
    //if(this.target) trimmed.targetID = this.target.id;
    return trimmed;
};

Player.prototype.getIndividualUpdatePackage = function(){
    if(this.updatePacket.isEmpty()) return null;
    var pkg = this.updatePacket;
    this.updatePacket = new PersonalUpdatePacket();
    return pkg;
};

module.exports.Player = Player;