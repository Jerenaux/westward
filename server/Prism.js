/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 21-03-18.
 */

var GameServer = require('./GameServer.js').GameServer;
var mongoose = require('mongoose');

var Prism = {
    actions: {
        'buy': 0
    }
};

Prism.logEvent = function(player,action,objectID){
    if(!action in Prism.actions){
        console.log('ERROR: Unrecognized action');
        return;
    }
    var event = new Event(player.id,Prism.actions[action],objectID);
};

function Event(playerID,action,objectID){
    this.time = Date.now();
    this.pid = playerID;
    this.action = action;
    var flags = ['isEquipment','isConsumable','isResource','isMaterial','isCrafted','craftTier'];
    flags.forEach(function(flag){
        this[flag] = GameServer.itemsData[objectID][flag];
    },this);
    /*
    * Cats: equipment, consumable, resource (= extracted by buildings), material, crafted, craftTier
    * */
    // TODO: set flags for all possible categories of interest: resource, weapon, terminal item or material, what subtype...
    // Put isXXX() getters in GameObject, overloaded where necessary
    this.oid = objectID;
}

// TODO: make event child specific to item-related events
var eventSchema = mongoose.Schema({
    pid: {type: Number, min: 0},
    oid: {type: Number, min: 0},
    action: {type: Number, min: 0},
    objectType: {type: Number, min: 0},
    time: { type: Date, default: Date.now },
    isEquipment: Boolean,
    isConsumable: Boolean,
    isResource: Boolean,
    isMaterial: Boolean,
    isCrafted: Boolean,
    craftTier: {type: Number, min: 0}
});
var eventModel = mongoose.model('Event', eventSchema);

module.exports.Prism = Prism;