/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 23-04-18.
 */

function classDataShell(){
    for(var i = 0; i < 4; i++){
        this[i] = 0;
    }
}

var Hero = new Phaser.Class({
    Extends: Player,

    initialize: function Hero(){
        Player.call(this);
        this.isHero = true;

        this.buildRecipes = new Inventory(7);
    },

    setUp: function(data){
        // data comes from Player.initTrim() server-side
        Player.prototype.setUp.call(this,data);

        this.settlement = data.settlement;
        this.buildingMarkers = data.buildingMarkers || [];
        this.resourceMarkers = data.resourceMarkers || [];
        this.unread = 1;
        this.inventory = new Inventory();
        this.stats = new StatsContainer();
        this.equipment = new EquipmentManager();

        this.gold = data.gold;
        this.civiclvl = data.civiclvl;
        this.civicxp = data.civicxp;
        this.classxp = data.classxp || new classDataShell();
        this.classlvl = data.classlvl || new classDataShell();
        this.ap = data.ap || new classDataShell();
        this.name = data.name;
    },

    updateData: function(data){ // don't call this 'update' or else conflict with Player.update() for other player updates
        var callbacks = {
            'ammo': this.updateAmmo,
            'ap': this.updateAP,
            'bldRecipes': this.updateBuildRecipes,
            'civiclvl': this.updateCivicLvl,
            'classlvl': this.updateClassLvl,
            'classxp': this.updateClassXP,
            'dead': this.handleDeath,
            'equipment': this.updateEquipment,
            'foodSurplus': this.updateFoodSurplus,
            'gold': this.updateGold,
            'items': this.updateInventory,
            'buildingMarkers': this.updateMarkers,
            'msgs': this.handleMsgs,
            'notifs': this.handleNotifs,
            'resetTurn': BattleManager.resetTurn,
            'stats': this.updateStats
        };

        this.updateEvents = new Set();

        for(var field in callbacks){
            if(!callbacks.hasOwnProperty(field)) continue;
            if(field in data) callbacks[field].call(this,data[field]);
        }

        this.updateEvents.forEach(function (e) {
            Engine.updateMenus(e);
        }, this);

        if(data.fightStatus !== undefined) BattleManager.handleFightStatus(data.fightStatus);
        if(data.remainingTime) BattleManager.setCounter(data.remainingTime);
        if(data.activeID) BattleManager.manageTurn(data.activeID);
        if(data.x >= 0 && data.y >= 0) this.teleport(data.x,data.y);
       
        Engine.updateAllOrientationPins(); 

        Engine.firstSelfUpdate = false;
    },

    setCommitSlots: function(commitSlots){
        // Data structures are cleared in updateCommitSlots
        if(!this.commitTypes) this.commitTypes = new Inventory(commitSlots.max);
        if(!this.commitIDs) this.commitIDs = [];
        this.maxCommitSlots = commitSlots.max;

        commitSlots.slots.forEach(function(s){
            this.commitTypes.add(s.type,1);
            this.commitIDs.push(s.id);
        },this);
    },

    canCommit: function(){
        if(!this.hasFreeCommitSlot()) return;
        return !this.commitIDs.includes(Engine.currentBuiling.id);
    },

    hasFreeCommitSlot: function(){
        return (this.commitIDs.length != this.maxCommitSlots);
    },


// ### GETTERS ###

    getEquipped: function(slot){
        return this.equipment.get(slot); // Returns the ID of the item equipped at the given slot
    },

    getMaxAmmo: function(slot){
        var container = this.equipment.get(this.equipment.getContainer(slot));
        return Engine.itemsData[container].capacity;
    },

    getNbAmmo: function(slot){
        return this.equipment.getNbAmmo(slot);
    },

    getRangedCursor: function(){
        var rangedw = this.getEquipped('rangedw');
        if(rangedw == -1) return 'bow';
        return (Engine.itemsData[rangedw].ammo == 'quiver' ? 'bow' : 'gun');
    },

    getStat: function(stat){
        return this.stats[stat];
    },

    getStatValue: function(stat){
        return this.getStat(stat).getValue();
    },

    hasItem: function(item,nb){
        return (this.inventory.getNb(item) >= nb);
    },

    getItemNb: function (item) {
        return this.inventory.getNb(item);
    },

    isAmmoEquipped: function(slot){
        return this.equipment.hasAnyAmmo(slot);
    },

    // ### UPDATES #####

    handleDeath: function(dead){
        if(dead == true) Engine.manageDeath();
        if(dead == false) Engine.manageRespawn();
    },

    handleMsgs: function(msgs){
        for(var i = 0; i < msgs.length; i++){
            this.talk(msgs[i]);
        }
    },

    handleNotifs: function(notifs){
        UI.handleNotifications(notifs);
    },

    updateAmmo: function(ammo){
        for(var i = 0; i < ammo.length; i++){
            var am = ammo[i];
            this.equipment.setAmmo(am.slot,am.nb);
        }
        this.updateEvents.add('equip');
    },

    updateAP: function(ap){
        this.ap = ap;
        this.updateEvents.add('character');
        this.updateEvents.add('citizen');
        //TODO: add sound effect
    },

    updateBuildRecipes: function(bldRecipes){
        if(bldRecipes.length == 1 && bldRecipes[0] == -1){
            this.buildRecipes.clear();
            return;
        }
        bldRecipes.forEach(function(w){
            this.buildRecipes.add(w,1);
        },this);
    },

    postChunkUpdate: function(){
        if(this.chunk != this.previousChunk) Engine.updateEnvironment();
        this.previousChunk = this.chunk;
    },

    updateCivicLvl: function(civiclvl){
        this.civiclvl = civiclvl;
        this.updateEvents.add('citizen');
        // TODO: add sound effect
    },

    updateClassLvl: function(classlvl){
        this.classlvl = classlvl;
        this.updateEvents.add('character');
        // TODO: add sound effect
    },

    updateClassXP: function(classxp){
        this.classxp = classxp;
        this.updateEvents.add('character');
        // TODO: add sound effect
    },

    updateEquipment: function(equipment){
        for(var i = 0; i < equipment.length; i++){
            var eq = equipment[i];
            this.equipment.set(eq.slot,eq.item);
        }
        this.updateEvents.add('equip');
    },

    updateFoodSurplus: function(foodSurplus){
        this.foodSurplus = foodSurplus;
        this.updateEvents.add('character');
    },

    updateGold: function(gold){
        this.gold = gold;
        this.updateEvents.add('gold');
        // TODO: move sound effect
    },

    updateInventory: function(items){
        this.inventory.updateItems(items);
        this.updateEvents.add('inv');

        if(!Engine.firstSelfUpdate) {
            items.forEach(function (item) {
                var sound = Engine.itemsData[item[0]].sound;
                if(sound) Engine.scene.sound.add(sound).play();
            });
        }
    },

    updateMarkers: function(markers){
        this.buildingMarkers = markers;
        if(Engine.miniMap) Engine.miniMap.map.updatePins();
    },

    updateStats: function(stats){
        for(var i = 0; i < stats.length; i++){
            this.updateStat(stats[i].k,stats[i]);
        }
        this.updateEvents.add('stats');
        // TODO: add sound effect
    },

    updateStat: function(key,data){
        var statObj = this.getStat(key);
        statObj.setBaseValue(data.v);
        statObj.relativeModifiers = [];
        statObj.absoluteModifiers = [];
        if(data.r){
            data.r.forEach(function(m){
                statObj.relativeModifiers.push(m);
            })
        }
        if(data.a){
            data.a.forEach(function(m){
                statObj.absoluteModifiers.push(m);
            })
        }
    }
});