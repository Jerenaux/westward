/**
 * Created by Jerome on 20-09-17.
 */

var Utils = require('../shared/Utils.js').Utils;
var PFUtils = require('../shared/PFUtils.js').PFUtils;
var PersonalUpdatePacket = require('./PersonalUpdatePacket.js').PersonalUpdatePacket;
var MovingEntity = require('./MovingEntity.js').MovingEntity;
var GameServer = require('./GameServer.js').GameServer;
var Inventory = require('../shared/Inventory.js').Inventory;
var Stats = require('../shared/Stats.js').Stats;
var Equipment = require('../shared/Equipment.js').Equipment;
var Formulas = require('../shared/Formulas.js').Formulas;

var NB_SLOTS = 2;
var COMMIT_DURATION = 30*1000;

function Player(){
    this.updatePacket = new PersonalUpdatePacket();
    this.isPlayer = true;
    this.newAOIs = []; //list of AOIs about which the player hasn't checked for updates yet
    this.oldAOIs = [];
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

Player.prototype.setClass = function(className){
    this.class = className;
};

Player.prototype.setSettlement = function(sid){
    this.settlement = sid;
};

Player.prototype.setStartingInventory = function(){
    this.giveItem(1,1); //food
    this.giveItem(9,2); // pelt
    this.giveItem(20,5); // arrows
    this.giveItem(19,1); // quiver
    this.giveItem(2,1); // bow
    //this.giveItem(11,2); // sword
    this.giveItem(6,1); // potion

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
    this.updatePacket.addStat(this.getStat(key).trim());
};

Player.prototype.applyDamage = function(dmg){
    MovingEntity.prototype.applyDamage.call(this,dmg);
    this.refreshStat('hp');
};

Player.prototype.die = function(){
    MovingEntity.prototype.die.call(this);
    this.updatePacket.dead = true;
};

Player.prototype.spawn = function(){
    var respawnLocation = GameServer.settlements[this.settlement].respawnLocation;
    this.setProperty('x', respawnLocation.x);
    this.setProperty('y', respawnLocation.y);
    console.log('spawning at ',this.x,this.y);
};

Player.prototype.respawn = function(){
    this.setProperty('dead',false);
    this.updatePacket.dead = false;
    this.setStat('hp',10); // TODO: adapt remaining health
    this.spawn();
    this.setOrUpdateAOI();
    // TODO: loose loot
};

Player.prototype.applyFoodModifier = function(foodSurplus){ // %
    if(isNaN(foodSurplus)) return; // Could happen if no fort
    var foodModifier = Formulas.decimalToPct(Formulas.computePlayerFoodModifier(Formulas.pctToDecimal(foodSurplus)));
    this.getStats().forEach(function(stat){
        if(Stats.dict[stat].noModifier) return;
        var statObj = this.getStat(stat);
        if(this.foodModifier !== null) statObj.removeRelativeModifier(this.foodModifier);
        statObj.addRelativeModifier(foodModifier);
        this.refreshStat(stat);
    },this);
    this.foodModifier = foodModifier;
    this.updatePacket.foodSurplus = foodSurplus;
};

Player.prototype.hasFreeCommitSlot = function(){
    return this.getSlots().length < this.commitSlots.max;
};

Player.prototype.takeCommitmentSlot = function(buildingID,notify){
    this.addToSlots({
        building: buildingID,
        stamp: Date.now()
    });
    this.syncCommitSlots();
    if(notify) this.addNotif('Committed to '+GameServer.buildings[buildingID].name);
};

Player.prototype.freeCommitmentSlot = function(){
    var slot = this.removeSlot();
    this.syncCommitSlots();
    this.addNotif('Commitment to '+GameServer.buildings[slot.building].name+' ended');
};

Player.prototype.trimCommitSlots = function(){
    var slots = [];
    this.getSlots().forEach(function(slot){
        slots.push(GameServer.buildings[slot.building].type); // Sends the building type, not ID anymore!
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
    return this.commitSlots.slots.shift();
};

Player.prototype.getSlots = function(){
    return this.commitSlots.slots;
};

Player.prototype.gainCivicXP = function(inc,notify){
    this.civicxp[0] = Utils.clamp(this.civicxp[0]+inc,0,this.civicxp[1]);
    this.updatePacket.civicxp = this.civicxp[0];
    if(notify) this.addNotif('+'+inc+' civic XP');
};

Player.prototype.giveGold = function(nb,notify){
    this.gold = Utils.clamp(this.gold+nb,0,100000);
    this.updatePacket.updateGold(this.gold);
    if(notify) this.addNotif('+'+nb+' '+Utils.formatMoney(nb));
};

Player.prototype.takeGold = function(nb,notify){
    this.gold = Utils.clamp(this.gold-nb,0,100000);
    this.updatePacket.updateGold(this.gold);
    if(notify) this.addNotif('-'+nb+' '+Utils.formatMoney(nb));
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

Player.prototype.giveItem = function(item,nb,notify){
    this.inventory.add(item,nb);
    this.updatePacket.addItem(item,this.inventory.getNb(item));
    if(notify) this.addNotif('+'+nb+' '+GameServer.itemsData[item].name);
};

Player.prototype.takeItem = function(item,nb,notify){
    this.inventory.take(item,nb);
    this.updatePacket.addItem(item,this.inventory.getNb(item));
    if(notify) this.addNotif('-'+nb+' '+GameServer.itemsData[item].name);
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
    if(!fromDB) this.addNotif('Equipped '+GameServer.itemsData[item].name);

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

Player.prototype.unequip = function(slot,subSlot,notify){
    var item = this.equipment[slot][subSlot];
    if(item == -1) return;
    var containerSlot = Equipment.dict[slot].containedIn;
    var containedSlot = Equipment.dict[slot].contains;
    var nb = containerSlot ? this.equipment.containers[containerSlot] : 1;
    if(containerSlot) this.unload(containerSlot,notify);
    if(containedSlot) this.unequip(containedSlot,0,notify);
    this.applyAbsoluteModifiers(item,-1);
    this.equipment[slot][subSlot] = -1;
    this.giveItem(item,nb);
    this.updatePacket.addEquip(slot,subSlot,-1);
    if(notify) this.addNotif('Unequipped '+GameServer.itemsData[item].name);
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

Player.prototype.unload = function(containerSlot,notify){
    var item = this.equipment.containers[containerSlot];
    this.equipment.containers[containerSlot] = 0;
    this.updatePacket.addAmmo(containerSlot,0);
    //if(notify) this.addNotif('Unloaded '+GameServer.itemsData[item].name);
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

Player.prototype.applyEffects = function(item,coef,notify){
    var coef = coef || 1;
    var itemData = GameServer.itemsData[item];
    if(!itemData.effects) return;
    for (var stat in itemData.effects) {
        if (!itemData.effects.hasOwnProperty(stat)) continue;
        this.applyEffect(stat, coef*itemData.effects[stat],notify);
    }
};

// Apply effect of consumable object
Player.prototype.applyEffect = function(stat,delta,notify){
    this.getStat(stat).increment(delta);
    this.refreshStat(stat);
    if(notify) {
        var change = delta;
        if(change >= 0) change = '+'+change;
        this.addNotif(Stats.dict[stat].name+' '+change);
    }
};

Player.prototype.initTrim = function(){
    // Return a smaller object, containing a subset of the initial properties, to be sent to the client
    var trimmed = {};
    var broadcastProperties = ['id','settlement','gold','civicxp','class']; // list of properties relevant for the client
    for(var p = 0; p < broadcastProperties.length; p++){
        trimmed[broadcastProperties[p]] = this[broadcastProperties[p]];
    }
    trimmed.x = parseInt(this.x);
    trimmed.y = parseInt(this.y);
    trimmed.commitSlots = this.trimCommitSlots();
    trimmed.settlements = GameServer.listSettlements('mapTrim');
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
    var dbProperties = ['x','y','equipment','gold','commitSlots','civicxp','class']; // list of properties relevant to store in the database
    for(var p = 0; p < dbProperties.length; p++){
        trimmed[dbProperties[p]] = this[dbProperties[p]];
    }
    trimmed.inventory = this.inventory.toList();
    trimmed.stats = {};
    return trimmed;
};

Player.prototype.getDataFromDb = function(document){
    // TODO: think about how to handle references to other entities
    // eg. inBuilding (how to retrieve proper building if server went down since), commitment...
    // Set up the player based on the data stored in the databse
    // document is the mongodb document retrieved form the database
    var dbProperties = ['x','y'];
    for(var p = 0; p < dbProperties.length; p++){
        this[dbProperties[p]] = document[dbProperties[p]];
    }
    // stats are not saved, see schema
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
    if(document.class) this.setClass(document.class);
    if(document.settlement) this.setSettlement(document.settlement);
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
    if(this.action.type == 2) GameServer.skinAnimal(this,this.action.id);
};

Player.prototype.checkForHostiles = function(){
    var AOIs = Utils.listAdjacentAOIs(this.aoi);
    for(var i = 0; i < AOIs.length; i++){
        var aoi = GameServer.AOIs[AOIs[i]];
        for(var j = 0; j < aoi.entities.length; j++) {
            var entity = aoi.entities[j];
            if(!entity.isAnimal) continue;
            if(!entity.isAggressive()) continue;
            if(!entity.isAvailableForFight()) continue;
            if(Utils.euclidean(this,entity) < 10){
                console.log(this.getShortID(),'spots',entity.getShortID());
                GameServer.handleBattle(this,entity,true);
                break;
            }
        }
    }
};

Player.prototype.enterBuilding = function(id){
    // TODO: check for proximity
    // TODO: add to a list of people in the building object
    this.setProperty('inBuilding', id);
};

Player.prototype.exitBuilding = function(){
    // TODO: check if in building first
    this.setProperty('inBuilding', -1);
};

Player.prototype.isAvailableForFight = function(){
    return (!this.isInBuilding() && !this.isDead());
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

Player.prototype.addNotif = function(msg){
    this.updatePacket.addNotif(msg);
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

Player.prototype.remove = function(){
    if(this.battle) this.battle.removeFighter(this);
    GameServer.settlements[this.settlement].removePlayer(this);
    delete GameServer.players[this.id];
};

module.exports.Player = Player;