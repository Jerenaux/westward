/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 21-03-18.
 */

var GameServer = require('./GameServer.js').GameServer;
var mongoose = require('mongoose');

// All events correspond to *actions* performed by *players*
// Frequency tables and means don't need logging

var eventSchema = new mongoose.Schema({
    pid: {type: Number, min: 0},
    time: { type: Date, default: Date.now },
    action: {type: String}
});
var Event = mongoose.model('Event', eventSchema);

var TradeEvent = Event.discriminator(
    'TradeEvent',
    new mongoose.Schema({
        price: Number,
        item: Number,
        nb: Number,
        building: Number
    }),
    {discriminatorKey: 'kind'}
);

var ExploreEvent = Event.discriminator(
    'ExploreEvent',
    new mongoose.Schema({
        aoi: Number
    }),
    {discriminatorKey: 'kind'}
);

var BuildingEvent = Event.discriminator(
    'BuildingEvent',
    new mongoose.Schema({
        building: Number
    }),
    {discriminatorKey: 'kind'}
);


var ConnectEvent = Event.discriminator(
    'ConnectEvent',
    new mongoose.Schema({
        stl: Number
    }),
    {discriminatorKey: 'kind'}
);

var DisconnectEvent = Event.discriminator(
    'DisconnectEvent',
    new mongoose.Schema(),
    {discriminatorKey: 'kind'}
);

var ServerStartEvent = Event.discriminator(
    'ServerStartEvent',
    new mongoose.Schema(),
    {discriminatorKey: 'kind'}
);

var Prism = {};

Prism.logEvent = function(player,action,data){
    data = data || {};
    data.action = action;
    data.pid = (player ? player.id : null);

    var map = {
        'building': BuildingEvent,
        'buy': TradeEvent,
        'connect': ConnectEvent,
        'disconnect': DisconnectEvent,
        'explore': ExploreEvent,
        'sell': TradeEvent,
        'server-start': ServerStartEvent
    };
    if(!(action in map)){
        console.warn('PRISM: Unrecognized event');
        return;
    }
    var event = new map[action](data);
    console.log('event : ',event);
    event.save(function(err){
        if(err) throw err;
        console.log('Event logged');
    });
};

/*function getItemData(data){
    var fields = Object.keys(TradeEvent.schema.paths).filter(function(k){
        return k[0] != '_';
    });
    fields.forEach(function(field){
        data[field] = (data[field] !== undefined ? data[field] : GameServer.itemsData[data.item][field]);
    });
    return data;
}*/

module.exports.Prism = Prism;