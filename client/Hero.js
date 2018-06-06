/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 23-04-18.
 */

var Hero = new Phaser.Class({
    Extends: Player,

    initialize: function(){
        Player.call(this);
        this.isHero = true;
    },

    updateData: function(data){ // don't call this 'update' or conflict with Phaser method
        var callbacks = {
            'ammo': this.updateAmmo,
            'civiclvl': this.updateCivicLvl,
            'classlvl': this.updateClassLvl,
            'classxp': this.updateClassXP,
            'commitSlots': this.updateCommitSlots,
            'dead': this.handleDeath,
            'equipment': this.updateEquipment,
            'foodSurplus': this.updateFoodSurplus,
            'gold': this.updateGold,
            'items': this.updateInventory,
            'msgs': this.handleMsgs,
            'notifs': this.handleNotifs,
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

        Engine.firstSelfUpdate = false;
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

    updateCivicLvl: function(civiclvl){
        this.civiclvl = civiclvl;
        this.updateEvents.add('citizen');
        // TODO: add sound effect
    },

    updateCivicXP: function(civicxp){
        this.civicxp = civicxp;
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

    updateCommitSlots: function(commitSlots){
        this.commitSlots = commitSlots;
        this.updateEvents.add('commit');
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

    updateStats: function(stats){
        for(var i = 0; i < stats.length; i++){
            Engine.updateStat(stats[i].k,stats[i]);
        }
        this.updateEvents.add('stats');
        // TODO: add sound effect
    }
});