/**
 * Created by Jerome on 20-09-17.
 */

var Utils = require('../shared/Utils.js').Utils;
var PersonalUpdatePacket = require('./PersonalUpdatePacket.js').PersonalUpdatePacket;
var MovingEntity = require('./MovingEntity.js').MovingEntity;
var GameServer = require('./GameServer.js').GameServer;
var Inventory = require('../shared/Inventory.js').Inventory;

function Player(){
    this.updatePacket = new PersonalUpdatePacket();
    this.newAOIs = []; //list of AOIs about which the player hasn't checked for updates yet
    this.inventory = new Inventory();
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
    //this.x = Utils.randomInt(523,542);
    //this.y = Utils.randomInt(690,700);
    this.x = Utils.randomInt(GameServer.startArea.minx,GameServer.startArea.maxx);
    this.y = Utils.randomInt(GameServer.startArea.miny,GameServer.startArea.maxy);
    console.log('Hi at ('+this.x+', '+this.y+')');
};

Player.prototype.setStartingInventory = function(){
    //{ "0" : 20 , "1" : 1 , "2" : 1 , "3" : 1, "5": 14};
    this.giveItem(0,20);
    this.giveItem(1,1);
    this.giveItem(2,1);
    this.giveItem(3,1);
    this.giveItem(5,14);
    this.giveItem(9,3);
    this.updateInventory();
};

Player.prototype.hasItem = function(item,nb){
    return (this.inventory.getNb(item) >= nb);
};

Player.prototype.giveItem = function(item,nb){
    console.log('Giving ',GameServer.itemsData[item].name,'x',nb);
    this.inventory.add(item,nb);
};

Player.prototype.takeItem = function(item,nb){
    console.log('Taking ',GameServer.itemsData[item].name,'x',nb);
    this.inventory.take(item,nb);
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
    return trimmed;
};

Player.prototype.dbTrim = function(){
    // Return a smaller object, containing a subset of the initial properties, to be stored in the database
    var trimmed = {};
    var dbProperties = ['x','y']; // list of properties relevant to store in the database
    for(var p = 0; p < dbProperties.length; p++){
        trimmed[dbProperties[p]] = this[dbProperties[p]];
    }
    trimmed.inventory = this.inventory.toList();
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
    this.inventory.fromList(document.inventory);
    this.updateInventory();
};

Player.prototype.updateInventory = function(){
    this.updatePacket.addItems(this.inventory.toList()); // update personal update packet
};

Player.prototype.startIdle = function(){
    console.log('['+this.constructor.name+' '+this.id+'] arrived at destination');
};

Player.prototype.getIndividualUpdatePackage = function(){
    if(this.updatePacket.isEmpty()) return null;
    var pkg = this.updatePacket;
    this.updatePacket = new PersonalUpdatePacket();
    return pkg;
};

module.exports.Player = Player;