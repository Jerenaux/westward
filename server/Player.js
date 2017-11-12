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
    this.inventory = {}; // permanent inventory
    this.settlement = 0;
}

Player.prototype = Object.create(MovingEntity.prototype);
Player.prototype.constructor = Player;

Player.prototype.setIDs = function(dbID,socketID){
    this.id = GameServer.lastPlayerID++;
    this.dbID = dbID;
    this.socketID = socketID;
};

Player.prototype.setStartingPosition = function(){
    this.x = Utils.randomInt(523,542);
    this.y = Utils.randomInt(690,700);
    console.log('Hi at ('+this.x+', '+this.y+')');
};

Player.prototype.setStartingInventory = function(){
    this.inventory = { "0" : 2 , "1" : 1 , "2" : 1 , "3" : 1};
    this.updateInventory();
};

Player.prototype.trim = function(){
    // Return a smaller object, containing a subset of the initial properties, to be sent to the client
    var trimmed = {};
    var broadcastProperties = ['id','path','settlement','inFight']; // list of properties relevant for the client
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
    var dbProperties = ['x','y','inventory']; // list of properties relevant to store in the database
    for(var p = 0; p < dbProperties.length; p++){
        trimmed[dbProperties[p]] = this[dbProperties[p]];
    }
    return trimmed;
};

Player.prototype.getDataFromDb = function(document){
    // Set up the player based on the data stored in the databse
    // document is the mongodb document retrieved form the database
    var dbProperties = ['x','y','inventory'];
    for(var p = 0; p < dbProperties.length; p++){
        this[dbProperties[p]] = document[dbProperties[p]];
    }
    this.setOrUpdateAOI();
    this.updateInventory();
};

Player.prototype.updateInventory = function(){
    var ids = Object.keys(this.inventory);
    var items = [];
    for(var i = 0; i < ids.length; i++){
        items.push([ids[i],this.inventory[ids[i]]]);
    }
    this.updatePacket.addItems(items); // update personal update packet
};

Player.prototype.getIndividualUpdatePackage = function(){
    if(this.updatePacket.isEmpty()) return null;
    var pkg = this.updatePacket;
    this.updatePacket = new PersonalUpdatePacket();
    return pkg;
};

module.exports.Player = Player;