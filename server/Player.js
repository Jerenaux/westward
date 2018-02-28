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

var NB_SLOTS = 2;
var COMMIT_DURATION = 30*1000;

function Player(){
    this.updatePacket = new PersonalUpdatePacket();
    this.isPlayer = true;
    this.newAOIs = []; //list of AOIs about which the player hasn't checked for updates yet
    this.action = null;
    this.inventory = new Inventory();
    this.settlement = 0;
    this.gold = 0;
    this.inBuilding = -1;
    this.commitSlots = this.getCommitSlotsShell();
    this.civicxp = [0,100];
    this.setUpStats();
    this.equipment = Equipment.getSkeleton();
    this.chatTimer = null;
}

Player.prototype = Object.create(MovingEntity.prototype);
Player.prototype.constructor = Player;

Player.prototype.getCommitSlotsShell = function(){
    return {
        slots: [],
        max: NB_SLOTS
    }
};

Player.prototype.setIDs = function(dbID,socketID){
    this.id = GameServer.lastPlayerID++;
    this.dbID = dbID;
    this.socketID = socketID;
};

Player.prototype.registerPlayer = function(){
    var settlement = GameServer.settlements[this.settlement];
    settlement.registerPlayer(this);
};

Player.prototype.setStartingPosition = function(){
    this.x = Utils.randomInt(GameServer.startArea.minx,GameServer.startArea.maxx);
    this.y = Utils.randomInt(GameServer.startArea.miny,GameServer.startArea.maxy);
};

Player.prototype.setStartingInventory = function(){
    this.giveItem(0,20);
    this.giveItem(1,1);
    this.giveItem(2,1);
    this.giveItem(3,1);
    this.giveItem(5,14);
    this.giveItem(9,3);
    this.giveItem(9,3);
    this.giveItem(11,2);
    this.giveItem(12,1);
    this.giveItem(13,1);
    this.giveItem(14,1);
    this.giveItem(17,3);
    this.giveItem(18,1);
    this.giveItem(19,1);
    this.giveItem(20,9);
    this.giveGold(500);
};

Player.prototype.setUpStats = function(){
    this.stats = Stats.getSkeleton();
    this.foodModifier = null;
};

Player.prototype.setStat = function(key,value){
    this.getStat(key).setBaseValue(value);
    this.refreshStat(key);
};

Player.prototype.refreshStat = function(key){
    this.updatePacket.addStat(key,this.getStat(key).getValue());
};

Player.prototype.applyDamage = function(dmg){
    MovingEntity.prototype.applyDamage.call(this,dmg);
    this.refreshStat('hp');
};

Player.prototype.die = function(){
    MovingEntity.prototype.die.call(this);
    this.updatePacket.dead = true;
};

Player.prototype.respawn = function(){
    this.setProperty('dead',false);
    this.updatePacket.dead = false;
    this.setStat('hp',10); // TODO: adapt remaining health
    var respawnLocation = GameServer.settlements[this.settlement].respawnLocation;
    this.setProperty('x', respawnLocation.x);
    this.setProperty('y', respawnLocation.y);
    this.setOrUpdateAOI();
    // TODO: loose loot
};

Player.prototype.applyFoodModifier = function(foodModifier){
    for(var stat in this.stats){
        if(!this.stats.hasOwnProperty(stat)) return;
        var statObj = this.getStat(stat);
        if(this.foodModifier !== null) statObj.removeRelativeModifier(this.foodModifier);
        statObj.addRelativeModifier(foodModifier);
        this.refreshStat(stat);
    }
    this.foodModifier = foodModifier;
};

Player.prototype.hasFreeCommitSlot = function(){
    return this.getSlots().length < this.commitSlots.max;
};

Player.prototype.takeCommitmentSlot = function(buildingID){
    this.addToSlots({
        building: buildingID,
        stamp: Date.now()
    });
    this.syncCommitSlots();
};

Player.prototype.freeCommitmentSlot = function(){
    this.removeSlot();
    this.syncCommitSlots();
};

Player.prototype.trimCommitSlots = function(){
    var slots = [];
    this.getSlots().forEach(function(slot){
        slots.push(slot.building);
    });
    var trimmed = this.getCommitSlotsShell();
    trimmed.slots = slots;
    return trimmed;
};

Player.prototype.syncCommitSlots = function(){
    this.updatePacket.commitSlots = this.trimCommitSlots();
};

Player.prototype.addToSlots = function(data){
    this.commitSlots.slots.push(data);
};

Player.prototype.removeSlot = function(){
    this.commitSlots.slots.shift();
};

Player.prototype.getSlots = function(){
    return this.commitSlots.slots;
};

Player.prototype.gainCivicXP = function(inc){
    this.civicxp[0] = Utils.clamp(this.civicxp[0]+inc,0,this.civicxp[1]);
    this.updatePacket.civicxp = this.civicxp[0];
};

Player.prototype.giveGold = function(nb){
    this.gold += nb;
    this.updatePacket.updateGold(this.gold);
};

Player.prototype.takeGold = function(nb){
    this.gold -= nb;
    this.updatePacket.updateGold(this.gold);
};

Player.prototype.canBuy = function(price){ // check if building has gold and room
    if(this.inventory.isFull()) {
        console.log('Error: player inventory full');
        return false;
    }
    if(price > this.gold){
        console.log('Error: not enough gold for player');
        return false;
    }
    return true;
};

Player.prototype.hasItem = function(item,nb){
    return (this.inventory.getNb(item) >= nb);
};

Player.prototype.giveItem = function(item,nb){
    //console.log('Giving ',GameServer.itemsData[item].name,'x',nb);
    this.inventory.add(item,nb);
    this.updatePacket.addItem(item,this.inventory.getNb(item));
};

Player.prototype.takeItem = function(item,nb){
    console.log('Taking ',GameServer.itemsData[item].name,'x',nb);
    this.inventory.take(item,nb);
    this.updatePacket.addItem(item,this.inventory.getNb(item));
};

Player.prototype.isEquipped = function(slot,subSlot){
    return this.equipment[slot][subSlot] > -1;
};

Player.prototype.getEquipped = function(slot,subSlot){
    return this.equipment[slot][subSlot];
};

Player.prototype.getFreeSubslot = function(slot){
    for(var i = 0; i < this.equipment[slot].length; i++){
        if(this.equipment[slot][i] == -1) return i;
    }
    return -1;
};

Player.prototype.canEquip = function(slot,item,fromDB){
    if(fromDB) return true;
    if(!this.hasItem(item, 1)) return false;
    var containerSlot = Equipment.dict[slot].containedIn;
    if(containerSlot && this.equipment[containerSlot][0] == -1) return false;
    return true;
};

Player.prototype.equip = function(slot,item,fromDB){
    if(!this.equipment.hasOwnProperty(slot)) return;
    if(!this.canEquip(slot,item,fromDB)) return;
    var conflictSlot = Equipment.dict[slot].conflict; // Name of the slot with which the new object could conflict
    var subSlot = this.getFreeSubslot(slot); // index of the first free subslot
    if(subSlot == -1) { // no free subslot found
        subSlot = 0;
        this.unequip(slot,subSlot); // free up the first subslot
    }
    if(conflictSlot && this.isEquipped(conflictSlot,0)) this.unequip(conflictSlot,0); // todo handle multiple subslots

    // equip item
    this.equipment[slot][subSlot] = item;
    this.updatePacket.addEquip(slot,subSlot,item);

    this.applyAbsoluteModifiers(item);
    var nb = 1;

    // Manage related container, if any
    var containerSlot = Equipment.dict[slot].containedIn;
    if(containerSlot) {
        nb = this.computeLoad(containerSlot,item); // compute how much will be added to the container
        this.load(containerSlot, nb);
    }

    if(!fromDB) this.takeItem(item, nb);
};

Player.prototype.unequip = function(slot,subSlot){
    var item = this.equipment[slot][subSlot];
    if(item == -1) return;
    var containerSlot = Equipment.dict[slot].containedIn;
    var containedSlot = Equipment.dict[slot].contains;
    var nb = containerSlot ? this.equipment.containers[containerSlot] : 1;
    if(containerSlot) this.unload(containerSlot);
    if(containedSlot) this.unequip(containedSlot,0);
    this.applyAbsoluteModifiers(item,-1);
    this.equipment[slot][subSlot] = -1;
    this.giveItem(item,nb);
    this.updatePacket.addEquip(slot,subSlot,-1);
};

Player.prototype.applyAbsoluteModifiers = function(item,change){
    var change = change || 1;
    var itemData = GameServer.itemsData[item];
    if(!itemData.effects) return;
    for (var stat in itemData.effects) {
        if (!itemData.effects.hasOwnProperty(stat)) continue;
        if(change == 1){
            this.applyAbsoluteModifier(stat, itemData.effects[stat]);
        }else if(change == -1) {
            this.removeAbsoluteModifier(stat, itemData.effects[stat]);
        }
    }
};

Player.prototype.applyAbsoluteModifier = function(stat,modifier){
    this.getStat(stat).addAbsoluteModifier(modifier);
    this.refreshStat(stat);
};

Player.prototype.removeAbsoluteModifier = function(stat,modifier){
    this.getStat(stat).removeAbsoluteModifier(modifier);
    this.refreshStat(stat);
};

// Compute how much of item `item` can be added to container `containerSlot`
Player.prototype.computeLoad = function(containerSlot,item){
    var currentNb = this.equipment.containers[containerSlot];
    var containerItem = this.equipment[containerSlot][0];
    var capacity = GameServer.itemsData[containerItem].capacity;
    return Math.min(this.inventory.getNb(item), capacity - currentNb);
};

Player.prototype.load = function(containerSlot,nb){
    this.equipment.containers[containerSlot] += nb;
    this.updatePacket.addAmmo(containerSlot,this.equipment.containers[containerSlot]);
};

Player.prototype.unload = function(containerSlot){
    this.equipment.containers[containerSlot] = 0;
    this.updatePacket.addAmmo(containerSlot,0);
};

Player.prototype.decreaseAmmo = function(){
    var container = this.getRangedContainer(this.getRangedWeapon());
    this.equipment.containers[container] = Math.max(this.equipment.containers[container]-1,0);
    this.updatePacket.addAmmo(container,this.equipment.containers[container]);
};

Player.prototype.getRangedWeapon = function(){
    return this.getEquipped('rangedw',0);
};

Player.prototype.getRangedContainer = function(rangedWeapon){
    return GameServer.itemsData[rangedWeapon].ammo;
};

Player.prototype.getAmmo = function(containerSlot){
    return this.equipment.containers[containerSlot];
};

Player.prototype.canRange = function(){
    var weapon = this.getRangedWeapon();
    if(weapon == -1) return false;
    return this.getAmmo(this.getRangedContainer(weapon)) > 0;
};

Player.prototype.applyEffects = function(item,coef){
    var coef = coef || 1;
    var itemData = GameServer.itemsData[item];
    if(!itemData.effects) return;
    for (var stat in itemData.effects) {
        if (!itemData.effects.hasOwnProperty(stat)) continue;
        this.applyEffect(stat, coef*itemData.effects[stat]);
    }
};

Player.prototype.applyEffect = function(stat,delta){
    this.getStat(stat).increment(delta);
    this.refreshStat(stat);
};

Player.prototype.initTrim = function(){
    // Return a smaller object, containing a subset of the initial properties, to be sent to the client
    var trimmed = {};
    var broadcastProperties = ['id','settlement','gold','civicxp']; // list of properties relevant for the client
    for(var p = 0; p < broadcastProperties.length; p++){
        trimmed[broadcastProperties[p]] = this[broadcastProperties[p]];
    }
    trimmed.x = parseInt(this.x);
    trimmed.y = parseInt(this.y);
    trimmed.commitSlots = this.trimCommitSlots();
    return trimmed;
};

Player.prototype.trim = function(){
    // Return a smaller object, containing a subset of the initial properties, to be sent to the client
    var trimmed = {};
    var broadcastProperties = ['id','path','settlement','inFight','inBuilding','chat',
        'battlezone','dead']; // list of properties relevant for the client
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
    var dbProperties = ['x','y','equipment','gold','commitSlots','civicxp']; // list of properties relevant to store in the database
    for(var p = 0; p < dbProperties.length; p++){
        trimmed[dbProperties[p]] = this[dbProperties[p]];
    }
    trimmed.inventory = this.inventory.toList();
    trimmed.stats = {};
    for(var statKey in Stats.dict){
        if(!Stats.dict.hasOwnProperty(statKey)) return;
        trimmed.stats[statKey] = this.getStat(statKey).getBaseValue();
    }
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
    for(var equip in Equipment.dict) {
        if (!Equipment.dict.hasOwnProperty(equip)) continue;
        var eq = Equipment.dict[equip];
        for(var i = 0; i < eq.nb; i++) {
            if(!document['equipment'].hasOwnProperty(equip)) continue;
            var dbvalue = document['equipment'][equip][i];
            if(dbvalue > -1) this.equip(equip,dbvalue,true); // true: data from DB
        }
        if(eq.containedIn) this.load(eq.containedIn,document['equipment']['containers'][eq.containedIn]);
    }
    for(var i = 0; i < document.inventory.length; i++){
        var item = document.inventory[i];
        this.giveItem(item[0],item[1]);
    }
    if(!document.gold) document.gold = 0;
    this.commitSlots = document.commitSlots || this.getCommitSlotsShell();
    this.civicxp = document.civicxp || [0,100];
    this.giveGold(document.gold);
    this.setOrUpdateAOI();
};

Player.prototype.setAction = function(action){
    this.action = action;
};

Player.prototype.onEndOfPath = function(){
    //console.log('['+this.constructor.name+' '+this.id+'] arrived at destination');
    MovingEntity.prototype.onEndOfPath.call(this);
    if(this.inFight) return;
    if(!this.action) return;
    if(this.action.type == 1) this.enterBuilding(this.action.id);
};

Player.prototype.enterBuilding = function(id){
    this.setProperty('inBuilding', id);
};

Player.prototype.exitBuilding = function(){
    this.setProperty('inBuilding', -1);
};

Player.prototype.isInBuilding = function(){
    return this.inBuilding > -1;
};

Player.prototype.notifyFight = function(flag){
    this.updatePacket.fightNotification(flag);
};

Player.prototype.setChat = function(text){
    if(this.chatTimer) clearTimeout(this.chatTimer);
    this.setProperty('chat',text);
    var _player = this;
    this.chatTimer = setTimeout(function(){
        _player.chat = undefined;
    },5000);
};

Player.prototype.addMsg = function(msg){
    this.updatePacket.addMsg(msg);
};

Player.prototype.getIndividualUpdatePackage = function(){
    if(this.updatePacket.isEmpty()) return null;
    var pkg = this.updatePacket;
    this.updatePacket = new PersonalUpdatePacket();
    return pkg;
};

Player.prototype.update = function() {
    var slots = this.getSlots();
    for(var i = 0; i < slots.length; i++){
        var slot = slots[i];
        if(Date.now() - slot.stamp > COMMIT_DURATION){
            var building = GameServer.buildings[slot.building];
            building.updateCommit(-1);
            this.freeCommitmentSlot();
            i--;
        }else{
            break;
        }
    }
};
module.exports.Player = Player;