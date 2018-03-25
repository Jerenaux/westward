/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 21-03-18.
 */

var GameServer = require('./GameServer.js').GameServer;
var mongoose = require('mongoose');

// All events correspond to *actions* performed by *players*
// Frequency tables and means don't need logging

var eventSchema = new mongoose.Schema({
    pid: {type: Number, min: 0},
    time: { type: Date, default: Date.now }
});
var Event = mongoose.model('Event', eventSchema);

var TradeEvent = Event.discriminator(
    'TradeEvent',
    new mongoose.Schema({
        action: Number,
        price: Number,
        nb: Number,
        isEquipment: {type: Boolean, default: false},
        isConsumable: {type: Boolean, default: false},
        isResource: {type: Boolean, default: false},
        isMaterial: {type: Boolean, default: false},
        isCrafted: {type: Boolean, default: false},
        craftTier: {type: Number, min: -1, default: -1}
    }),
    {discriminatorKey: 'kind'}
);

var Prism = {
    actions: {
        'buy': 0,
        'sell': 1
    }
};

Prism.logEvent = function(player,actionKey,data){
    if(!actionKey in Prism.actions){
        console.log('ERROR: Unrecognized action key');
        return;
    }
    var action = Prism.actions[actionKey];
    data.action = action;
    data.pid = player.id;

    switch(action){
        case 0: // buy, fall-through to next
        case 1: // sell
            getItemData(data);
            var event = new TradeEvent(data);
            console.log(event);
            break;
    }
};

function getItemData(data){
    var fields = Object.keys(TradeEvent.schema.paths).filter(function(k){
        return k[0] != '_';
    });
    fields.forEach(function(field){
        data[field] = GameServer.itemsData[data.id][field];
    });
}

module.exports.Prism = Prism;