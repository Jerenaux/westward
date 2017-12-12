/**
 * Created by Jerome on 20-09-17.
 */

var Utils = require('../shared/Utils.js').Utils;
var PersonalUpdatePacket = require('./PersonalUpdatePacket.js').PersonalUpdatePacket;
var MovingEntity = require('./MovingEntity.js').MovingEntity;
var GameServer = require('./GameServer.js').GameServer;
var Inventory = require('../shared/Inventory.js').Inventory;
var Stats = require('../shared/Stats.js').Stats;
var Equipment = require('../shared/Equipment.js').Equipment;

function Player(){
    this.updatePacket = new PersonalUpdatePacket();
    this.newAOIs = []; //list of AOIs about which the player hasn't checked for updates yet
    this.inventory = new Inventory();
    this.settlement = 0;
    this.stats = Stats.getSkeleton();
    this.equipment = Equipment.getSkeleton();
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
    this.giveItem(0,20);
    this.giveItem(1,1);
    this.giveItem(2,1);
    this.giveItem(3,1);
    this.giveItem(5,14);
    this.giveItem(9,3);
    this.updateInventory();
};

Player.prototype.setStartingStats = function(){
    for(var i = 0; i < Stats.list.length; i++) {
        var key = Stats.list[i];
        this.setStat(key,Stats.dict[key].start);
    }
};

Player.prototype.setStat = function(key,value){
    this.stats[key] = value;
    this.updatePacket.addStat(key,this.stats[key]);
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

Player.prototype.isSlotBusy = function(slot){
    if(slot == 'acc'){
        for(var i = 0; i < Equipment.nbAccessories; i++) {
            if(this.equipment['acc'][i] == -1) return false;
        }
        return true;
    }else{
        return (this.equipment['slot'] > -1);
    }
};

Player.prototype.getEquip = function(slot){
    if(slot == 'acc'){

    }else{
        return this.equipment['slot'];
    }
};

Player.prototype.equip = function(slot,item,applyEffects){
    //if(this.equipment[slot] > -1) this.unequip(slot);
    if(this.isSlotBusy(slot)) this.unequip(slot);
    this.equipment[slot] = item;
    if(applyEffects) {
        this.applyEffects(item);
        if (this.hasItem(item, 1)) this.takeItem(item, 1);
    }
    this.updatePacket.addEquip(slot,item);
};

Player.prototype.unequip = function(slot){
    var item = this.equipment[slot];
    this.applyEffects(item,-1);
    this.equipment[slot] = -1;
    this.giveItem(item,1);
    this.updatePacket.addEquip(slot,-1);
};

Player.prototype.applyEffects = function(item,coef){
    var coef = coef || 1;
    var itemData = GameServer.itemsData[item];
    for (var stat in itemData.effects) {
        if (!itemData.effects.hasOwnProperty(stat)) continue;
        this.applyEffect(stat, coef*itemData.effects[stat]);
    }
};

Player.prototype.applyEffect = function(stat,delta){
    var newvalue = Utils.clamp(this.stats[stat],Stats.dict[stat].min,Stats.dict[stat].max);
    this.setStat(stat,newvalue);
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
    var dbProperties = ['x','y','stats','equipment']; // list of properties relevant to store in the database
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
    for(var i = 0; i < Stats.list.length; i++) {
        var key = Stats.list[i];
        if(document['stats'][key] >= 0) this.setStat(key,document['stats'][key]);
    }
    for(var i = 0; i < Equipment.list.length; i++){
        var equip = Equipment.list[i];
        this.equip(equip,document['equipment'][equip],false); // false: don't apply effects
    }
    for(var i = 0; i < Equipment.nbAccessories; i++){
        this.equip('acc',document['equipment']['acc'][i],false); // false: don't apply effects
    }
    this.setOrUpdateAOI();
    this.inventory.fromList(document.inventory);
    this.updateInventory();
};

Player.prototype.updateInventory = function(){
    this.updatePacket.addItems(this.inventory.toList()); // update personal update packet
};

Player.prototype.startIdle = function(){
    //console.log('['+this.constructor.name+' '+this.id+'] arrived at destination');
};

Player.prototype.getIndividualUpdatePackage = function(){
    if(this.updatePacket.isEmpty()) return null;
    var pkg = this.updatePacket;
    this.updatePacket = new PersonalUpdatePacket();
    return pkg;
};

module.exports.Player = Player;