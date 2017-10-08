/**
 * Created by Jerome on 20-09-17.
 */

var Utils = require('../shared/Utils.js').Utils;
var PersonalUpdatePacket = require('./PersonalUpdatePacket.js').PersonalUpdatePacket;
var MovingEntity = require('./MovingEntity.js').MovingEntity;
var GameServer = require('./GameServer.js').GameServer;

function Player(){
    this.updatePacket = new PersonalUpdatePacket();
    this.newAOIs = []; //list of AOIs about which the player hasn't checked for updates yet
}

Player.prototype = Object.create(MovingEntity.prototype);
Player.prototype.constructor = Player;

Player.prototype.setIDs = function(dbID,socketID){
    this.id = GameServer.lastPlayerID++;
    this.dbID = dbID;
    this.socketID = socketID;
};

Player.prototype.setStartingPosition = function(){
    this.x = Utils.randomInt(1,21);
    this.y = Utils.randomInt(1,16);
    console.log('Hi at ('+this.x+', '+this.y+')');
};

Player.prototype.trim = function(){
    // Return a smaller object, containing a subset of the initial properties, to be sent to the client
    var trimmed = {};
    var broadcastProperties = ['id','path']; // list of properties relevant for the client
    for(var p = 0; p < broadcastProperties.length; p++){
        trimmed[broadcastProperties[p]] = this[broadcastProperties[p]];
    }
    trimmed.x = parseInt(this.x);
    trimmed.y = parseInt(this.y);
    //if(this.route) trimmed.route = this.route.trim(this.category);
    //if(this.target) trimmed.targetID = this.target.id;
    return trimmed;
};

Player.prototype.dbTrim = function(){
    // Return a smaller object, containing a subset of the initial properties, to be stored in the database
    var trimmed = {};
    var dbProperties = ['x','y']; // list of properties relevant to store in the database
    for(var p = 0; p < dbProperties.length; p++){
        trimmed[dbProperties[p]] = this[dbProperties[p]];
    }
    //trimmed['weapon'] = GameServer.db.itemsIDmap[this.weapon];
    //trimmed['armor'] = GameServer.db.itemsIDmap[this.armor];
    return trimmed;
};

Player.prototype.getDataFromDb = function(document){
    // Set up the player based on the data stored in the databse
    // document is the mongodb document retrieved form the database
    var dbProperties = ['x','y'];
    for(var p = 0; p < dbProperties.length; p++){
        this[dbProperties[p]] = document[dbProperties[p]];
    }
    this.setOrUpdateAOI();
    //this.equip(1,document['weapon']);
    //this.equip(2,document['armor']);
};

Player.prototype.getIndividualUpdatePackage = function(){
    if(this.updatePacket.isEmpty()) return null;
    var pkg = this.updatePacket;
    this.updatePacket = new PersonalUpdatePacket();
    return pkg;
};

module.exports.Player = Player;