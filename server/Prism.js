/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 21-03-18.
 */

var mongoose = require('mongoose');

var Prism = {
    actions: {
        'buy': 0
    }
};

Prism.logEvent = function(player,action,object){
    if(!action in Prism.actions){
        console.log('ERROR: Unrecognized action');
        return;
    }
    var event = new Event(player.id,Prism.actions[action],object);
};

function Event(playerID,action,object){
    this.time = Date.now();
    this.pid = playerID;
    this.action = action;
    // TODO: set flags for all possible categories of interest: resource, weapon, terminal item or material, what subtype...
    // Put isXXX() getters in GameObject, overloaded where necessary
    this.oid = object.id;
}

var eventSchema = mongoose.Schema({
    pid: {type: Number, min: 0},
    oid: {type: Number, min: 0},
    action: {type: Number, min: 0},
    objectType: {type: Number, min: 0},
    time: { type: Date, default: Date.now }
});
var eventModel = mongoose.model('Event', eventSchema);

module.exports.Prism = Prism;