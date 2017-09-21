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
    console.log('['+this.id+'] Hi at '+this.x+', '+this.y);
}

Player.prototype.getIndividualUpdatePackage = function(){
    if(this.updatePacket.isEmpty()) return null;
    var pkg = this.updatePacket;
    this.updatePacket = new PersonalUpdatePacket();
    return pkg;
};

module.exports.Player = Player;