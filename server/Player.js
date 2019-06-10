/**
 * Created by Jerome on 20-09-17.
 */

var Utils = require('../shared/Utils.js').Utils;
var PersonalUpdatePacket = require('./PersonalUpdatePacket.js').PersonalUpdatePacket;
var GameObject = require('./GameObject.js').GameObject;
var MovingEntity = require('./MovingEntity.js').MovingEntity;
var GameServer = require('./GameServer.js').GameServer;
var Inventory = require('../shared/Inventory.js').Inventory;
var Stats = require('../shared/Stats.js').Stats;
var StatsContainer = require('../shared/Stats.js').StatsContainer;
var Equipment = require('../shared/Equipment.js').Equipment;
var EquipmentManager = require('../shared/Equipment.js').EquipmentManager;
var Formulas = require('../shared/Formulas.js').Formulas;
var Prism = require('./Prism.js').Prism;

function Player() {
    this.updatePacket = new PersonalUpdatePacket();
    this.isPlayer = true;
    this.battleTeam = 'Player';
    this.entityCategory = 'Player';
    this.updateCategory = 'players';
    this.sentient = true; // used in battle to know if a battle shoud end
    this.schemaModel = GameServer.PlayerModel;
    this.battlePriority = 1;

    this.newAOIs = []; //list of AOIs about which the player hasn't checked for updates yet
    this.oldAOIs = [];
    this.action = null;
    this.inventory = new Inventory();
    this.belt = new Inventory(3); //TODO: conf
    this.sid = 0;
    this.settlement = null;
    this.gold = 0;
    this.inBuilding = -1;

    this.classxp = {
        0: 0,
        1: 0,
        2: 0,
        3: 0
    };
    this.classlvl = {
        0: 0,
        1: 0,
        2: 0,
        3: 0
    };
    this.ap = {
        0: 0,
        1: 0,
        2: 0,
        3: 0,
        4: 0 // civic AP
    };
    this.baseBldrecipes = GameServer.clientParameters.config.defaultBuildRecipes;
    this.bldRecipes = [];

    this.cellsWidth = 1;
    this.cellsHeight = 1;
    this.w = this.cellsWidth; // For quadtree
    this.h = this.cellsHeight;

    this.setUpStats();
    this.equipment = new EquipmentManager();
    this.history = [];
    this.fieldOfVision = [];
    this.visitedAOIs = new Set(); // List of AOIs visitted since last fort debrief
    this.steps = 0;
    MovingEntity.call(this);

    this.extraMarkers = [];
}

Player.prototype = Object.create(MovingEntity.prototype);
Player.prototype.constructor = Player;

Player.prototype.setIDs = function (dbID, socketID) {
    //this.id = GameServer.lastPlayerID++;
    this.dbID = dbID;
    this.socketID = socketID;
};

Player.prototype.setInstance = function () {
    this.instance = GameServer.nextInstanceID++;
    if (GameServer.nextInstanceID % 100 == 0) GameServer.nextInstanceID = 0;
};

Player.prototype.isInstanced = function () {
    return this.instance > -1;
};

Player.prototype.getInstance = function () {
    return GameServer.instances[this.instance];
};

Player.prototype.updateBldRecipes = function () {
    this.bldRecipes = [];
    this.baseBldrecipes.forEach(function (b) {
        if (this.countOwnedBuildings(b) < 1) this.bldRecipes.push(b);
    }, this);
    if (this.bldRecipes.length == 0) this.bldRecipes = [-1];
    this.setOwnProperty('bldRecipes', this.bldRecipes);
};

// Called by finalizePlayer
Player.prototype.listBuildings = function () {
    this.buildings = [];
    for (var bid in GameServer.buildings) {
        var building = GameServer.buildings[bid];
        if (building.owner == this.id) this.buildings.push(building);
    }
    // console.log('Player owns',this.buildings.length,'buildings');
    this.updateBldRecipes();
};

Player.prototype.countOwnedBuildings = function (type) {
    if (type == -1) return this.buildings.length;
    var count = 0;
    this.buildings.forEach(function (b) {
        if (b.type == type) count++;
    });
    return count;
};

Player.prototype.isExplorer = function () {
    return this.class == GameServer.classes.explorer;
};

Player.prototype.isCraftsman = function () {
    return this.class == GameServer.classes.craftsman;
};

Player.prototype.isMerchant = function () {
    return this.class == GameServer.classes.merchant;
};

Player.prototype.setName = function (name) {
    this.name = name;
};

Player.prototype.setRegion = function (sid) {
    this.sid = sid;
    this.region = GameServer.regions[this.sid];
    this.respawnLocation = {
        x: this.region.x,
        y: this.region.y
    }
};

Player.prototype.getRegionName = function () {
    return this.region.name;
};

Player.prototype.updateSteps = function () {
    this.steps++;
    var limit = 1000; // arbitrary limit to avoid overflows
    if (this.steps > limit) this.steps -= limit;

    if (this.steps % GameServer.characterParameters.steps == 0) this.updateVigor(-GameServer.characterParameters.stepsLoss);
};

Player.prototype.updateVigor = function (inc, ignoreFood) {
    var vigor = this.getStat('vigor');
    if (!ignoreFood) { // e.g. when regaining vigor through rest
        var food = this.getStat('food');
        inc *= 1 + ((food.getCap() - food.getValue()) / food.getCap());
    }
    var changed = vigor.increment(inc);
    if (changed) {
        this.refreshStat('vigor');
        this.applyVigorModifier();
    }
};

Player.prototype.updateFood = function (inc) {
    var changed = this.getStat('food').increment(inc);
    if (changed) this.refreshStat('food');
};

Player.prototype.applyVigorModifier = function () {
    var vigor = this.getStat('vigor');
    var delta = vigor.getCap() - vigor.getValue();
    var malus = Utils.clamp(delta - 30, 0, vigor.getCap());
    if (malus == 0) return;
    this.getStats().forEach(function (stat) {
        if (Stats[stat].noModifier) return;
        var statObj = this.getStat(stat);
        statObj.clearRelativeModifiers();
        statObj.addRelativeModifier(-malus);
        this.refreshStat(stat);
    }, this);
};

Player.prototype.setStartingInventory = function () {
    // TODO: move to some config file
    var list = [
        [7, 1],
        [21, 1]
    ];

    list.forEach(function (l) {
        this.giveItem(l[0], l[1]);
        GameServer.createItem(l[0], l[1], 'start');
    }, this);

    this.giveGold(300);
};

Player.prototype.setUpStats = function () {
    this.stats = new StatsContainer();
    var v = GameServer.characterParameters.variables;
    var list = ['hpmax', 'dmg', 'def'];
    list.forEach(function (s) {
        this.setStat(s, v[s]);
    }, this);
    this.maxStat('hp');
};

Player.prototype.maxStat = function (key) {
    var s = this.getStat(key);
    s.setBaseValue(s.maxStat.getValue());
    this.refreshStat(key);
};

Player.prototype.setStat = function (key, value) {
    this.getStat(key).setBaseValue(value);
    this.refreshStat(key);
};

Player.prototype.refreshStat = function (key) {
    this.updatePacket.addStat(this.getStat(key).trim());
};

Player.prototype.applyDamage = function (dmg) {
    MovingEntity.prototype.applyDamage.call(this, dmg);
    this.refreshStat('hp');
};

Player.prototype.die = function () {
    MovingEntity.prototype.die.call(this);
    // this.updatePacket.dead = true;
    this.setOwnProperty('dead', true);
};

Player.prototype.spawn = function (x, y) {
    var xpos = x || this.respawnLocation.x;
    var ypos = y || this.respawnLocation.y;
    var pos = this.findNextFreeCell(xpos, ypos);
    x = pos.x;
    y = pos.y;
    this.setProperty('x', x);
    this.setProperty('y', y);
    this.setOwnProperty('x', x);
    this.setOwnProperty('y', y);
    this.onAddAtLocation();
    console.log('spawning at ', this.x, this.y, '(aiming at', xpos, ypos, ')');
    var battleCell = GameServer.checkForBattle(this.x, this.y);
    if (battleCell) GameServer.expandBattle(battleCell.battle, this);
};

Player.prototype.respawn = function () {
    this.setProperty('dead', false);
    this.setOwnProperty('dead', false);
    this.setStat('hp', 10); // TODO: adapt remaining health
    this.onRemoveFromLocation();
    this.spawn();
    this.setOrUpdateAOI();
    this.save();
    // TODO: loose loot?
};

Player.prototype.gainClassXP = function (classID, inc, notify) {
    if (notify) this.addNotif('+' + inc + ' ' + GameServer.classData[classID].name + ' XP');
    var max = Formulas.computeMaxClassXP(this.classlvl[classID]);
    this.classxp[classID] = Utils.clamp(this.classxp[classID] + inc, 0, GameServer.characterParameters.maxClassXP);
    if (this.classxp[classID] >= max) {
        if (this.classlvl[classID] == GameServer.characterParameters.maxClassLvl) {
            this.classxp[classID] = max;
        } else {
            this.classxp[classID] -= max;
            this.classLvlUp(classID, notify);
        }
    }
    // this.updatePacket.classxp = this.classxp;
    this.setOwnProperty('clasxp', this.classxp);
};

Player.prototype.classLvlUp = function (classID, notify) {
    this.classlvl[classID]++;
    var nb = 3; // TODO: vary number
    this.ap[classID] += nb;
    // this.updatePacket.classlvl = this.classlvl;
    // this.updatePacket.ap = this.ap;
    this.setOwnProperty('classlvl', this.classlvl);
    this.setOwnProperty('ap', this.ap);
    if (notify) {
        this.addNotif('Reached ' + GameServer.classData[classID].name + ' level ' + this.classlvl[classID] + '!');
        this.addNotif('Earned ' + nb + ' AP!');
    }
};

Player.prototype.giveGold = function (nb, notify) {
    // this.gold = Utils.clamp(this.gold+nb,0,GameServer.characterParameters.maxGold);
    // this.updatePacket.updateGold(this.gold);
    this.setOwnProperty('gold', Utils.clamp(this.gold + nb, 0, GameServer.characterParameters.maxGold));
    if (notify) {
        this.addNotif('Received ' + nb + ' ' + Utils.formatMoney(nb));
        this.save();
    }
};

Player.prototype.takeGold = function (nb, notify) {
    // this.gold = Utils.clamp(this.gold-nb,0,GameServer.characterParameters.maxGold);
    // this.updatePacket.updateGold(this.gold);
    this.setOwnProperty('gold', Utils.clamp(this.gold - nb, 0, GameServer.characterParameters.maxGold));
    if (notify) {
        this.addNotif('Gave ' + nb + ' ' + Utils.formatMoney(nb));
        this.save();
    }
    return nb;
};

Player.prototype.canBuy = function (price) { // check if building has gold and room
    if (this.inventory.isFull()) {
        console.log('Error: player inventory full');
        return false;
    }
    if (price > this.gold) {
        console.log('Error: not enough gold for player');
        return false;
    }
    return true;
};

Player.prototype.canCraft = function (item, nb) {
    var recipe = GameServer.itemsData[item].recipe;
    for (var itm in recipe) {
        if (!this.hasItem(itm, recipe[itm] * nb)) return false;
    }
    return true;
};

Player.prototype.getGold = function () {
    return this.gold;
};

Player.prototype.getItemNb = function (item) {
    return this.inventory.getNb(item);
};

Player.prototype.getItemNbInBelt = function (item) {
    return this.belt.getNb(item);
};

Player.prototype.hasItem = function (item, nb) {
    return (this.inventory.getNb(item) >= nb);
};

Player.prototype.hasItemInBelt = function (item) {
    return (this.belt.getNb(item) >= 0);
};

Player.prototype.giveItem = function (item, nb, notify, verb) {
    this.inventory.add(item, nb);
    this.updatePacket.addItem(item, this.inventory.getNb(item));
    if (notify) {
        // this.addNotif('+'+nb+' '+GameServer.itemsData[item].name);
        verb = verb || 'Received';
        this.addNotif(verb + ' ' + nb + ' ' + GameServer.itemsData[item].name);
        this.save();
    }
    return this;
};

Player.prototype.takeItem = function (item, nb, notify, verb) {
    this.inventory.take(item, nb);
    this.updatePacket.addItem(item, this.inventory.getNb(item));
    if (notify) {
        verb = verb || 'Sold';
        this.addNotif(verb + ' ' + nb + ' ' + GameServer.itemsData[item].name);
        this.save();
    }
};

Player.prototype.addToBelt = function (item, nb) {
    this.belt.add(item, nb);
    this.updatePacket.addBelt(item, this.belt.getNb(item));
};

Player.prototype.takeFromBelt = function (item, nb) {
    this.belt.take(item, nb);
    this.updatePacket.addBelt(item, this.belt.getNb(item));
};

Player.prototype.isEquipped = function (slot) {
    return this.equipment.get(slot) > 1;
};

Player.prototype.getEquipped = function (slot) {
    return this.equipment.get(slot);
};

Player.prototype.canEquip = function (slot, item) {
    if (!this.hasItem(item, 1) && !this.hasItemInBelt(item, 1)) return false;
    // If it's ammo, check that the proper container is equipped
    if (slot in Equipment.ammo) {
        var container = this.equipment.getContainer(slot);
        if (this.equipment.get(container) == -1) return false;
    }
    return true;
};

Player.prototype.equip = function (slot, item, fromDB) {
    if (!fromDB && !this.canEquip(slot, item)) return false;
    // console.log('Equipping');
    var slotData = Equipment.getData(slot);
    var itemData = GameServer.itemsData[item];

    if (this.isEquipped(slot)) this.unequip(slot);

    var conflictSlot = slotData.conflict; // Name of the slot with which the new object could conflict
    if (conflictSlot && this.isEquipped(conflictSlot)) this.unequip(conflictSlot, true);

    // equip item
    this.equipment.set(slot, item);
    this.updatePacket.addEquip(slot, item);

    this.applyAbsoluteModifiers(item);
    var nb = 1;

    // Manage ammo
    if (slot in Equipment.ammo) {
        var container = this.equipment.get(this.equipment.getContainer(slot));
        nb = this.computeLoad(slot, container, item); // compute how much will be added to the container
        this.load(slot, nb);
    }

    if (!fromDB) {
        this.addNotif('Equipped ' + nb + ' ' + itemData.name + (nb > 1 ? 's' : ''));
        if (this.hasItemInBelt(item)) {
            this.takeFromBelt(item, nb);
        } else {
            this.takeItem(item, nb);
        }
        if (!this.inFight) this.save();
    }
    return true;
};

/**
 *
 * @param slot {string} - Key in Equipment.
 * @param notify {boolean} - Send a notification to player or not.
 */
Player.prototype.unequip = function (slot, notify) {
    var item = this.equipment.get(slot);
    if (item == -1) return;

    if(GameServer.itemsData[item].permanent) return;

    var nb = 1;
    if (slot in Equipment.ammo) nb = this.unload(slot);
    if (slot in Equipment.containers) {
        var ammo = this.equipment.getAmmoType(slot);
        this.unequip(ammo, true);
    }

    this.giveItem(item, nb);

    this.equipment.set(slot, -1);
    this.updatePacket.addEquip(slot, -1);
    this.applyAbsoluteModifiers(item, -1);

    // Replace with permanent equipment
    if(slot in Equipment.slots) {
        var defaultItem = Equipment.slots[slot].defaultItem;
        this.equip(slot, defaultItem);
    }

    if (notify) {
        this.addNotif('Unequipped ' + nb + ' ' + GameServer.itemsData[item].name + (nb > 1 ? 's' : ''));
        this.save();
    }
};

Player.prototype.applyAbsoluteModifiers = function (item, change) {
    var change = change || 1;
    var itemData = GameServer.itemsData[item];
    if (!itemData.effects) return;
    for (var stat in itemData.effects) {
        if (!itemData.effects.hasOwnProperty(stat)) continue;
        if (change == 1) {
            this.applyAbsoluteModifier(stat, itemData.effects[stat]);
        } else if (change == -1) {
            this.removeAbsoluteModifier(stat, itemData.effects[stat]);
        }
    }
};

Player.prototype.applyAbsoluteModifier = function (stat, modifier) {
    this.getStat(stat).addAbsoluteModifier(modifier);
    this.refreshStat(stat);
};

Player.prototype.removeAbsoluteModifier = function (stat, modifier) {
    this.getStat(stat).removeAbsoluteModifier(modifier);
    this.refreshStat(stat);
};

// Compute how much of item `item` can be added to container `containerSlot`
Player.prototype.computeLoad = function (slot, container, ammoType) {
    var currentNb = this.equipment.getNbAmmo(slot);
    var capacity = GameServer.itemsData[container].capacity;
    return Math.min(this.inventory.getNb(ammoType), capacity - currentNb);
};

Player.prototype.load = function (ammo, nb) {
    this.equipment.load(ammo, nb);
    this.updatePacket.addAmmo(ammo, this.equipment.getNbAmmo(ammo));
};

Player.prototype.unload = function (ammo, notify) {
    var nb = this.equipment.getNbAmmo(ammo);
    var item = this.equipment.get(ammo);
    this.equipment.setAmmo(ammo, 0);
    this.updatePacket.addAmmo(ammo, 0);
    if (notify) this.addNotif('Unloaded ' + GameServer.itemsData[item].name);
    return nb;
};

Player.prototype.decreaseAmmo = function () {
    var ammoType = this.equipment.getAmmoType(this.getRangedContainer(this.getRangedWeapon()));
    var ammoID = this.equipment.get(ammoType);
    this.equipment.load(ammoType, -1);
    var nb = this.equipment.getNbAmmo(ammoType);
    if (nb == 0) this.unequip(ammoType);
    this.updatePacket.addAmmo(ammoType, nb);
    return ammoID;
};

Player.prototype.getRangedWeapon = function () {
    return this.getEquipped('rangedw');
};

Player.prototype.getRangedContainer = function (rangedWeapon) {
    return GameServer.itemsData[rangedWeapon].ammo;
};

Player.prototype.getAmmo = function (container) {
    var ammoType = this.equipment.getAmmoType(container);
    return this.equipment.getNbAmmo(ammoType);
};

Player.prototype.canRange = function () {
    var weapon = this.getRangedWeapon();
    if (weapon == -1) {
        this.addMsg('I don\'t have a ranged weapon equipped!');
        // this.updatePacket.resetTurn = true;
        this.setOwnProperty('resetTurn', true);
        return false;
    }
    if (this.getAmmo(this.getRangedContainer(weapon)) > 0) {
        return true;
    } else {
        this.addMsg('I\'m out of ammo!');
        // this.updatePacket.resetTurn = true;
        this.setOwnProperty('resetTurn', true);
        return false;
    }
};

Player.prototype.applyEffects = function (item, coef, notify) {
    var coef = coef || 1;
    var itemData = GameServer.itemsData[item];
    if (!itemData.effects) return false;
    for (var stat in itemData.effects) {
        if (!itemData.effects.hasOwnProperty(stat)) continue;
        this.applyEffect(stat, coef * itemData.effects[stat], notify);
    }
    return true;
};

// Apply effect of consumable object
Player.prototype.applyEffect = function (stat, delta, notify) {
    this.getStat(stat).increment(delta);
    this.refreshStat(stat);
    if (notify) {
        var change = delta;
        if (change >= 0) change = '+' + change;
        this.addNotif(Stats[stat].name + ' ' + change);
    }
};

/**
 * Create a smaller object containing the properties needed to initialize
 * the player character on the client-side. Called in `gs.createInitializationPacket()`
 * @returns {{}}
 */
Player.prototype.initTrim = function () {
    var trimmed = {};
    var broadcastProperties = ['id', 'gold', 'classxp', 'classlvl', 'ap',
        'name', 'history']; // list of properties relevant for the client
    for (var p = 0; p < broadcastProperties.length; p++) {
        trimmed[broadcastProperties[p]] = this[broadcastProperties[p]];
    }
    trimmed.settlement = this.sid;
    trimmed.x = parseInt(this.x);
    trimmed.y = parseInt(this.y);
    trimmed.fow = GameServer.fowList;
    trimmed.buildingMarkers = GameServer.listBuildingMarkers(this.instance);
    trimmed.resourceMarkers = GameServer.listResourceMarkers(this.instance).concat(this.extraMarkers);
    trimmed.rarity = GameServer.getRarity();
    return trimmed;
};

/**
 * Create a smaller object containing the properties needed for the *other clients*
 * (Properties needed by the player itself are put into his individualUpdatePacjage)
 * @returns {{}}
 */
Player.prototype.trim = function () {
    var trimmed = {};
    var broadcastProperties = ['id', 'path', 'inFight', 'inBuilding', 'chat',
        'battlezone', 'dead']; // list of properties relevant for the client
    broadcastProperties.forEach(function (field) {
        trimmed[field] = this[field];
    }, this);
    trimmed.settlement = this.sid;
    trimmed.x = parseInt(this.x);
    trimmed.y = parseInt(this.y);
    trimmed.quickSlots = this.equipment.quickslots.nb;
    // return trimmed;
    return GameObject.prototype.trim.call(this, trimmed);
};

/**
 * Update a property and simultaneously add it to the list of changes
 * to be sent to the client.
 * @param {string} property - Name of the field to modify.
 * @param value - Value to assign.
 */
Player.prototype.setOwnProperty = function (property, value) {
    this[property] = value;
    this.updatePacket[property] = value;
};

Player.prototype.getDataFromDb = function (data) {
    this.id = data.id;
    this.name = data.name;
    this.x = Utils.clamp(data.x, 0, World.worldWidth - 1);
    this.y = Utils.clamp(data.y, 0, World.worldHeight - 1);
    this.classxp = data.classxp;
    this.classlvl = data.classlvl;
    this.setOwnProperty('inBuilding', data.inBuilding);

    if (!data.stats) data.stats = [];
    data.stats.forEach(function (stat) {
        this.getStat(stat.stat).setBaseValue(stat.value);
        this.refreshStat(stat.stat);
    }, this);
    this.setStat('hp', Math.max(this.getStat('hp').getValue(), 10)); // quick fix
    this.applyVigorModifier();

    for (var slot in data.equipment.slots) {
        var item = data.equipment.slots[slot];
        if (item == -1) continue;
        this.equip(slot, item, true);
    }
    for (var slot in data.equipment.containers) {
        var item = data.equipment.containers[slot].id;
        if (item == -1) continue;
        this.equip(slot, item, true);
    }
    for (var slot in data.equipment.ammo) {
        var item = data.equipment.ammo[slot].id;
        var nb = data.equipment.ammo[slot].nb;
        if (item == -1 || nb == 0) continue;
        this.equip(slot, item, true);
        this.load(slot, nb);
    }
    data.inventory.forEach(function (i) {
        this.giveItem(i[0], i[1]);
    }, this);
    data.belt.forEach(function (i) {
        this.addToBelt(i[0], i[1]);
    }, this);

    this.setRegion(data.sid);
    this.giveGold(data.gold);
    this.history = data.history;

    var delta = (Date.now() - data.savestamp);
    var deltaturns = Math.floor(delta / (GameServer.turnDuration * 1000));
    this.fastForward(deltaturns);
};

Player.prototype.save = function () {
    if (this.inFight) return false;
    this.savestamp = Date.now();
    GameObject.prototype.save.call(this);
};

Player.prototype.setAction = function (action) {
    this.action = action;
};

Player.prototype.onAOItransition = function (newAOI, previousAOI) {
    if (!this.visitedAOIs.has(newAOI)) {
        this.visitedAOIs.add(newAOI);
        if (previousAOI) { // if previousAOI: don't grant XP for spawning in fort
            Prism.logEvent(this, 'explore', {aoi: newAOI});
            this.save();
        }
    }
};

Player.prototype.onEndOfPath = function () {
    MovingEntity.prototype.onEndOfPath.call(this);
    if (this.inFight) return;
    if (!this.action) return;
    if (this.action.type == 1) this.enterBuilding(this.action.id);
    if (this.action.type == 2) GameServer.lootNPC(this, 'animal', this.action.id);
    if (this.action.type == 3) GameServer.pickUpItem(this, this.action.id);
    if (this.action.type == 4) GameServer.lootNPC(this, 'civ', this.action.id);
};


Player.prototype.enterBuilding = function (id) {
    // TODO: check for proximity
    // TODO: add to a list of people in the building object
    this.setProperty('inBuilding', id);
    var building = GameServer.buildings[id];
    var type = building.type;
    var bldname = GameServer.buildingsData[type].name;
    var phrase = ['Entered', (building.isOwnedBy(this) ? 'my' : building.ownerName + '\'s'), bldname];
    this.addNotif(phrase.join(' ')); //true = silent
    if (!building.isOwnedBy(this)) {
        var phrase = [this.name, 'visitted my', bldname];
        GameServer.notifyPlayer(building.owner, phrase.join(' '));
    }
    Prism.logEvent(this, 'building', {building: type});
    return true;
};

Player.prototype.exitBuilding = function () {
    if (!this.isInBuilding()) return;
    /*var building = GameServer.buildings[this.inBuilding];
    var type = building.type;
    var bldname = GameServer.buildingsData[type].name;
    var phrase = ['Left',(building.isOwnedBy(this) ? 'my' : building.ownerName+'\'s'),bldname];
    this.addNotif(phrase.join(' ')); // true = silent*/
    this.setProperty('inBuilding', -1);
    this.setOwnProperty('inBuilding', -1);
};

Player.prototype.endFight = function (alive) {
    MovingEntity.prototype.endFight.call(this);
    if (this.xpPool && alive) this.gainClassXP(0, this.xpPool, true);
};

Player.prototype.isAvailableForFight = function () {
    return (!this.isInBuilding() && !this.isDead() && !this.inFight);
};

Player.prototype.isInBuilding = function () {
    return this.inBuilding != -1;
};

Player.prototype.isInside = function (buildingID) {
    return this.inBuilding == buildingID;
};

Player.prototype.notifyFight = function (flag) {
    this.setOwnProperty('fightStatus', flag);
};

Player.prototype.addMsg = function (msg) {
    this.updatePacket.addMsg(msg);
};

Player.prototype.addNotif = function (msg, silent) {
    if (!silent) this.updatePacket.addNotif(msg);
    this.history.push([Date.now(), msg]);
    var MAX_LENGTH = 20; // TODO: max limit in conf
    // if(this.history.length > MAX_LENGTH) this.history.splice(MAX_LENGTH,this.history.length-MAX_LENGTH);
    if (this.history.length > MAX_LENGTH) this.history.splice(0, this.history.length - MAX_LENGTH);
};

Player.prototype.getIndividualUpdatePackage = function () {
    // console.log(this.updatePacket,this.updatePacket.isEmpty());
    var pkg = this.updatePacket;
    if (GameServer.fowChanged) pkg.fow = GameServer.fowList;
    if (GameServer.buildingsChanged) pkg.buildingMarkers = GameServer.listBuildingMarkers(this.instance);
    if (pkg.isEmpty()) return null;
    this.updatePacket = new PersonalUpdatePacket();
    return pkg;
};

Player.prototype.fastForward = function (nbturns) {
    console.warn('Fast forward', nbturns, 'turns');
    var foodRate = GameServer.economyTurns['foodConsumptionRate'];
    var restRate = GameServer.economyTurns['restRate'];
    var nbStarvationTurns = Math.floor(nbturns / foodRate);
    var nbRestTurns = Math.floor(nbturns / restRate);
    this.starve(nbStarvationTurns);
    this.rest(nbRestTurns);
    this.save();
    console.warn('----');
};

Player.prototype.update = function () {
    if (GameServer.isTimeToUpdate('foodConsumptionRate')) this.starve(1);
    if (GameServer.isTimeToUpdate('restRate') && this.inBuilding > -1) this.rest(1);
};

Player.prototype.starve = function (nb) {
    console.log('Starving for', nb, 'cycles');
    this.updateFood(-(nb * GameServer.characterParameters.foodConsumption));
};

Player.prototype.rest = function (nb) {
    var building = GameServer.buildings[this.inBuilding];
    if (!building) {
        console.log('Not in a building');
        return;
    }
    if (!building.isBuilt()) return;
    var buildingData = GameServer.buildingsData[building.type];
    if (!buildingData.shelter) {
        // console.log('Building doesn\'t offer shelter');
        return;
    }
    if (!building.isOwnedBy(this)) return;
    console.log('Resting for', nb, 'cycles');
    this.updateVigor(nb * buildingData.restVigorAmount, true); // true = ignore food level
    var changed = this.getStat('hp').increment(nb * buildingData.restHealthAmount);
    if (changed) this.refreshStat('hp');
};

Player.prototype.remove = function () {
    console.log('removing player');
    if (this.battle) this.battle.removeFighter(this);
    this.onRemoveFromLocation();
    delete GameServer.players[this.id];
    GameServer.updateVision();
};

Player.prototype.getShootingPoint = function () {
    return {
        x: this.x + 1,
        y: this.y + 1
    };
};

module.exports.Player = Player;
